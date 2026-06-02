#!/usr/bin/env python3
"""Tests for reconstruct_active_chat() in send_event.py.

Run: python3 .claude/hooks/test_add_chat.py   (no external deps needed)

Verifies the append-only transcript TREE is pruned to its live linear
conversation — dropping rewind ghosts and compacted-away branches — using only
uuid/parentUuid plus the invariant that the last physical line sits on the live
branch (Stop/SubagentStop fire right after a fresh append).
"""
import sys
import os
import types
import importlib.util

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_send_event():
    """Import send_event.py's pure helpers without its runtime deps.

    send_event imports utils.summarizer / utils.model_extractor (which pull in
    anthropic) at module load; stub them so the test runs under plain python3.
    """
    pkg = types.ModuleType('utils')
    pkg.__path__ = []
    sys.modules.setdefault('utils', pkg)
    summ = types.ModuleType('utils.summarizer')
    summ.generate_event_summary = lambda *a, **k: None
    sys.modules['utils.summarizer'] = summ
    me = types.ModuleType('utils.model_extractor')
    me.get_model_from_transcript = lambda *a, **k: ''
    sys.modules['utils.model_extractor'] = me

    spec = importlib.util.spec_from_file_location(
        'send_event', os.path.join(HOOKS_DIR, 'send_event.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


se = _load_send_event()
reconstruct = se.reconstruct_active_chat


# --- tiny harness ---
_failures = []


def check(name, cond):
    print(("  PASS  " if cond else "  FAIL  ") + name)
    if not cond:
        _failures.append(name)


def m(uuid, parent, type_, text=""):
    return {"uuid": uuid, "parentUuid": parent, "type": type_,
            "message": {"role": type_, "content": text}}


def system(uuid, parent, content=None):
    return {"uuid": uuid, "parentUuid": parent, "type": "system", "content": content}


def attach(uuid, parent):
    return {"uuid": uuid, "parentUuid": parent, "type": "attachment", "attachment": {"x": 1}}


def meta(type_):
    return {"type": type_, "sessionId": "s"}


def uuids(chat):
    return [c.get("uuid") for c in chat]


# 1. Linear conversation — everything kept, in file order.
def test_linear():
    lines = [
        m("u1", None, "user", "hi"),
        m("a1", "u1", "assistant", "hello"),
        m("u2", "a1", "user", "more"),
        m("a2", "u2", "assistant", "ok"),
    ]
    chat, pruned = reconstruct(lines)
    check("linear: keeps all 4 in order", uuids(chat) == ["u1", "a1", "u2", "a2"])
    check("linear: pruned == 0", pruned == 0)


# 2. THE critical case: rewind WITHOUT compact.
#    Ghost branch sits at LOWER file indices; new branch is appended LAST.
def test_rewind_no_compact():
    lines = [
        m("u1", None, "user"),
        m("a1", "u1", "assistant"),
        m("u2", "a1", "user"),             # <- rewind point (kept)
        m("a2g", "u2", "assistant"),       # ghost
        m("u3g", "a2g", "user"),           # ghost
        m("a3g", "u3g", "assistant"),      # ghost leaf (lower index)
        m("a2n", "u2", "assistant"),       # NEW branch, appended last = live tip
    ]
    chat, pruned = reconstruct(lines)
    check("rewind: keeps live path u1,a1,u2,a2n",
          uuids(chat) == ["u1", "a1", "u2", "a2n"])
    check("rewind: drops ghosts a2g,u3g,a3g",
          not ({"a2g", "u3g", "a3g"} & set(uuids(chat))))
    check("rewind: pruned == 3", pruned == 3)


# 3. Compaction: new system root + compact summary; pre-compact branch dropped.
def test_compaction_multiroot():
    lines = [
        m("u1", None, "user"),             # pre-compact branch
        m("a1", "u1", "assistant"),
        m("u2", "a1", "user"),
        m("a2", "u2", "assistant"),
        system("sysR", None, content=None),       # new root (empty system)
        m("cs", "sysR", "user", "summary"),        # compact summary
        m("apost", "cs", "assistant", "after"),    # live tip
    ]
    chat, pruned = reconstruct(lines)
    check("compaction: keeps only post-compact cs,apost",
          uuids(chat) == ["cs", "apost"])
    check("compaction: drops pre-compact u1..a2 and empty sysR",
          not ({"u1", "a1", "u2", "a2", "sysR"} & set(uuids(chat))))


# 4. Trailing attachment is the physical last line; walk still reaches the tip.
def test_attachment_tip():
    lines = [
        m("u1", None, "user"),
        m("a1", "u1", "assistant"),
        attach("att", "a1"),               # appended last, but not renderable
    ]
    chat, pruned = reconstruct(lines)
    check("attachment-tip: walks to a1, keeps u1,a1",
          uuids(chat) == ["u1", "a1"])
    check("attachment-tip: attachment dropped from output",
          "att" not in uuids(chat))


# 5. Empty system markers dropped; system with content OR toolUseID kept.
def test_system_filtering():
    st = {"uuid": "st", "parentUuid": "se", "type": "system",
          "toolUseID": "tool_123"}              # toolUseID only -> kept (UI shows it)
    lines = [
        m("u1", None, "user"),
        system("se", "u1", content=None),          # empty -> dropped
        st,
        system("sf", "st", content="hook ran"),    # has content -> kept
        m("a1", "sf", "assistant"),
    ]
    chat, pruned = reconstruct(lines)
    check("system: empty dropped, toolUseID + content kept",
          uuids(chat) == ["u1", "st", "sf", "a1"])


# 6. No uuid anywhere -> fallback returns renderable lines as-is.
def test_no_uuid_fallback():
    lines = [
        {"type": "user", "message": {"role": "user", "content": "x"}},  # no uuid
        meta("mode"),
        meta("ai-title"),
    ]
    chat, pruned = reconstruct(lines)
    check("fallback: keeps the renderable user line",
          len(chat) == 1 and chat[0]["type"] == "user")
    check("fallback: no off-path messages pruned (metadata isn't a message)",
          pruned == 0)


# 7. Cycle safety — a malformed parent cycle must not hang.
def test_cycle_safety():
    lines = [
        m("u1", "a1", "user"),
        m("a1", "u1", "assistant"),        # u1 <-> a1 cycle, a1 is last
    ]
    chat, pruned = reconstruct(lines)
    check("cycle: terminates and keeps both", set(uuids(chat)) == {"u1", "a1"})


def main():
    for t in (test_linear, test_rewind_no_compact, test_compaction_multiroot,
              test_attachment_tip, test_system_filtering, test_no_uuid_fallback,
              test_cycle_safety):
        print(t.__name__)
        t()
    print()
    if _failures:
        print(f"FAILED ({len(_failures)}): {', '.join(_failures)}")
        return 1
    print("All tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

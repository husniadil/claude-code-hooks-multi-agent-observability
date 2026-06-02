import type { Component } from 'vue';
import {
  Wrench,
  CircleCheck,
  CircleX,
  Lock,
  Bell,
  CircleStop,
  Bot,
  Users,
  Archive,
  CornerDownLeft,
  LogIn,
  LogOut,
  ClipboardPlus,
  ClipboardCheck,
  Moon,
  ArchiveRestore,
  OctagonX,
  Ban,
  Layers,
  Settings,
  FolderTree,
  ScrollText,
  WandSparkles,
  Hammer,
  MessageCircleMore,
  MailCheck,
  Circle,
  Terminal,
  BookOpen,
  PenLine,
  Pencil,
  FilePen,
  FileSearch,
  Search,
  Globe,
  NotebookPen,
  FileText,
  List,
  FileOutput,
  Square,
  UsersRound,
  UserMinus,
  Send,
  Map,
  DoorOpen,
  CircleQuestionMark,
  Sparkles,
  Plug,
} from 'lucide-vue-next';

// One lucide icon per documented hook event type (26 events).
const eventTypeToIcon: Record<string, Component> = {
  PreToolUse: Wrench,
  PostToolUse: CircleCheck,
  PostToolUseFailure: CircleX,
  PermissionRequest: Lock,
  Notification: Bell,
  Stop: CircleStop,
  SubagentStart: Bot,
  SubagentStop: Users,
  PreCompact: Archive,
  UserPromptSubmit: CornerDownLeft,
  SessionStart: LogIn,
  SessionEnd: LogOut,
  TaskCreated: ClipboardPlus,
  TaskCompleted: ClipboardCheck,
  TeammateIdle: Moon,
  PostCompact: ArchiveRestore,
  StopFailure: OctagonX,
  PermissionDenied: Ban,
  PostToolBatch: Layers,
  ConfigChange: Settings,
  CwdChanged: FolderTree,
  InstructionsLoaded: ScrollText,
  UserPromptExpansion: WandSparkles,
  Setup: Hammer,
  Elicitation: MessageCircleMore,
  ElicitationResult: MailCheck,
};

const toolNameToIcon: Record<string, Component> = {
  Bash: Terminal,
  Read: BookOpen,
  Write: PenLine,
  Edit: Pencil,
  MultiEdit: FilePen,
  Glob: FileSearch,
  Grep: Search,
  WebFetch: Globe,
  WebSearch: Globe,
  NotebookEdit: NotebookPen,
  Task: Bot,
  TaskCreate: ClipboardPlus,
  TaskGet: FileText,
  TaskUpdate: FilePen,
  TaskList: List,
  TaskOutput: FileOutput,
  TaskStop: Square,
  TeamCreate: UsersRound,
  TeamDelete: UserMinus,
  SendMessage: Send,
  EnterPlanMode: Map,
  ExitPlanMode: DoorOpen,
  AskUserQuestion: CircleQuestionMark,
  Skill: Sparkles,
};

export function useEventIcons() {
  const getIconForEventType = (eventType: string): Component => {
    return eventTypeToIcon[eventType] || Circle;
  };

  const getIconForToolName = (toolName: string): Component => {
    if (toolNameToIcon[toolName]) return toolNameToIcon[toolName];
    if (toolName.startsWith('mcp__')) return Plug;
    return Wrench;
  };

  return { getIconForEventType, getIconForToolName };
}

import { watch, nextTick, onUnmounted, type Ref } from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Wires standard dialog accessibility onto a modal:
 *  - Escape closes it
 *  - Tab / Shift+Tab are trapped inside the container (focus can't escape)
 *  - focus moves into the dialog on open and is restored to the trigger on close
 *
 * Pair with `role="dialog"`, `aria-modal="true"`, an `aria-labelledby` pointing at
 * the title, and `tabindex="-1"` on the container element bound to `containerRef`.
 * Key listening is active only while the dialog is open.
 */
export function useModalA11y(
  isOpen: () => boolean,
  containerRef: Ref<HTMLElement | null>,
  onClose: () => void,
) {
  let previouslyFocused: HTMLElement | null = null;

  const focusableItems = (): HTMLElement[] => {
    const el = containerRef.value;
    if (!el) return [];
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (node) => node.offsetParent !== null,
    );
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const items = focusableItems();
      if (items.length === 0) {
        e.preventDefault();
        containerRef.value?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const insideContainer = !!active && !!containerRef.value?.contains(active);

      if (e.shiftKey && (active === first || !insideContainer)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  watch(isOpen, (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', onKeydown);
      nextTick(() => {
        const items = focusableItems();
        (items[0] ?? containerRef.value)?.focus();
      });
    } else {
      document.removeEventListener('keydown', onKeydown);
      previouslyFocused?.focus?.();
      previouslyFocused = null;
    }
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown);
  });
}

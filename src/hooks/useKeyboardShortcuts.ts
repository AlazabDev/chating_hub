import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return shortcuts;
};

// Default shortcuts for the application
export const createDefaultShortcuts = (actions: {
  openSearch?: () => void;
  openNotifications?: () => void;
  openSettings?: () => void;
  toggleTheme?: () => void;
  switchToChat?: () => void;
  switchToRepositories?: () => void;
  switchToPerformance?: () => void;
  newConversation?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.openSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      action: actions.openSearch,
      description: 'فتح البحث العام',
      category: 'search'
    });
  }

  if (actions.openNotifications) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.openNotifications,
      description: 'فتح الإشعارات',
      category: 'general'
    });
  }

  if (actions.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      action: actions.openSettings,
      description: 'فتح الإعدادات',
      category: 'general'
    });
  }

  if (actions.toggleTheme) {
    shortcuts.push({
      key: 'd',
      ctrlKey: true,
      action: actions.toggleTheme,
      description: 'تبديل السمة',
      category: 'general'
    });
  }

  if (actions.switchToChat) {
    shortcuts.push({
      key: '1',
      ctrlKey: true,
      action: actions.switchToChat,
      description: 'التبديل إلى المحادثة',
      category: 'navigation'
    });
  }

  if (actions.switchToRepositories) {
    shortcuts.push({
      key: '2',
      ctrlKey: true,
      action: actions.switchToRepositories,
      description: 'التبديل إلى المستودعات',
      category: 'navigation'
    });
  }

  if (actions.switchToPerformance) {
    shortcuts.push({
      key: '3',
      ctrlKey: true,
      action: actions.switchToPerformance,
      description: 'التبديل إلى مراقب الأداء',
      category: 'navigation'
    });
  }

  if (actions.newConversation) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      action: actions.newConversation,
      description: 'محادثة جديدة',
      category: 'editing'
    });
  }

  return shortcuts;
};
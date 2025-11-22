import { useEffect, useCallback } from 'react';

type KeyCombo = {
    key: string;
    ctrl?: boolean;
    meta?: boolean; // Command key on Mac
    shift?: boolean;
    alt?: boolean;
};

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
    combo: KeyCombo;
    handler: ShortcutHandler;
    description: string;
    id: string;
}

export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[] = [],
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Check if input or textarea is focused (unless it's a special shortcut like Escape)
            const target = event.target as HTMLElement;
            const isInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            shortcuts.forEach(({ combo, handler }) => {
                const keyMatch = event.key.toLowerCase() === combo.key.toLowerCase();
                const ctrlMatch = !!combo.ctrl === event.ctrlKey;
                const metaMatch = !!combo.meta === event.metaKey;
                const shiftMatch = !!combo.shift === event.shiftKey;
                const altMatch = !!combo.alt === event.altKey;

                // Allow Escape even in inputs
                if (combo.key === 'Escape' && keyMatch) {
                    event.preventDefault();
                    handler(event);
                    return;
                }

                if (isInput) return;

                if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    handler(event);
                }
            });
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Pre-defined common shortcuts
export const GLOBAL_SHORTCUTS = {
    COMMAND_PALETTE: { key: 'k', meta: true, ctrl: true }, // Cmd+K or Ctrl+K (handled by checking both usually, or platform specific)
    SETTINGS: { key: ',', meta: true, ctrl: true },
    REFRESH: { key: 'r', meta: true, ctrl: true },
    SAVE: { key: 's', meta: true, ctrl: true },
    SEARCH: { key: 'f', meta: true, ctrl: true },
    ESCAPE: { key: 'Escape' },
};

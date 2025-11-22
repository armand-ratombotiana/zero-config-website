import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, ArrowRight, Server, Layout, Settings, Terminal, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    category: 'Navigation' | 'Actions' | 'Services';
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Define commands
    const commands: CommandItem[] = useMemo(() => [
        // Navigation
        {
            id: 'nav-dashboard',
            title: 'Go to Dashboard',
            icon: <Layout className="w-4 h-4" />,
            category: 'Navigation',
            action: () => navigate('/'),
            shortcut: '⌘1'
        },
        {
            id: 'nav-services',
            title: 'Go to Services',
            icon: <Server className="w-4 h-4" />,
            category: 'Navigation',
            action: () => navigate('/services'),
            shortcut: '⌘2'
        },
        {
            id: 'nav-logs',
            title: 'Go to Logs',
            icon: <Terminal className="w-4 h-4" />,
            category: 'Navigation',
            action: () => navigate('/logs'),
            shortcut: '⌘5'
        },
        {
            id: 'nav-settings',
            title: 'Go to Settings',
            icon: <Settings className="w-4 h-4" />,
            category: 'Navigation',
            action: () => navigate('/settings'),
            shortcut: '⌘,'
        },
        // Actions
        {
            id: 'act-refresh',
            title: 'Refresh Data',
            icon: <Command className="w-4 h-4" />,
            category: 'Actions',
            action: () => window.location.reload(),
            shortcut: '⌘R'
        },
    ], [navigate]);

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query) return commands;
        const lowerQuery = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.category.toLowerCase().includes(lowerQuery)
        );
    }, [query, commands]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            if (!isOpen) return;

            if (e.key === 'Escape') {
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-in flex flex-col max-h-[60vh]">
                {/* Search Input */}
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-400">
                            ESC
                        </kbd>
                    </div>
                </div>

                {/* Results List */}
                <div className="overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <p>No results found.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    onClick={() => {
                                        cmd.action();
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors",
                                        index === selectedIndex
                                            ? "bg-blue-500/20 text-white"
                                            : "text-gray-300 hover:bg-white/5"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "p-2 rounded-md",
                                            index === selectedIndex ? "bg-blue-500/20 text-blue-300" : "bg-white/5 text-gray-400"
                                        )}>
                                            {cmd.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium">{cmd.title}</p>
                                            {cmd.description && (
                                                <p className="text-xs text-gray-400">{cmd.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {cmd.shortcut && (
                                            <span className="text-xs text-gray-500 font-mono">{cmd.shortcut}</span>
                                        )}
                                        {index === selectedIndex && (
                                            <ArrowRight className="w-4 h-4 text-blue-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-xs text-gray-500 flex justify-between">
                    <div className="flex gap-4">
                        <span>Use <kbd className="font-mono bg-white/10 px-1 rounded">↑</kbd> <kbd className="font-mono bg-white/10 px-1 rounded">↓</kbd> to navigate</span>
                        <span><kbd className="font-mono bg-white/10 px-1 rounded">↵</kbd> to select</span>
                    </div>
                    <span>ZeroConfig Command Palette</span>
                </div>
            </div>
        </div>
    );
}

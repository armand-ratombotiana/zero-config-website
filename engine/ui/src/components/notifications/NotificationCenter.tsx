import { X, Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: Date;
    read: boolean;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
    onRemove: (id: string) => void;
}

export function NotificationCenter({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
    onClearAll,
    onRemove
}: NotificationCenterProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-[90]",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={clsx(
                    "fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                role="dialog"
                aria-label="Notification Center"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <h2 className="font-semibold text-white">Notifications</h2>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                            {notifications.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Clear all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Bell className="w-12 h-12 mb-4 opacity-20" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && onMarkAsRead(notification.id)}
                                className={clsx(
                                    "relative p-4 rounded-xl border transition-all group hover-lift cursor-pointer",
                                    notification.read
                                        ? "bg-slate-800/50 border-white/5"
                                        : "bg-slate-800 border-blue-500/30 shadow-glow"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-1 shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={clsx(
                                                "font-medium text-sm truncate pr-4",
                                                notification.read ? "text-gray-300" : "text-white"
                                            )}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatTime(notification.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(notification.id);
                                    }}
                                    className="absolute top-2 right-2 p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                    title="Remove"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

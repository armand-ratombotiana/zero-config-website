import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastNotificationProps {
    toast: Toast;
    onClose: (id: string) => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(() => {
                onClose(toast.id);
            }, toast.duration);

            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onClose]);

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-success-500/10 border-success-500/30 text-success-500';
            case 'error':
                return 'bg-error-500/10 border-error-500/30 text-error-500';
            case 'warning':
                return 'bg-warning-500/10 border-warning-500/30 text-warning-500';
            default:
                return 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple';
        }
    };

    const getIcon = () => {
        const iconClass = 'h-5 w-5';
        switch (toast.type) {
            case 'success':
                return <CheckCircle className={iconClass} aria-hidden="true" />;
            case 'error':
                return <XCircle className={iconClass} aria-hidden="true" />;
            case 'warning':
                return <AlertTriangle className={iconClass} aria-hidden="true" />;
            default:
                return <Info className={iconClass} aria-hidden="true" />;
        }
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`
                glass-card flex items-center justify-between gap-3 rounded-lg border p-4 shadow-lg
                min-w-[320px] max-w-[500px] animate-slide-up
                ${getToastStyles()}
            `}
        >
            <div className="flex items-center gap-3">
                {getIcon()}
                <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity rounded p-1 hover:bg-white/10"
                aria-label="Close notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-3"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

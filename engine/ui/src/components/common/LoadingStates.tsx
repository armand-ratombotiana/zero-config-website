import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <svg
            className={`spinner ${sizeClasses[size]} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
    className = '',
    width,
    height,
    variant = 'rectangular'
}: SkeletonProps) {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`skeleton ${variantClasses[variant]} ${className}`}
            style={style}
            aria-label="Loading..."
            role="status"
        />
    );
}

interface ProgressBarProps {
    value?: number;
    max?: number;
    indeterminate?: boolean;
    className?: string;
}

export function ProgressBar({
    value = 0,
    max = 100,
    indeterminate = false,
    className = ''
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className={`progress-bar ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
            {indeterminate ? (
                <div className="progress-bar-indeterminate" />
            ) : (
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            )}
        </div>
    );
}

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 fade-in">
            <LoadingSpinner size={size} className="text-accent mb-4" />
            <p className="text-sm text-gray-400">{message}</p>
        </div>
    );
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="card p-12 text-center fade-in" role="status" aria-live="polite">
            {icon && (
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
            {description && (
                <p className="text-gray-400 mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}

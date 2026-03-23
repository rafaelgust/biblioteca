import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PALETTE = [
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-teal-600',
    'from-emerald-500 to-green-600',
    'from-amber-500 to-orange-600',
    'from-red-500 to-rose-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-500 to-blue-600',
    'from-lime-500 to-emerald-600',
];

function hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}

function getInitials(title: string): string {
    return title
        .split(/\s+/)
        .filter((word) => word.length > 2 || title.split(/\s+/).length <= 2)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
}

type BookCoverProps = {
    title: string;
    coverUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
};

const sizeClasses = {
    sm: 'h-24 w-16',
    md: 'h-40 w-28',
    lg: 'h-56 w-40',
    xl: 'h-80 w-56',
};

const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
};

const textSizes = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
};

/**
 * Placeholder com gradiente colorido baseado no título do livro.
 * Usado quando não há imagem de capa ou quando a imagem falha ao carregar.
 */
function CoverPlaceholder({
    title,
    size,
    className,
}: {
    title: string;
    size: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) {
    const gradient = PALETTE[hashString(title) % PALETTE.length];
    const initials = getInitials(title);

    return (
        <div
            className={cn(
                'flex shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-gradient-to-br shadow-sm',
                sizeClasses[size],
                gradient,
                className,
            )}
        >
            <BookOpen className={cn('text-white/70', iconSizes[size])} />
            <span
                className={cn(
                    'font-bold tracking-wide text-white/90',
                    textSizes[size],
                )}
            >
                {initials}
            </span>
        </div>
    );
}

export function BookCover({
    title,
    coverUrl,
    size = 'md',
    className,
}: BookCoverProps) {
    const [hasError, setHasError] = useState(false);

    if (!coverUrl || hasError) {
        return (
            <CoverPlaceholder
                title={title}
                size={size}
                className={className}
            />
        );
    }

    return (
        <div
            className={cn(
                'shrink-0 overflow-hidden rounded-md shadow-sm',
                sizeClasses[size],
                className,
            )}
        >
            <img
                src={coverUrl}
                alt={`Capa de ${title}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setHasError(true)}
            />
        </div>
    );
}

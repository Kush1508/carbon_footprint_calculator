import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'micro' | 'spruce';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      spruce:
        'bg-[#0F3A2E] text-white hover:bg-[#144c3c] shadow-sm border border-[#0F3A2E]/80 active:translate-y-[0.5px]',
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm border border-zinc-950 active:translate-y-[0.5px]',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200/80',
      outline:
        'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:text-zinc-950 shadow-sm',
      ghost:
        'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100',
      micro:
        'text-[11px] font-mono tracking-tight py-1 px-2 rounded border border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-9 px-3.5 text-xs',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

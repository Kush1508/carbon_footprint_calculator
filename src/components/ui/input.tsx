import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  addonRight?: string;
  addonLeft?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', addonRight, addonLeft, ...props }, ref) => {
    if (addonRight || addonLeft) {
      return (
        <div className="relative flex items-center w-full min-w-0">
          {addonLeft && (
            <span className="inline-flex items-center px-2.5 sm:px-3 h-9 text-xs font-mono text-zinc-500 bg-zinc-50 border border-r-0 border-zinc-200 rounded-l-lg select-none shrink-0">
              {addonLeft}
            </span>
          )}
          <input
            type={type}
            className={cn(
              'flex h-9 w-full min-w-0 bg-white px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-zinc-900 border border-zinc-200 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 font-mono tabular-nums',
              addonLeft ? 'rounded-r-lg border-l-0' : '',
              addonRight ? 'rounded-l-lg border-r-0' : '',
              !addonLeft && !addonRight ? 'rounded-lg' : '',
              className
            )}
            ref={ref}
            {...props}
          />
          {addonRight && (
            <span className="inline-flex items-center px-2 sm:px-3 h-9 text-[11px] sm:text-xs font-mono text-zinc-500 bg-zinc-50 border border-l-0 border-zinc-200 rounded-r-lg select-none whitespace-nowrap shrink-0">
              {addonRight}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs sm:text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 font-mono tabular-nums',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

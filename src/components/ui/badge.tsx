import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant =
  | 'scope1'
  | 'scope2'
  | 'scope3'
  | 'removals'
  | 'outline'
  | 'audit'
  | 'secondary'
  | 'methodology';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'outline', className, children, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    scope1: 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155]',
    scope2: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3730A3]',
    scope3: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
    removals: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
    audit: 'bg-zinc-100 border-zinc-200 text-zinc-800 font-mono text-[11px]',
    secondary: 'bg-zinc-100 border-zinc-200 text-zinc-600',
    methodology: 'bg-emerald-50 border-emerald-200 text-emerald-800 font-mono text-[10px]',
    outline: 'border-zinc-200 text-zinc-700 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border tracking-wide transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

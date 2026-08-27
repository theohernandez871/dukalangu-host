import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-surface-border bg-white shadow-card', className)}>{children}</div>;
}

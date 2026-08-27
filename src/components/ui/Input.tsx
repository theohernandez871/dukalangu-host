import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, ...props }, ref) => (
  <div>
    {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        error ? 'border-red-400' : 'border-surface-border',
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = 'Input';

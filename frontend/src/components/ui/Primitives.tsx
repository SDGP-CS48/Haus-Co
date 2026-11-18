import React from 'react';
import { AlertTriangle, Info, Lock, ShieldCheck, X } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#D9940A]';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];

  // Brand contrast rules: White text ONLY on Golden Amber; Ink (#1C1C1A) text on Golden Yellow & Pale Gold.
  const variants = {
    primary: 'bg-[#D9940A] text-white hover:bg-[#c08208] shadow-xs hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-[#F4B41A] text-[#1C1C1A] hover:bg-[#e5a610] font-semibold',
    outline: 'border border-[#1C1C1A]/20 bg-[#FAF7EE] text-[#1C1C1A] hover:bg-[#FDE8A5]/60',
    ghost: 'bg-transparent text-[#1C1C1A] hover:bg-[#FDE8A5]/50',
    danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B]',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizes} ${variants} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'pale' | 'canvas' | 'white';
  bordered?: boolean;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  tone = 'pale',
  bordered = true,
  className = '',
  children,
  ...rest
}) => {
  const bg =
    tone === 'pale'
      ? 'bg-[#FDE8A5]/65'
      : tone === 'white'
        ? 'bg-white/85'
        : 'bg-[#FAF7EE]';
  const border = bordered ? 'border border-[#1C1C1A]/12' : '';
  return (
    <div className={`rounded-lg ${bg} ${border} text-[#1C1C1A] ${className}`} {...rest}>
      {children}
    </div>
  );
};

interface BadgeProps {
  tone?: 'amber' | 'yellow' | 'pale' | 'critical' | 'warning' | 'ok';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'yellow', children, className = '' }) => {
  const styles = {
    amber: 'bg-[#D9940A] text-white',
    yellow: 'bg-[#F4B41A] text-[#1C1C1A]',
    pale: 'bg-[#FDE8A5] text-[#1C1C1A] border border-[#D9940A]/30',
    critical: 'bg-[#FEE2E2] text-[#991B1B] border border-[#B91C1C]/30',
    warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#B45309]/30',
    ok: 'bg-[#DCFCE7] text-[#166534] border border-[#15803D]/30',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold tracking-tight ${styles} ${className}`}
    >
      {children}
    </span>
  );
};

export const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-[#1C1C1A]/80 mb-1.5">
    {children}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...rest
}) => (
  <input
    className={`w-full rounded-md border border-[#1C1C1A]/20 bg-[#FAF7EE] px-3 py-2 text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/45 focus:border-[#D9940A] focus:bg-white focus:outline-none ${className}`}
    {...rest}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <select
    className={`w-full rounded-md border border-[#1C1C1A]/20 bg-[#FAF7EE] px-3 py-2 text-sm text-[#1C1C1A] focus:border-[#D9940A] focus:bg-white focus:outline-none ${className}`}
    {...rest}
  >
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...rest
}) => (
  <textarea
    className={`w-full rounded-md border border-[#1C1C1A]/20 bg-[#FAF7EE] px-3 py-2 text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/45 focus:border-[#D9940A] focus:bg-white focus:outline-none ${className}`}
    {...rest}
  />
);

export const DisclaimerBanner: React.FC<{
  title: string;
  body: string;
  tone?: 'info' | 'warning';
}> = ({ title, body, tone = 'info' }) => (
  <div
    role="note"
    className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-xs leading-relaxed ${
      tone === 'warning'
        ? 'border-[#B45309]/35 bg-[#FEF3C7]/70 text-[#1C1C1A]'
        : 'border-[#D9940A]/35 bg-[#FDE8A5]/55 text-[#1C1C1A]'
    }`}
  >
    {tone === 'warning' ? (
      <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309] mt-0.5" />
    ) : (
      <Info className="h-4 w-4 shrink-0 text-[#D9940A] mt-0.5" />
    )}
    <div>
      <p className="font-semibold text-[#1C1C1A]">{title}</p>
      <p className="text-[#1C1C1A]/80 mt-0.5">{body}</p>
    </div>
  </div>
);

export const SampleDataPill: React.FC<{ label?: string }> = ({ label = 'Sample data — non-live demo' }) => (
  <Badge tone="pale">
    <ShieldCheck className="h-3 w-3 text-[#D9940A]" />
    {label}
  </Badge>
);

export const LockedFeatureBanner: React.FC<{
  title: string;
  description: string;
  priceLabel?: string;
  onUnlock: () => void;
  unlocking?: boolean;
}> = ({ title, description, priceLabel, onUnlock, unlocking }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-[#D9940A]/40 bg-[#FDE8A5]/70 p-4">
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-[#D9940A] p-2 text-white shrink-0">
        <Lock className="h-4 w-4" />
      </div>
      <div>
        <h4 className="font-display font-semibold text-sm text-[#1C1C1A]">{title}</h4>
        <p className="text-xs text-[#1C1C1A]/80 mt-0.5 max-w-xl">{description}</p>
      </div>
    </div>
    <Button onClick={onUnlock} loading={unlocking} className="shrink-0">
      Unlock {priceLabel ? `(${priceLabel})` : 'Now'}
    </Button>
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1A]/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-lg border border-[#1C1C1A]/15 bg-[#FAF7EE] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1C1C1A]/10 px-5 py-3.5">
          <h3 className="font-display text-base font-bold text-[#1C1C1A]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-[#1C1C1A]/70 hover:bg-[#FDE8A5] hover:text-[#1C1C1A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

import type { ReactNode } from "react";
import type { FeedbackStatus } from "../api/types";
import { initials } from "../lib/format";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="center-block" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state state-error" role="alert">
      <strong>Could not load this</strong>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <svg
        className="state-art"
        viewBox="0 0 120 90"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="14" y="18" width="70" height="52" rx="10" className="art-a" />
        <rect x="34" y="30" width="70" height="52" rx="10" className="art-b" />
        <path
          d="M48 50h42M48 62h26"
          strokeWidth="5"
          strokeLinecap="round"
          className="art-line"
        />
      </svg>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  PENDING: "Waiting for review",
  APPROVED: "Approved and paid",
  REJECTED: "Rejected",
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          width="16"
          height="16"
          className={n <= value ? "star on" : "star"}
          aria-hidden="true"
        >
          <path d="M10 1.8l2.4 5.3 5.8.6-4.3 3.9 1.2 5.7L10 14.4l-5.1 2.9 1.2-5.7L1.8 7.7l5.8-.6z" />
        </svg>
      ))}
    </span>
  );
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={small ? "avatar avatar-sm" : "avatar"} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      className="meter"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

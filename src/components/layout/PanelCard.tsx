interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function PanelCard({ title, badge, badgeColor, children, className = '' }: Props) {
  return (
    <div className={`bg-surface-card border border-surface-border ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
        <span className="text-xs font-mono font-medium tracking-wider uppercase text-text-muted">
          {title}
        </span>
        {badge && (
          <span
            className="text-xs font-mono font-semibold tracking-wider"
            style={{ color: badgeColor || '#8888a0' }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

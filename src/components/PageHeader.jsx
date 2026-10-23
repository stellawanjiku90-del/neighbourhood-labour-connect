// Standardized page header — enforces consistent height, spacing, typography
// across ALL pages. Used by PageHeader and Layout back-arrow bar.
export default function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <header className="shrink-0 px-5 md:px-10 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', paddingBottom: '16px' }}>
      <div className="flex items-center justify-between gap-3 max-w-[1200px] mx-auto w-full">
        <div className="min-w-0 flex items-center gap-2.5">
          {Icon && (
            <span className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-accent-foreground" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
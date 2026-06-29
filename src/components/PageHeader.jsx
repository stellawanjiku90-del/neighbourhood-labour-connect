// Standardized page header. title (required), optional subtitle, optional
// right-side action node. Keeps spacing/typography consistent across pages.
export default function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <header className="shrink-0 px-4 md:px-8 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2.5">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-accent-foreground" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
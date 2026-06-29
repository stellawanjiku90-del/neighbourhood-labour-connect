// Unified card component — consistent border radius, shadows, padding, spacing
// across the entire application. Use for ALL card-based layouts.
export default function UnifiedCard({ children, className = "", hover = false }) {
  return (
    <div className={`bg-card rounded-2xl border border-border p-4 ${hover ? "hover:bg-muted transition-colors" : ""} ${className}`}>
      {children}
    </div>
  );
}
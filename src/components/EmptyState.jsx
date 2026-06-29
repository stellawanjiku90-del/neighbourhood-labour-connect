import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Standardized empty state used across Messages, Jobs, Earnings, etc.
// icon: lucide component, title, description, actionLabel, onAction.
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, to }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 max-w-sm mx-auto">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-accent-foreground" />
        </div>
      )}
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>
      )}
      {actionLabel && (to ? (
        <Button asChild className="rounded-xl h-11 px-6">
          <Link to={to}>{actionLabel}</Link>
        </Button>
      ) : (
        <Button onClick={onAction} className="rounded-xl h-11 px-6">
          {actionLabel}
        </Button>
      ))}
    </div>
  );
}
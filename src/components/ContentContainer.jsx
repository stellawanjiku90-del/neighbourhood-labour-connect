// Global layout container — enforces consistent max-width, padding, and safe areas
// across ALL pages for a unified desktop/mobile experience.
//
// Desktop: max-width 1200px, centered, with consistent horizontal padding
// Mobile: full width with safe-area insets respected
//
// Usage: Wrap your page content (excluding headers) in this container

export default function ContentContainer({ children, className = "" }) {
  return (
    <div className={`w-full max-w-[1320px] mx-auto px-5 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
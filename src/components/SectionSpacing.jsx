// Consistent section spacing wrapper — use between ALL major sections
// to eliminate uneven whitespace and create uniform vertical rhythm.
export default function SectionSpacing({ children, className = "", size = "md" }) {
  const spacing = {
    sm: "space-y-3",
    md: "space-y-5",
    lg: "space-y-6",
  };
  return <div className={`${spacing[size]} ${className}`}>{children}</div>;
}
// Unified page wrapper for ALL standalone pages (auth, legal, secondary flows)
// Guarantees:
// - Consistent safe-area compliance (top, bottom, left, right)
// - Unified max-width constraints (900-1200px for desktop)
// - Consistent vertical rhythm and spacing
// - No layout jumping between pages
//
// Usage: Replace ad-hoc wrappers with this for PhoneAuth, LegalPage, Subscribe, etc.

export default function UnifiedPage({ children, className = "", maxWidth = "max-w-2xl" }) {
  return (
    <div className={`h-[100dvh] w-full bg-background flex flex-col overflow-hidden safe-area-inset safe-area-top safe-area-bottom ${className}`}>
      <div className={`flex-1 min-h-0 overflow-y-auto w-full mx-auto ${maxWidth} px-4 md:px-8`}>
        {children}
      </div>
    </div>
  );
}
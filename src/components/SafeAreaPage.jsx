// Universal page wrapper — guarantees safe-area compliance and consistent
// spacing for standalone (non-Layout) screens like auth and legal pages.
// Used so logos, headers and content never touch device notches or edges.
export default function SafeAreaPage({ children, className = "" }) {
  return (
    <div
      className={`h-[100dvh] w-full bg-background flex flex-col overflow-hidden ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {children}
    </div>
  );
}
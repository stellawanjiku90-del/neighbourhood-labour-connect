export default function LogoHeader() {
  return (
    <header className="shrink-0 bg-background/90 backdrop-blur safe-area-top border-b border-border">
      <div className="flex items-center justify-center h-12 px-4">
        <div className="flex items-center gap-2">
          <img
            src="/icon.svg"
            alt=""
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-display font-extrabold text-foreground text-sm md:text-base tracking-tight">
            Neighbourhood Labour Connect
          </span>
        </div>
      </div>
    </header>
  );
}
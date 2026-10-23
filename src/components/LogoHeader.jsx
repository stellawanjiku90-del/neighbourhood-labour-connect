export default function LogoHeader() {
  return (
    <header className="shrink-0 bg-background/90 backdrop-blur safe-area-top border-b border-border">
      <div className="flex items-center justify-center h-16 px-5 md:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/icon.svg"
            alt=""
            className="w-9 h-9 rounded-xl object-cover"
          />
          <span className="font-display font-extrabold text-foreground text-base md:text-lg tracking-tight">
            Neighbourhood Labour Connect
          </span>
        </div>
      </div>
    </header>
  );
}
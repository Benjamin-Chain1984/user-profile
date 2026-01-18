import idealLogo from '@/assets/ideal-logo.png';
export function AppHeader() {
  return <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-border shadow-sm text-primary-foreground bg-primary-foreground">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
        <img src={idealLogo} alt="IDEAL - Intelligent Data for Everyday Activities and Lifestyle" className="h-14 w-auto" />
      </div>
    </header>;
}
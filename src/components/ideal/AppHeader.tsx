import idealLogo from '@/assets/ideal-logo.png';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-border shadow-sm bg-card/95 safe-area-top">
      <div className="max-w-4xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center">
        <img 
          src={idealLogo} 
          alt="IDEAL - Intelligent Data for Everyday Activities and Lifestyle" 
          className="h-10 sm:h-14 w-auto" 
        />
      </div>
    </header>
  );
}
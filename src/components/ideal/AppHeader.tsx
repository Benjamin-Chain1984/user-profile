import idealLogo from '@/assets/ideal-logo.png';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-primary backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
        <img 
          src={idealLogo} 
          alt="IDEAL - Intelligent Data for Everyday Activities and Lifestyle" 
          className="h-10 w-auto"
        />
      </div>
    </header>
  );
}

/**
 * MarketingLayout - shared chrome (nav + footer) for all public website pages.
 */

import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { footerNav } from '@/data/marketing';
import idealLogo from '@/assets/ideal-titlecase-logo.png';

const navItems = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="site-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" aria-label="IDEAL home">
          <img src={idealLogo} alt="Ideal" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/signup">Start free</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="site-container flex flex-col py-3" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-3 text-sm font-medium ${
                  location.pathname === item.to ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button asChild variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1" onClick={() => setOpen(false)}>
                <Link to="/signup">Start free</Link>
              </Button>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={idealLogo} alt="Ideal" className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Clinical monitoring, escalation and reporting for disability and aged-care providers.
          </p>
        </div>
        <FooterColumn title="Product" links={footerNav.product} />
        <FooterColumn title="Company" links={footerNav.company} />
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-4 space-y-2.5">
            {footerNav.legal.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold">Social</h3>
          <ul className="mt-3 flex gap-4">
            <li>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                X
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="site-container flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IDEAL. All rights reserved.</p>
          <p>IDEAL supports clinical documentation. It does not replace clinical judgement.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

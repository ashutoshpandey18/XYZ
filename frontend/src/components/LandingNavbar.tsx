import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--hero-bg)' }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              CampusMail
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
              How It Works
            </a>
            <a href="#tech" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Tech Stack
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ borderWidth: '1px', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Log In
              </Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm" style={{ backgroundColor: 'var(--accent)' }}>
                Get Started
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ borderWidth: '1px', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--hero-bg)' }}>
          <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
          <a href="#tech" onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tech Stack</a>
          <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
            <Link to="/login" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Log In</Link>
            <Link to="/signup" className="block text-center px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: 'var(--accent)' }}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

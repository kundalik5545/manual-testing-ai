'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('ui-theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    const initialTheme: 'light' | 'dark' =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : prefersDark
          ? 'dark'
          : 'light';

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ui-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-20">
      <div className="shadow-teal-md bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white md:hidden"
              onClick={onToggleSidebar}
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <div>
              <p className="text-base font-semibold">
                Regression Report Viewer
              </p>
              <p className="text-xs text-teal-100">Next.js Migration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="hidden text-xs text-teal-100 sm:block">
              GLOBAL SEARCH
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="border-white/30 text-white"
            >
              {theme === 'dark' ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

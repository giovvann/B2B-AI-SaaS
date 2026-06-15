'use client';

import { useTheme } from '@/context/theme-context';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-5 right-5 z-50
        w-11 h-11 rounded-full
        bg-white dark:bg-zinc-800
        border border-zinc-200 dark:border-zinc-700
        text-zinc-700 dark:text-zinc-200
        shadow-sm dark:shadow-zinc-900/60
        hover:shadow-md dark:hover:shadow-zinc-900/80
        flex items-center justify-center
        transition-all duration-200
        active:scale-90
      "
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5" strokeWidth={2} />
      )}
    </button>
  );
}
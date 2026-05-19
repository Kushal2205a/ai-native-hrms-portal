'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = window.localStorage.getItem('hrms-theme');

  return savedTheme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isLight = theme === 'light';

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem('hrms-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      return currentTheme === 'dark' ? 'light' : 'dark';
    });
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
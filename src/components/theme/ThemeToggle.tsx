'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a loader/placeholder
  if (!mounted) {
    return <div className="w-[72px] h-[34px] bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-full border border-black/5 dark:border-white/5 shadow-inner" />;
  }

  // Resolve the active visual theme (including 'system' scheme resolution)
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-full border border-black/5 dark:border-white/5 shadow-inner">
       <button
         onClick={() => setTheme('light')}
         className={`relative p-1.5 rounded-full transition-all cursor-pointer ${!isDark ? 'bg-white shadow-sm text-primary scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
         title="Light Mode"
       >
          <Sun className="w-4 h-4" />
       </button>
       <button
         onClick={() => setTheme('dark')}
         className={`relative p-1.5 rounded-full transition-all cursor-pointer ${isDark ? 'bg-zinc-700 shadow-sm text-primary scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
         title="Dark Mode"
       >
          <Moon className="w-4 h-4" />
       </button>
    </div>
  );
}

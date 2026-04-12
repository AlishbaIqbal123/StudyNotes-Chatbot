'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-full border border-black/5 dark:border-white/5 shadow-inner">
       <button
         onClick={() => theme === 'dark' && toggleTheme()}
         className={`relative p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow-sm text-primary scale-110' : 'text-zinc-500 hover:text-white'}`}
       >
          <Sun className="w-4 h-4" />
       </button>
       <button
         onClick={() => theme === 'light' && toggleTheme()}
         className={`relative p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-700 shadow-sm text-primary scale-110' : 'text-zinc-500 hover:text-zinc-800'}`}
       >
          <Moon className="w-4 h-4" />
       </button>
    </div>
  );
}

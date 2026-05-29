'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutGrid, LogOut,
  User as UserIcon, Sparkles, Search as SearchIcon,
  ChevronLeft, ChevronRight, BookOpen, Zap, Upload,
  BrainCircuit, Headphones, Menu, X
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '../theme/ThemeToggle';
import { useAuth } from '../auth/AuthProvider';

const navItems = [
  { icon: LayoutGrid,  label: 'Knowledge Board',  path: '/dashboard' },
  { icon: Upload,      label: 'New Synthesis',    path: '/upload' },
  { icon: BrainCircuit,label: 'Flashcards',       path: '/flashcards' },
  { icon: BookOpen,    label: 'Study Reports',    path: '/reports' },
  { icon: Headphones,  label: 'Audio Labs',       path: '/audio' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const sidebarW = collapsed ? 88 : 280;

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex flex-col border-r border-border bg-[#070A13] fixed left-0 top-0 h-screen z-50 transition-all duration-500 ease-out shadow-2xl overflow-hidden"
        style={{ width: sidebarW }}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 border-b border-white/5 shrink-0">
           <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                 <Sparkles className="text-white w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                   <span className="text-white font-black text-lg tracking-tight leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
                   <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-0.5 leading-none">Atelier</span>
                </div>
              )}
           </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-8 px-4 no-scrollbar overflow-y-auto flex flex-col justify-between min-h-0">
           <div className="space-y-2">
              {navItems.map((item) => {
                 const active = pathname === item.path;
                 return (
                   <Link
                     key={item.path}
                     href={item.path}
                     className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                       active ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                     } ${collapsed ? 'justify-center' : ''}`}
                   >
                     <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'group-hover:text-zinc-300'}`} />
                     {!collapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                     {active && <motion.div layoutId="sidebar-active-pill" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                   </Link>
                 );
              })}
           </div>

           {/* Pro Access Upgrade Card */}
           <div className="mt-8 pt-6 border-t border-white/5">
              {!collapsed ? (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
                      <Zap className="text-white w-4 h-4 fill-white animate-pulse" />
                    </div>
                    <h3 className="text-white font-bold text-sm leading-tight">Pro Access</h3>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">Unlock advanced AI synthesizers & direct audio rendering.</p>
                    <Link href="/pricing" className="mt-4 block w-full py-2.5 rounded-xl bg-gold-gradient hover:opacity-90 text-[#0A1128] text-center text-xs font-black uppercase tracking-widest shadow-gold-glow transition-all hover:scale-[1.02]">
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/pricing" className="flex items-center justify-center mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 hover:text-white hover:bg-gold-gradient hover:border-transparent transition-all shadow-md group">
                  <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                </Link>
              )}
           </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-1 shrink-0">
           <button
             onClick={() => setCollapsed(!collapsed)}
             className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-all ${collapsed ? 'justify-center' : ''}`}
           >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Minimize</span></>}
           </button>
           <div className="pt-2">
              <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${collapsed ? 'justify-center' : 'bg-white/5'}`}>
                 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <UserIcon className="text-white w-5 h-5" />
                 </div>
                 {!collapsed && (
                    <div className="min-w-0">
                       <p className="text-sm font-bold text-white truncate">{user?.name || 'Academic'}</p>
                       <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Atelier Access</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500" style={{ marginLeft: sidebarW }}>
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-6 lg:px-12 bg-background/80 backdrop-blur-2xl border-b border-border">
           <div className="flex items-center gap-4 lg:hidden">
              <button onClick={() => setMobileMenuOpen(true)} className="p-2.5 rounded-2xl bg-card border border-border shadow-sm">
                 <Menu className="w-5 h-5 text-foreground" />
              </button>
              <Sparkles className="text-primary w-6 h-6" />
           </div>

           <div className="relative max-w-sm w-full hidden md:block">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                 type="text" placeholder="Search archive..."
                 className="w-full h-11 pl-11 pr-4 rounded-full bg-card border border-border focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm outline-none"
              />
           </div>

           <div className="flex items-center gap-4 lg:gap-6">
              <ThemeToggle />
              <Link href="/upload" className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                 <Plus className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">New Session</span>
              </Link>
           </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8 lg:px-10 lg:py-12">
           <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                 {children}
              </motion.div>
           </AnimatePresence>
        </main>
      </div>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
         {mobileMenuOpen && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md lg:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-[#070A13] p-8 lg:hidden flex flex-col shadow-2xl">
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                       <Sparkles className="text-primary w-8 h-8" />
                       <span className="text-white font-black text-2xl tracking-tight">Lumina</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-white"><X className="w-6 h-6" /></button>
                 </div>
                 <nav className="flex-1 space-y-4">
                    {navItems.map((item) => (
                       <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-5 p-4 rounded-2xl text-lg font-bold ${pathname === item.path ? 'bg-primary text-white' : 'text-zinc-500'}`}>{item.label}</Link>
                    ))}
                 </nav>
                 <div className="pt-8 border-t border-white/5">
                    <button onClick={logout} className="flex items-center gap-4 text-zinc-500 font-bold p-4 hover:text-primary transition-colors"><LogOut className="w-5 h-5 text-primary" />Log Out</button>
                 </div>
              </motion.div>
           </>
         )}
      </AnimatePresence>
    </div>
  );
}

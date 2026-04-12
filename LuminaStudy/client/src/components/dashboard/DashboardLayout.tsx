'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutGrid, Clock, Star, Settings, LogOut,
  Bell, User as UserIcon, Sparkles, Search as SearchIcon,
  ChevronLeft, ChevronRight, BookOpen, Zap, Upload,
  BrainCircuit, Headphones, Command, Menu, X
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarW = collapsed ? 88 : 280;

  if (!mounted) return <div className="min-h-screen bg-studio-bg" />;

  return (
    <div className="flex min-h-screen bg-studio-bg selection:bg-primary/10 transition-colors duration-500 overflow-x-hidden">
      
      {/* ── DESKTOP SIDEBAR (Non-Fixed Fluid) ── */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#160E0C]/5 bg-sidebar-bg sticky top-0 h-screen z-50 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[20px_0_50px_rgba(0,0,0,0.02)]`}
        style={{
          width: sidebarW,
        }}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 border-b border-white/5">
           <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                 <Sparkles className="text-white w-5 h-5" />
              </div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                   <span className="text-white font-black text-lg tracking-tight leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Lumina
                   </span>
                   <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-0.5 leading-none">
                      Study
                   </span>
                </motion.div>
              )}
           </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
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
                  {!collapsed && (
                    <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                       {item.label}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    />
                  )}
                </Link>
              );
           })}
        </div>

        {/* Pro Banner */}
        {!collapsed && (
           <div className="px-5 mb-8">
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 overflow-hidden group">
                 <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-colors" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Upgrade Laboratory</p>
                 <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Unlock advanced neuro-synthesis and unlimited archiving.</p>
                 <button className="w-full py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    Get Access
                 </button>
              </div>
           </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
           <button
             onClick={() => setCollapsed(!collapsed)}
             className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-all ${collapsed ? 'justify-center' : ''}`}
           >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Minimize</span></>}
           </button>
           
           <div className="pt-2">
              <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${collapsed ? 'justify-center' : 'bg-white/5'}`}>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#B7001A] flex items-center justify-center shrink-0">
                    <UserIcon className="text-white w-5 h-5" />
                 </div>
                 {!collapsed && (
                    <div className="min-w-0">
                       <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {user?.displayName || user?.name || 'Academic'}
                       </p>
                       <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Founder Status</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
        {/* Global Toolbar */}
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-6 lg:px-12 bg-studio-bg/80 backdrop-blur-2xl border-b border-[#160E0C]/5">
           
           {/* Mobile Menu Toggle & Logo */}
           <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/[0.02]"
              >
                 <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="text-white w-4 h-4" />
                 </div>
                 <span className="font-black text-sm tracking-tighter uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
              </div>
           </div>

           {/* Search Laboratory */}
           <div className="relative max-w-sm w-full hidden md:block">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                 type="text" 
                 placeholder="Search the archive..."
                 className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-[#160E0C]/5 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm outline-none"
                 style={{ fontFamily: "'Manrope', sans-serif" }}
              />
           </div>

           {/* Action Group */}
           <div className="flex items-center gap-3 lg:gap-6">
              <div className="hidden sm:flex p-1 rounded-full bg-gray-100/50 border border-gray-200">
                 <ThemeToggle />
              </div>
              
              <Link href="/upload" 
                 className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-primary text-white shadow-[0_12px_24px_-8px_rgba(230,0,35,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                 <Plus className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    New Session
                 </span>
              </Link>
           </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-16 lg:py-12">
           <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                 {children}
              </motion.div>
           </AnimatePresence>
        </main>
      </div>

      {/* ── MOBILE OVERLAY MENU ── */}
      <AnimatePresence>
         {mobileMenuOpen && (
           <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-[#160E0C] p-8 lg:hidden flex flex-col shadow-2xl"
              >
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                          <Sparkles className="text-white w-6 h-6" />
                       </div>
                       <span className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-white">
                       <X className="w-6 h-6" />
                    </button>
                 </div>

                 <nav className="flex-1 space-y-3">
                    {navItems.map((item) => (
                       <Link 
                         key={item.path}
                         href={item.path}
                         className={`flex items-center gap-5 p-4 rounded-2xl transition-all ${pathname === item.path ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                         style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                       >
                          <item.icon className="w-6 h-6" />
                          <span className="text-sm font-bold tracking-tight uppercase tracking-widest">{item.label}</span>
                       </Link>
                    ))}
                 </nav>

                 <div className="pt-8 border-t border-white/5 flex flex-col gap-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-white">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#B7001A] flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                       </div>
                       <div>
                          <p className="text-sm font-bold uppercase tracking-widest">{user?.name || 'Academic'}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">Founder Access</p>
                       </div>
                    </div>
                    <button onClick={logout} className="flex items-center gap-4 text-zinc-500 font-bold p-4 hover:text-[#FF6B6B] transition-colors">
                       <LogOut className="w-5 h-5 text-[#FF6B6B]" />
                       <span className="text-xs uppercase tracking-widest">Sign Out Archive</span>
                    </button>
                 </div>
              </motion.div>
           </>
         )}
      </AnimatePresence>
      
    </div>
  );
}

        {/* Global Toolbar */}
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-6 lg:px-12 bg-studio-bg/80 backdrop-blur-2xl border-b border-[#160E0C]/5">
           
           {/* Mobile Menu Toggle & Logo */}
           <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm"
              >
                 <Menu className="w-5 h-5" />
              </button>
              <Sparkles className="text-primary w-6 h-6" />
           </div>

           {/* Search Laboratory */}
           <div className="relative max-w-sm w-full hidden md:block">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                 type="text" 
                 placeholder="Search the archive..."
                 className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-[#160E0C]/5 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm outline-none"
                 style={{ fontFamily: "'Manrope', sans-serif" }}
              />
           </div>

           {/* Action Group */}
           <div className="flex items-center gap-3 lg:gap-6">
              <div className="hidden sm:flex p-1 rounded-full bg-gray-100/50 border border-gray-200">
                 <ThemeToggle />
              </div>
              
              <Link href="/upload" 
                 className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                 <Plus className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    New Session
                 </span>
              </Link>
           </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 px-6 py-12 lg:px-20 lg:py-16">
           <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                 {children}
              </motion.div>
           </AnimatePresence>
        </main>
      </div>

      {/* ── MOBILE OVERLAY MENU ── */}
      <AnimatePresence>
         {mobileMenuOpen && (
           <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-[#160E0C] p-8 lg:hidden flex flex-col"
              >
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                       <Sparkles className="text-primary w-8 h-8" />
                       <span className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-white">
                       <X className="w-6 h-6" />
                    </button>
                 </div>

                 <nav className="flex-1 space-y-4">
                    {navItems.map((item) => (
                       <Link 
                         key={item.path}
                         href={item.path}
                         className={`flex items-center gap-5 p-4 rounded-2xl text-lg font-bold ${pathname === item.path ? 'bg-primary text-white' : 'text-zinc-500'}`}
                         style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                       >
                          <item.icon className="w-6 h-6" />
                          {item.label}
                       </Link>
                    ))}
                 </nav>

                 <div className="pt-8 border-t border-white/5">
                    <button onClick={logout} className="flex items-center gap-4 text-zinc-500 font-bold p-4">
                       <LogOut className="w-5 h-5 text-[#FF6B6B]" />
                       Log Out
                    </button>
                 </div>
              </motion.div>
           </>
         )}
      </AnimatePresence>
      
    </div>
  );
}

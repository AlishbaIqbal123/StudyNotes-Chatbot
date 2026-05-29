'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Moon, Sun, Monitor, Bell, Lock, Globe, Trash2, Database } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10">
        <header className="mb-20">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-[2px] bg-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Preferences</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
              Atelier <span className="italic">Calibration</span>.
            </h1>
            <p className="text-xl text-muted-foreground font-medium mt-4 max-w-xl">Fine-tune your cognitive environment for maximum resonance.</p>
        </header>

        <div className="space-y-24">
            {/* Appearance */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                   <h3 className="text-sm font-black text-[#160E0C]/40 uppercase tracking-[0.2em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Visual Mode</h3>
                   <div className="flex-1 h-[1px] bg-black/5" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { id: 'light', label: 'Canvas (Light)', icon: Sun, desc: 'Optimized for daylight focus' },
                        { id: 'dark', label: 'Obsidian (Dark)', icon: Moon, desc: 'Low-light cognitive sessions' },
                        { id: 'system', label: 'Ethereal (System)', icon: Monitor, desc: 'Sync with environmental clock' },
                    ].map((mode) => (
                        <button 
                            key={mode.id}
                            onClick={() => setTheme(mode.id as 'light' | 'dark' | 'system')}
                            className={`flex flex-col items-start gap-6 p-8 rounded-[2.5rem] border-2 transition-all group ${theme === mode.id ? 'border-primary bg-white shadow-2xl translate-y-[-4px]' : 'border-black/5 bg-white/40 text-muted-foreground hover:border-black/10 hover:bg-white'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${theme === mode.id ? 'bg-primary text-white rotate-3' : 'bg-black/5 group-hover:rotate-3'}`}>
                              <mode.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`font-bold text-lg mb-1 ${theme === mode.id ? 'text-[#160E0C]' : ''}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{mode.label}</h4>
                                <p className="text-xs font-medium opacity-60 leading-relaxed">{mode.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* General Settings */}
            <section className="space-y-4">
                 <div className="flex items-center gap-4 mb-10">
                   <h3 className="text-sm font-black text-[#160E0C]/40 uppercase tracking-[0.2em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Neural Parameters</h3>
                   <div className="flex-1 h-[1px] bg-black/5" />
                </div>

                 <div className="bg-white/40 backdrop-blur-md rounded-[3rem] border border-white shadow-sm overflow-hidden">
                    {[
                        { icon: Bell, label: 'Session Reminders', desc: 'Manage your study reminders and interval alerts' },
                        { icon: Lock, label: 'Data Sovereignty', desc: 'End-to-end encryption for your private archives' },
                        { icon: Globe, label: 'Linguistic Tone', desc: 'Select the primary linguistic synthesis mode' },
                        { icon: Database, label: 'Inference Sync', desc: 'Universal backup cross-atelier synchronization' },
                    ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between p-8 ${i !== 3 ? 'border-b border-black/5' : ''} hover:bg-white/60 transition-colors`}>
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#160E0C]/30 shadow-sm">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-[#160E0C]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</h4>
                                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                                </div>
                            </div>
                            <div className="w-14 h-8 bg-black/5 rounded-full relative cursor-pointer group p-1 transition-colors hover:bg-black/10">
                                <div className="w-6 h-6 rounded-full bg-white shadow-md transition-all group-hover:translate-x-6 group-hover:bg-primary" />
                            </div>
                        </div>
                    ))}
                 </div>
            </section>

            {/* Danger Zone */}
            <section>
                 <div className="flex items-center gap-4 mb-10">
                   <h3 className="text-sm font-black text-primary/40 uppercase tracking-[0.2em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Atelier Dissolution</h3>
                   <div className="flex-1 h-[1px] bg-primary/10" />
                </div>
                
                 <div className="bg-primary/[0.03] rounded-[3rem] border border-primary/10 p-12 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <h4 className="font-bold text-2xl text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Purge All Archives</h4>
                        <p className="text-sm text-primary/60 font-medium max-w-md leading-relaxed">Permanently dissolve your digital footprint and all synthesized study assets. This action cannot be reversed within the Lumina network.</p>
                    </div>
                    <button className="px-12 py-5 bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        <Trash2 className="w-5 h-5" /> Dissolve Identity
                    </button>
                 </div>
            </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Zap, Settings, CreditCard, ChevronRight, LogOut, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: User, label: 'Atelier Identity', desc: 'Refine your public academic persona', color: 'var(--primary)' },
    { icon: Mail, label: 'Correspondence', desc: 'Secure contact settings', color: '#3B9BC8' },
    { icon: Shield, label: 'Vault Security', desc: 'Advanced authentication protocols', color: '#5E7B5A' },
    { icon: Zap, label: 'Inference Plan', desc: 'Unlimited AI processing enabled', color: '#C8552A' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10">
        
        {/* EDITORIAL HEADER */}
        <header className="mb-20 flex flex-col lg:flex-row items-center lg:items-end gap-12 text-center lg:text-left">
            <div className="relative group">
                <div className="w-48 h-48 rounded-[3.5rem] bg-surface flex items-center justify-center border-2 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <img 
                       src={`https://pollinations.ai/p/cinematic_oil_painting_of_a_scholarly_portrait_academic_atmosphere?width=400&height=400&model=flux&nologo=true&seed=${user?.id || 'guest'}`}
                       className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                       alt="Profile Avatar"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-[#160E0C] shadow-2xl">Refine Image</span>
                    </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce">
                    <Sparkles className="w-6 h-6" />
                </div>
            </div>
            
            <div className="flex-1 pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Student <span className="italic text-primary">Archive</span>.
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground font-medium max-w-xl" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Curating academic excellence since October 2026. Your presence is the cornerstone of the Lumina experiment.
                </p>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* SETTINGS MENU */}
            <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-8 h-[2px] bg-primary" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Archive Parameters</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menuItems.map((item, i) => (
                      <motion.button 
                          key={i}
                          whileHover={{ y: -5, x: 2 }}
                          className="group p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white hover:border-primary/10 transition-all text-left shadow-sm hover:shadow-xl"
                      >
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6"
                               style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                              <item.icon className="w-7 h-7" />
                          </div>
                          <div>
                              <h4 className="font-bold text-lg mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</h4>
                              <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                          </div>
                      </motion.button>
                  ))}
                </div>
            </div>

            {/* SUBSCRIPTION & STATUS */}
            <div className="lg:col-span-5 space-y-8">
                 <div className="flex items-center gap-3 mb-8">
                   <div className="w-8 h-[2px] bg-primary" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Operational Status</span>
                </div>

                 <div className="bg-[#160E0C] rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Member Tier</div>
                                <h4 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Lumina <span className="italic">Pro</span></h4>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                               <Zap className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-6 mb-12">
                            {[
                                'Infinite Content Ingestion',
                                'Neural Study Synthesis',
                                'High-Priority Processing',
                                'Direct AI Interrogation'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-4 text-xs font-bold tracking-wide text-white/60">
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                        
                        <button className="w-full py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                            Manage Inference Core
                        </button>
                    </div>
                 </div>

                 <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 p-8 bg-black/5 hover:bg-primary/5 text-[#160E0C] hover:text-primary rounded-[2.5rem] font-bold text-xs uppercase tracking-widest transition-all border border-dashed border-black/10 hover:border-primary/20"
                 >
                    <LogOut className="w-5 h-5" /> Decommission Session
                 </button>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

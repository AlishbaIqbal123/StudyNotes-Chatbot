'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, Layers } from 'lucide-react';

export default function FlashcardsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 rounded-[2rem] bg-atelier-sky/10 flex items-center justify-center mb-10 relative"
        >
          <div className="absolute inset-0 bg-atelier-sky/20 rounded-full blur-3xl animate-pulse" />
          <Layers className="w-10 h-10 text-atelier-sky relative z-10" />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Memory <span className="italic text-atelier-sky">Archive</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-12">
          Your global conceptual archive is being calibrated. Soon, you&apos;ll be able to review all synthesized flashcards across every atelier piece in one neural stream.
        </p>

        <div className="flex gap-4">
           <div className="px-6 py-2 rounded-full border border-[#160E0C]/5 bg-white text-[10px] font-black uppercase tracking-widest text-[#160E0C]/40 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Synthesis Active
           </div>
           <div className="px-6 py-2 rounded-full border border-[#160E0C]/5 bg-white text-[10px] font-black uppercase tracking-widest text-[#160E0C]/40 flex items-center gap-2">
              <BrainCircuit className="w-3 h-3" /> Neural Linking 84%
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

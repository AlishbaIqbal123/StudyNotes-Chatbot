'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 rounded-[2rem] bg-atelier-crimson/10 flex items-center justify-center mb-10 relative"
        >
          <div className="absolute inset-0 bg-atelier-crimson/20 rounded-full blur-3xl animate-pulse" />
          <BookOpen className="w-10 h-10 text-atelier-crimson relative z-10" />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Study <span className="italic text-atelier-crimson">Exhibits</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-12">
          Comprehensive synthesis reports and academic longitudinal data are currently being compiled. Your progress exhibits will soon be available for deep review.
        </p>

        <div className="flex gap-4">
           <div className="px-6 py-2 rounded-full border border-[#160E0C]/5 bg-white text-[10px] font-black uppercase tracking-widest text-[#160E0C]/40 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Data Compilation
           </div>
           <div className="px-6 py-2 rounded-full border border-[#160E0C]/5 bg-white text-[10px] font-black uppercase tracking-widest text-[#160E0C]/40 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Exhibit Status: Pending
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

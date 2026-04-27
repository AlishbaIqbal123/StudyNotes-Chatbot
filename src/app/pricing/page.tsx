"use client";

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, Shield } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-20 px-6">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Choose Your Learning Power
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          From casual study sessions to high-intensity exam prep, we have a plan that fits your speed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* FREE PLAN */}
        <div className="bg-[#1e293b] rounded-3xl p-8 border border-gray-700 hover:border-blue-500 transition-all">
          <h2 className="text-2xl font-bold mb-2">Basic</h2>
          <div className="text-4xl font-bold mb-6">$0 <span className="text-lg text-gray-500">/mo</span></div>
          <p className="text-gray-400 mb-8">Perfect for a quick summary or single lecture notes.</p>
          
          <ul className="space-y-4 mb-10 text-left">
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="text-green-500 w-5 h-5" /> 3 Generations per day
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="text-green-500 w-5 h-5" /> Standard AI Models
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="text-green-500 w-5 h-5" /> Basic YouTube Support
            </li>
          </ul>

          <Link href="/upload" className="block w-full py-4 rounded-xl border border-gray-600 font-bold hover:bg-gray-800 transition-colors">
            Current Plan
          </Link>
        </div>

        {/* PRO PLAN */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl transform scale-105 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</div>
          
          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <div className="text-4xl font-bold mb-6">$4 <span className="text-lg text-blue-200">/mo</span></div>
          <p className="text-blue-100 mb-8">For serious students who want to master their subjects fast.</p>
          
          <ul className="space-y-4 mb-10 text-left">
            <li className="flex items-center gap-3 text-white font-medium">
              <Zap className="text-yellow-400 w-5 h-5" /> Unlimited Everything
            </li>
            <li className="flex items-center gap-3 text-white font-medium">
              <Sparkles className="text-yellow-400 w-5 h-5" /> Deep Research AI (Llama 3.1)
            </li>
            <li className="flex items-center gap-3 text-white font-medium">
              <Shield className="text-yellow-400 w-5 h-5" /> Priority Processing
            </li>
            <li className="flex items-center gap-3 text-white font-medium">
              <Check className="text-yellow-400 w-5 h-5" /> PDF & Document Deep Extraction
            </li>
            <li className="flex items-center gap-3 text-white font-medium">
              <Check className="text-yellow-400 w-5 h-5" /> HD Podcast Studio Access
            </li>
          </ul>

          <button className="w-full py-4 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-lg">
            Upgrade Now
          </button>
        </div>
      </div>

      <div className="mt-20 text-center text-gray-500">
        <p>Limits reset every 24 hours at 00:00 UTC.</p>
      </div>
    </div>
  );
}

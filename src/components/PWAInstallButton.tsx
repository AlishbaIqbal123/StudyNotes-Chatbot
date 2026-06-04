'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone || 
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent;
    const detectedIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(detectedIOS);

    if (detectedIOS) {
      // On iOS Safari, we can display the button directly since there's no native prompt event
      setShowButton(true);
      return;
    }

    // Standard Android/Chrome/Desktop PWA install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowButton(false);
      setShowIOSModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowButton(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleInstallClick}
            className={`flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-full bg-gradient-to-r from-primary to-[#7C6FCD] text-white shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider ${className}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Download className="w-3.5 h-3.5" />
            {compact ? (
              <span className="hidden md:inline">Install App</span>
            ) : (
              <span>Install App</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* iOS Safari Instruction Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm rounded-[2.5rem] bg-[#070A13] border border-white/10 p-8 shadow-2xl text-left overflow-hidden"
            >
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              
              <button 
                onClick={() => setShowIOSModal(false)}
                className="absolute right-6 top-6 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-white font-black text-xl tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Install LuminaStudy
              </h3>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Install LuminaStudy on your iPhone or iPad to use it full-screen and access it directly from your home screen.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <Share className="text-primary w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>1. Open Share Menu</h4>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Tap the Share button in the Safari navigation bar at the bottom of the screen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <PlusSquare className="text-primary w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>2. Add to Home Screen</h4>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Scroll down the share options list and select &ldquo;Add to Home Screen&rdquo;.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowIOSModal(false)}
                className="mt-8 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-black uppercase tracking-widest transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

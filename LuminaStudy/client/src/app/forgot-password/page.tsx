'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        setSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-8">
            <div className="w-12 h-12 pastel-gradient-1 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">Lumina</span>
        </Link>
        <h2 className="text-center text-4xl font-extrabold text-gray-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-gray-500 font-medium">
          We'll send you a link to get back into your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl border border-gray-100 sm:rounded-[2.5rem] sm:px-12 relative overflow-hidden">
          
          <AnimatePresence>
            {success ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                >
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h3>
                    <p className="text-gray-500 font-medium mb-8">If an account exists for {email}, you'll receive a reset link shortly.</p>
                    <Link href="/login" className="text-pastel-red font-bold hover:underline flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </motion.div>
            ) : (
                <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6" 
                    onSubmit={handleSubmit}
                >
                    <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-pastel-red transition-colors" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-pastel-red rounded-2xl outline-none transition-all font-medium text-gray-800"
                            placeholder="you@example.com"
                        />
                    </div>
                    </div>

                    <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 flex justify-center items-center px-4 py-2 border border-transparent rounded-2xl shadow-xl text-lg font-bold text-white pastel-gradient-1 hover:shadow-2xl focus:outline-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Link'}
                    </button>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2">
                             <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Add AnimatePresence import
import { AnimatePresence } from 'framer-motion';

'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Enter your credentials to access your library" variant="login">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-start gap-3 p-4 rounded-2xl text-sm font-medium"
              style={{ background: 'rgba(230,0,35,0.06)', color: 'var(--primary)', border: '1px solid rgba(230,0,35,0.14)' }}
            >
              <AlertCircle className="w-4.5 w-[18px] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--foreground)' }}
          >
            Email Address
          </label>
          <div className="relative group">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 w-[18px] h-[18px] transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              {...register('email')}
              id="login-email"
              type="email"
              placeholder="name@example.com"
              className="lumina-input lumina-input-icon"
              style={{ borderColor: errors.email ? 'var(--destructive)' : undefined }}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--destructive)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              className="text-sm font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--foreground)' }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold hover:underline transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              {...register('password')}
              id="login-password"
              type="password"
              placeholder="••••••••"
              className="lumina-input lumina-input-icon"
              style={{ borderColor: errors.password ? 'var(--destructive)' : undefined }}
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--destructive)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          disabled={isSubmitting}
          type="submit"
          className="btn-primary w-full py-4 text-base mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Log In <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-2 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border-faint)' }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Or continue with
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-faint)' }} />
        </div>

        {/* Google */}
        <button
          id="login-google"
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm transition-all hover:scale-[1.01] active:scale-95"
          style={{
            background: 'var(--surface-container-low)',
            color: 'var(--foreground)',
            border: '1px solid var(--border-faint)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Globe className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </button>

        <p
          className="text-center text-sm font-medium mt-6"
          style={{ color: 'var(--muted-foreground)', fontFamily: "'Manrope', sans-serif" }}
        >
          Don't have an account?{' '}
          <Link href="/signup" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
            Sign up for free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

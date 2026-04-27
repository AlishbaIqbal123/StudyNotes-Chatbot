'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, Loader2, ShieldCheck, AlertCircle, ArrowRight, Globe, Sparkles } from 'lucide-react';

import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
      });
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/dashboard');
    } catch {
      setError('Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const fields = [
    { id: 'signup-name',    key: 'name',            label: 'Full Name',        icon: User,        type: 'text',     placeholder: 'Your full name', error: errors.name },
    { id: 'signup-email',   key: 'email',           label: 'Email Address',    icon: Mail,        type: 'email',    placeholder: 'name@example.com', error: errors.email },
    { id: 'signup-pass',    key: 'password',        label: 'Password',         icon: Lock,        type: 'password', placeholder: '••••••••', error: errors.password },
    { id: 'signup-confirm', key: 'confirmPassword', label: 'Confirm Password', icon: ShieldCheck, type: 'password', placeholder: '••••••••', error: errors.confirmPassword },
  ] as const;

  return (
    <AuthLayout title="Create Account" subtitle="Join LuminaStudy and start learning smarter" variant="signup">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
              <AlertCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        {fields.map((f) => (
          <div key={f.key}>
            <label
              className="block text-sm font-bold mb-2.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--foreground)' }}
            >
              {f.label}
            </label>
            <div className="relative">
              <f.icon
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <input
                {...register(f.key)}
                id={f.id}
                type={f.type}
                placeholder={f.placeholder}
                className="lumina-input lumina-input-icon"
                style={{ borderColor: f.error ? 'var(--destructive)' : undefined }}
              />
            </div>
            {f.error && (
              <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--destructive)' }}>
                {f.error.message}
              </p>
            )}
          </div>
        ))}

        {/* Submit */}
        <button
          id="signup-submit"
          disabled={isSubmitting}
          type="submit"
          className="btn-primary w-full h-14 text-base mt-4 shadow-xl"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5" />
              Create Free Account
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-4 flex items-center gap-4">
          <div className="flex-1 h-px bg-border/40" />
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--muted-foreground)', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Or start with
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Google */}
        <button
          id="signup-google"
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="btn-secondary w-full h-14"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Globe className="w-5 h-5 opacity-70" /> 
              Continue with Google
            </>
          )}
        </button>

        <p
          className="text-center text-xs mt-4"
          style={{ color: 'var(--muted-foreground)', fontFamily: "'Manrope', sans-serif" }}
        >
          By signing up, you agree to our{' '}
          <Link href="#" className="hover:underline" style={{ color: 'var(--primary)' }}>Terms</Link> and{' '}
          <Link href="#" className="hover:underline" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>.
        </p>

        <p
          className="text-center text-sm font-medium"
          style={{ color: 'var(--muted-foreground)', fontFamily: "'Manrope', sans-serif" }}
        >
          Already have an account?{' '}
          <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

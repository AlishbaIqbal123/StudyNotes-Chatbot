import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'LuminaStudy | AI-Powered Pinterest-Style Study Platform',
  description: 'Transform PDFs, YouTube videos, and notes into beautiful Pinterest-style AI flashcards, quizzes & summaries. The Digital Atelier for modern learners.',
  keywords: 'AI study, flashcards, quiz, PDF notes, YouTube to notes, study platform',
  openGraph: {
    title: 'LuminaStudy — Study Smarter, Not Harder',
    description: 'AI-powered study suite that transforms any content into an interactive learning experience.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className="antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

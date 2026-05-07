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
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css2?family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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

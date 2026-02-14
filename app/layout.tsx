import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Community Habit Tracker',
  description: 'Build better habits together with real-time community updates and intelligent streak prediction.',
  keywords: ['habits', 'tracker', 'community', 'productivity', 'goals'],
  authors: [{ name: 'Habit Tracker Team' }],
  openGraph: {
    type: 'website',
    url: 'https://habittracker.vercel.app',
    title: 'Community Habit Tracker',
    description: 'Build better habits together',
    siteName: 'Habit Tracker',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

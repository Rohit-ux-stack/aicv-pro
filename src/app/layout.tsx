import { ResumeProvider } from '@/components/builder/ResumeContext';
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

// Sets the correct scale for mobile devices
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'AICV-Pro — Next-Gen AI Resume Builder',
  description: 'Create a professional, ATS-friendly resume in minutes with AICV-Pro.',
  keywords: ['Resume Builder', 'AI Resume', 'CV Maker', 'Professional CV', 'ATS Friendly'],
  authors: [{ name: 'Rohit Somnath Banerjee' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-violet-500/30 selection:text-violet-100`}>
        <ResumeProvider>
          {children}
        </ResumeProvider>
        
        {/* Vercel Analytics Component securely tracks page views in the background */}
        <Analytics />
      </body>
    </html>
  );
}
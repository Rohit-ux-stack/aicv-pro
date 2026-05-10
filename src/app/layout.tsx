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
  title: 'AIcv Pro — Next-Gen AI Resume Builder',
  description: 'Create a professional, ATS-friendly resume in minutes with AIcv Pro.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        <ResumeProvider>
          {children}
        </ResumeProvider>
        <Analytics />
      </body>
    </html>
  );
}
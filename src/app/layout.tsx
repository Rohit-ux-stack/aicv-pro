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
  title: 'AICV-Pro | Free AI Resume Builder & ATS Optimizer',
  description: 'Build a professional, ATS-friendly resume in minutes. Upload your PDF or start from scratch. Free AI summary writer and ATS keyword optimization for software engineers and freshers.',
  keywords: [
  // ── Core Product ──────────────────────────────────────────────
  'AI resume builder',
  'free AI resume builder',
  'online resume builder',
  'resume maker',
  'resume generator',
  'professional resume builder',
  'resume creator online',
  'best resume builder 2025',
  'AICV Pro',

  // ── ATS Specific ──────────────────────────────────────────────
  'ATS friendly resume',
  'ATS resume builder',
  'ATS keyword optimizer',
  'ATS optimized resume',
  'ATS resume checker',
  'applicant tracking system resume',
  'beat ATS resume',
  'ATS resume format',
  'ATS compatible resume builder',
  'ATS score resume',

  // ── AI Features ───────────────────────────────────────────────
  'AI resume writer',
  'AI powered resume',
  'AI resume generator',
  'AI resume summary writer',
  'ChatGPT resume builder',
  'AI resume optimizer',
  'auto resume builder AI',
  'artificial intelligence resume maker',
  'AI cover letter generator',

  // ── PDF Features ──────────────────────────────────────────────
  'resume PDF download',
  'auto format resume PDF',
  'PDF resume builder',
  'resume PDF generator',
  'upload resume PDF',
  'parse resume PDF',
  'convert resume to PDF',

  // ── User Segments ─────────────────────────────────────────────
  'resume builder for freshers',
  'resume builder for students',
  'resume builder for college students',
  'resume builder for BCA students',
  'resume for first job',
  'resume builder for internship',
  'resume for engineering students',
  'resume builder for IT professionals',
  'resume builder for developers',
  'software engineer resume builder',
  'web developer resume builder',
  'UI UX designer resume',
  'data analyst resume builder',
  'resume for no experience',
  'entry level resume builder',
  'fresher resume format',

  // ── Job Specific ──────────────────────────────────────────────
  'Next.js developer resume',
  'full stack developer resume',
  'React developer resume',
  'frontend developer resume',
  'backend developer resume',
  'graphic designer resume',
  'digital marketing resume',
  'Java developer resume',
  'Python developer resume',

  // ── Format & Features ─────────────────────────────────────────
  'one page resume builder',
  'Harvard style resume',
  'professional resume template',
  'modern resume template',
  'clean resume template',
  'simple resume format',
  'resume with no watermark',
  'free resume no sign up',
  'resume builder no account needed',
  'resume builder no login',
  'instant resume download',
  'resume builder with PDF preview',

  // ── Indian Market ─────────────────────────────────────────────
  'resume builder India',
  'resume builder for Naukri',
  'resume builder for LinkedIn',
  'resume builder for Internshala',
  'resume for campus placement',
  'resume for Indian freshers',
  'resume for MNC',
  'best resume format India 2025',

  // ── Competitors / Alternatives ────────────────────────────────
  'alternative to resume.io',
  'alternative to Zety',
  'alternative to Canva resume',
  'better than Novoresume',
  'free alternative to LinkedIn resume',

  // ── Long Tail ─────────────────────────────────────────────────
  'how to make a resume for first job',
  'how to build ATS resume',
  'best resume format for freshers 2025',
  'resume tips for software engineers',
  'make resume in minutes',
  'build resume online free no watermark',
  'AI write my resume for me',
  'upload old resume and improve it',
],
  authors: [{ name: 'Rohit Somnath Banerjee' }],
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'WMT0_6q4Ff3F92BeOO7ySYhPZPywnlQeB_FJLD8weo8', // Keeping your verification code safe!
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
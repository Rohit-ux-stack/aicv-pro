'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Edit3, Sparkles, Download, CheckCircle2, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- TS Error Fix: Explicitly cast 'ease' properties as const ---
const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, type: 'tween' as const, ease: 'easeOut' as const } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const stepItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, type: 'tween' as const, ease: 'easeOut' as const }
  }
};
const CustomGithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
export default function HowToUsePage() {
  const steps = [
    {
      icon: <UploadCloud className="w-6 h-6 text-violet-400" />,
      title: "1. Start Your Journey",
      description: "Upload an existing PDF resume to let our AI engine extract and format your data instantly, or choose to build a precision document manually from scratch."
    },
    {
      icon: <Edit3 className="w-6 h-6 text-violet-400" />,
      title: "2. Input Core Details",
      description: "Navigate seamlessly through the sections using the 'Next' and 'Previous' buttons. Fill in your Education, Experience, Projects, and Certifications."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-violet-400" />,
      title: "3. Leverage Smart Tags",
      description: "For skills, languages, and target job profiles, simply type a word and press 'Enter' or 'Comma' to create a smart chip. You can even paste a comma-separated list to add multiple at once!"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-violet-400" />,
      title: "4. Let AI Craft Your Summary",
      description: "Once your profile details are filled out, navigate to the final step and click 'AI Write for Me'. Our intelligent system will analyze your data to write a compelling, ATS-optimized executive summary."
    },
    {
      icon: <Download className="w-6 h-6 text-violet-400" />,
      title: "5. Preview & Export",
      description: "Review your generated PDF in the live 1:1 viewer. If everything looks perfect, hit 'Download PDF' to receive your professionally formatted, application-ready document."
    }
  ];

  return (
    <div 
      className="relative flex min-h-screen w-full flex-col items-center px-4 py-8 sm:px-6 sm:py-12 overflow-hidden font-sans"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #1e0a3c 0%, #0a0a12 60%, #000000 100%)' }}
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" 
        />
      </div>

      {/* Back Button Container */}
      <div className="w-full max-w-4xl mb-6 relative z-20">
        <Link href="/">
          <Button variant="ghost" className="text-violet-300 hover:text-white hover:bg-violet-500/20 transition-all px-4 py-2 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Builder
          </Button>
        </Link>
      </div>

      {/* Main Content Card */}
      <motion.div 
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="glass-card relative z-10 w-full max-w-4xl rounded-[2rem] sm:rounded-[2.5rem] border border-violet-400/20 bg-black/50 p-6 sm:p-8 md:p-12 shadow-2xl shadow-violet-950/50 backdrop-blur-2xl"
      >
        {/* subtle inner top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[2.5rem] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/50 ring-1 ring-white/10">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
            AICV<span className="text-violet-400">-Pro</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-sm">
          How to Use the Builder
        </h1>
        <p className="text-violet-200/70 mb-8 sm:mb-12 text-base sm:text-lg font-medium">
          Master the AI resume creation process in 5 easy steps.
        </p>

        {/* Steps List */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-6"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={stepItemVariants}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-300 p-5 sm:p-6 rounded-2xl border border-violet-400/15 group"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-400/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-violet-200/70 leading-relaxed text-sm sm:text-base font-medium">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action Footer */}
        <div className="mt-10 sm:mt-14 text-center border-t border-violet-500/20 pt-8 sm:pt-10">
          <Link href="/">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg font-bold shadow-xl shadow-violet-900/40 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
              Start Building Now
            </Button>
          </Link>
        </div>
      </motion.div>
      {/* ── Footer ── */}
      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="relative z-10 w-full mt-auto shrink-0 border-t border-violet-500/10 pt-10 pb-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-violet-400/60 mb-4">
          <span className="font-black text-violet-400/80 tracking-widest uppercase text-[11px]">AICV-Pro</span>
          <span className="text-violet-500/30">·</span>
          <span className="text-violet-400/40">© {new Date().getFullYear()}</span>
          {[['How to Use', '/how-to-use'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <React.Fragment key={href}>
              <span className="hidden sm:inline text-violet-500/30">·</span>
              <Link href={href} className="text-violet-400/60 hover:text-violet-300 transition-colors">{label}</Link>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <a href="mailto:rohitbanerjee847@gmail.com" className="flex items-center gap-2 text-[11px] font-medium text-violet-400/45 hover:text-violet-300 transition-colors group">
            <Mail className="h-3.5 w-3.5" />
            <span className="group-hover:underline underline-offset-2">rohitbanerjee847@gmail.com</span>
          </a>
          <span className="hidden sm:inline text-violet-600/40">·</span>
          <a href="https://github.com/Rohit-ux-stack" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-medium text-violet-400/45 hover:text-violet-300 transition-colors group">
            <CustomGithubIcon className="h-3.5 w-3.5" />
            <span className="group-hover:underline underline-offset-2">github.com/Rohit-ux-stack</span>
          </a>
        </div>
      </motion.footer>
    </div>
  );
}
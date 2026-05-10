'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Edit3, Sparkles, Download, CheckCircle2, Zap } from 'lucide-react';
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
    </div>
  );
}
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

interface IntroSplashProps {
  forcePlay?: boolean;
}

export function IntroSplash({ forcePlay = false }: IntroSplashProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [isEmerging, setIsEmerging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // 1. Accessibility & Show-Once verification
  useEffect(() => {
    // If not forced, check sessionStorage
    if (!forcePlay && typeof window !== 'undefined') {
      const alreadyPlayed = sessionStorage.getItem('introPlayed');
      if (alreadyPlayed === 'true') {
        setIsSkipped(true);
        router.replace('/login');
        return;
      }

      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        sessionStorage.setItem('introPlayed', 'true');
        setIsSkipped(true);
        router.replace('/login');
        return;
      }
    }

    // Delay skip button appearance by 1.5s
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    // 3-second fallback timer: if video hasn't started playing, redirect to /login
    const fallbackTimer = setTimeout(() => {
      if (videoRef.current && videoRef.current.currentTime === 0) {
        console.warn('Intro video autoplay timed out. Redirecting to login directly.');
        handleFinish();
      }
    }, 3000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallbackTimer);
    };
  }, [forcePlay, router]);

  // Finish and mark intro as played
  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('introPlayed', 'true');
    }
    setIsCompleted(true);
    router.push('/login');
  };

  // Skip button click
  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleFinish();
  };

  // Toggle audio
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Time update listener for the 13s doorway transition
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;

    if (time > 0.2 && !hasStarted) {
      setHasStarted(true);
    }

    // 13.0s: Start emerging through the glowing portal doorway
    if (time >= 13.0 && !isEmerging) {
      setIsEmerging(true);
    }

    // 15.5s: Complete transition cleanly to login
    if (time >= 15.5 && !isCompleted) {
      handleFinish();
    }
  };

  if (isSkipped) {
    return null;
  }

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black select-none">
      {/* Video Background Layer */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* High-Definition Video Element (Native hardware decoding & smooth GPU filtering) */}
      <motion.video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        animate={{
          opacity: isCompleted ? 0 : isEmerging ? 0.35 : 1,
        }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-contain sm:object-cover object-center pointer-events-none z-0"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </motion.video>

      {/* Atmospheric Portal Glow & Ambient Vignette during Doorway emergence */}
      <motion.div
        animate={{
          opacity: isEmerging ? 1 : 0,
        }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none z-10 bg-radial from-amber-500/20 via-slate-950/70 to-slate-950/95"
      />

      {/* Emergent Functional Login Form (Portal Transition) - Fully Mobile Responsive */}
      <AnimatePresence>
        {isEmerging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-4 max-h-[100dvh] overflow-y-auto"
          >
            <div className="w-full max-w-sm sm:max-w-md portal-glow-rim rounded-2xl my-auto">
              <LoginForm isInPortal={true} onSuccess={handleFinish} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Mute/Unmute Toggle (Top-Left on Mobile, Bottom-Left on Desktop) */}
      <div className="absolute top-4 left-4 sm:top-auto sm:bottom-6 sm:left-6 z-30">
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white backdrop-blur-md text-xs font-mono transition shadow-lg cursor-pointer"
          title={isMuted ? 'Enable Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline sm:inline">Unmute</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline sm:inline">Sound On</span>
            </>
          )}
        </button>
      </div>

      {/* "Skip Intro →" Floating Pill (Top-Right on Mobile, Bottom-Right on Desktop) */}
      <AnimatePresence>
        {showSkip && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 z-30"
          >
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 hover:border-amber-400 backdrop-blur-md text-xs font-mono font-semibold transition-all duration-200 shadow-xl cursor-pointer group"
            >
              <span>Skip Intro</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

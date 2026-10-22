'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight, Play, Sparkles } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

interface IntroSplashProps {
  forcePlay?: boolean;
}

export function IntroSplash({ forcePlay = false }: IntroSplashProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSkip, setShowSkip] = useState(true);
  const [isEmerging, setIsEmerging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [needsUserTap, setNeedsUserTap] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Play video safely handling browser autoplay restrictions (e.g. iOS Low Power Mode)
  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
      setHasStarted(true);
      setNeedsUserTap(false);
    } catch (err) {
      console.warn('Autoplay restricted by browser/Low Power Mode, awaiting user tap:', err);
      // Browser blocked autoplay (common on iOS when Low Power Mode is ON)
      setNeedsUserTap(true);
      setIsPlaying(false);
    }
  }, [isMuted]);

  useEffect(() => {
    attemptPlay();
  }, [attemptPlay]);

  // Handle user tap anywhere to start/resume video
  const handleScreenTap = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
          setNeedsUserTap(false);
        })
        .catch((err) => {
          console.error('Play failed on user tap:', err);
        });
    }
  };

  // Finish and proceed to login
  const handleFinish = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    router.push('/login');
  };

  // Skip button click
  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleFinish();
  };

  // Toggle audio
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Time update listener for the 13s doorway transition & smooth progress
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const time = video.currentTime;
    const duration = video.duration || 16;

    setVideoProgress((time / duration) * 100);

    if (time > 0.2 && !hasStarted) {
      setHasStarted(true);
    }

    // 13.0s: Start emerging through the glowing portal doorway
    if (time >= 13.0 && !isEmerging) {
      setIsEmerging(true);
    }

    // Complete transition cleanly once video ends or reaches final 0.5s
    if (duration > 0 && time >= duration - 0.5 && !isCompleted) {
      handleFinish();
    }
  };

  return (
    <div
      onClick={handleScreenTap}
      className="relative w-screen h-[100dvh] overflow-hidden bg-black select-none cursor-pointer"
    >
      {/* Video Background Layer */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* High-Definition Video Element (PlaysInline for mobile iOS/Android) */}
      <motion.video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        playsInline
        webkit-playsinline="true"
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setNeedsUserTap(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        animate={{
          opacity: isCompleted ? 0 : isEmerging ? 0.35 : 1,
        }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-contain sm:object-cover object-center z-0"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </motion.video>

      {/* Center "Tap to Play" overlay if browser (e.g. iOS Low Power Mode) pauses autoplay */}
      <AnimatePresence>
        {needsUserTap && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center"
          >
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-amber-500/30 blur-xl animate-pulse" />
              <button
                type="button"
                onClick={handleScreenTap}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/50 hover:scale-105 active:scale-95 transition"
              >
                <Play className="w-9 h-9 sm:w-10 sm:h-10 fill-current translate-x-1" />
              </button>
            </div>

            <div className="mt-6 space-y-2 max-w-xs">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>TicketScan Portal</span>
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Tap anywhere on screen to begin cinematic journey
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Portal Glow & Ambient Vignette during Doorway emergence */}
      <motion.div
        animate={{
          opacity: isEmerging ? 1 : 0,
        }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none z-10 bg-radial from-amber-500/20 via-slate-950/70 to-slate-950/95"
      />

      {/* Emergent Functional Login Form (Portal Transition) */}
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
            onClick={(e) => e.stopPropagation()}
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
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white backdrop-blur-md text-xs font-mono transition shadow-lg cursor-pointer"
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

      {/* Subtle Progress Bar along the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-30 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-150"
          style={{ width: `${videoProgress}%` }}
        />
      </div>
    </div>
  );
}

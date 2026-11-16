'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';
import { ExperienceMode } from '../layout/CalculatorExperience';
import { Archetype } from '../../types';

interface VerraHeroVideoProps {
  onSelectMode?: (mode: ExperienceMode) => void;
  onSelectArchetype?: (arc: Archetype) => void;
}

export function VerraHeroVideo({ onSelectMode, onSelectArchetype }: VerraHeroVideoProps) {
  const scrollToCalculator = () => {
    const el = document.getElementById('calculator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-[100dvh] min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#07162C]">
      {/* 1. Full-Bleed Background Video (Adapts to Mobile, Tablet & Desktop) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          className="w-full h-full object-cover filter brightness-[0.85]"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* 2. Verra Cinematic Dark Overlay (Ensures text readability on all displays) */}
      <div className="absolute inset-0 bg-[#07162C]/65 md:bg-[#07162C]/60 z-10 pointer-events-none" />

      {/* Top spacer to balance fixed navbar height */}
      <div className="h-16 sm:h-20 lg:h-24 w-full shrink-0 z-20 pointer-events-none" />

      {/* 3. Hero Content Container (Occupies 1/3 on left, leaving 2/3 open for video) */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full my-auto py-4">
        <div className="max-w-md lg:max-w-lg">
          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.15] mb-6 sm:mb-8 text-balance drop-shadow-sm">
            Precision carbon accounting across households, agriculture, and industry.
          </h1>

          {/* Exactly ONE Authoritative Clean CTA Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={scrollToCalculator}
              className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-md bg-white text-zinc-950 font-bold text-sm sm:text-base hover:bg-zinc-100 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] cursor-pointer tracking-tight"
            >
              Explore Calculator
            </button>
          </div>
        </div>
      </div>

      {/* 4. Verra Animated Down Arrow Indicator (Pinned above bottom of viewport) */}
      <div className="relative z-20 pb-5 sm:pb-8 flex justify-center shrink-0">
        <button
          type="button"
          onClick={scrollToCalculator}
          aria-label="Scroll down to calculator"
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/35 flex items-center justify-center animate-bounce bg-white/10 backdrop-blur-xs group-hover:border-white transition-all shadow-md">
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}

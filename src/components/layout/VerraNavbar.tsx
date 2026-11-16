'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Building2,
  Home,
  Wheat,
  Award,
  Search,
} from 'lucide-react';
import { ExperienceMode } from './CalculatorExperience';
import { Archetype } from '../../types';

interface VerraNavbarProps {
  currentMode: ExperienceMode;
  onSelectMode: (mode: ExperienceMode) => void;
  onSelectArchetype?: (arc: Archetype) => void;
}

export function VerraNavbar({ currentMode, onSelectMode, onSelectArchetype }: VerraNavbarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position so navbar stays solid white when scrolled down past the hero
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When mouse is on the navbar OR scrolled down, the navbar lights up to white
  const isBright = isHovered || isScrolled;

  const handleModeClick = (mode: ExperienceMode, archetype?: Archetype) => {
    onSelectMode(mode);
    if (archetype && onSelectArchetype) {
      onSelectArchetype(archetype);
    }
    setMobileMenuOpen(false);

    // Smooth scroll down to calculator
    const el = document.getElementById('calculator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-0 inset-x-0 z-50 w-full font-sans transition-all duration-300 ease-in-out"
    >
      {/* 1. TOP UTILITY BAR (Exact Verra Dark Navy Bar) */}
      <div className="hidden lg:block text-xs bg-[#081d40] text-white/90 border-b border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          {/* Left utility dropdowns */}
          <div className="flex items-center gap-6 text-[11px] font-medium text-white/85">
            {/* Registry Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors py-1 cursor-pointer"
              >
                <span>Registry</span>
                <ChevronDown className="w-3 h-3 text-white/60 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-zinc-900 rounded-lg shadow-2xl border border-zinc-200 py-1.5 hidden group-hover:block z-50">
                <a
                  href="https://registry.verra.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-zinc-50 text-zinc-700 font-semibold"
                >
                  <span>Verra Registry Log In</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
                <a
                  href="#calculator-section"
                  onClick={() => handleModeClick('audit')}
                  className="block px-3 py-1.5 text-xs hover:bg-zinc-50 text-zinc-600"
                >
                  Registry Issuance Suite
                </a>
              </div>
            </div>

            {/* Project Hub Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors py-1 cursor-pointer"
              >
                <span>Project Hub</span>
                <ChevronDown className="w-3 h-3 text-white/60 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-zinc-900 rounded-lg shadow-2xl border border-zinc-200 py-1.5 hidden group-hover:block z-50">
                <a
                  href="/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-1.5 text-xs hover:bg-zinc-50 text-zinc-700 font-mono text-[11px]"
                >
                  Digital Gateway API (/openapi.json)
                </a>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-1.5 text-xs hover:bg-zinc-50 text-zinc-700 font-mono text-[11px]"
                >
                  AI Agents Context (/llms.txt)
                </a>
              </div>
            </div>

            <span className="text-white/30">|</span>
            <span className="text-cyan-300 font-semibold tracking-wide">
              ISO 14064-1/2 • GHG Protocol • 2019 IPCC AFOLU
            </span>
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-4 text-[11px] font-medium text-white/85">
            <a
              href="#methodology-and-audit"
              onClick={() => handleScrollTo('methodology-and-audit')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Statutory Formulas
            </a>
            <span className="text-white/30">|</span>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/15 text-white hover:bg-white/25 transition"
            >
              API (/openapi.json)
            </a>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/25 text-cyan-200 hover:bg-cyan-500/35 transition"
            >
              AI Agents (/llms.txt)
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR (Transparent over video -> Lights up to white on hover/scroll) */}
      <div
        className={`w-full transition-all duration-300 ease-in-out ${
          isBright
            ? 'bg-white shadow-md border-b border-zinc-200/90 text-zinc-950'
            : 'bg-transparent border-b border-white/15 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 lg:h-18 flex items-center justify-between gap-3">
          {/* Brand Logo: Clean CLIMATE-LEDGER Emblem (VERRA removed) */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm tracking-tighter shadow-xs transition-all duration-300 ${
                  isBright
                    ? 'bg-[#0F3A2E] text-white shadow-sm'
                    : 'bg-white/20 backdrop-blur-md border border-white/40 text-white'
                }`}
              >
                CL
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-extrabold text-sm sm:text-base md:text-lg tracking-tight transition-colors duration-300 ${
                      isBright ? 'text-zinc-950' : 'text-white'
                    }`}
                  >
                    CLIMATE-LEDGER™
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold border transition-colors duration-300 ${
                      isBright
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white/15 text-white/90 border-white/25'
                    }`}
                  >
                    v2.4
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium transition-colors duration-300 hidden sm:block ${
                    isBright ? 'text-zinc-500' : 'text-white/70'
                  }`}
                >
                  Carbon Accounting &amp; Registry Suite
                </p>
              </div>
            </a>
          </div>

          {/* Navigation Links: Plain White over Video -> Black when Lit Up */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-xs sm:text-sm font-semibold">
            {/* Audit Archetypes Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isBright
                    ? 'text-zinc-950 hover:text-[#057299]'
                    : 'text-white hover:text-white/80'
                }`}
              >
                <span>Audit Archetypes</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform group-hover:rotate-180 ${
                    isBright ? 'text-zinc-500' : 'text-white/70'
                  }`}
                />
              </button>

              {/* Dropdown Menu for House, Farmers, Industry */}
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200 p-2 hidden group-hover:block z-50 animate-in fade-in-50 slide-in-from-top-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1.5">
                  Audit Modules
                </div>
                <button
                  type="button"
                  onClick={() => handleModeClick('audit', 'household')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md shrink-0 mt-0.5">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-900">House (Domestic)</div>
                    <div className="text-[11px] text-zinc-500">Electricity, LPG, water &amp; domestic waste</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeClick('audit', 'agriculture')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md shrink-0 mt-0.5">
                    <Wheat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-900">Farmers (Agriculture)</div>
                    <div className="text-[11px] text-zinc-500">IPCC Tier 1 enteric, paddy, fertilizer</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeClick('audit', 'corporate')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-900">Industry (Corporate)</div>
                    <div className="text-[11px] text-zinc-500">Scope 1-3, freight logistics, cloud SCI</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Registries Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1 cursor-pointer ${
                  isBright
                    ? 'text-zinc-950 hover:text-[#057299]'
                    : 'text-white hover:text-white/80'
                }`}
              >
                <span>Registries</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform group-hover:rotate-180 ${
                    isBright ? 'text-zinc-500' : 'text-white/70'
                  }`}
                />
              </button>
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200 p-2 hidden group-hover:block z-50">
                <a
                  href="#calculator-section"
                  onClick={() => handleModeClick('audit')}
                  className="block p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="font-bold text-xs text-zinc-900">BEE India Carbon Market</div>
                  <div className="text-[11px] text-zinc-500">CCTS compliance certificates</div>
                </a>
                <a
                  href="#calculator-section"
                  onClick={() => handleModeClick('audit')}
                  className="block p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="font-bold text-xs text-zinc-900">Verra VCS (VM0042)</div>
                  <div className="text-[11px] text-zinc-500">Soil organic carbon &amp; forestry</div>
                </a>
                <a
                  href="#calculator-section"
                  onClick={() => handleModeClick('audit')}
                  className="block p-2 rounded-lg hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="font-bold text-xs text-zinc-900">Gold Standard</div>
                  <div className="text-[11px] text-zinc-500">Household energy &amp; clean cookstoves</div>
                </a>
              </div>
            </div>

            {/* Methodology Anchor */}
            <a
              href="#methodology-and-audit"
              onClick={() => handleScrollTo('methodology-and-audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                isBright
                  ? 'text-zinc-950 hover:text-[#057299]'
                  : 'text-white hover:text-white/80'
              }`}
            >
              Methodology
            </a>

            {/* API Documentation */}
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1 cursor-pointer ${
                isBright
                  ? 'text-zinc-950 hover:text-[#057299]'
                  : 'text-white hover:text-white/80'
              }`}
            >
              <span>API Docs</span>
              <ExternalLink className={`w-3 h-3 ${isBright ? 'text-zinc-400' : 'text-white/70'}`} />
            </a>
          </nav>

          {/* Right Action: Mode Switcher Pills (Adapts to White or Translucent Glass) */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center p-1 rounded-xl transition-all duration-300 ${
                isBright
                  ? 'bg-zinc-100 border border-zinc-200 shadow-inner'
                  : 'bg-white/15 backdrop-blur-md border border-white/25 shadow-sm'
              }`}
            >
              {/* Pill 1: Personal Use */}
              <button
                type="button"
                onClick={() => handleModeClick('quick')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMode === 'quick'
                    ? isBright
                      ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200 font-extrabold'
                      : 'bg-white text-zinc-950 shadow-sm font-extrabold'
                    : isBright
                    ? 'text-zinc-600 hover:text-zinc-950'
                    : 'text-white/85 hover:text-white'
                }`}
                title="60-Second Approximate Personal Footprint"
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    currentMode === 'quick' ? 'text-amber-500 fill-amber-500' : 'opacity-70'
                  }`}
                />
                <span className="hidden sm:inline">Personal Use</span>
                <span className="sm:hidden">Personal</span>
              </button>

              {/* Pill 2: Serious Users & Professionals */}
              <button
                type="button"
                onClick={() => handleModeClick('audit')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentMode === 'audit'
                    ? isBright
                      ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200 font-extrabold'
                      : 'bg-white text-zinc-950 shadow-sm font-extrabold'
                    : isBright
                    ? 'text-zinc-600 hover:text-zinc-950'
                    : 'text-white/85 hover:text-white'
                }`}
                title="Serious Users & Audit Suite (House · Farmers · Industry)"
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    currentMode === 'audit' ? 'text-emerald-700' : 'opacity-70'
                  }`}
                />
                <span className="hidden md:inline">Serious Users &amp; Professionals</span>
                <span className="md:hidden">Audit Suite</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isBright
                  ? 'text-zinc-900 hover:bg-zinc-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white text-zinc-900 border-t border-zinc-200 px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-100">
              <button
                type="button"
                onClick={() => handleModeClick('quick')}
                className={`p-2.5 rounded-lg text-left text-xs font-bold border transition cursor-pointer ${
                  currentMode === 'quick'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Personal Use</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-normal">Approx personal footprint (60s)</div>
              </button>

              <button
                type="button"
                onClick={() => handleModeClick('audit')}
                className={`p-2.5 rounded-lg text-left text-xs font-bold border transition cursor-pointer ${
                  currentMode === 'audit'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Serious Users</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-normal">House, Farmers &amp; Industry</div>
              </button>
            </div>

            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Audit Modules (Serious Users):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeClick('audit', 'household')}
                className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-zinc-600" />
                <span>House</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeClick('audit', 'agriculture')}
                className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800 cursor-pointer"
              >
                <Wheat className="w-3.5 h-3.5 text-zinc-600" />
                <span>Farmers</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeClick('audit', 'corporate')}
                className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Industry</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 space-y-2 text-xs font-medium text-zinc-700">
              <a
                href="#methodology-and-audit"
                onClick={() => handleScrollTo('methodology-and-audit')}
                className="block py-1 hover:text-emerald-800 cursor-pointer"
              >
                Statutory Methodology Reference
              </a>
              <a
                href="/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1 hover:text-emerald-800"
              >
                OpenAPI 3.1.0 Specification
              </a>
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1 hover:text-emerald-800"
              >
                LLM Context File (/llms.txt)
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

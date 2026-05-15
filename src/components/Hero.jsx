import React from 'react';
import { Play } from 'lucide-react';

const Hero = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-4 text-center">
      {/* Badge with Glow */}
      <div className="mb-10 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-950/30 text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <span className="text-blue-500 text-sm">⚡</span> The Shark Tank of Interviews
      </div>

      {/* Hero Title */}
      <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase text-white">
        Swim to <br />
        <span className="text-slate-500">Success.</span>
      </h1>

      {/* Description */}
      <p className="max-w-xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12">
        Interactive AI interview prep with Shark 🦈 mentor, level-based 
        timers, and detailed progress tracking.
      </p>

      {/* Glowing Action Button */}
      <button 
        onClick={onStart}
        className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95"
      >
        <Play className="fill-white group-hover:animate-pulse" size={24} />
        Begin Journey
      </button>
    </div>
  );
};

export default Hero;
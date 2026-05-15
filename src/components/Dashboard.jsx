import React from 'react';
import { Brain, UserCircle, Calendar, ChevronRight } from 'lucide-react';

const RoundCard = ({ icon: Icon, title, desc, onSelect }) => (
  <div className="bg-[#0b1224] border border-slate-800 p-8 rounded-3xl hover:border-blue-500 transition-all group">
    <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
      <Icon className="text-blue-400" size={24} />
    </div>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className="text-slate-400 mb-6">{desc}</p>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">
       <Calendar size={14} /> 2:00 Per Q
    </div>
    <button 
      onClick={onSelect}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
    >
      Start Round <ChevronRight size={18} />
    </button>
  </div>
);

export default function Dashboard({ onSelectRound }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Select Simulation</h2>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
          {['Beginner', 'Professional', 'Expert'].map(lv => (
            <button key={lv} className={`px-4 py-2 rounded-lg text-sm font-bold ${lv === 'Beginner' ? 'bg-blue-600' : 'text-slate-500'}`}>
              {lv}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <RoundCard 
          icon={Brain} title="Logic Round" 
          desc="Numbers, patterns, and quick logic." 
          onSelect={() => onSelectRound('logic')}
        />
        <RoundCard 
          icon={UserCircle} title="HR Round" 
          desc="Soft skills & behavioral tests." 
          onSelect={() => onSelectRound('hr')}
        />
        {/* Add more cards here */}
      </div>
    </div>
  );
}

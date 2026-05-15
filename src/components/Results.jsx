import React from 'react';

const Results = ({ questions, userAnswers }) => {
  // Logic to calculate score
  const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
  const scorePercentage = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12">
      {/* Percentage Header */}
      <div className="text-center mb-16">
        <h1 className="text-[120px] md:text-[160px] font-black text-blue-500 leading-none shadow-blue-500/20 drop-shadow-2xl">
          {scorePercentage}%
        </h1>
        <p className="text-2xl font-black uppercase tracking-[0.3em] mt-4">Final Assessment</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Strengths & Weaknesses */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#061e1e] border border-emerald-900/30 p-8 rounded-[32px]">
            <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-4">Strengths</h3>
            {/* Logic: Map through topics where user got 100% correct */}
            <p className="text-slate-500 text-sm italic">Complete more rounds to identify strengths.</p>
          </div>

          <div className="bg-[#1a0b10] border border-red-900/30 p-8 rounded-[32px]">
            <h3 className="text-red-400 font-black text-xs uppercase tracking-widest mb-6">Weaknesses</h3>
            <ul className="space-y-3 text-slate-300 font-medium text-sm">
              <li>• Time and Work</li>
              <li>• Profit and Loss</li>
              <li>• Averages</li>
              <li>• Percentages</li>
              <li>• Ratios and Proportions</li>
            </ul>
          </div>
        </div>

        {/* Right Section: Question Review */}
        <div className="lg:col-span-8 space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-[#0b1120] border border-slate-800 rounded-[32px] p-8 md:p-10">
              <h4 className="text-lg font-bold leading-relaxed mb-8">
                {idx + 1}. {q.question}
              </h4>

              <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* User Answer Box */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">You</span>
                  <span className={`font-bold ${userAnswers[idx] === q.correctAnswer ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {userAnswers[idx] !== null ? q.options[userAnswers[idx]] : 'No Ans'}
                  </span>
                </div>

                {/* Correct Answer Box */}
                <div className="flex-1 bg-blue-950/20 border border-blue-900/30 p-5 rounded-2xl">
                  <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Correct</span>
                  <span className="font-bold text-blue-400">{q.options[q.correctAnswer]}</span>
                </div>
              </div>

              {/* Logic/Explanation Box */}
              <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50">
                <p className="text-xs italic text-slate-400 leading-relaxed">
                  <span className="text-slate-200 font-bold not-italic">Logic:</span> {q.explanation || "The combined rate of work is calculated using the reciprocal sum method."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Shark Icon */}
      <div className="fixed bottom-8 right-8">
        <button className="p-4 bg-blue-600 rounded-full shadow-lg">
          <span className="text-2xl">🦈</span>
        </button>
      </div>
    </div>
  );
};

export default Results;
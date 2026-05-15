import React, { useState, useEffect } from 'react';
import { fetchQuestions } from "../services/gemini";

const Simulation = ({ roundType = "Logic" }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      const data = await fetchQuestions(roundType);
      setQuestions(data);
      setLoading(false);
    };
    loadQuiz();
  }, [roundType]);

  if (loading) return <div className="text-white text-center mt-20">Shark is preparing your questions... 🦈</div>;
  if (questions.length === 0) return <div className="text-white">Error loading questions.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0b1120] border border-slate-800 rounded-[40px] p-10 md:p-16 shadow-2xl">
        
        {/* Progress Header */}
        <div className="flex justify-between items-start mb-12">
          <div className="text-blue-500 font-black text-xs uppercase tracking-widest">
            Question {currentIndex + 1} / {questions.length}
          </div>
          <div className="text-4xl font-mono font-bold text-blue-400">{/* Timer logic here */}</div>
        </div>

        {/* Question */}
        <h2 className="text-3xl font-bold text-white mb-12">{currentQ.question}</h2>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {currentQ.options.map((option, index) => (
            <button key={index} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl text-left text-slate-300 hover:border-blue-500">
              <span className="font-black text-slate-500 mr-4">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="float-right bg-blue-600 px-10 py-4 rounded-xl font-bold text-white"
        >
          {currentIndex === questions.length - 1 ? "Finish" : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default Simulation;
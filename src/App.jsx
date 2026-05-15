import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Brain, UserCircle, Play, CheckCircle, X, Loader2, 
  Lightbulb, Clock, ArrowLeft, Star, AlertTriangle, Info, Sparkles,
  MessageCircle, Send, XCircle, Map, Zap
} from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// src/App.jsx
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const App = () => {
  // --- STATE ---
  const [view, setView] = useState('landing'); 
  const [level, setLevel] = useState('Beginner'); 
  const [category, setCategory] = useState(null); 
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dailyTask, setDailyTask] = useState(null);
  
  // Progress Journey (Leveling System)
  const [points, setPoints] = useState(150); 
  const userRank = points < 300 ? 'Novice' : points < 800 ? 'Pro' : 'Master Shark';

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Shark Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: "Hey chum! I'm Shark 🦈. Need help with an interview or just feeling like a fish out of water? Ask me anything!" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      clearInterval(interval);
      // Auto-advance or submit if time runs out
      if (currentIndex === 4) {
        submitInterview();
      } else {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(getLevelTime());
      }
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, currentIndex]);

  // --- UTILS ---
  const getLevelTime = useCallback(() => {
    if (level === 'Beginner') return 120;
    if (level === 'Professional') return 90;
    return 60;
  }, [level]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // --- AI LOGIC ---
  const callAI = async (prompt, isJson = true) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const rawText = await response.text();
    console.log("Gemini RAW:", rawText);

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = JSON.parse(rawText);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty AI response");
    }

    if (!isJson) return text;

    // Gemini sometimes wraps JSON in ```json ```
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);

  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};

  const getDailyTask = async () => {
    setLoading(true);
    setCategory('Daily');
    const result = await callAI(`Generate a unique daily logic puzzle for an interview prep. Return JSON: { title: "string", puzzle: "string", hint: "string", solution: "string" }`);
    if (result) {
      setDailyTask(result);
      setView('tasks');
    }
    setLoading(false);
  };

  const handleSharkChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const prompt = `You are Shark 🦈, an AI interview coach. Your style: simple English, funny, uses ocean puns, but provides very meaningful and helpful interview advice.
    The user says: "${userMsg}"
    Keep your answer short and punchy. Avoid complex formatting.`;
    
    const response = await callAI(prompt, false);
    setChatHistory(prev => [...prev, { role: 'bot', text: response || "My gills are clogged! Try again." }]);
    setIsChatLoading(false);
  };

  const startSession = async (type) => {
    setLoading(true);
    setCategory(type);
    const result = await callAI(`Generate 5 ${level} interview questions for ${type}. Each question object MUST include an 'options' key which is an ARRAY of 4 strings. Return JSON array: [{id, question, options: ["A", "B", "C", "D"], answer, explanation}]`);
    if (result && Array.isArray(result)) {
      setQuestions(result);
      setView('interview');
      setCurrentIndex(0);
      setUserAnswers({});
      setTimeLeft(getLevelTime());
      setIsTimerActive(true);
    } else {
      console.error("Invalid AI response format");
    }
    setLoading(false);
  };

  const submitInterview = async () => {
    setIsTimerActive(false);
    setLoading(true);
    const result = await callAI(`Analyze these answers: ${JSON.stringify({ questions, userAnswers })}. Return JSON: { score: number, strengths: string[], weaknesses: string[], overallFeedback: string, mentorAdvice: string }`);
    if (result) {
      setFeedback(result);
      setPoints(prev => prev + (result?.score || 0)); 
      setView('result');
    }
    setLoading(false);
  };

  // --- UI COMPONENTS ---
  const Card = ({ children, className = "" }) => (
    <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );

  const Button = ({ children, onClick, variant = "primary", icon: Icon, loading, disabled }) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
      outline: "border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
    };
    return (
      <button 
        onClick={onClick}
        disabled={loading || disabled}
        className={`${variants[variant]} flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40`}
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : Icon && <Icon className="w-5 h-5" />}
        {children}
      </button>
    );
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="max-w-4xl text-center z-10 animate-in fade-in zoom-in-95">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6 font-bold text-xs">
            <Zap className="w-4 h-4" /> THE SHARK TANK OF INTERVIEWS
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            SWIM TO<br/>SUCCESS.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Interactive AI interview prep with Shark 🦈 mentor, level-based timers, and detailed progress tracking.
          </p>
          <Button onClick={() => setView('dashboard')} icon={Play}>Begin Journey</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans relative">
      {/* --- DASHBOARD VIEW --- */}
      {view === 'dashboard' && (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <Map className="text-blue-500" /> Career Journey
                </h2>
                <p className="text-slate-500 text-sm">Your current status: <span className="text-blue-400 font-bold uppercase">{userRank}</span></p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-500">{points}</span>
                <span className="text-slate-600 text-xs font-bold block uppercase tracking-widest">XP Points</span>
              </div>
            </div>
            <div className="h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, (points/1000)*100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-600 uppercase tracking-tighter">
              <span>Novice</span>
              <span>Professional</span>
              <span>Expert Mentor</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400">Select Simulation</h3>
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
              {['Beginner', 'Professional', 'Expert'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${level === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { id: 'Aptitude', title: 'Logic Round', desc: 'Numbers, patterns, and quick logic.', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { id: 'HR', title: 'HR Round', desc: 'Soft skills & behavioral tests.', icon: UserCircle, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { id: 'Daily', title: 'Daily Tasks', desc: 'Keep your brain swimming!', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
            ].map((card) => (
              <Card key={card.id} className="group hover:-translate-y-2 transition-transform duration-300">
                <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center ${card.color} mb-6`}>
                  <card.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">{card.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 bg-slate-800/50 w-fit px-3 py-1 rounded-full border border-slate-700">
                  <Clock className="w-3 h-3" />
                  {level === 'Beginner' ? '2:00 Per Q' : level === 'Professional' ? '1:30 Per Q' : '1:00 Per Q'}
                </div>
                <Button 
                  onClick={() => card.id === 'Daily' ? getDailyTask() : startSession(card.id)} 
                  loading={loading && (category === card.id || (card.id === 'Daily' && view === 'tasks'))}
                  className="w-full"
                >
                  Start Round
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TASKS VIEW --- */}
      {view === 'tasks' && dailyTask && (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in slide-in-from-top-4">
          <Card className="max-w-2xl w-full border-emerald-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-8 h-8 text-emerald-400" />
              <h2 className="text-3xl font-black text-white">Logic Lab</h2>
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-200 border-b border-slate-800 pb-4">{dailyTask.title}</h3>
            <p className="text-slate-300 mb-10 text-lg leading-relaxed">{dailyTask.puzzle}</p>
            <div className="flex gap-4">
              <Button onClick={() => setView('dashboard')} variant="secondary" icon={ArrowLeft}>Back</Button>
              <Button onClick={() => alert(`Solution: ${dailyTask.solution}`)} variant="outline">Reveal Logic</Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- INTERVIEW VIEW --- */}
      {view === 'interview' && currentQuestion && (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in zoom-in-95">
          <Card className="max-w-3xl w-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-widest">Question {currentIndex + 1} / 5</span>
              <div className={`flex flex-col items-end ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                <div className="text-4xl font-mono font-black tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                <span className="text-[10px] uppercase font-black">Time Left</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-8 text-white">{currentQuestion.question}</h2>
            {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setUserAnswers({...userAnswers, [currentIndex]: opt})}
                    className={`text-left p-5 rounded-2xl border-2 transition-all font-bold ${userAnswers[currentIndex] === opt ? 'bg-blue-600 border-blue-400 shadow-xl translate-x-1' : 'bg-slate-800/40 border-slate-700'}`}
                  >
                    <span className="mr-3 text-slate-400">{String.fromCharCode(65 + i)}.</span> {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                className="w-full h-48 bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-6 mb-10 outline-none focus:border-blue-500 text-lg text-white"
                placeholder="Type your response..."
                value={userAnswers[currentIndex] || ''}
                onChange={(e) => setUserAnswers({...userAnswers, [currentIndex]: e.target.value})}
              />
            )}
            <div className="flex justify-end">
              <Button onClick={() => currentIndex === 4 ? submitInterview() : (setCurrentIndex(prev => prev + 1), setTimeLeft(getLevelTime()))} loading={loading}>
                {currentIndex === 4 ? 'Submit Simulation' : 'Next Question'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- RESULTS VIEW --- */}
      {view === 'result' && feedback && (
        <div className="max-w-5xl mx-auto p-8 animate-in fade-in">
          <div className="text-center mb-12">
            <div className="text-9xl font-black text-blue-500 mb-2 drop-shadow-2xl">{feedback.score}%</div>
            <h2 className="text-3xl font-bold uppercase tracking-widest">Final Assessment</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                 <h4 className="font-black text-emerald-400 text-xs mb-3">STRENGTHS</h4>
                 <ul className="text-xs space-y-2">{feedback.strengths?.map((s,i) => <li key={i}>• {s}</li>)}</ul>
               </div>
               <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20">
                 <h4 className="font-black text-red-400 text-xs mb-3">WEAKNESSES</h4>
                 <ul className="text-xs space-y-2">{feedback.weaknesses?.map((w,i) => <li key={i}>• {w}</li>)}</ul>
               </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                  <p className="font-bold mb-4 text-white">{idx + 1}. {q.question}</p>
                  <div className="flex gap-4 text-sm mb-4">
                    <div className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 font-bold"><span className="text-[10px] text-slate-500 block">YOU</span> {userAnswers[idx] || 'No Ans'}</div>
                    <div className="flex-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold"><span className="text-[10px] text-blue-400/50 block">CORRECT</span> {q.answer}</div>
                  </div>
                  <div className="text-xs text-slate-400 italic bg-slate-800/50 p-3 rounded-xl"><strong>Logic:</strong> {q.explanation}</div>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => setView('dashboard')} className="w-full">Back to Dashboard</Button>
        </div>
      )}

      {/* --- SHARK CHATBOT 🦈 --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="w-80 md:w-96 h-[450px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col mb-4 animate-in slide-in-from-bottom-10">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-900 rounded-t-3xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦈</span>
                <div>
                  <h4 className="text-sm font-black text-white">Shark AI</h4>
                  <span className="text-[10px] text-blue-200">Interview Predator</span>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)}><XCircle className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && <div className="text-slate-500 text-[10px] animate-pulse">Shark is thinking... 🌊</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs focus:ring-1 ring-blue-500 outline-none text-white"
                placeholder="Ask Shark anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSharkChat()}
              />
              <button onClick={handleSharkChat} className="bg-blue-600 p-2 rounded-xl text-white"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-90"
        >
          <span className="text-3xl">🦈</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617]" />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;

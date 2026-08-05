import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Brain, UserCircle, Play, CheckCircle, X, Loader2, 
  Lightbulb, Clock, ArrowLeft, Star, AlertTriangle, Info, Sparkles,
  MessageCircle, Send, XCircle, Map, Zap, Mic, MicOff, Volume2,
  Video, VideoOff, Code, Flame, Target, Compass, BookOpen, VolumeX,
  Languages, Building2, Edit3, Trash2
} from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Native Web Audio Synthesizer for SFX
const playSFX = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // Ignore audio failures if context is restricted by browser
  }
};

// --- EXTERNAL REUSABLE UI COMPONENTS ---
// Defined outside App to prevent unmounting/remounting on state changes (fixes Scratchpad focus loss)
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", icon: Icon, loading, disabled, className = "" }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    outline: "border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
  };
  return (
    <button 
      onClick={(e) => {
        playSFX('click');
        if (onClick) onClick(e);
      }}
      disabled={loading || disabled}
      className={`${variants[variant]} flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 ${className}`}
    >
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

const App = () => {
  // --- STATE ---
  const [view, setView] = useState('landing'); 
  const [level, setLevel] = useState('Beginner'); 
  const [role, setRole] = useState('Frontend Developer');
  const [regionalDrive, setRegionalDrive] = useState('General MNC');
  const [vernacularLang, setVernacularLang] = useState('English');
  const [category, setCategory] = useState(null); 
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dailyTask, setDailyTask] = useState(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  
  // Audio & Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Camera State
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMockCam, setIsMockCam] = useState(false);
  const videoRef = useRef(null);

  // Scratchpad & Whiteboard State
  const [scratchpad, setScratchpad] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const canvasRef = useRef(null);
  const savedCanvasDataRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Gamification & Streak State
  const [points, setPoints] = useState(150); 
  const [streak, setStreak] = useState(3);
  const [badges, setBadges] = useState(['Early Bird', 'First Swim']);
  
  const userRank = points < 300 ? 'Novice' : points < 800 ? 'Pro' : 'Master Shark';

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Shark Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sharkPersona, setSharkPersona] = useState('funny');
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: "Hey chum! I'm Shark 🦈. Need help with an interview or just feeling like a fish out of water? Ask me anything!" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- SPEECH RECOGNITION SETUP ---
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (!isListening) {
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = vernacularLang === 'Tamil' ? 'ta-IN' : vernacularLang === 'Hindi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswers(prev => ({
          ...prev,
          [currentIndex]: (prev[currentIndex] || '') + ' ' + transcript
        }));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // --- CAMERA SETUP (SAFE WITH PERMISSION FALLBACK) ---
  const toggleCam = async () => {
    if (isCamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setIsCamActive(false);
      setIsMockCam(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCamActive(true);
        setIsMockCam(false);
      } catch (err) {
        console.warn("Camera access restricted or blocked. Switching to simulated pressure mode.", err);
        setIsCamActive(true);
        setIsMockCam(true);
      }
    }
  };

  // --- PERSISTENT WHITEBOARD DRAWING LOGIC ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      savedCanvasDataRef.current = canvas.toDataURL();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      savedCanvasDataRef.current = null;
    }
  };

  useEffect(() => {
    if (showWhiteboard && canvasRef.current && savedCanvasDataRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = savedCanvasDataRef.current;
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
  }, [showWhiteboard]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 11) playSFX('warn');
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      clearInterval(interval);
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

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = JSON.parse(rawText);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty AI response");
      }

      if (!isJson) return text;

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
    playSFX('click');
    setLoading(true);
    setCategory('Daily');
    const result = await callAI(`Generate a unique daily logic puzzle for an interview prep for target role ${role} in ${regionalDrive} recruitment drives. Return JSON: { title: "string", puzzle: "string", hint: "string", solution: "string" }`);
    if (result) {
      setDailyTask(result);
      setView('tasks');
    }
    setLoading(false);
  };

  const handleSharkChat = async () => {
    if (!chatInput.trim()) return;
    playSFX('click');
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const personaStyle = {
      funny: "funny, uses ocean puns, enthusiastic",
      ruthless: "direct, sharp, demanding high excellence, like a tough Wall Street recruiter",
      supportive: "warm, gentle, encouraging, highly empathetic",
      zen: "calm, structured, philosophical, focused on breath and mental clarity"
    };

    const prompt = `You are Shark 🦈, an AI interview coach. Your personality mode is: ${personaStyle[sharkPersona]}.
    User is practicing for a ${role} role in ${regionalDrive} placement drives.
    Preferred Language Explanation: ${vernacularLang}.
    The user says: "${userMsg}"
    Keep your answer short, practical, and punchy. Avoid complex markdown.`;
    
    const response = await callAI(prompt, false);
    const botMsg = response || "My gills are clogged! Try again.";
    setChatHistory(prev => [...prev, { role: 'bot', text: botMsg }]);
    setIsChatLoading(false);
  };

  const startSession = async (type) => {
    playSFX('click');
    setLoading(true);
    setCategory(type);
    const prompt = `Generate 5 ${level} level interview questions for a ${role} position focusing on ${type}. 
    Company/Drive Context: ${regionalDrive}.
    Explanation Language Focus: ${vernacularLang}.
    Each question object MUST include an 'options' key which is an ARRAY of 4 strings. 
    Return JSON array: [{id, question, options: ["A", "B", "C", "D"], answer, explanation}]`;
    
    const result = await callAI(prompt);
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
    playSFX('success');
    setIsTimerActive(false);
    setLoading(true);
    const result = await callAI(`Analyze these answers for a candidate applying for ${role} in ${regionalDrive} drives: ${JSON.stringify({ questions, userAnswers })}. Provide feedback tailored to ${vernacularLang} speaking students. Return JSON: { score: number, strengths: string[], weaknesses: string[], overallFeedback: string, mentorAdvice: string }`);
    if (result) {
      setFeedback(result);
      const addedPoints = result?.score || 0;
      setPoints(prev => prev + addedPoints);

      if (addedPoints >= 80 && !badges.includes('Sharpshooter')) {
        setBadges(prev => [...prev, 'Sharpshooter']);
      }
      setView('result');
    }
    setLoading(false);
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
            Interactive AI interview prep with Shark 🦈 mentor, voice answers, live camera simulator, regional drive modules, and custom role drills.
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
                <p className="text-slate-500 text-sm">Your status: <span className="text-blue-400 font-bold uppercase">{userRank}</span></p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-2xl">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-bold text-orange-400 text-sm">{streak} Day Streak</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-500">{points}</span>
                  <span className="text-slate-600 text-xs font-bold block uppercase tracking-widest">XP Points</span>
                </div>
              </div>
            </div>
            <div className="h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, (points/1000)*100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-600 uppercase tracking-tighter">
              <span>Novice (0 XP)</span>
              <span>Professional (300 XP)</span>
              <span>Expert Mentor (800+ XP)</span>
            </div>
          </div>

          {/* BADGES DISPLAY */}
          <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Badges:</span>
            {badges.map((b, idx) => (
              <span key={idx} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" /> {b}
              </span>
            ))}
          </div>

          {/* REGIONAL PLACEMENT & LANGUAGE CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-400" /> Target Position
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option>Frontend Developer</option>
                <option>Backend Developer</option>
                <option>Data Scientist</option>
                <option>Product Manager</option>
                <option>System Architect</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" /> Regional Placement Drive
              </label>
              <select 
                value={regionalDrive} 
                onChange={(e) => setRegionalDrive(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option>General MNC</option>
                <option>TCS Digital / NQT</option>
                <option>Infosys / Wipro Drive</option>
                <option>Zoho Software Development</option>
                <option>Tier-2 / Tier-3 College Campus Drive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-emerald-400" /> Explanation Language
              </label>
              <select 
                value={vernacularLang} 
                onChange={(e) => setVernacularLang(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option>English</option>
                <option>Tamil</option>
                <option>Hindi</option>
                <option>Telugu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Simulation Difficulty</label>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['Beginner', 'Professional', 'Expert'].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      playSFX('click');
                      setLevel(l);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${level === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { id: 'Aptitude', title: 'Logic Round', desc: 'Numbers, patterns, and quick reasoning.', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
              <Button onClick={() => setShowSolutionModal(true)} variant="outline">Reveal Logic</Button>
            </div>
          </Card>

          {/* Solution Modal */}
          {showSolutionModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-lg w-full animate-in zoom-in-95">
                <h4 className="text-2xl font-bold text-white mb-4">Solution</h4>
                <p className="text-slate-300 mb-6 leading-relaxed">{dailyTask.solution}</p>
                <Button onClick={() => setShowSolutionModal(false)} className="w-full">Got it!</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- INTERVIEW VIEW --- */}
      {view === 'interview' && currentQuestion && (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in zoom-in-95">
          <Card className="max-w-4xl w-full relative overflow-hidden">
            
            {/* INTERVIEW TOOLBAR: SPEECH READOUT, CAM SIMULATOR, SCRATCHPAD, WHITEBOARD */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-widest">Question {currentIndex + 1} / 5</span>
                <button 
                  onClick={() => speakText(currentQuestion.question)}
                  className="text-slate-400 hover:text-blue-400 transition-colors p-1"
                  title="Read Question Aloud"
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5 text-blue-400 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={toggleCam}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isCamActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {isCamActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  {isCamActive ? 'Disable Cam' : 'Enable Pressure Cam'}
                </button>

                <button 
                  onClick={() => {
                    setShowScratchpad(!showScratchpad);
                    if (showWhiteboard) setShowWhiteboard(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showScratchpad ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Code className="w-4 h-4" /> Scratchpad
                </button>

                <button 
                  onClick={() => {
                    setShowWhiteboard(!showWhiteboard);
                    if (showScratchpad) setShowScratchpad(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showWhiteboard ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Edit3 className="w-4 h-4" /> Whiteboard
                </button>

                <div className={`flex flex-col items-end ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                  <div className="text-3xl font-mono font-black tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                </div>
              </div>
            </div>

            {/* LIVE WEBCAM OVERLAY OR SIMULATED FALLBACK */}
            {isCamActive && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-700 h-44 bg-black relative flex items-center justify-center">
                {isMockCam ? (
                  <div className="text-center p-4">
                    <Video className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">Simulated Pressure Cam Active</span>
                  </div>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}
                <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> REC • Live Prep
                </span>
              </div>
            )}

            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white">{currentQuestion.question}</h2>

            {/* SCRATCHPAD AREA (TEXTAREA FIX INCLUDED) */}
            {showScratchpad && (
              <div className="mb-6 animate-in fade-in">
                <textarea
                  value={scratchpad}
                  onChange={(e) => setScratchpad(e.target.value)}
                  placeholder="Scratchpad for code snippets or logic thoughts..."
                  className="w-full h-32 bg-slate-950 font-mono text-sm text-emerald-400 p-4 rounded-xl border border-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* CANVAS WHITEBOARD AREA (CANVAS WIPE FIX INCLUDED) */}
            {showWhiteboard && (
              <div className="mb-6 animate-in fade-in relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-mono">Drawing Board (Touch & Mouse Supported)</span>
                  <button onClick={clearCanvas} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Clear Canvas
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full bg-slate-950 rounded-xl border border-slate-800 touch-none cursor-crosshair"
                />
              </div>
            )}

            {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      playSFX('click');
                      setUserAnswers({...userAnswers, [currentIndex]: opt});
                    }}
                    className={`text-left p-5 rounded-2xl border-2 transition-all font-bold ${userAnswers[currentIndex] === opt ? 'bg-blue-600 border-blue-400 shadow-xl translate-x-1' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}`}
                  >
                    <span className="mr-3 text-slate-400">{String.fromCharCode(65 + i)}.</span> {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="relative mb-10">
                <textarea
                  className="w-full h-48 bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-6 outline-none focus:border-blue-500 text-lg text-white pr-14"
                  placeholder="Type or use speech-to-text..."
                  value={userAnswers[currentIndex] || ''}
                  onChange={(e) => setUserAnswers({...userAnswers, [currentIndex]: e.target.value})}
                />
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    className={`absolute right-4 top-4 p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                    title="Dictate Answer"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
              </div>
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
                 <h4 className="font-black text-emerald-400 text-xs mb-3 uppercase">STRENGTHS</h4>
                 <ul className="text-xs space-y-2">{feedback.strengths?.map((s,i) => <li key={i}>• {s}</li>)}</ul>
               </div>
               <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20">
                 <h4 className="font-black text-red-400 text-xs mb-3 uppercase">WEAKNESSES</h4>
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
          <div className="w-80 md:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col mb-4 animate-in slide-in-from-bottom-10">
            
            {/* CHAT HEADER & PERSONALITY SELECTOR */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-900 rounded-t-3xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🦈</span>
                  <div>
                    <h4 className="text-sm font-black text-white">Shark AI</h4>
                    <span className="text-[10px] text-blue-200">Interview Predator</span>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)}><XCircle className="w-5 h-5 text-white/50 hover:text-white" /></button>
              </div>

              {/* Persona buttons */}
              <div className="flex gap-1 bg-black/30 p-1 rounded-xl">
                {['funny', 'ruthless', 'supportive', 'zen'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSharkPersona(p)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded-lg capitalize transition-all ${sharkPersona === p ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                    {msg.text}
                  </div>
                  {msg.role === 'bot' && (
                    <button 
                      onClick={() => speakText(msg.text)} 
                      className="text-[10px] text-slate-500 hover:text-blue-400 mt-1 flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Speak
                    </button>
                  )}
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
              <button onClick={handleSharkChat} className="bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-500"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        <button 
          onClick={() => {
            playSFX('click');
            setIsChatOpen(!isChatOpen);
          }}
          className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-90 relative"
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
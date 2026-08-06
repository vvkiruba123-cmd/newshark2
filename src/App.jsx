import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, Brain, UserCircle, Play, CheckCircle, X, Loader2, 
  Lightbulb, Clock, ArrowLeft, Star, AlertTriangle, Info, Sparkles,
  MessageCircle, Send, XCircle, Map, Zap, Mic, MicOff, Volume2,
  Video, VideoOff, Code, Flame, Target, Compass, BookOpen, VolumeX,
  Layers, RotateCw, Check, Repeat, Languages, Building2, LogOut, Lock, Mail
} from 'lucide-react';

// Import Supabase Client
import { supabase } from './services/supabase';
import PressureCam from './components/PressureCam';

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
    // Ignore audio failures
  }
};

// --- STABLE UI COMPONENTS (DECLARED OUTSIDE APP TO PREVENT INPUT FOCUS LOSS) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", icon: Icon, loading, disabled, className = "", type = "button" }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    outline: "border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
  };
  return (
    <button 
      type={type}
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
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- APP STATE ---
  const [view, setView] = useState('login'); 
  const [level, setLevel] = useState('Beginner'); 
  const [role, setRole] = useState('Frontend Developer');
  const [targetCompany, setTargetCompany] = useState('General MNC');
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

  // Scratchpad State
  const [scratchpad, setScratchpad] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);

  // Gamification & Streak State
  const [points, setPoints] = useState(150); 
  const [streak, setStreak] = useState(3);
  const [badges, setBadges] = useState(['Early Bird', 'First Swim']);

  // Rapid Warmup Flashcard State
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(0);
  
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

  // --- SUPABASE AUTH LISTENER & DATA FETCH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setView('landing');
      } else {
        setView('login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Supabase Error:", error.message);
      } else if (data) {
        if (data.points !== undefined) setPoints(data.points);
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.badges) setBadges(data.badges);
      }
    }

    fetchProfile();
  }, [user]);

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!authEmail || !authPassword) {
      setAuthError('Please enter both email and password.');
      setAuthLoading(false);
      return;
    }

    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setAuthError('Email not confirmed. Please check your inbox or disable email confirmation in Supabase Dashboard.');
        } else {
          setAuthError(error.message);
        }
        playSFX('warn');
      } else if (data.user) {
        playSFX('success');
        setUser(data.user);
        setView('landing');
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        setAuthError(error.message);
        playSFX('warn');
      } else if (data.user) {
        playSFX('success');
        setUser(data.user);
        setView('landing');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    playSFX('click');
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
  };

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
      recognition.lang = vernacularLang === 'Tamil' ? 'ta-IN' : vernacularLang === 'Hindi' ? 'hi-IN' : vernacularLang === 'Telugu' ? 'te-IN' : 'en-US';

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
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const rawText = await response.text();
      if (!response.ok) throw new Error("API request failed");

      const data = JSON.parse(rawText);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty AI response");

      if (!isJson) return text;

      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
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
    const result = await callAI(`Generate a unique daily logic puzzle for an interview prep targeting ${targetCompany} drive for target role ${role}. Provide explanations in ${vernacularLang}. Return JSON: { title: "string", puzzle: "string", hint: "string", solution: "string" }`);
    if (result) {
      setDailyTask(result);
      setView('tasks');
    }
    setLoading(false);
  };

  const startFlashcards = async () => {
    playSFX('click');
    setLoading(true);
    setCategory('Flashcards');
    const prompt = `Generate 5 high-yield rapid warmup flashcards for a ${role} interview targeting ${targetCompany} drive at ${level} difficulty level. Language for explanation should be ${vernacularLang}. Each item should have a 'question' (short key concept question), an 'answer' (concise clear explanation), and 'keyPoints' (array of 2 short bullet points). Return JSON array: [{ id: number, question: string, answer: string, keyPoints: string[] }]`;
    
    const result = await callAI(prompt);
    if (result && Array.isArray(result)) {
      setFlashcards(result);
      setFlashcardIndex(0);
      setIsFlipped(false);
      setMasteredCards(0);
      setView('flashcards');
    }
    setLoading(false);
  };

  const nextFlashcard = (isMastered = false) => {
    playSFX(isMastered ? 'success' : 'click');
    if (isMastered) {
      setMasteredCards(prev => prev + 1);
      setPoints(prev => prev + 10);
    }
    setIsFlipped(false);
    if (flashcardIndex < flashcards.length - 1) {
      setFlashcardIndex(prev => prev + 1);
    } else {
      setView('dashboard');
    }
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
      ruthless: "direct, sharp, demanding high excellence",
      supportive: "warm, gentle, encouraging",
      zen: "calm, structured, philosophical"
    };

    const prompt = `You are Shark 🦈, an AI interview coach. Your personality mode is: ${personaStyle[sharkPersona]}.
    User is practicing for a ${role} role targeting ${targetCompany} recruitment drive. Explain in ${vernacularLang}.
    The user says: "${userMsg}"
    Keep your answer short, practical, and punchy.`;
    
    const response = await callAI(prompt, false);
    const botMsg = response || "My gills are clogged! Try again.";
    setChatHistory(prev => [...prev, { role: 'bot', text: botMsg }]);
    setIsChatLoading(false);
  };

  const startSession = async (type) => {
    playSFX('click');
    setLoading(true);
    setCategory(type);
    const prompt = `Generate 5 ${level} level interview questions for a ${role} focusing on ${type} pattern specific to ${targetCompany} hiring drive pattern. Ensure explanations are in ${vernacularLang}. Each question object MUST include an 'options' key which is an ARRAY of 4 strings. Return JSON array: [{id, question, options: ["A", "B", "C", "D"], answer, explanation}]`;
    
    const result = await callAI(prompt);
    if (result && Array.isArray(result)) {
      setQuestions(result);
      setView('interview');
      setCurrentIndex(0);
      setUserAnswers({});
      setTimeLeft(getLevelTime());
      setIsTimerActive(true);
    }
    setLoading(false);
  };

  const submitInterview = async () => {
    playSFX('success');
    setIsTimerActive(false);
    setLoading(true);
    const result = await callAI(`Analyze these answers for a candidate applying for ${role} at ${targetCompany}. Give clear mentor suggestions in ${vernacularLang}: ${JSON.stringify({ questions, userAnswers })}. Return JSON: { score: number, strengths: string[], weaknesses: string[], overallFeedback: string, mentorAdvice: string }`);
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

  /* --- LOGIN & SIGNUP VIEW --- */
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <Card className="max-w-md w-full z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 font-bold text-xs">
              <Zap className="w-4 h-4" /> INTERVIEW PORTAL
            </div>
            <h2 className="text-3xl font-black text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {authMode === 'login' ? 'Sign in to access your interview practice portal' : 'Start your journey to crack dream interviews'}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <Button type="submit" loading={authLoading} className="w-full mt-6">
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => {
                playSFX('click');
                setAuthError('');
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
              }}
              className="text-xs text-slate-400 hover:text-blue-400 font-bold transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* --- LANDING VIEW --- */
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="max-w-4xl text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6 font-bold text-xs">
            <Zap className="w-4 h-4" /> THE SHARK TANK OF INTERVIEWS
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            SWIM TO<br/>SUCCESS.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Interactive AI interview prep with Shark 🦈 mentor, voice answers, live camera simulator, flashcards, and custom role drills.
          </p>
          <Button onClick={() => setView('dashboard')} icon={Play}>Begin Journey</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentFlashcard = flashcards[flashcardIndex];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans relative">
      {/* --- DASHBOARD VIEW --- */}
      {view === 'dashboard' && (
        <div className="max-w-6xl mx-auto p-8">
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
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs font-bold transition-all ml-2"
                  title="Log out of application"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
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

          {/* TARGET ROLE, DRIVE & LEVEL SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Target Position</label>
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
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Target Drive
              </label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
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
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                {['Beginner', 'Professional', 'Expert'].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      playSFX('click');
                      setLevel(l);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${level === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRACTICE ROUND CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { id: 'Aptitude', title: 'Logic Round', desc: 'Numbers, patterns, and quick reasoning.', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { id: 'HR', title: 'HR Round', desc: 'Soft skills & behavioral tests.', icon: UserCircle, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { id: 'Daily', title: 'Daily Tasks', desc: 'Keep your brain swimming!', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { id: 'Flashcards', title: 'Rapid Flashcards', desc: 'Flash drill core concept cards before interviews.', icon: Layers, color: 'text-amber-400', bg: 'bg-amber-400/10' }
            ].map((card) => (
              <Card key={card.id} className="group hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center ${card.color} mb-6`}>
                    <card.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{card.desc}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 bg-slate-800/50 w-fit px-3 py-1 rounded-full border border-slate-700">
                    <Clock className="w-3 h-3" />
                    {card.id === 'Flashcards' ? 'Rapid Fire' : level === 'Beginner' ? '2:00 Per Q' : level === 'Professional' ? '1:30 Per Q' : '1:00 Per Q'}
                  </div>
                  <Button 
                    onClick={() => {
                      if (card.id === 'Daily') getDailyTask();
                      else if (card.id === 'Flashcards') startFlashcards();
                      else startSession(card.id);
                    }} 
                    loading={loading && (category === card.id || (card.id === 'Daily' && view === 'tasks'))}
                    className="w-full"
                  >
                    Start Round
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- RAPID WARMUP FLASHCARDS VIEW --- */}
      {view === 'flashcards' && currentFlashcard && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-xl w-full relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
                <Layers className="w-4 h-4" /> Rapid Warmup ({flashcardIndex + 1}/{flashcards.length})
              </div>
              <Button onClick={() => setView('dashboard')} variant="secondary" className="px-3 py-1 text-xs">Exit Deck</Button>
            </div>

            <div 
              onClick={() => {
                playSFX('click');
                setIsFlipped(!isFlipped);
              }}
              className="cursor-pointer min-h-[260px] bg-slate-950/80 border-2 border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col justify-center items-center text-center transition-all duration-300 hover:shadow-2xl relative mb-6"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                <RotateCw className="w-3 h-3 text-amber-400" /> Click to Flip
              </div>

              {!isFlipped ? (
                <div>
                  <span className="text-xs font-bold text-amber-400/80 uppercase tracking-widest block mb-3">CONCEPT QUESTION</span>
                  <h3 className="text-2xl font-bold text-white leading-snug">{currentFlashcard.question}</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">SOLUTION & INSIGHT</span>
                  <p className="text-slate-200 font-medium text-base leading-relaxed">{currentFlashcard.answer}</p>
                  {currentFlashcard.keyPoints && currentFlashcard.keyPoints.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 text-left">
                      {currentFlashcard.keyPoints.map((pt, i) => (
                        <div key={i} className="text-xs text-slate-400 flex items-start gap-1.5 mb-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => nextFlashcard(false)} 
                variant="secondary" 
                icon={Repeat}
                className="w-full text-xs"
              >
                Needs Review
              </Button>
              <Button 
                onClick={() => nextFlashcard(true)} 
                icon={Check}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs"
              >
                Mastered (+10 XP)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- TASKS VIEW --- */}
      {view === 'tasks' && dailyTask && (
        <div className="min-h-screen flex items-center justify-center p-6">
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

          {showSolutionModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-lg w-full">
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
  <div className="min-h-screen flex items-center justify-center p-6">
    <Card className="max-w-4xl w-full relative overflow-hidden">
      
      {/* Question Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-widest">
            Question {currentIndex + 1} / 5
          </span>
          <button 
            onClick={() => speakText(currentQuestion.question)}
            className="text-slate-400 hover:text-blue-400 transition-colors p-1"
            title="Read Question Aloud"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-blue-400 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* AI Pressure Camera Component */}
      <div className="mb-6">
        <PressureCam />
      </div>

      {/* Question Title */}
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white">
        {currentQuestion.question}
      </h2>

      {/* Scratchpad Overlay */}
      {showScratchpad && (
        <div className="mb-6">
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Scratchpad for code snippets or logic thoughts..."
            className="w-full h-32 bg-slate-950 font-mono text-sm text-emerald-400 p-4 rounded-xl border border-slate-800 outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Options List / Text Input */}
      {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                playSFX('click');
                setUserAnswers({...userAnswers, [currentIndex]: opt});
              }}
              className={`text-left p-5 rounded-2xl border-2 transition-all font-bold ${
                userAnswers[currentIndex] === opt 
                  ? 'bg-blue-600 border-blue-400 shadow-xl translate-x-1' 
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
              }`}
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
              className={`absolute right-4 top-4 p-3 rounded-xl transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Dictate Answer"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => currentIndex === 4 ? submitInterview() : (setCurrentIndex(prev => prev + 1), setTimeLeft(getLevelTime()))} 
          loading={loading}
        >
          {currentIndex === 4 ? 'Submit Simulation' : 'Next Question'}
        </Button>
      </div>

    </Card>
  </div>
)}

      {/* --- RESULTS VIEW --- */}
      {view === 'result' && feedback && (
        <div className="max-w-5xl mx-auto p-8">
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
          <div className="w-80 md:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col mb-4">
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
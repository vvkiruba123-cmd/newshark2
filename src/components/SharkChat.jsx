import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

const SharkChat = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey chum! I'm Shark 🦈. Need help with an interview or just feeling like a fish out of water? Ask me anything!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD6Wknmtrm96rBfr1nhQUDim-5LA142BGA`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are Shark AI, an "Interview Predator." Your personality is witty, funny, and full of shark/ocean puns. Your goal is to help the user with interview prep, but you must stay in character. Keep answers concise. User says: ${input}` }] }]
        })
      });

      const data = await response.json();
      const sharkReply = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { role: 'assistant', text: sharkReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "My gills are clogged! Try asking again in a wave." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-8 w-[380px] bg-[#0b1120] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-[#1e40af] p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">🦈</div>
          <div>
            <h3 className="text-white font-black leading-none">Shark AI</h3>
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Interview Predator</p>
          </div>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-[400px] overflow-y-auto p-5 space-y-4 flex flex-col">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
            msg.role === 'user' 
              ? 'bg-blue-600 text-white self-end rounded-tr-none' 
              : 'bg-slate-900 border border-slate-800 text-slate-300 self-start rounded-tl-none'
          }`}>
            {msg.text}
          </div>
        ))}
        {isTyping && <div className="text-slate-500 text-xs italic animate-pulse">Shark is circling...</div>}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="flex gap-2 bg-[#020617] border border-slate-800 rounded-xl px-4 py-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Shark anything..."
            className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-slate-600"
          />
          <button onClick={handleSendMessage} className="text-blue-500 hover:text-blue-400">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharkChat;
import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { Bot, Send, Sparkles, User, RefreshCw, Music, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const AiView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Halo! Saya **Vanz AI**, asisten musik dan teman ngobrol pribadi Anda. Mau mencari rekomendasi lagu yang pas untuk suasana hati Anda, mendiskusikan artis favorit, atau sekadar cerita dan curhat santai hari ini? Silakan ketik pesan Anda di bawah!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: query.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...updatedMessages, { role: 'model', content: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: 'model', content: data.error || 'Maaf, Vanz AI sedang mengalami kendala. Coba beberapa saat lagi ya!' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { role: 'model', content: 'Gagal terhubung ke server Vanz AI. Periksa koneksi internet Anda.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-8 flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] pb-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 sm:mb-6 pb-2 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--theme-accent)] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-[var(--theme-glow)]">
          <Bot className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h1 className="text-base sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Vanz AI</span>
          </h1>
          <p className="text-[9px] sm:text-xs text-neutral-400">Asisten musik & teman cerita Anda</p>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-4 pr-1 sm:pr-2 mb-2 sm:mb-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === 'user' 
                ? 'bg-neutral-800 border border-white/10 text-white' 
                : 'bg-[var(--theme-accent)] text-white shadow-md shadow-[var(--theme-glow)]'
            }`}>
              {msg.role === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4" /> : <Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-3.5 text-[11px] sm:text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--theme-accent)] text-white rounded-tr-none font-medium'
                : 'bg-[#1c1c1e] border border-white/10 text-neutral-200 rounded-tl-none shadow-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)] text-white flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-neutral-400 flex items-center gap-2 shadow-md">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--theme-accent)]" />
              <span>Vanz AI sedang meracik rekomendasi & jawaban...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="flex items-center gap-2 bg-[#1c1c1e] border border-white/10 rounded-2xl p-2 shadow-xl shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya rekomendasi..."
          className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 sm:p-3 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-[var(--theme-glow)] transition-all flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </form>
    </motion.div>
  );
};

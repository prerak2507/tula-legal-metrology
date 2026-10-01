import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  Scale, 
  FileText, 
  ShieldCheck,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { askMetrologyAssistant, ChatMessage } from '../../services/gemini';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

const PRESET_QUERIES = [
  {
    icon: Scale,
    title: 'MPE Tolerances',
    query: 'What is the Maximum Permissible Error (MPE) for Class III weighing scales in India during initial verification vs re-verification?'
  },
  {
    icon: FileText,
    title: 'Fees by state',
    query: 'How are verification fees decided, and why can they differ between states?'
  },
  {
    icon: ShieldCheck,
    title: 'Section 24 Rules',
    query: 'What are the legal periodicity requirements and deadlines for verification and stamping under Section 24 of the Legal Metrology Act 2009?'
  },
  {
    icon: ExternalLink,
    title: 'GATC vs LMO Roles',
    query: 'Explain the division of powers between State Legal Metrology Officers (LMO) and Government Approved Test Centres (GATC).'
  }
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose, initialQuestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: `**Namaste! I am the TULA help assistant** (Google Gemini).\n\nAsk me about:\n* How to register, apply, pay and track a verification\n* The Legal Metrology Act, 2009 and the General Rules, 2011\n* What an LMO or a GATC does\n\nYou can ask in English, Hindi or Gujarati. My answers are guidance only. Fees and deadlines are set by your State, so confirm with your district Legal Metrology office.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuestion && isOpen) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.sender !== 'system').map(m => ({
        sender: m.sender as 'user' | 'gemini',
        text: m.text
      }));

      const reply = await askMetrologyAssistant(textToSend, history);

      const geminiMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, geminiMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorChatMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'system',
        text: `**The assistant could not answer right now.** ${errorMsg}\n\nEverything else in TULA keeps working without it.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorChatMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'gemini',
        text: `**Conversation refreshed.** How can I assist you with Legal Metrology laws and verification standards today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[88vh] max-h-[820px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-gov-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-gov-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brass to-gov-600 flex items-center justify-center shadow-md border border-brass-400/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  TULA help assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Gemini Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Guidance on the Legal Metrology Act, 2009 and General Rules, 2011. It never decides anything.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Model Banner */}
        <div className="bg-gov-50/90 border-b border-gov-100 px-5 py-1.5 flex items-center justify-between text-[11px] text-gov-900">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-gov-600" />
            Model: <strong className="font-mono">gemini-3.5-flash</strong> (falls back to a lighter Gemini model if busy). Not official advice.
          </span>
          <span className="text-[10px] text-gov-600 font-semibold uppercase tracking-wider hidden sm:inline">
            SIH 2026 Problem 26036
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'user' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'gemini' 
                    ? 'bg-gradient-to-br from-gov-600 to-brass-700 text-white' 
                    : 'bg-rose-600 text-white'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-lg p-4 text-xs leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gov-600 text-white rounded-tr-xs'
                  : msg.sender === 'gemini'
                  ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
              }`}>
                {/* Header inside bubble */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-black/5">
                  <span className={`font-bold text-[10px] uppercase tracking-wider ${
                    msg.sender === 'user' ? 'text-gov-100' : 'text-slate-500'
                  }`}>
                    {msg.sender === 'user' ? 'You' : msg.sender === 'gemini' ? 'TULA AI Advisor' : 'System Notice'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${msg.sender === 'user' ? 'text-gov-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                    {msg.sender === 'gemini' && (
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Markdown text representation */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  {msg.text.split('\n\n').map((para, i) => {
                    // Simple bold & bullet point render
                    return (
                      <div key={i} className="space-y-1">
                        {para.split('\n').map((line, j) => {
                          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                          const cleanLine = isBullet ? line.trim().substring(2) : line;
                          
                          return (
                            <div key={j} className={isBullet ? 'flex items-start gap-2 pl-2' : ''}>
                              {isBullet && <span className="text-brass-600 font-bold shrink-0">•</span>}
                              <span dangerouslySetInnerHTML={{
                                __html: cleanLine
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px]">$1</code>')
                              }} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gov-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gov-600 to-brass-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-lg rounded-tl-xs p-4 shadow-xs text-xs text-slate-600 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-brass-600 animate-spin" />
                <span>Consulting Legal Metrology Act 2009 &amp; generating statutory response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset query chips */}
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brass-600" />
            Quick Topics:
          </span>
          {PRESET_QUERIES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(preset.query)}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-paper-50 text-slate-700 hover:text-ink border border-slate-200 hover:border-brass-300 text-[11px] font-medium transition-all shadow-2xs disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-brass-600" />
                <span>{preset.title}</span>
                <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
              </button>
            );
          })}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Legal Metrology Act, statutory fees, MPE tolerances, Section 24, GATC rules..."
                rows={1}
                className="w-full resize-none py-2.5 pl-3.5 pr-10 text-xs text-slate-900 bg-slate-50 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-gov-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-brass-600 to-gov-600 hover:from-brass-700 hover:to-gov-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
              title="Send (Enter)"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> to submit, <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift+Enter</kbd> for new line</span>
            <span>Responses powered by Google Gemini API</span>
          </div>
        </div>

      </div>
    </div>
  );
};

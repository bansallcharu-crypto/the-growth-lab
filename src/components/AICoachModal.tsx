import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  BookOpen,
  Mic,
  MicOff,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
  Key,
  Check,
  MessageSquare,
  Users,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { AICoachMessage, UserProfile } from '../types';
import { AIService, ChatMessage } from '../services/aiService';
import { StorageService } from '../services/storage';
import { AudioRecorderService } from '../services/audioService';
import { WashiTape, PopStamp, StickerBadge } from './ScrapbookElements';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentContextHint?: string;
  initialMode?: 'general' | 'study' | 'communication' | 'thought-builder' | 'brand-coach' | 'linkedin';
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentContextHint = 'General Learning & Daily Practice',
  initialMode = 'general',
}) => {
  const [messages, setMessages] = useState<AICoachMessage[]>(() =>
    StorageService.getAICoachMessages()
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<
    'general' | 'study' | 'communication' | 'thought-builder' | 'brand-coach' | 'linkedin'
  >(initialMode);

  // Server OpenAI status
  const [serverHasKey, setServerHasKey] = useState<boolean | null>(null);
  const [serverModel, setServerModel] = useState<string>('gpt-4o-mini');
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keySavedSuccess, setKeySavedSuccess] = useState(false);

  // Voice recording state in chat
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const recorderRef = useRef<AudioRecorderService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check backend status
    AIService.checkBackendStatus().then((status) => {
      setServerHasKey(status.hasOpenAIKey);
      if (status.model) setServerModel(status.model);
    });

    recorderRef.current = new AudioRecorderService();
    recorderRef.current.onTranscriptUpdate = (text) => {
      setInput(text);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSaveOpenAIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineKeyInput.trim()) return;
    setSavingKey(true);
    const success = await AIService.setServerApiKey(inlineKeyInput.trim(), serverModel);
    setSavingKey(false);
    if (success) {
      setServerHasKey(true);
      setKeySavedSuccess(true);
      setTimeout(() => setKeySavedSuccess(false), 2000);
    } else {
      alert('Failed to save API key. Please check your network or key format.');
    }
  };

  const handleToggleVoiceInChat = async () => {
    if (!recorderRef.current) return;
    if (!isVoiceRecording) {
      const ok = await recorderRef.current.startRecording();
      if (ok) {
        setIsVoiceRecording(true);
      } else {
        alert('Could not access microphone.');
      }
    } else {
      setIsVoiceRecording(false);
      try {
        const { blob } = await recorderRef.current.stopRecording();
        // Run Whisper if audio recorded
        if (serverHasKey && blob.size > 2000) {
          const res = await AIService.transcribeAudioWithWhisper(blob);
          if (res.ok && res.text) {
            setInput(res.text);
          }
        }
      } catch (e) {
        console.warn('Voice recording stop error:', e);
      }
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || loading) return;

    const userMsg: AICoachMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      contextTag: mode,
      timestamp: new Date().toISOString(),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for OpenAI
      const chatHistory: ChatMessage[] = newMsgs.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await AIService.sendMessage(chatHistory, mode, currentContextHint);

      let replyText = '';
      if (res.ok && res.reply) {
        replyText = res.reply;
      } else if (res.error === 'OPENAI_KEY_REQUIRED') {
        replyText = `To enable genuine ChatGPT conversations, please enter your OpenAI API key in the setup banner above or in Settings. (Model: ${serverModel})`;
        setServerHasKey(false);
      } else {
        replyText = res.message || 'I encountered an error connecting to OpenAI. Please check your API key.';
      }

      const coachMsg: AICoachMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'coach',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      const updated = [...newMsgs, coachMsg];
      setMessages(updated);
      StorageService.saveAICoachMessages(updated);
    } catch (err: any) {
      const errMsg: AICoachMessage = {
        id: `msg-${Date.now() + 2}`,
        sender: 'coach',
        text: `Error: ${err.message || 'Could not connect to OpenAI.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMsgs, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Start a new open conversation?')) {
      const reset: AICoachMessage[] = [
        {
          id: `msg-${Date.now()}`,
          sender: 'coach',
          text: "Hi Charu! I'm here. We can talk about whatever is on your mind—brand ideas, MBA studies, quick thoughts, or casual conversation.",
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(reset);
      StorageService.saveAICoachMessages(reset);
    }
  };

  const modesList = [
    { id: 'general' as const, label: 'General Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'study' as const, label: 'Study Assistant', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'communication' as const, label: 'Speaking Partner', icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'thought-builder' as const, label: 'Thought Builder', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'brand-coach' as const, label: 'Brand Coach', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'linkedin' as const, label: 'LinkedIn Assistant', icon: <Share2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white w-full max-w-2xl h-[90vh] max-h-[780px] rounded-3xl border-2 border-ink-900 shadow-pop flex flex-col overflow-hidden">
        <WashiTape color="cyan" position="top-right" width="w-20" />

        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-cream-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cobalt-600 border-2 border-ink-900 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-ink-900 text-base">Growth AI Assistant</h3>
                {serverHasKey ? (
                  <PopStamp label={`OPENAI ${serverModel}`} variant="emerald" />
                ) : (
                  <PopStamp label="SETUP KEY" variant="yellow" />
                )}
              </div>
              <p className="text-xs text-ink-600 font-semibold">
                Natural conversational partner · Speak or type freely
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Start new conversation"
              className="p-2 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-cream-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 py-2 border-b-2 border-cream-200 bg-cream-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {modesList.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                mode === m.id
                  ? 'bg-cobalt-600 text-white border-ink-900 shadow-pop-sm scale-102'
                  : 'bg-white text-ink-700 border-cream-200 hover:bg-cream-100'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Server OpenAI API Key Setup Banner (shown when key is not configured) */}
        {!serverHasKey && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <Key className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-2 flex-1">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Configure OpenAI API Key</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    The Growth Lab uses genuine OpenAI ChatGPT and Whisper models via secure server integration. Your key is stored private and local on your server.
                  </p>
                </div>
                <form onSubmit={handleSaveOpenAIKey} className="flex items-center gap-2">
                  <input
                    type="password"
                    value={inlineKeyInput}
                    onChange={(e) => setInlineKeyInput(e.target.value)}
                    placeholder="sk-proj-... (Paste OpenAI API Key)"
                    className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                  <button
                    type="submit"
                    disabled={savingKey || !inlineKeyInput.trim()}
                    className="px-4 py-1.5 rounded-xl bg-cobalt-600 text-white font-bold text-xs hover:bg-cobalt-700 disabled:opacity-40 transition-all shadow-soft"
                  >
                    {keySavedSuccess ? 'Connected!' : savingKey ? 'Saving...' : 'Save & Connect'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-cream-50/50">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cobalt-600 text-white rounded-br-sm shadow-soft'
                      : 'bg-white text-ink-800 rounded-bl-sm border border-cream-200 shadow-soft'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{m.text}</div>
                  <span
                    className={`block mt-1.5 text-[10px] ${
                      isUser ? 'text-cobalt-200' : 'text-ink-400'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-cream-200 rounded-3xl p-4 shadow-soft flex items-center gap-2 text-xs text-ink-500">
                <Sparkles className="w-4 h-4 text-cobalt-600 animate-spin" />
                OpenAI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice & Text Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-cream-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Dictation Button */}
            <button
              type="button"
              onClick={handleToggleVoiceInChat}
              title={isVoiceRecording ? 'Stop speaking' : 'Speak your message (Voice dictation)'}
              className={`p-3 rounded-2xl border-2 border-ink-900 shadow-pop-sm transition-all hover-wiggle ${
                isVoiceRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-yellow-300 text-ink-950 hover:bg-yellow-400'
              }`}
            >
              {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-ink-950" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isVoiceRecording
                  ? 'Listening to your speech... (speak naturally)'
                  : 'Chat freely with AI, ask any question, or share an idea...'
              }
              className="flex-1 bg-cream-50 border-2 border-cream-200 rounded-2xl px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-cobalt-500/40 focus:border-cobalt-600 font-medium"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-cobalt-600 text-white font-black text-xs uppercase tracking-wider border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 disabled:opacity-40 transition-all flex items-center gap-1.5 active:translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

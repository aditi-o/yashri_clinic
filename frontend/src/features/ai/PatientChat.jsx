import { useEffect, useRef, useState } from 'react';
import useAiStore from './ai.store';

// ── Suggestion chips shown before first message ────────────────────────────
const SUGGESTIONS = [
  'What medicines am I taking?',
  'When was my last visit?',
  'What was my last diagnosis?',
  'Do I have any follow-up appointments?',
  'What are my known allergies?',
];

// ── Single message bubble ──────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1"
          style={{ background: 'var(--azure-light)', color: 'var(--azure)' }}
        >
          🤖
        </div>
      )}
      <div
        className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
        style={
          isUser
            ? { background: 'var(--azure)', color: '#fff', borderBottomRightRadius: 4 }
            : { background: 'white', color: 'var(--text)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
        }
      >
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
        <p
          className="text-xs mt-1 opacity-60 text-right"
          style={{ fontSize: 10 }}
        >
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ml-2 mt-1"
          style={{ background: 'var(--surface-2)' }}
        >
          👤
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1"
        style={{ background: 'var(--azure-light)', color: 'var(--azure)' }}
      >
        🤖
      </div>
      <div
        className="px-4 py-3 rounded-2xl"
        style={{ background: 'white', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'var(--text-light)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PatientChat() {
  const { messages, loading, sendMessage, clearChat } = useAiStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Clear session when component unmounts
  useEffect(() => () => clearChat(), [clearChat]);

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const useSuggestion = (s) => {
    if (loading) return;
    sendMessage(s);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-t-2xl"
        style={{ background: 'var(--azure)', color: 'white' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          🤖
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>
            Health Assistant
          </p>
          <p className="text-xs opacity-80">Answers based on your medical records</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-auto text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Message area ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: 'var(--surface)' }}
      >
        {/* Welcome state */}
        {isEmpty && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🏥</div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Sora,sans-serif' }}>
              Your Personal Health Assistant
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Ask me anything about your medical history, medications, or appointments.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => useSuggestion(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'white',
                    border: '1.5px solid var(--border)',
                    color: 'var(--azure)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat bubbles */}
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}

        {/* Loading indicator */}
        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="px-4 py-3 flex gap-3 items-end rounded-b-2xl"
        style={{ background: 'white', borderTop: '1px solid var(--border)' }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your health records…"
          className="flex-1 resize-none outline-none text-sm px-3 py-2 rounded-xl"
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            maxHeight: 96,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--azure)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
          disabled={loading}
        />
        <button
          onClick={submit}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0"
          style={{
            background: input.trim() && !loading ? 'var(--azure)' : 'var(--surface-2)',
            color: input.trim() && !loading ? 'white' : 'var(--text-light)',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

import { create } from 'zustand';
import aiApi from './ai.api';

/**
 * Message shape:
 * { id: string, role: 'user' | 'ai', text: string, ts: number }
 */
const useAiStore = create((set) => ({
  messages: [],   // chat history for current session
  loading: false,
  error: null,

  /**
   * Send a message and append both the user turn and the AI reply.
   */
  sendMessage: async (text) => {
    const userMsg = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() };

    set((s) => ({
      messages: [...s.messages, userMsg],
      loading: true,
      error: null,
    }));

    try {
      const { reply } = await aiApi.patientChat(text);
      const aiMsg = { id: crypto.randomUUID(), role: 'ai', text: reply, ts: Date.now() };
      set((s) => ({ messages: [...s.messages, aiMsg], loading: false }));
    } catch (err) {
      const errText =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong. Please try again.';

      const errMsg = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: `⚠️ ${errText}`,
        ts: Date.now(),
      };
      set((s) => ({
        messages: [...s.messages, errMsg],
        loading: false,
        error: errText,
      }));
    }
  },

  clearChat: () => set({ messages: [], error: null }),
}));

export default useAiStore;

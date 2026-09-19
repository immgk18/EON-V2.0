"use client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "eon_chat_history_v1";
const ACTIVE_SESSION_KEY = "eon_active_chat_v1";
const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_CHAT = 100;

function available(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanTitle(text: string): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (!value) return "NEW CHAT";
  return value.length > 52 ? `${value.slice(0, 49)}…` : value;
}

export function loadChatSessions(): ChatSession[] {
  if (!available()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChatSessions(sessions: ChatSession[]): void {
  if (!available()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessions.slice(0, MAX_SESSIONS))
    );
  } catch {
    console.warn("EON chat history could not be saved.");
  }
}

export function getActiveChatId(): string | null {
  if (!available()) return null;
  try {
    return window.localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function createChatSession(title = "NEW CHAT"): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: makeId("chat"),
    title: cleanTitle(title),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  const sessions = loadChatSessions();
  saveChatSessions([session, ...sessions]);

  if (available()) {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, session.id);
  }

  return session;
}

export function ensureActiveChatSession(): ChatSession {
  const sessions = loadChatSessions();
  const activeId = getActiveChatId();

  const existing = sessions.find((chat) => chat.id === activeId);
  if (existing) return existing;

  if (sessions.length > 0) {
    const first = sessions[0];
    if (available()) {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, first.id);
    }
    return first;
  }

  return createChatSession();
}

export function getChatSession(id: string): ChatSession | null {
  return loadChatSessions().find((chat) => chat.id === id) ?? null;
}

export function addChatTurn(
  sessionId: string,
  userContent: string,
  assistantContent: string
): ChatSession | null {
  const sessions = loadChatSessions();
  const index = sessions.findIndex((chat) => chat.id === sessionId);
  if (index < 0) return null;

  const chat = sessions[index];
  const now = Date.now();

  if (chat.messages.length === 0) {
    chat.title = cleanTitle(userContent);
  }

  chat.messages.push(
    {
      id: makeId("user"),
      role: "user",
      content: userContent.trim(),
      timestamp: now,
    },
    {
      id: makeId("assistant"),
      role: "assistant",
      content: assistantContent.trim(),
      timestamp: now + 1,
    }
  );

  chat.messages = chat.messages.slice(-MAX_MESSAGES_PER_CHAT);
  chat.updatedAt = now;

  sessions.splice(index, 1);
  sessions.unshift(chat);
  saveChatSessions(sessions);

  return chat;
}

export function setActiveChat(id: string): ChatSession | null {
  const chat = getChatSession(id);
  if (!chat) return null;

  if (available()) {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, id);
  }

  return chat;
}

export function deleteChatSession(id: string): void {
  const sessions = loadChatSessions().filter((chat) => chat.id !== id);
  saveChatSessions(sessions);

  if (getActiveChatId() === id && available()) {
    if (sessions[0]) {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, sessions[0].id);
    } else {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }
}

export default {
  loadChatSessions,
  getActiveChatId,
  createChatSession,
  ensureActiveChatSession,
  getChatSession,
  addChatTurn,
  setActiveChat,
  deleteChatSession,
};

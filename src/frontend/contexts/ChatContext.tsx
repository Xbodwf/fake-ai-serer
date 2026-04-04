import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

type ChatSession = {
  id: string;
  title: string;
  model: string;
  systemPrompt: string;
  apiType: string;
  stream: boolean;
  timeout: number;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  ownerId: string;
  isReadOnly?: boolean;
};

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  createNewSession: () => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<boolean>;
  loadSessionsFromServer: () => Promise<void>;
  loadSessionFromServer: (sessionId: string) => Promise<ChatSession | null>;
  sessionsPanelOpen: boolean;
  setSessionsPanelOpen: (open: boolean) => void;
  sessionsLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsPanelOpen, setSessionsPanelOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const { user, token } = useAuth();

  // 从服务器加载会话列表
  const loadSessionsFromServer = useCallback(async () => {
    if (!user || !token) {
      setSessions([]);
      return;
    }

    setSessionsLoading(true);
    try {
      const response = await fetch('/api/chat-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Failed to load sessions from server:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load sessions from server:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [user, token]);

  // 从服务器加载单个会话
  const loadSessionFromServer = useCallback(async (sessionId: string): Promise<ChatSession | null> => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        headers,
      });

      if (response.ok) {
        const sessionData = await response.json();
        return sessionData;
      } else {
        console.error('Failed to load session from server:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Failed to load session from server:', error);
      return null;
    }
  }, [token]);

  // 创建新会话
  const createNewSession = useCallback(async (): Promise<ChatSession | null> => {
    if (!user || !token) {
      return null;
    }

    try {
      const response = await fetch('/api/sessions/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '新对话',
          model: '',
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          apiType: 'openai-chat',
          stream: true,
          timeout: 60,
        }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        // 确保 isReadOnly 字段存在
        const sessionWithReadOnly = {
          ...sessionData,
          isReadOnly: sessionData.isReadOnly ?? false,
        };
        setSessions((prev) => [...prev, sessionWithReadOnly]);
        setCurrentSessionId(sessionWithReadOnly.id);
        return sessionWithReadOnly;
      } else {
        console.error('Failed to create session:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }, [user, token]);

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== sessionId);
          if (currentSessionId === sessionId && filtered.length > 0) {
            setCurrentSessionId(filtered[0].id);
          } else if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
          }
          return filtered;
        });
        return true;
      } else {
        console.error('Failed to delete session:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }, [token, currentSessionId]);

  // 更新会话
  const updateSession = useCallback(async (sessionId: string, updates: Partial<ChatSession>): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === sessionId) {
              return { ...s, ...updates, updatedAt: Date.now() };
            }
            return s;
          })
        );
        return true;
      } else {
        console.error('Failed to update session:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }, [token]);

  // 用户登录时加载会话列表
  useEffect(() => {
    if (user && token) {
      loadSessionsFromServer();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user, token, loadSessionsFromServer]);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        setCurrentSessionId,
        setSessions,
        createNewSession,
        deleteSession,
        updateSession,
        loadSessionsFromServer,
        loadSessionFromServer,
        sessionsPanelOpen,
        setSessionsPanelOpen,
        sessionsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
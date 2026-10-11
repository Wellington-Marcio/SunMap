import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type ToastMessage = {
  id: number;
  text: string;
  type?: 'info' | 'success' | 'error' | 'warning';
};

type ToastContextValue = {
  push: (text: string, type?: ToastMessage['type']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const push = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const msg: ToastMessage = { id, text, type };
    setMessages((s) => [msg, ...s]);
    // auto remove
    setTimeout(() => {
      setMessages((s) => s.filter(m => m.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(m => (
          <div key={m.id} style={{ minWidth: 220, padding: '10px 14px', borderRadius: 8, color: '#fff', background: m.type === 'error' ? 'rgba(220,53,69,0.95)' : m.type === 'success' ? 'rgba(40,167,69,0.95)' : 'rgba(40,167,255,0.95)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '0.95rem' }}>{m.text}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

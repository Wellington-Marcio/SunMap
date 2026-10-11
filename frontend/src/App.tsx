/*
import paineis from './assets/paineis.jpg'

import './App.css'

function App() {
 

  return (
    <>
      <div>
        
        <h1>SunMap</h1>
          <img src={paineis}  alt="Energia solar" />
        <h3>Energia que nasce do clima</h3>          

      </div>
      <footer>
        
        <p>Wellington Martins</p>
        <p>Desafio-gdash-2025-02</p>

      </footer>
    </>
  )
}

export default App*/

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from './components/Toast';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pokemon from './pages/Pokemon';
import paineis from './assets/paineis.jpg'
import './App.css'

function App() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sunmap_token') : null;
  function isTokenValid(t: string | null) {
    if (!t) return false;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return false;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
      const json = atob(padded);
      const obj = JSON.parse(json);
      if (typeof obj.exp === 'number') {
        return obj.exp > Math.floor(Date.now() / 1000);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const [isAuth, setIsAuth] = useState(() => isTokenValid(token));

  useEffect(() => {
    function onLogin() { setIsAuth(true); }
    function onStorage(e: StorageEvent) {
      if (e.key === 'sunmap_token') setIsAuth(isTokenValid(e.newValue));
    }
    window.addEventListener('sunmap-login', onLogin);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('sunmap-login', onLogin);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // also validate token on mount in case it is expired or malformed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('sunmap_token');
    if (!isTokenValid(t)) {
      try { localStorage.removeItem('sunmap_token'); } catch (e) {}
      setIsAuth(false);
    }
  }, []);

  function logout() {
    try { localStorage.removeItem('sunmap_token'); } catch (e) {}
    setIsAuth(false);
    // navigate back to login
    window.location.href = '/';
  }

  return (
    <ToastProvider>
    <BrowserRouter>
      <div className="bg-panel" style={{backgroundImage: `url(${paineis})`}}>
        {/* Logout button (top-right) */}
        {isAuth && (
          <button onClick={logout} aria-label="Sair" title="Sair" className="logout-btn" style={{position: 'fixed', top: 12, right: 12, zIndex: 2000}}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className="container">
          <main>
            <Routes>
              {/* Root shows login unless already authenticated */}
              <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
              {/* Explicit login and register routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Protected dashboard route */}
              <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/" replace />} />
              <Route path="/pokemon" element={isAuth ? <Pokemon /> : <Navigate to="/" replace />} />
              {/* Fallback: redirect unknown routes to root (login) */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="text-white text-center mt-4">
            <small>Wellington Martins — Desafio-gdash-2025-02</small>
          </footer>
        </div>
      </div>
    </BrowserRouter>
    </ToastProvider>
  )
}

export default App

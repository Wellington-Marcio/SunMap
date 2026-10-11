import React, { useState } from 'react';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const token = res.data?.access_token;
      if (token) {
        localStorage.setItem('sunmap_token', token);
        // notify app about login (so header/button can update)
        try { window.dispatchEvent(new Event('sunmap-login')); } catch (_e) {}
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Improve error reporting: show backend message when available, otherwise network/error message
      console.error('Login error', err);
      if (err?.response) {
        // NestJS usually returns { statusCode, message, error }
        const data = err.response.data;
        const msg = typeof data?.message === 'string' ? data.message : Array.isArray(data?.message) ? data.message.join(', ') : data?.message || data?.error || JSON.stringify(data);
        setError(msg || `Erro ${err.response.status}`);
      } else {
        setError(err?.message || 'Falha ao entrar');
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative">
      <div className="card-wrapper">
        <div className="login-header text-center">
          <h1 className="app-title">SunMap</h1>
        </div>

        <div className="glass-card">
        <div className="glass-left">
          <h5 className="panel-title">BEM-VINDO</h5>
          <h2 className="fw-bold" style={{fontSize: '1.6rem'}}>NOVO LOGIN</h2>
          <p className="muted-small">Crie uma conta para acompanhar seus painéis e previsões climáticas.</p>
          <div className="mt-3">
            <button type="button" className="btn btn-outline-light btn-round" onClick={() => navigate('/register')}>CRIAR CONTA</button>
          </div>
        </div>

        <div className="glass-right">
          <h4 className="text-white">LOGIN</h4>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form onSubmit={submit} autoComplete="on">
              <div className="mb-3">
                <label className="form-label muted-small" htmlFor="email">Usuario</label>
                <input id="email" name="username" autoComplete="username" type="email" className="form-control form-control-lg custom" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

            <div className="mb-3">
              <label className="form-label muted-small" htmlFor="password">Senha</label>
              <input id="password" name="current-password" autoComplete="current-password" type="password" className="form-control form-control-lg custom" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check text-white">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label muted-small" htmlFor="remember">Lembrar</label>
              </div>
              <a className="text-white muted-small" href="#">Esqueci a senha</a>
            </div>

            <div className="d-flex justify-content-center">
              <button type="submit" className="btn btn-light btn-round btn-enter">ENTRAR</button>
            </div>

            
          </form>
        </div>
        </div>

        <div className="login-slogan text-center mt-3">
          <h3>Mapeando o futuro com a força do sol!</h3>
        </div>
      </div>
    </div>
  );
}

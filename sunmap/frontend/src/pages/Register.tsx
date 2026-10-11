import { useState } from 'react';
import { usersApi, authApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await usersApi.create(email, password);
      toast.push('Registro criado. Entrando...', 'success');
      // auto-login
      const res = await authApi.login(email, password);
      const token = res.data?.access_token;
      if (token) {
        localStorage.setItem('sunmap_token', token);
        try { window.dispatchEvent(new Event('sunmap-login')); } catch (_e) {}
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Register error', err);
      const msg = err?.response?.data?.message || err?.message || 'Falha ao registrar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative">
      <div className="card-wrapper">
        <div className="login-header text-center">
          <h1 className="app-title">SunMap</h1>
        </div>

        <div className="glass-card">
          <div className="glass-right" style={{width: '100%'}}>
            <h4 className="text-white">REGISTRAR</h4>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <form onSubmit={submit} autoComplete="on">
              <div className="mb-3">
                <label className="form-label muted-small" htmlFor="email">Usuario (email)</label>
                <input id="email" name="username" autoComplete="username" type="email" className="form-control form-control-lg custom" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label muted-small" htmlFor="password">Senha</label>
                <input id="password" name="new-password" autoComplete="new-password" type="password" className="form-control form-control-lg custom" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="mb-3">
                <label className="form-label muted-small" htmlFor="confirm">Confirme a Senha</label>
                <input id="confirm" name="confirm-password" autoComplete="new-password" type="password" className="form-control form-control-lg custom" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>

              <div className="d-flex justify-content-center">
                <button type="submit" className="btn btn-light btn-round btn-enter" disabled={loading}>{loading ? 'Aguarde...' : 'Registrar'}</button>
              </div>

              <div className="text-center mt-3 muted-small">Já tem uma conta? <a href="/">Entrar</a></div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

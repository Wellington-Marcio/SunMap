// React import removed (using automatic JSX runtime)
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <nav className="sidebar neon-sidebar" aria-label="Sidebar">
      <div className="sidebar-brand">Menu</div>

      <div className="sidebar-nav p-3">
        <button
          type="button"
          className="btn btn-outline-light btn-round w-100"
          onClick={() => navigate('/pokemon')}
          aria-label="Abrir Pokemon"
        >
          Pokemon API
        </button>
      </div>

      <div className="sidebar-footer" />
    </nav>
  );
}

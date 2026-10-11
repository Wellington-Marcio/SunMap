// React import removed (using automatic JSX runtime)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PokemonSummary = { name: string; url: string };

type PokemonDetail = {
  id: number;
  name: string;
  image?: string | null;
  types: string[];
  strength: number; // sum of base stats
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ApiType = { type: { name: string } };
type ApiStat = { base_stat: number };

async function fetchPokemonDetail(s: PokemonSummary): Promise<PokemonDetail> {
  const r = await fetch(s.url);
  if (!r.ok) throw new Error('Falha ao buscar detalhes do pokémon');
  const j = await r.json();
  const types: string[] = (j.types || []).map((t: ApiType) => capitalize(t.type.name));
  const image = j.sprites?.other?.['official-artwork']?.front_default || j.sprites?.front_default || null;
  const stats = (j.stats || []).map((st: ApiStat) => Number(st.base_stat) || 0);
  const strength = stats.reduce((a: number, b: number) => a + b, 0);
  return {
    id: j.id,
    name: j.name,
    image,
    types,
    strength,
  } as PokemonDetail;
}

export default function Pokemon() {
  const [items, setItems] = useState<PokemonDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=12');
        if (!listRes.ok) throw new Error('Falha ao buscar lista');
        const listJson = await listRes.json();
        const summaries: PokemonSummary[] = listJson.results || [];

        const details = await Promise.all(summaries.map((s) => fetchPokemonDetail(s)));

        if (!cancelled) setItems(details);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) setError(msg || 'Erro ao carregar pokémons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pokémon - PokeAPI</h2>
        <div>
          <button className="btn btn-outline-light btn-round me-2" onClick={() => navigate('/dashboard')}>Voltar</button>
        </div>
      </div>

      {loading && <div>Carregando pokémons...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {items.map((p) => (
          <PokemonCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function PokemonCard({ p }: { p: PokemonDetail }) {
  return (
    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
      <div className="card h-100">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          {p.image ? (
            <img src={p.image} alt={p.name} style={{ width: 120, height: 120, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</div>
          )}
        </div>

        <div className="card-body text-center">
          <h5 className="card-title">{capitalize(p.name)}</h5>
          <p className="mb-1"><strong>Tipos:</strong> {p.types.join(', ') || '—'}</p>
          <p className="mb-0"><strong>Força:</strong> {p.strength}</p>
        </div>
      </div>
    </div>
  );
}

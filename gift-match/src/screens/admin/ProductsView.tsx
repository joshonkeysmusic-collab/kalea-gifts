import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { SEED_CATALOG } from '../../engine/catalog';
import { CATEGORY_IDS, type Product } from '../../engine/product';
import { CATEGORIES, compileProduct, productFromItem } from '../../engine/rules';
import type { CategoryId } from '../../engine/types';
import { getAllProducts, isBuiltinId, sourceOf, type Source } from '../../lib/adminStore';

interface Entry {
  product: Product;
  source: Source;
  hidden: boolean;
  /** A built-in gift that has been replaced by Katya's version. */
  edited: boolean;
  icon: string;
  tone: string;
}

function buildEntries(): Entry[] {
  const yours: Entry[] = getAllProducts().map((p) => {
    const item = compileProduct(p);
    return { product: p, source: sourceOf(p.id), hidden: p.active === false, edited: isBuiltinId(p.id), icon: item.icon, tone: item.tone };
  });
  const seen = new Set(yours.map((e) => e.product.id));
  const builtin: Entry[] = SEED_CATALOG.filter((i) => !i.kind && !seen.has(i.id)).map((i) => ({
    product: productFromItem(i), source: 'builtin' as const, hidden: false, edited: false, icon: i.icon, tone: i.tone,
  }));
  const order = (c: CategoryId) => CATEGORY_IDS.indexOf(c);
  return [...yours, ...builtin.sort((a, b) => order(a.product.category) - order(b.product.category))];
}

export function ProductsView({ version, onAdd, onEdit }: { version: number; onAdd: () => void; onEdit: (p: Product, source: Source) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | ''>('');
  const [scope, setScope] = useState<'all' | 'yours' | 'builtin' | 'hidden'>('all');

  // `version` changes whenever a product is saved, so the list rebuilds.
  const entries = useMemo(buildEntries, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = entries.filter((e) => {
    if (scope === 'yours' && e.source === 'builtin') return false;
    if (scope === 'builtin' && e.source !== 'builtin') return false;
    if (scope === 'hidden' && !e.hidden) return false;
    if (cat && e.product.category !== cat) return false;
    const t = q.trim().toLowerCase();
    return !t || e.product.title.toLowerCase().includes(t) || (e.product.tags ?? []).some((x) => x.includes(t));
  });
  const yoursCount = entries.filter((e) => e.source !== 'builtin').length;

  return (
    <div className="pv">
      <div className="pv-bar">
        <label className="pv-search">
          <Search size={16} aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or tags" aria-label="Search products" />
        </label>
        <button type="button" className="btn btn-dark add-btn" onClick={onAdd}>Add product <Plus size={18} strokeWidth={2.6} /></button>
      </div>

      <div className="pv-filters">
        <div className="seg" role="group" aria-label="Show">
          {(['all', 'yours', 'builtin', 'hidden'] as const).map((s) => (
            <button key={s} type="button" className={scope === s ? 'on' : ''} aria-pressed={scope === s} onClick={() => setScope(s)}>
              {{ all: 'All', yours: `Yours (${yoursCount})`, builtin: 'Built-in', hidden: 'Deleted' }[s]}
            </button>
          ))}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value as CategoryId | '')} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORY_IDS.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
        </select>
      </div>

      <p className="fineprint tight">{shown.length} of {entries.length} gifts</p>
      {shown.length === 0 ? (
        <p className="pv-empty">No gifts match. {scope === 'yours' && yoursCount === 0 ? 'Tap "Add product" to add your first one.' : 'Try a different search or filter.'}</p>
      ) : (
        <ul className="pv-list">
          {shown.map((e) => (
            <li key={e.product.id}>
              <button type="button" className={`pv-row ${e.hidden ? 'hidden' : ''}`} onClick={() => onEdit(e.product, e.source)}>
                <span className="item-swatch" style={{ ['--tone' as string]: e.tone }}>
                  {e.product.imageUrl ? <img className="thumb-photo" src={e.product.imageUrl} alt="" loading="lazy" /> : <Icon name={e.icon} size={18} stroke={1.5} />}
                </span>
                <span className="pv-text">
                  <strong>{e.product.title}</strong>
                  <small>{CATEGORIES[e.product.category].label} · AED {e.product.price}</small>
                </span>
                <span className="pv-badges">
                  {e.hidden && <i className="b hide">Deleted</i>}
                  {e.source === 'draft' && <i className="b draft">Draft</i>}
                  {e.source === 'published' && <i className="b live">Live</i>}
                  {e.source === 'builtin' && <i className="b">Built-in</i>}
                  {e.edited && !e.hidden && <i className="b edit">Edited</i>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

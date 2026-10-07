import { ArrowLeft, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AdminLogin } from '../components/AdminLogin';
import { Toast } from '../components/Shell';
import { getCatalog } from '../engine/catalog';
import { auditCatalog } from '../engine/coverage';
import type { Product } from '../engine/product';
import { isAdminSession, setAdminSession } from '../lib/adminSession';
import { getDrafts, getVersion, subscribe, type Source } from '../lib/adminStore';
import { CoverageView } from './admin/CoverageView';
import { ProductForm } from './admin/ProductForm';
import { ProductsView } from './admin/ProductsView';
import { PublishView } from './admin/PublishView';

type View = 'coverage' | 'products' | 'publish';
type Editing = { product?: Product; origin: 'new' | Source } | null;

/** Loaded on demand (React.lazy) so ordinary visitors never download the admin screens. */
export default function Admin() {
  const [authed, setAuthed] = useState(isAdminSession);
  const [view, setView] = useState<View>('coverage');
  const [editing, setEditing] = useState<Editing>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(false);
  const version = useSyncExternalStore(subscribe, getVersion);
  const report = useMemo(() => auditCatalog(getCatalog()), [version]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authed) return;
    import('../lib/adminAuth').then((m) => setPlaceholder(m.usingPlaceholder()));
  }, [authed]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!authed) {
    return <AdminLogin mode="page" onSuccess={() => setAuthed(true)} onCancel={() => { window.location.hash = ''; }} />;
  }

  const lock = () => {
    setAdminSession(false);
    window.location.hash = '';
  };
  const issues = report.alerts.filter((a) => a.severity !== 'info').length;
  const drafts = getDrafts().length;

  const tab = (id: View, label: string, badge?: number, tone?: 'bad' | 'gold') => (
    <button type="button" role="tab" id={`tab-${id}`} aria-selected={view === id} aria-controls={`panel-${id}`} className={view === id ? 'on' : ''} onClick={() => { setView(id); setEditing(null); }}>
      {label}
      {!!badge && <i className={tone ?? ''}>{badge}</i>}
    </button>
  );

  return (
    <div className="admin">
      <header className="admin-top">
        <button type="button" className="round-btn" onClick={() => { window.location.hash = ''; }} aria-label="Back to the app"><ArrowLeft size={18} /></button>
        <div className="admin-title">
          <h1>Catalogue admin</h1>
          <span className="micro">KALEA GIFTS</span>
        </div>
        <button type="button" className="admin-lock" onClick={lock}><LockKeyhole size={15} /> Lock</button>
      </header>

      {placeholder && (
        <div className="admin-banner warn" role="note">
          <ShieldAlert size={18} />
          <span>You are still using the placeholder password. Set <code>VITE_ADMIN_PASSWORD</code> and redeploy before sharing the link. This lock keeps casual visitors out; it is not full security.</span>
        </div>
      )}
      {drafts > 0 && view !== 'publish' && !editing && (
        <button type="button" className="admin-banner gold" onClick={() => setView('publish')}>
          <span>{drafts} draft{drafts === 1 ? '' : 's'} on this device are only visible to you. Publish them →</span>
        </button>
      )}

      {editing ? (
        <ProductForm
          key={editing.product?.id ?? 'new'}
          initial={editing.product}
          origin={editing.origin}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setToast(m);
            setEditing(null);
            setView('products');
          }}
        />
      ) : (
        <>
          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {tab('coverage', 'Coverage', issues, report.alerts.some((a) => a.severity === 'critical') ? 'bad' : 'gold')}
            {tab('products', 'Products')}
            {tab('publish', 'Publish', drafts, 'gold')}
          </div>
          <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className="admin-panel" key={view}>
            {view === 'coverage' && <CoverageView report={report} />}
            {view === 'products' && <ProductsView version={version} onAdd={() => setEditing({ origin: 'new' })} onEdit={(product, origin) => setEditing({ product, origin })} />}
            {view === 'publish' && <PublishView onToast={setToast} />}
          </div>
        </>
      )}
      <Toast text={toast} />
    </div>
  );
}

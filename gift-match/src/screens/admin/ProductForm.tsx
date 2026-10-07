import { ArrowLeft, Check, ImageOff, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { SEED_CATALOG, getCatalog } from '../../engine/catalog';
import { productsFromJson, uniqueId } from '../../engine/ingest';
import { BUDGET_ORDER, BUDGETS } from '../../engine/budgets';
import { CATEGORY_IDS, INTERESTS, LIMITS, OCCASIONS, RELATIONSHIPS, VIBES, type Product } from '../../engine/product';
import { CATEGORIES, TAG_RULES, normaliseTag } from '../../engine/rules';
import { INTEREST_WORDS, OCCASION_WORDS, RELATION_WORDS, VIBE_WORDS } from '../../engine/words';
import { getAllProducts, getPublished, hideProduct, isBuiltinId, removeDraft, restoreProduct, saveDraft, type Source } from '../../lib/adminStore';
import { ConfirmButton } from './ConfirmButton';
import { coverageImpact, emptyForm, fromProduct, ISSUE_FIELD, toRaw, triggerPreview, type FormState } from './formModel';

type Origin = 'new' | Source;

const TAG_SUGGESTIONS: Partial<Record<keyof typeof CATEGORIES, string[]>> = {
  candles: ['soy-wax', 'custom', 'luxury', 'romantic'],
  cakes: ['birthday', 'celebration', 'custom', 'eid'],
  sweets: ['eid', 'luxury', 'baklava', 'thank-you'],
  personalised: ['custom', 'photo', 'bespoke'],
  experiences: ['spa', 'couple', 'for-two'],
};
const DEFAULT_SUGGESTIONS = ['birthday', 'luxury', 'custom', 'eid'];
const IMAGE_OK = /^(https:\/\/\S+|\/(?!\/)\S*)$/;

const labels = {
  interest: (i: (typeof INTERESTS)[number]) => INTEREST_WORDS[i].label,
  vibe: (v: (typeof VIBES)[number]) => VIBE_WORDS[v].label,
  occasion: (o: (typeof OCCASIONS)[number]) => OCCASION_WORDS[o].label,
  relation: (r: (typeof RELATIONSHIPS)[number]) => RELATION_WORDS[r].label,
};

export function ProductForm({ initial, origin, onClose, onSaved }: {
  initial?: Product;
  origin: Origin;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromProduct(initial) : emptyForm()));
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [broken, setBroken] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => (t.has(k) ? t : new Set(t).add(k)));
  const toggle = <K extends 'interests' | 'vibes' | 'occasions' | 'recipients'>(k: K, v: FormState[K][number], max?: number) =>
    setForm((f) => {
      const cur = f[k] as FormState[K][number][];
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : max && cur.length >= max ? [...cur.slice(1), v] : [...cur, v];
      return { ...f, [k]: next };
    });

  const taken = useMemo(() => new Set([...SEED_CATALOG.map((i) => i.id), ...getAllProducts().map((p) => p.id)]), []);
  const id = initial?.id ?? uniqueId(form.title || 'product', taken);

  const result = useMemo(() => productsFromJson(JSON.stringify([toRaw(form, id)])), [form, id]);
  const errors = result.issues.filter((i) => i.level === 'error');
  const warnings = result.issues.filter((i) => i.level === 'warning').map((i) => i.message);
  const errorFor = (field: keyof typeof ISSUE_FIELD) =>
    submitted || touched.has(field) ? errors.find((e) => e.field === ISSUE_FIELD[field])?.message : undefined;

  const preview = useMemo(() => triggerPreview(form, labels), [form]);
  const impact = useMemo(() => (preview ? coverageImpact(getCatalog(), id, preview.item) : null), [preview, id]);
  const allWarnings = [...new Set([...warnings.filter((w) => !/^Replaces/.test(w)), ...(preview?.warnings ?? [])])];

  const url = form.imageUrl.trim();
  const showImage = !!url && IMAGE_OK.test(url) && broken !== url;
  const spec = form.category ? CATEGORIES[form.category] : null;
  const suggestions = (form.category ? TAG_SUGGESTIONS[form.category] : undefined) ?? DEFAULT_SUGGESTIONS;

  useEffect(() => {
    root.current?.scrollIntoView({ block: 'start' });
  }, []);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    const product = result.products[0];
    if (!result.ok || !product) {
      setTimeout(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    saveDraft(product);
    onSaved(`Saved "${product.title}". It is on this device now; use Publish to make it live for everyone.`);
  };

  const hidden = initial?.active === false;
  const underneath = initial ? (getPublished().some((p) => p.id === initial.id) ? 'published' : isBuiltinId(initial.id) ? 'builtin' : null) : null;

  return (
    <div className="admin-form" ref={root}>
      <div className="af-head">
        <button type="button" className="round-btn" onClick={onClose} aria-label="Back to products"><ArrowLeft size={18} /></button>
        <div>
          <h2>{origin === 'new' ? 'Add a product' : 'Edit product'}</h2>
          <span className="micro">{origin === 'builtin' ? 'BUILT-IN GIFT · YOUR VERSION WILL REPLACE IT' : origin === 'new' ? 'NEW' : origin === 'published' ? 'LIVE · YOUR CHANGES SAVE AS A DRAFT' : 'DRAFT ON THIS DEVICE'}</span>
        </div>
      </div>

      <div className="af-grid">
        <form id="product-form" className="af-fields" onSubmit={submit} noValidate>
          <Field label="Title" id="pf-title" error={errorFor('title')} hint={`${form.title.length}/${LIMITS.title}`}>
            <input id="pf-title" value={form.title} onChange={(e) => set('title', e.target.value)} onBlur={() => touch('title')} placeholder="e.g. Custom name candle" maxLength={LIMITS.title + 20} autoComplete="off" aria-invalid={!!errorFor('title')} />
          </Field>

          <div className="af-two">
            <Field label="Price (AED)" id="pf-price" error={errorFor('price')} hint="Whole AED, wrap not included">
              <input id="pf-price" inputMode="numeric" value={form.price} onChange={(e) => set('price', e.target.value)} onBlur={() => touch('price')} placeholder="120" autoComplete="off" aria-invalid={!!errorFor('price')} />
            </Field>
            <Field label="Category" id="pf-category" error={errorFor('category')}>
              <select id="pf-category" value={form.category} onChange={(e) => { set('category', e.target.value as FormState['category']); touch('category'); }} aria-invalid={!!errorFor('category')}>
                <option value="">Choose…</option>
                {CATEGORY_IDS.map((c) => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}
              </select>
            </Field>
          </div>
          {spec && <p className="af-note"><Sparkles size={14} /> {spec.hint}</p>}

          <Field label="Image URL" id="pf-image" error={errorFor('imageUrl')} hint="https:// link or a /path. Square works best.">
            <div className="af-image">
              <input id="pf-image" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} onBlur={() => touch('imageUrl')} placeholder="https://…/rose-candle.jpg" autoComplete="off" inputMode="url" aria-invalid={!!errorFor('imageUrl')} />
              <span className="af-thumb" aria-hidden={!url}>
                {showImage ? <img src={url} alt="Product preview" onError={() => setBroken(url)} /> : url && IMAGE_OK.test(url) ? <ImageOff size={18} /> : spec ? <Icon name={spec.icon} size={20} stroke={1.6} /> : null}
              </span>
            </div>
            {broken === url && url && <span className="af-warn">This link did not load as an image. Check it opens in a browser.</span>}
          </Field>

          <Field label="Tags" id="pf-tags" hint="Press Enter after each. Gold tags set rules automatically.">
            <TagInput tags={form.tags} onChange={(t) => set('tags', t)} suggestions={suggestions} />
          </Field>

          <Field label="Short description" id="pf-blurb" error={errorFor('blurb')} hint={`${form.blurb.length}/${LIMITS.blurb}`}>
            <textarea id="pf-blurb" rows={2} value={form.blurb} onChange={(e) => set('blurb', e.target.value)} onBlur={() => touch('blurb')} placeholder="One line shown under the title" aria-invalid={!!errorFor('blurb')} />
          </Field>

          <details className="af-adv">
            <summary>Override the automatic rules <small>optional</small></summary>
            <p className="af-note">Leave a group empty and the app works it out from the category and tags. Anything you choose here replaces it.</p>
            <ChipGroup label="Matches interests (up to 3)" options={INTERESTS} names={labels.interest} value={form.interests} onToggle={(v) => toggle('interests', v, LIMITS.interests)} onReset={() => set('interests', [])} />
            <ChipGroup label="Suits vibes (up to 3)" options={VIBES} names={labels.vibe} value={form.vibes} onToggle={(v) => toggle('vibes', v, LIMITS.vibes)} onReset={() => set('vibes', [])} />
            <ChipGroup label="Occasion boost (up to 3)" options={OCCASIONS} names={labels.occasion} value={form.occasions} onToggle={(v) => toggle('occasions', v, LIMITS.occasions)} onReset={() => set('occasions', [])} />
            <ChipGroup label="Only offered for" options={RELATIONSHIPS} names={labels.relation} value={form.recipients} onToggle={(v) => toggle('recipients', v)} onReset={() => set('recipients', [])} />
            <div className="af-two">
              <Field label="Hide below budget" id="pf-minbudget" error={errorFor('minBudget')}>
                <select id="pf-minbudget" value={form.minBudget} onChange={(e) => set('minBudget', e.target.value as FormState['minBudget'])}>
                  <option value="">Automatic (from price)</option>
                  {BUDGET_ORDER.map((b) => <option key={b} value={b}>{BUDGETS[b].label}</option>)}
                </select>
              </Field>
              <Field label="Unlock at" id="pf-hearts" error={errorFor('hearts')}>
                <select id="pf-hearts" value={form.hearts} onChange={(e) => set('hearts', e.target.value as FormState['hearts'])}>
                  <option value="">Automatic (from tags)</option>
                  <option value="1">Thoughtful and up</option>
                  <option value="2">Personal and up</option>
                  <option value="3">Made for Them only</option>
                </select>
              </Field>
            </div>
            <label className="af-check">
              <input type="checkbox" checked={form.photo} onChange={(e) => set('photo', e.target.checked)} />
              <span>Only offer it when the buyer uploaded a photo</span>
            </label>
          </details>

          <label className="af-check">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            <span>Visible in the app</span>
          </label>

          {initial && (
            <div className="af-danger">
              {hidden ? (
                <button type="button" className="btn btn-outline" onClick={() => { restoreProduct(initial); onSaved(`"${initial.title}" is back in the app.`); }}>Restore this gift</button>
              ) : origin === 'draft' ? (
                <ConfirmButton
                  label={underneath === 'builtin' ? 'Undo my edits (back to the built-in gift)' : underneath === 'published' ? 'Discard my changes' : 'Delete this product'}
                  onConfirm={() => { removeDraft(initial.id); onSaved(underneath ? 'Back to the original.' : `Deleted "${initial.title}".`); }}
                />
              ) : (
                <ConfirmButton label="Delete this gift" onConfirm={() => { hideProduct(initial); onSaved(`Deleted "${initial.title}". Find it under Deleted to restore it.`); }} />
              )}
            </div>
          )}
        </form>

        <aside className="af-preview" aria-label="Preview">
          <h3>How it will show up</h3>
          <div className="af-card">
            <span className="item-swatch" style={{ ['--tone' as string]: preview?.item.tone ?? '#3a2e29' }}>
              {showImage ? <img className="thumb-photo" src={url} alt="" /> : <Icon name={preview?.item.icon ?? 'gift'} size={18} stroke={1.5} />}
            </span>
            <span className="item-text">
              <strong>{form.title.trim() || 'Your product'}</strong>
              <small>{form.blurb.trim() || 'A thoughtful gift, chosen with care.'}</small>
            </span>
            <span className="item-price">{preview?.item.price ? `AED ${preview.item.price}` : 'AED –'}</span>
          </div>

          <h3>When the app recommends it</h3>
          {!preview ? (
            <p className="af-empty">Choose a category and the rules appear here as you type.</p>
          ) : (
            <>
              <ul className="af-rules">
                {preview.rows.map((r) => (
                  <li key={r.label}>
                    <span className="af-rule-label">{r.label}{r.weight && <em>{r.weight}</em>}</span>
                    <span className="af-rule-values">
                      {(r.values.length ? r.values : [r.empty ?? '–']).map((v) => <b key={v} className={r.values.length ? '' : 'none'}>{v}</b>)}
                    </span>
                    <span className={`af-auto ${r.auto ? '' : 'set'}`}>{r.auto ? 'Auto' : 'Set by you'}</span>
                  </li>
                ))}
                <li>
                  <span className="af-rule-label">Shown to budgets</span>
                  <span className="af-rule-values"><b>{preview.budget}</b></span>
                  <span className={`af-auto ${form.minBudget ? 'set' : ''}`}>{form.minBudget ? 'Set by you' : 'Auto'}</span>
                </li>
              </ul>

              {impact && (
                <div className="af-impact">
                  <strong>{impact.category.label}: {impact.category.before} → {impact.category.after} gift{impact.category.after === 1 ? '' : 's'}</strong>
                  {impact.fixes.map((m) => <span key={m} className="good"><Check size={14} /> Fixes: {m}</span>)}
                  {impact.improved.map((m) => <span key={m} className="good"><Check size={14} /> Better, but still: {m}</span>)}
                  {impact.newIssues.map((m) => <span key={m} className="warn">New: {m}</span>)}
                </div>
              )}
              {allWarnings.length > 0 && (
                <ul className="af-warnings">{allWarnings.map((w) => <li key={w}>{w}</li>)}</ul>
              )}
            </>
          )}
        </aside>
      </div>

      <div className="sticky-cta af-save">
        <div className="cta-pair">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" form="product-form" className="btn btn-dark grow">
            {origin === 'new' ? 'Add product' : 'Save changes'} <Check size={18} strokeWidth={2.6} />
          </button>
        </div>
        {submitted && errors.length > 0 && <p className="af-warn" role="alert">Fix {errors.length} {errors.length === 1 ? 'field' : 'fields'} above to save.</p>}
      </div>
    </div>
  );
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`af-field ${error ? 'bad' : ''}`}>
      <div className="af-label">
        <label htmlFor={id} className="micro">{label.toUpperCase()}</label>
        {hint && !error && <small>{hint}</small>}
      </div>
      {children}
      {error && <span className="af-err" role="alert">{error}</span>}
    </div>
  );
}

function TagInput({ tags, onChange, suggestions }: { tags: string[]; onChange: (t: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const parts = raw.split(/[,\n|]/).map(normaliseTag).filter(Boolean);
    if (parts.length) onChange([...new Set([...tags, ...parts])].slice(0, 12));
    setText('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1));
  };
  return (
    <div className="af-tags">
      <div className="af-tagbox">
        {tags.map((t) => (
          <span key={t} className={`af-tag ${TAG_RULES[t] ? 'known' : ''}`} title={TAG_RULES[t] ? 'Sets rules automatically' : 'Kept as a label, no rule'}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}><X size={12} strokeWidth={3} /></button>
          </span>
        ))}
        <input id="pf-tags" value={text} onChange={(e) => (/[,\n|]/.test(e.target.value) ? add(e.target.value) : setText(e.target.value))} onKeyDown={onKey} onBlur={() => add(text)} placeholder={tags.length ? '' : 'candle, custom, birthday…'} autoComplete="off" autoCapitalize="none" />
      </div>
      <div className="af-suggest" aria-label="Suggested tags">
        {suggestions.filter((s) => !tags.includes(s)).map((s) => (
          <button type="button" key={s} onClick={() => onChange([...tags, s])}>+ {s}</button>
        ))}
      </div>
    </div>
  );
}

function ChipGroup<T extends string>({ label, options, names, value, onToggle, onReset }: { label: string; options: readonly T[]; names: (v: T) => string; value: T[]; onToggle: (v: T) => void; onReset: () => void }) {
  return (
    <fieldset className="af-chips">
      <legend className="micro">{label.toUpperCase()}</legend>
      <div>
        {options.map((o) => (
          <button type="button" key={o} className={value.includes(o) ? 'on' : ''} aria-pressed={value.includes(o)} onClick={() => onToggle(o)}>{names(o)}</button>
        ))}
        {value.length > 0 && <button type="button" className="reset" onClick={onReset}>Reset to auto</button>}
      </div>
    </fieldset>
  );
}

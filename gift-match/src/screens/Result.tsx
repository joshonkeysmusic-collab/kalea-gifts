import { ArrowRight, Shuffle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Hearts, Hl } from '../components/Shell';
import { Burst, haptic, useCountUp } from '../components/Motion';
import { Icon } from '../components/Icon';
import { StickyCta } from './Questions';
import type { CatalogItem, CompleteAnswers, GiftBox } from '../engine/types';

const ORBIT = ['coffee', 'flower', 'gem', 'flame', 'book', 'heart'];
const LINES = ['Reading what they love…', 'Matching the vibe…', 'Fitting your budget…', 'Wrapping it up…'];

export function Matching({ name, onDone }: { name?: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 650);
    const d = setTimeout(() => done.current(), 650 * LINES.length);
    return () => {
      clearInterval(t);
      clearTimeout(d);
    };
  }, []);
  return (
    <div className="app matching">
      <div className="orbit-wrap">
        <div className="orbit" aria-hidden>
          {ORBIT.map((ic, k) => (
            <span key={ic} style={{ ['--k' as string]: k, ['--n' as string]: ORBIT.length }}>
              <Icon name={ic} size={18} stroke={1.5} />
            </span>
          ))}
        </div>
        <div className="orb">
          <Sparkles size={34} strokeWidth={1.3} />
        </div>
      </div>
      <h1 className="serif">Finding {name ? `${name}'s` : 'their'} gift…</h1>
      <p className="matching-line" key={i}>{LINES[Math.min(i, LINES.length - 1)]}</p>
      <div className="matching-bar"><div style={{ animationDuration: `${650 * LINES.length}ms` }} /></div>
    </div>
  );
}

/** The product photo when there is one, otherwise its category icon. A broken image falls back to the icon. */
function Thumb({ item, size, stroke }: { item: CatalogItem; size: number; stroke: number }) {
  const [broken, setBroken] = useState(false);
  if (item.imageUrl && !broken) {
    return <img className="thumb-photo" src={item.imageUrl} alt="" loading="lazy" onError={() => setBroken(true)} />;
  }
  return <Icon name={item.icon} size={size} stroke={stroke} />;
}

export function BoxHero({ box, message, photo, recipient, price }: { box: GiftBox; message?: string; photo?: string | null; recipient?: string; price?: number }) {
  const items = box.items.filter((i) => !i.kind);
  return (
    <div className="box-hero">
      <div className="box-hero-bg" />
      <div className="rays hero-rays" aria-hidden />
      <div className="hero-plinth" aria-hidden />
      <div className="hero-items">
        {items.slice(0, 3).map((it, i) => (
          <div key={it.id} className={`hero-item p${i}`} style={{ ['--tone' as string]: it.tone, animationDelay: `${350 + i * 110}ms` }}>
            <Thumb item={it} size={i === 0 ? 34 : 26} stroke={1.3} />
          </div>
        ))}
      </div>
      <div className="note-card">
        {photo && <img src={photo} alt="" className="note-photo" />}
        <p className="note-text">{message?.trim() || 'You deserve this'}</p>
        {recipient && <p className="note-sign">for {recipient}</p>}
      </div>
      {price !== undefined && (
        <div className="sticker gold price-sticker" aria-hidden>
          <small>ALL IN</small>
          AED {price}
        </div>
      )}
    </div>
  );
}

export function ItemList({ items, showPrices = true }: { items: CatalogItem[]; showPrices?: boolean }) {
  return (
    <ul className="items">
      {items.map((it, i) => (
        <li key={it.id} style={{ ['--i' as string]: i }}>
          <span className="item-swatch" style={{ ['--tone' as string]: it.tone }}>
            <Thumb item={it} size={18} stroke={1.5} />
          </span>
          <span className="item-text">
            <strong>{it.name}{it.minHearts && <em className="tag">Personal</em>}</strong>
            <small>{it.blurb}</small>
          </span>
          {showPrices && <span className="item-price">{it.price ? `AED ${it.price}` : 'Included'}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Result({ box, answers, photo, onShuffle, onNext }: {
  box: GiftBox;
  answers: CompleteAnswers;
  photo: string | null;
  onShuffle: () => void;
  onNext: () => void;
}) {
  const [scatter, setScatter] = useState(false);
  const shown = useCountUp(box.total);
  const shuffle = () => {
    if (scatter) return;
    haptic();
    setScatter(true);
    setTimeout(() => {
      onShuffle();
      setScatter(false);
    }, 320);
  };
  return (
    <div className={`result ${scatter ? 'scatter' : ''}`} key={box.seed}>
      <div className="result-head">
        <span className="burst-anchor"><Hearts n={answers.hearts} size={16} /><Burst fire={box.seed} kind="heart" count={10} /></span>
        <h1>{splitHeadline(box.headline)}</h1>
        <p>{box.subtitle}</p>
      </div>
      <BoxHero box={box} message={answers.details.message} photo={photo} recipient={answers.details.name} price={box.total} />
      <section className="panel">
        <div className="panel-head">
          <h2>{box.title}</h2>
          <span className="price" data-total={box.total} aria-label={`AED ${box.total}`}>AED {shown}</span>
        </div>
        <div className="budget-meter" aria-label={`AED ${box.total} of AED ${box.budgetMax} budget`}>
          <div style={{ ['--w' as string]: `${Math.min(100, (box.total / box.budgetMax) * 100)}%` }} />
        </div>
        <ItemList items={box.items} />
      </section>
      <section className="panel why">
        <h3>Why this works</h3>
        <ul>
          {box.why.map((w) => <li key={w}>{w}</li>)}
        </ul>
      </section>
      <StickyCta>
        <div className="cta-pair">
          <button className="btn btn-ghost" onClick={shuffle} aria-label="Try another match">
            <Shuffle size={18} />
          </button>
          <button className="btn btn-coral grow" onClick={onNext}>
            Order this box
            <span className="price-tab">AED {box.total} <ArrowRight size={16} strokeWidth={2.6} /></span>
          </button>
        </div>
      </StickyCta>
    </div>
  );
}

/** "Here's a match for Sarah" → highlight the person, thumbnail-style. */
function splitHeadline(h: string) {
  const lead = "Here's a match for ";
  if (!h.startsWith(lead)) return h;
  return (
    <>
      {lead}
      <Hl tone="gold">{h.slice(lead.length)}</Hl>
    </>
  );
}

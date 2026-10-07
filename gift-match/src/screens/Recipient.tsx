import { ArrowLeft, ArrowRight, Frown, Gift, Heart, Send, Smile } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GiftArt } from '../components/GiftArt';
import { Toast } from '../components/Shell';
import { Burst, PageTransition, haptic } from '../components/Motion';
import { BoxHero, ItemList } from './Result';
import { StickyCta } from './Questions';
import { CARD, GIFT_WRAP, getCatalog } from '../engine/catalog';
import { OCCASION_WORDS } from '../engine/words';
import type { GiftBox, Occasion } from '../engine/types';
import { sessionId, track } from '../lib/analytics';
import { shareOrCopy, type GiftLink } from '../lib/share';

const RATINGS = [
  { id: 'love', label: 'Love it', Icon: Heart, reply: 'nailed it' },
  { id: 'nice', label: "It's nice", Icon: Smile, reply: 'got close' },
  { id: 'notme', label: 'Not quite me', Icon: Frown, reply: 'missed this time' },
] as const;

type Stage = 'closed' | 'opening' | 'open' | 'done';

export function Recipient({ link }: { link: GiftLink }) {
  const [stage, setStage] = useState<Stage>('closed');
  const [rating, setRating] = useState<(typeof RATINGS)[number]['id'] | null>(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const from = link.f || 'Someone who cares about you';
  // The giver previewing their own link gets a way back to their match.
  const isGiver = link.s === sessionId();
  const backToMatch = isGiver ? (
    <button className="preview-back" onClick={() => { window.location.hash = ''; }}>
      <ArrowLeft size={14} /> Back to your match
    </button>
  ) : null;

  const box: GiftBox = useMemo(() => {
    const all = [...getCatalog(), GIFT_WRAP, CARD];
    const items = link.i.map((id) => all.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
    return { title: link.t, headline: '', who: '', subtitle: '', why: [], items, total: 0, budgetMax: 1, seed: 0 };
  }, [link]);

  useEffect(() => {
    if (!isGiver) track('recipient_open', { giver: link.s });
  }, [link.s, isGiver]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const unwrap = () => {
    if (stage !== 'closed') return;
    haptic();
    setStage('opening');
    setTimeout(() => setStage('open'), 1100);
  };

  return (
    <>
      {backToMatch}
      <PageTransition id={stage === 'opening' ? 'closed' : stage} kind="scene">
        {view()}
      </PageTransition>
    </>
  );

  function view() {
  if (stage === 'closed' || stage === 'opening') {
    return (
      <div className={`app reveal ${stage === 'opening' ? 'unwrapping' : ''}`}>
        <p className="eyebrow">A gift prediction for {link.n || 'you'}</p>
        <h1 className="serif">{from} picked something they think you'll love</h1>
        <button className="reveal-box" onClick={unwrap} aria-label="Open your gift">
          <GiftArt open={stage === 'opening'} />
          <Burst fire={stage === 'opening'} count={22} />
          <span className="tap">{stage === 'opening' ? 'Opening…' : 'Tap to open'}</span>
        </button>
        <p className="fineprint">For {OCCASION_WORDS[link.o as Occasion]?.phrase ?? 'you'}</p>
      </div>
    );
  }

  if (stage === 'done') {
    const r = RATINGS.find((x) => x.id === rating)!;
    return (
      <div className="app reveal done">
        <div className="orb small burst-anchor"><r.Icon size={28} strokeWidth={1.3} /><Burst fire={rating === 'love' ? 1 : 0} kind="heart" count={14} /></div>
        <h1 className="serif">Thank you{link.n ? `, ${link.n}` : ''}!</h1>
        <p className="lede-dark">Let {link.f || 'them'} know how they did. They're waiting to hear if they nailed it.</p>
        <button
          className="btn btn-dark"
          onClick={async () => {
            const res = await shareOrCopy({
              title: 'Kalea Gifts',
              text: `You ${r.reply} with my gift prediction! (${r.label}) 🎁 Your turn next?`,
              url: `${window.location.origin}${window.location.pathname}`,
            });
            track('share', { kind: 'reply', result: res });
            if (res === 'copied') setToast('Copied. Paste it in your chat 💌');
          }}
        >
          <Send size={16} /> Tell {link.f || 'them'}
        </button>
        <div className="panel share-card alt">
          <h3>Your turn</h3>
          <p>Think you know someone better? Predict the perfect gift for someone you love.</p>
          <a className="btn btn-light-outline" href={`${window.location.pathname}?from=${encodeURIComponent(link.n || 'a friend')}`} onClick={() => sessionStorage.removeItem('gm_flow')}>
            <Gift size={16} /> Make a match <ArrowRight size={16} />
          </a>
        </div>
        <Toast text={toast} />
      </div>
    );
  }

  return (
    <div className="app">
      <main className="screen">
        <div className="result">
          <div className="result-head">
            <p className="eyebrow">From {from}</p>
            <h1>{box.title}</h1>
            <p>Here's what they predicted you'd love.</p>
          </div>
          <BoxHero box={box} message={link.m} recipient={link.n} />
          <section className="panel">
            <ItemList items={box.items.filter((i) => !i.kind)} showPrices={false} />
          </section>
          <section className="panel">
            <h3 className="center">Did they get it right?</h3>
            <div className="choices">
              {RATINGS.map(({ id, label, Icon }, i) => (
                <button key={id} className={`choice ${rating === id ? 'on' : ''}`} onClick={() => { haptic(); setRating(id); }} aria-pressed={rating === id} style={{ ['--i' as string]: i }}>
                  <Icon size={22} strokeWidth={1.4} />
                  {label}
                </button>
              ))}
            </div>
            <label className="textarea-wrap">
              <span>What would you love instead? (optional)</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} placeholder="Be kind, be honest…" />
            </label>
          </section>
          <StickyCta>
            <button
              className="btn btn-dark"
              disabled={!rating}
              onClick={() => {
                track('recipient_rating', { rating, note: note.trim() || undefined, giver: link.s, title: link.t });
                setStage('done');
              }}
            >
              Send my answer <ArrowRight size={16} />
            </button>
          </StickyCta>
        </div>
      </main>
    </div>
  );
  }
}

import { ArrowRight, Check, Eye, Heart, Link2, Repeat, RotateCcw, Send, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Hl, Toast } from '../components/Shell';
import { GiftArt } from '../components/GiftArt';
import { Burst, haptic } from '../components/Motion';
import { StickyCta } from './Questions';
import { sessionId, track } from '../lib/analytics';
import { appUrl, encode, shareOrCopy, type GiftLink, type ShareResult } from '../lib/share';
import { OCCASION_WORDS, RELATION_WORDS } from '../engine/words';
import type { CompleteAnswers, GiftBox } from '../engine/types';

const CHOICES = [
  { id: 'yes', title: "Yes, I'd order it", sub: (n: string) => `This is exactly what I'd send ${n}`, prompt: 'What made it feel right?', Icon: Heart },
  { id: 'maybe', title: 'Maybe, with changes', sub: () => "Tell us what you'd swap", prompt: 'What would make it a yes?', Icon: Repeat },
  { id: 'no', title: 'Not this one', sub: () => 'Help the next match land', prompt: 'What would they love instead?', Icon: X },
] as const;

export function Intent({ box, answers, onNext }: { box: GiftBox; answers: CompleteAnswers; onNext: () => void }) {
  const [answer, setAnswer] = useState<(typeof CHOICES)[number]['id'] | null>(null);
  const [note, setNote] = useState('');
  const name = answers.details.name?.trim();
  const picked = CHOICES.find((c) => c.id === answer);
  const occasion = OCCASION_WORDS[answers.occasion].label;
  return (
    <div className="order">
      <div className="order-glow" aria-hidden />
      <span className="sticker gold final-sticker"><i className="blink-dot" /> FINAL STEP</span>

      <div className="ticket">
        <div className="ticket-art" aria-hidden><GiftArt /></div>
        <div className="ticket-text">
          <strong>{box.title}</strong>
          <small>For {name || RELATION_WORDS[answers.who].noun} · {occasion}{answers.details.birthday ? `, ${answers.details.birthday}` : ''}</small>
        </div>
        <div className="ticket-price">
          <strong>{box.total}</strong>
          <small>AED</small>
        </div>
      </div>

      <div className="heading left">
        <h1>Would you <Hl>order</Hl> this for {name || RELATION_WORDS[answers.who].noun}?</h1>
      </div>

      <div className="order-choices">
        {CHOICES.map(({ id, title, sub, Icon }, i) => {
          const on = answer === id;
          const beacon = !answer && id === 'yes';
          return (
            <button
              key={id}
              className={`order-choice ${on ? 'on' : beacon ? 'beacon' : ''}`}
              onClick={() => { haptic(); setAnswer(id); }}
              aria-pressed={on}
              style={{ ['--i' as string]: i }}
            >
              <span className="oc-icon"><Icon size={beacon ? 24 : 20} strokeWidth={2} fill={beacon && id === 'yes' ? 'currentColor' : 'none'} /></span>
              <span className="oc-text">
                <strong>{title}</strong>
                <small>{sub(name || 'them')}</small>
              </span>
              {on && <span className="oc-check"><Check size={16} strokeWidth={3.4} /></span>}
              {beacon && <ArrowRight className="oc-go" size={24} strokeWidth={2.6} />}
            </button>
          );
        })}
      </div>

      {picked && (
        <label className="textarea-wrap rise-in">
          <span className="micro">{picked.prompt.toUpperCase()}</span>
          <textarea rows={2} placeholder="One line is plenty…" value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} />
        </label>
      )}

      <StickyCta>
        {answer && (
          <button
            className="btn btn-light-solid"
            onClick={() => {
              track('intent', { answer, note: note.trim() || undefined, total: box.total, title: box.title });
              onNext();
            }}
          >
            Lock in my answer <ArrowRight size={18} strokeWidth={2.6} />
          </button>
        )}
        <p className="fineprint tight">Ordering isn't open yet. Your answer decides which boxes we stock first.</p>
      </StickyCta>
    </div>
  );
}

export function ShareStep({ box, answers, onRestart }: { box: GiftBox; answers: CompleteAnswers; onRestart: () => void }) {
  const [from, setFrom] = useState(() => {
    try {
      return localStorage.getItem('gm_from') ?? '';
    } catch {
      return '';
    }
  });
  const [toast, setToast] = useState<string | null>(null);
  const [sent, setSent] = useState(0);
  const name = answers.details.name?.trim();
  const rel = RELATION_WORDS[answers.who];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const report = (r: ShareResult) => {
    if (r !== 'failed') setSent((n) => n + 1);
    setToast(r === 'copied' ? 'Link copied. Paste it anywhere 💌' : r === 'shared' ? 'Sent! 💌' : null);
  };

  const giftHash = () => {
    try {
      localStorage.setItem('gm_from', from.trim());
    } catch {
      /* ignore */
    }
    const link: GiftLink = {
      v: 1,
      n: name,
      f: from.trim() || undefined,
      t: box.title,
      i: box.items.map((i) => i.id),
      m: answers.details.message?.trim() || undefined,
      o: answers.occasion,
      s: sessionId(),
    };
    return `#/r/${encode(link)}`;
  };

  const preview = () => {
    track('share', { kind: 'preview' });
    window.location.hash = giftHash();
  };

  const sendToRecipient = async () => {
    const url = appUrl(giftHash());
    const r = await shareOrCopy({
      title: 'A gift prediction for you',
      text: `${name ? `${name}, ` : ''}I tried to predict the perfect gift for you 🎁 Did I get it right?`,
      url,
    });
    track('share', { kind: 'recipient', result: r });
    report(r);
  };

  const challenge = async () => {
    const who = from.trim();
    const url = `${window.location.origin}${window.location.pathname}${who ? `?from=${encodeURIComponent(who)}` : ''}`;
    const r = await shareOrCopy({
      title: 'Kalea Gifts',
      text: `I just predicted the perfect gift for ${rel.noun} in under a minute 🎁 Can you find a better match for someone you love?`,
      url,
    });
    track('share', { kind: 'challenge', result: r });
    report(r);
  };

  return (
    <>
      <div className="heading">
        <div className="trophy burst-anchor"><Trophy size={26} strokeWidth={1.3} /><Burst fire={1} count={12} /><Burst fire={sent} kind="heart" count={12} /></div>
        <h1>Now, did you predict it right?</h1>
        <p>Send {name || rel.noun} a little gift reveal. They'll open it, rate it, and tell you if you nailed it.</p>
      </div>

      <section className="panel share-card">
        <label className="inline-field">
          <span>Your first name</span>
          <input placeholder="So they know it's from you" value={from} onChange={(e) => setFrom(e.target.value.slice(0, 30))} />
        </label>
        <button className="btn btn-dark" onClick={sendToRecipient}>
          <Send size={16} /> Send to {name || rel.noun}
        </button>
        <button className="text-btn tight" onClick={preview}>
          <Eye size={15} /> Preview what {name || 'they'} will see
        </button>
        <p className="fineprint">They'll see the gift, but not the prices.</p>
      </section>

      <section className="panel share-card alt">
        <h3>Challenge a friend</h3>
        <p>Who knows their people best? Invite a friend to match a gift for someone they love.</p>
        <button className="btn btn-light-outline" onClick={challenge}>
          <Link2 size={16} /> Share Kalea Gifts
        </button>
      </section>

      <button className="text-btn" onClick={onRestart}>
        <RotateCcw size={14} /> Match a gift for someone else
      </button>
      <Toast text={toast} />
    </>
  );
}

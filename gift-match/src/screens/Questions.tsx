import { ArrowRight, AtSign, CalendarDays, Cake, Camera, Check, Gift, MessageSquareHeart, StickyNote, User, X } from 'lucide-react';
import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { BirthdaySheet, daysUntil, parseBirthday } from '../components/BirthdaySheet';
import { Heading, Hearts, Hl } from '../components/Shell';
import { Icon } from '../components/Icon';
import { haptic } from '../components/Motion';
import { BUDGET_OPTIONS, HEART_OPTIONS, type Option } from '../options';
import type { BudgetId, Details, HeartLevel } from '../engine/types';

export function TileStep<T extends string>({ title, subtitle, options, value, onChange, multi, onNext }: {
  title: ReactNode;
  subtitle: string;
  options: Option<T>[];
  value: T[];
  onChange: (v: T[]) => void;
  multi?: number;
  onNext?: () => void;
}) {
  const toggle = (id: T) => {
    haptic();
    if (!multi) return onChange([id]);
    if (value.includes(id)) return onChange(value.filter((v) => v !== id));
    if (value.length >= multi) return onChange([...value.slice(1), id]);
    onChange([...value, id]);
  };
  return (
    <>
      <Heading title={title} subtitle={subtitle} />
      <div className={`tiles ${options.length % 2 ? 'odd' : ''}`}>
        {options.map((o, i) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              className={`tile ${on ? 'on' : ''}`}
              style={{ ['--c1' as string]: o.colors[0], ['--c2' as string]: o.colors[1], ['--i' as string]: i }}
              onClick={() => toggle(o.id)}
              aria-pressed={on}
            >
              <span className="tile-gloss" />
              <Icon name={o.icon} size={on ? 42 : 38} stroke={1.8} className="tile-icon" />
              <span className="tile-label">{o.label}</span>
              <span className="tick">{on && <Check size={15} strokeWidth={3.6} />}</span>
            </button>
          );
        })}
      </div>
      {multi && onNext && (
        <StickyCta>
          <button className="btn btn-dark" disabled={!value.length} onClick={onNext}>
            {value.length ? `Continue · ${value.length} selected` : 'Pick at least one'} <ArrowRight size={16} />
          </button>
        </StickyCta>
      )}
    </>
  );
}

export function StickyCta({ children }: { children: ReactNode }) {
  return <div className="sticky-cta">{children}</div>;
}

export function BudgetStep({ value, onChange }: { value?: BudgetId; onChange: (v: BudgetId) => void }) {
  return (
    <>
      <Heading title={<>What is your <Hl tone="gold">budget?</Hl></>} subtitle="Choose a comfortable range." />
      <div className="list">
        {BUDGET_OPTIONS.map((b, i) => (
          <button key={b.id} className={`row ${value === b.id ? 'on' : ''}`} onClick={() => onChange(b.id)} style={{ ['--i' as string]: i }}>
            <span className="row-icon"><Gift size={20} strokeWidth={1.4} /></span>
            <span className="row-text">
              <strong>{b.label}</strong>
              <small>{b.hint}</small>
            </span>
            <span className="radio">{value === b.id && <Check size={13} strokeWidth={3} />}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function HeartsStep({ value, onChange }: { value?: HeartLevel; onChange: (v: HeartLevel) => void }) {
  return (
    <>
      <Heading
        title={<>How <Hl>personal</Hl> do you want to make it?</>}
        subtitle="The more you share, the more tailored the gift becomes."
      />
      <div className="list">
        {HEART_OPTIONS.map((h, i) => (
          <button key={h.id} className={`row tall ${value === h.id ? 'on' : ''}`} onClick={() => onChange(h.id)} style={{ ['--i' as string]: i }}>
            <span className={`row-hearts h${h.id}`}><Hearts n={h.id} size={20} /></span>
            <span className="row-text">
              <strong className="serif">{h.label}</strong>
              <small>{h.text}</small>
            </span>
            <span className="radio">{value === h.id && <Check size={13} strokeWidth={3} />}</span>
          </button>
        ))}
      </div>
      <p className="fineprint">The hearts show how deep the personalisation goes, not how much you love them.</p>
    </>
  );
}

export function DetailsStep({ value, onChange, photo, onPhoto, onNext }: {
  value: Details;
  onChange: (d: Details) => void;
  photo: string | null;
  onPhoto: (p: string | null) => void;
  onNext: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [calOpen, setCalOpen] = useState(false);
  const closeCal = useCallback(() => setCalOpen(false), []);
  const bday = parseBirthday(value.birthday);
  const until = bday ? daysUntil(bday.m, bday.d) : null;
  const set = (k: keyof Details) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value.slice(0, k === 'message' || k === 'notes' ? 240 : 40) });

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      onPhoto(String(r.result));
      onChange({ ...value, hasPhoto: true });
    };
    r.readAsDataURL(f);
  };

  const filled = [value.name, value.birthday, value.hasPhoto, value.handle, value.message, value.notes].filter(Boolean).length;

  return (
    <>
      <Heading title={<>Make it <Hl>personal</Hl></>} subtitle="Optional. Each detail makes the match sharper." />
      <div className="list form">
        <Field tone="blue" icon={<User size={20} strokeWidth={2} />} label="Their name">
          <input placeholder="e.g. Sarah" value={value.name ?? ''} onChange={set('name')} autoComplete="off" />
        </Field>
        <button className="row field bday" onClick={() => setCalOpen(true)} type="button" aria-label={`Birthday: ${value.birthday ?? 'choose a date'}`}>
          <span className="row-icon tone-coral"><Cake size={20} strokeWidth={2} /></span>
          <span className="row-text">
            <span className="micro coral">BIRTHDAY</span>
            <strong>{value.birthday ?? 'Tap to pick a date'}</strong>
            {until && <small>{until.days === 0 ? "It's today!" : `In ${until.days} days · a ${until.weekday}`}</small>}
          </span>
          <CalendarDays size={20} className="bday-cal" />
        </button>
        <button className="row field" onClick={() => file.current?.click()} type="button">
          <span className="row-icon tone-green"><Camera size={20} strokeWidth={2} /></span>
          <span className="row-text">
            <strong>Upload a photo</strong>
            <small>Unlocks photo gifts · stays on your phone</small>
          </span>
          {photo ? (
            <span className="thumb">
              <img src={photo} alt="Your upload" />
              <span
                role="button"
                aria-label="Remove photo"
                className="thumb-x"
                onClick={(e) => {
                  e.stopPropagation();
                  onPhoto(null);
                  onChange({ ...value, hasPhoto: false });
                }}
              >
                <X size={12} />
              </span>
            </span>
          ) : (
            <span className="thumb empty">+</span>
          )}
        </button>
        <input ref={file} type="file" accept="image/*" hidden onChange={pick} data-testid="photo-input" />
        <Field tone="violet" icon={<AtSign size={20} strokeWidth={2} />} label="Social handle">
          <input placeholder="e.g. @username" value={value.handle ?? ''} onChange={set('handle')} autoComplete="off" />
        </Field>
        <Field tone="gold" icon={<MessageSquareHeart size={20} strokeWidth={2} />} label="Personal message">
          <textarea placeholder="Write a short note for their card…" rows={2} value={value.message ?? ''} onChange={set('message')} />
        </Field>
        <Field tone="cyan" icon={<StickyNote size={20} strokeWidth={2} />} label="Anything else we should know?">
          <textarea placeholder="Favourite scent, colour, memories…" rows={2} value={value.notes ?? ''} onChange={set('notes')} />
        </Field>
      </div>
      <StickyCta>
        <button className="btn btn-dark" onClick={onNext}>
          {filled ? 'Find my gift match' : 'Skip & find my match'} <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </StickyCta>
      {calOpen && <BirthdaySheet value={value.birthday} onSet={(b) => onChange({ ...value, birthday: b })} onClose={closeCal} />}
    </>
  );
}

function Field({ icon, label, tone, children }: { icon: ReactNode; label: string; tone: string; children: ReactNode }) {
  return (
    <label className="row field">
      <span className={`row-icon tone-${tone}`}>{icon}</span>
      <span className="row-text">
        <span className="micro">{label.toUpperCase()}</span>
        {children}
      </span>
    </label>
  );
}

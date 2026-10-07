import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildBox } from './engine/engine';
import type { Answers, CompleteAnswers } from './engine/types';
import { resetSession, track } from './lib/analytics';
import { decode, type GiftLink } from './lib/share';
import { Hl, Shell } from './components/Shell';
import { PageTransition, haptic, type Direction } from './components/Motion';
import { Welcome } from './screens/Welcome';
import { BudgetStep, DetailsStep, HeartsStep, TileStep } from './screens/Questions';
import { Matching, Result } from './screens/Result';
import { Intent, ShareStep } from './screens/AfterResult';
import { Recipient } from './screens/Recipient';
import { Founder } from './screens/Founder';

// Admin screens are a separate chunk: only downloaded when someone opens /#/admin.
const Admin = lazy(() => import('./screens/Admin'));
import { INTERESTS, OCCASIONS, VIBES, WHO } from './options';

export const FLOW = ['welcome', 'who', 'occasion', 'interests', 'vibes', 'budget', 'hearts', 'details', 'matching', 'result', 'intent', 'share'] as const;
export type StepId = (typeof FLOW)[number];
const QUESTION_STEPS = 7;

const EMPTY: Answers = { interests: [], vibes: [], details: {} };
const STORE = 'gm_flow';

interface FlowState {
  step: number;
  answers: Answers;
  seed: number;
  dir?: Direction;
}

/** Pause after a single-choice tap so the selection is seen before moving on. */
const CONFIRM_MS = 360;

function load(): FlowState {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORE) || 'null') as FlowState | null;
    if (s && typeof s.step === 'number') {
      // The matching animation is a moment, not a resting place.
      return { ...s, step: FLOW[s.step] === 'matching' ? FLOW.indexOf('result') : s.step };
    }
  } catch {
    /* ignore */
  }
  return { step: 0, answers: EMPTY, seed: 1 };
}

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  if (hash.startsWith('#/r/')) {
    const link = decode<GiftLink>(hash.slice(4));
    if (link) return <Recipient link={link} />;
  }
  if (hash.startsWith('#/founder')) return <Founder />;
  if (hash.startsWith('#/admin')) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }
  return <Flow />;
}

function Flow() {
  const [state, setState] = useState<FlowState>(load);
  const [photo, setPhoto] = useState<string | null>(null);
  const { step, answers, seed, dir = 'fwd' } = state;
  const pending = useRef(false);
  const id = FLOW[step];
  const invitedBy = useMemo(() => new URLSearchParams(window.location.search).get('from')?.slice(0, 40) ?? null, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    pending.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const complete = isComplete(answers) ? answers : null;
  const box = useMemo(() => (complete ? buildBox(complete, seed) : null), [complete, seed]);

  const set = (patch: Partial<Answers>) => setState((s) => ({ ...s, answers: { ...s.answers, ...patch } }));
  const go = (to: StepId) => setState((s) => ({ ...s, step: FLOW.indexOf(to), dir: 'fwd' }));
  const next = () => {
    if (step >= 1 && step <= QUESTION_STEPS) track('step', { step: id });
    setState((s) => ({ ...s, step: Math.min(s.step + 1, FLOW.length - 1), dir: 'fwd' }));
  };
  const nextSoon = () => {
    if (pending.current) return;
    pending.current = true;
    haptic();
    setTimeout(next, CONFIRM_MS);
  };
  const back = () =>
    setState((s) => ({ ...s, dir: 'back', step: Math.max(0, FLOW[s.step - 1] === 'matching' ? s.step - 2 : s.step - 1) }));
  const restart = () => {
    resetSession();
    setPhoto(null);
    setState({ step: 0, answers: EMPTY, seed: 1, dir: 'back' });
  };

  let scene: 'welcome' | 'matching' | 'flow' = id === 'welcome' ? 'welcome' : id === 'matching' ? 'matching' : 'flow';
  let page: ReactNode;
  if ((id === 'result' || id === 'intent' || id === 'share') && (!complete || !box)) {
    // Answers were lost (e.g. storage cleared): start over gracefully.
    scene = 'welcome';
  }

  if (scene === 'welcome') {
    page = (
      <Welcome
        invitedBy={invitedBy}
        onStart={() => {
          if (id !== 'welcome') return restart();
          track('start', invitedBy ? { via: 'challenge' } : undefined);
          next();
        }}
      />
    );
  } else if (scene === 'matching') {
    page = <Matching name={answers.details.name} onDone={() => go('result')} />;
  } else {
    page = renderStep();
  }

  return (
    <PageTransition id={scene} kind="scene" dir={dir}>
      {page}
    </PageTransition>
  );

  function renderStep() {
  return (
    <Shell step={Math.min(step, QUESTION_STEPS)} total={QUESTION_STEPS} onBack={back} onRestart={restart} hideProgress={step > QUESTION_STEPS}>
      <PageTransition id={id} dir={dir}>
      {id === 'who' && (
        <TileStep
          key="who"
          title={<>Who is this gift <Hl tone="gold">for?</Hl></>}
          subtitle="Choose the person closest to this moment."
          options={WHO}
          value={answers.who ? [answers.who] : []}
          onChange={([v]) => {
            set({ who: v });
            nextSoon();
          }}
        />
      )}
      {id === 'occasion' && (
        <TileStep
          key="occasion"
          title={<>What is the <Hl>occasion?</Hl></>}
          subtitle="Every moment deserves something special."
          options={OCCASIONS}
          value={answers.occasion ? [answers.occasion] : []}
          onChange={([v]) => {
            set({ occasion: v });
            nextSoon();
          }}
        />
      )}
      {id === 'interests' && (
        <TileStep
          key="interests"
          title={<>What are they <Hl tone="gold">into?</Hl></>}
          subtitle="Pick up to four things they love."
          options={INTERESTS}
          multi={4}
          value={answers.interests}
          onChange={(v) => set({ interests: v })}
          onNext={next}
        />
      )}
      {id === 'vibes' && (
        <TileStep
          key="vibes"
          title={<>What kind of <Hl>vibe</Hl> suits them?</>}
          subtitle="Choose up to 3 vibes."
          options={VIBES}
          multi={3}
          value={answers.vibes}
          onChange={(v) => set({ vibes: v })}
          onNext={next}
        />
      )}
      {id === 'budget' && (
        <BudgetStep
          value={answers.budget}
          onChange={(v) => {
            set({ budget: v });
            nextSoon();
          }}
        />
      )}
      {id === 'hearts' && (
        <HeartsStep
          value={answers.hearts}
          onChange={(v) => {
            set({ hearts: v });
            nextSoon();
          }}
        />
      )}
      {id === 'details' && (
        <DetailsStep
          value={answers.details}
          photo={photo}
          onPhoto={setPhoto}
          onChange={(d) => set({ details: d })}
          onNext={() => {
            const d = answers.details;
            const detailsCount = [d.name, d.birthday, d.hasPhoto, d.handle, d.message, d.notes].filter(Boolean).length;
            track('step', { step: 'details' });
            track('result', {
              who: answers.who,
              occasion: answers.occasion,
              interests: answers.interests,
              vibes: answers.vibes,
              budget: answers.budget,
              hearts: answers.hearts,
              detailsCount,
            });
            setState((s) => ({ ...s, step: FLOW.indexOf('matching') }));
          }}
        />
      )}
      {id === 'result' && box && complete && (
        <Result
          box={box}
          answers={complete}
          photo={photo}
          onShuffle={() => {
            track('shuffle');
            setState((s) => ({ ...s, seed: s.seed + 1 }));
          }}
          onNext={next}
        />
      )}
      {id === 'intent' && box && complete && <Intent box={box} answers={complete} onNext={next} />}
      {id === 'share' && box && complete && <ShareStep box={box} answers={complete} onRestart={restart} />}
      </PageTransition>
    </Shell>
  );
  }
}

function isComplete(a: Answers): a is CompleteAnswers {
  return !!(a.who && a.occasion && a.interests.length && a.vibes.length && a.budget && a.hearts);
}

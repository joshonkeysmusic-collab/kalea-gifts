import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { GiftArt } from '../components/GiftArt';
import { Icon } from '../components/Icon';
import { AdminLogin } from '../components/AdminLogin';
import { Burst, haptic } from '../components/Motion';
import { isAdminSession } from '../lib/adminSession';

const CHIPS = [
  { icon: 'coffee', cls: 'c1' },
  { icon: 'flower', cls: 'c2' },
  { icon: 'gem', cls: 'c3' },
  { icon: 'leaf', cls: 'c4' },
];

export function Welcome({ onStart, invitedBy }: { onStart: () => void; invitedBy: string | null }) {
  const [opening, setOpening] = useState(false);
  const [login, setLogin] = useState(false);
  const goAdmin = () => {
    window.location.hash = '#/admin';
  };
  const start = () => {
    if (opening) return;
    haptic();
    setOpening(true);
    setTimeout(onStart, 650);
  };
  return (
    <div className={`welcome ${opening ? 'opening' : ''}`}>
      <div className="welcome-spot" aria-hidden />
      <div className="welcome-rays rays" aria-hidden />
      <div className="welcome-inner">
        <div className="welcome-top w-in" style={{ ['--d' as string]: 0 }}>
          <button type="button" className="wordmark" aria-label="Kalea Gifts" onClick={() => (isAdminSession() ? goAdmin() : setLogin(true))}>
            <span className="wm-word" aria-hidden>
              <svg className="wm-bow" viewBox="0 0 70 44" aria-hidden>
                <path d="M35 26C26 10 6 4 6 16c0 10 16 12 29 10z" fill="#FFC94A" />
                <path d="M35 26C44 10 64 4 64 16c0 10-16 12-29 10z" fill="#F2B12A" />
                <path d="M35 26c-4 6-10 14-16 17M35 26c4 6 10 14 16 17" stroke="#E8A21E" strokeWidth="5" strokeLinecap="round" fill="none" />
                <circle cx="35" cy="25" r="6.5" fill="#FFE08F" />
              </svg>
              kalea
            </span>
            <span className="wm-tag" aria-hidden><i />GIFTS</span>
          </button>
          <span className="micro">7 QUESTIONS</span>
        </div>

        <div className="welcome-stage">
          <div className="welcome-art">
            <GiftArt open={opening} />
            <Burst fire={opening} count={22} />
          </div>
          {CHIPS.map((c, i) => (
            <span key={c.icon} className={`float-chip ${c.cls}`} style={{ ['--k' as string]: i }} aria-hidden>
              <Icon name={c.icon} size={c.cls === 'c4' ? 22 : 28} stroke={2} />
            </span>
          ))}
          <span className="sticker gold welcome-sticker" aria-hidden>60 SEC</span>
        </div>

        {invitedBy && <div className="invite-pill w-in" style={{ ['--d' as string]: 1 }}>💌 {invitedBy} challenged you</div>}
        <h1 className="brand w-in" style={{ ['--d' as string]: 2 }}>
          Predict the gift they'll <span className="hl coral">love</span>
        </h1>
        <p className="lede w-in" style={{ ['--d' as string]: 3 }}>
          Seven taps. One curated gift box within your budget. Then <strong>they</strong> tell you if you nailed it.
        </p>
        <button className="btn btn-dark pulse w-in" style={{ ['--d' as string]: 4 }} onClick={start}>
          Start Gift Match <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </div>
      {login && (
        <AdminLogin
          onCancel={() => setLogin(false)}
          onSuccess={() => {
            setLogin(false);
            goAdmin();
          }}
        />
      )}
    </div>
  );
}

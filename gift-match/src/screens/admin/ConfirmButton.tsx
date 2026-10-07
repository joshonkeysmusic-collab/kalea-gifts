import { useEffect, useState } from 'react';

/** Two taps to confirm, so nothing is deleted by accident (browser confirm dialogs are blocked in some views). */
export function ConfirmButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={`btn btn-outline danger ${armed ? 'armed' : ''}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? 'Tap again to confirm' : label}
    </button>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';

declare global { interface Window { echoesDesktop?: boolean } }
export default function DownloadModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Initial visibility depends on browser-only storage and the Electron preload.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { if (!window.echoesDesktop && !localStorage.getItem('echoes.continueWeb')) setOpen(true); } catch { if (!window.echoesDesktop) setOpen(true); }
  }, []);
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { try { localStorage.setItem('echoes.continueWeb', '1'); } catch {} setOpen(false); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);
  function dismiss() { try { localStorage.setItem('echoes.continueWeb', '1'); } catch {} setOpen(false); }
  if (!open) return null;
  return <div className="modal-backdrop"><div className="modal glass" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button className="close" onClick={dismiss} aria-label="Close"><X size={18}/></button>
    <div className="modal-orb">✳</div><div className="eyebrow">A LITTLE CLOSER TO THE MUSIC</div>
    <h2 id="modal-title">Meet Echoes,<br/><span>on your desktop.</span></h2>
    <p>Et eget sted for musikken din. Oppdag Echoes-appen, eller fortsett her i nettleseren.</p>
    <Link className="button primary" href="/download/">Last ned Echoes-appen <ArrowRight size={17}/></Link>
    <button className="button secondary" onClick={dismiss}>Fortsett i nettleseren</button>
  </div></div>;
}

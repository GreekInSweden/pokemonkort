"use client";

import { useEffect, useState } from "react";

export default function EmailVerifyBanner() {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/member/verify-email")
      .then((r) => r.json())
      .then((j) => setVerified(!!j.verified))
      .catch(() => setVerified(null));
  }, []);

  if (verified !== false) return null;

  async function send() {
    setErr(null);
    const r = await fetch("/api/member/verify-email", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setSent(true);
    else setErr(j.error ?? "Något gick fel.");
  }

  return (
    <div className="border border-amber-400/50 bg-amber-400/5 rounded-md p-4 mb-8 text-sm">
      <p className="text-amber-400/90 mb-2">
        Din e-postadress är inte bekräftad. Det krävs för att köpa vissa varor.
      </p>
      {sent ? (
        <p className="text-paper">Mejl skickat! Klicka på länken i det (kolla skräpposten).</p>
      ) : (
        <button onClick={send} className="focus-ring rounded-sm border border-gold text-gold px-3 py-1.5 text-xs">
          Skicka bekräftelsemejl
        </button>
      )}
      {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
    </div>
  );
}

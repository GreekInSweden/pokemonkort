"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-mute">Laddar…</div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMsg("Länken saknas.");
      return;
    }
    fetch("/api/member/verify-email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (r.ok) setState("ok");
        else {
          setState("error");
          setMsg(j.error ?? "Något gick fel.");
        }
      })
      .catch(() => {
        setState("error");
        setMsg("Kunde inte nå servern.");
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {state === "loading" && <p className="text-mute">Bekräftar…</p>}
      {state === "ok" && (
        <>
          <h1 className="font-display text-2xl font-bold text-paper mb-3">E-postadressen är bekräftad ✓</h1>
          <Link href="/konto" className="text-gold hover:underline">Till Mitt konto</Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="font-display text-2xl font-bold text-paper mb-3">Det gick inte</h1>
          <p className="text-mute mb-6">{msg}</p>
          <Link href="/konto" className="text-gold hover:underline">Till Mitt konto</Link>
        </>
      )}
    </div>
  );
}

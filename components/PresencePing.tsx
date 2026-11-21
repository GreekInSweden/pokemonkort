"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Skickar en anonym puls till /api/presence när sidan visas och sedan en
// gång i minuten medan fliken är synlig. Syns bara i admin-statistiken.
export default function PresencePing() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const id = setInterval(ping, 60_000);
    const onVisible = () => ping();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}

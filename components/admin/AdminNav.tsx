"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/admin/LogoutButton";

interface NavLink {
  href: string;
  label: string;
}
interface NavGroup {
  title: string;
  links: NavLink[];
}

// Adminmenyn: bred rad på stor skärm, hopfälld meny med rubriker på mobil
// och surfplatta (annars rymdes de 11 länkarna inte).
export default function AdminNav({ lagerEnabled }: { lagerEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Stäng menyn när man navigerat.
  useEffect(() => setOpen(false), [pathname]);

  // Lås bakgrundens scroll medan menyn är öppen.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups: NavGroup[] = [
    {
      title: "Försäljning",
      links: [
        ...(lagerEnabled ? [{ href: "/admin", label: "Lager" }] : []),
        { href: "/admin/produkter", label: "Produkter" },
        { href: "/admin/bestallningar", label: "Beställningar" },
        { href: "/admin/paket", label: "Paket" },
        { href: "/admin/auktioner", label: "Auktioner" },
        { href: "/admin/giveaway", label: "Giveaway" },
      ],
    },
    {
      title: "Samling",
      links: [
        { href: "/admin/masterset", label: "Master Set" },
        { href: "/admin/kortsok", label: "Kortsök" },
      ],
    },
    {
      title: "Medlemmar",
      links: [
        { href: "/admin/medlemmar", label: "Medlemmar" },
        { href: "/admin/medlemskap", label: "Medlemskap" },
        { href: "/admin/anmalningar", label: "Anmälningar" },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.links);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
  const current = all.find((l) => isActive(l.href));

  return (
    <>
      {/* Stor skärm: allt i en rad */}
      <nav className="hidden lg:flex items-center gap-4">
        {all.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`focus-ring text-sm hover:text-gold ${
              isActive(l.href) ? "text-gold" : "text-paper"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <LogoutButton />
      </nav>

      {/* Mobil/surfplatta: nuvarande sida + hamburgare */}
      <div className="lg:hidden flex items-center gap-3 min-w-0">
        {current && (
          <span className="text-sm text-gold truncate max-w-[9rem]">{current.label}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Stäng menyn" : "Öppna menyn"}
          className="focus-ring flex items-center justify-center w-11 h-11 shrink-0 rounded-md border border-line text-paper hover:border-gold"
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l12 12M15 3L3 15" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 4h14M2 9h14M2 14h14" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-ink border-t border-line overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-4 pb-24">
            {groups.map((g) => (
              <div key={g.title} className="mb-5">
                <div className="font-mono text-[11px] uppercase tracking-widest text-mute mb-1">
                  {g.title}
                </div>
                {g.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`focus-ring flex items-center py-3 border-b border-line text-base ${
                      isActive(l.href) ? "text-gold" : "text-paper"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between">
              <Link href="/" className="focus-ring text-sm text-mute hover:text-paper">
                ← Till sidan
              </Link>
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

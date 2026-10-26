"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { Member } from "@/lib/types";
import { memberLabel } from "@/lib/memberLabel";
import { LAGER_ENABLED } from "@/lib/siteConfig";

export default function SiteHeader() {
  const { itemCount, subtotalSek } = useCart();
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [matchCount, setMatchCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [shopEnabled, setShopEnabled] = useState(false);
  const [giveawayActive, setGiveawayActive] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // SiteHeader lives in the root layout and never unmounts across
  // client-side navigations (router.push after login/register/logout
  // doesn't remount it) — so an effect with an empty dependency array
  // would only ever check login state once, on the very first page
  // load, and then show that stale state forever even after logging
  // in. Re-checking on every pathname change catches the redirect that
  // follows login/register/logout.
  useEffect(() => {
    fetch("/api/member/me")
      .then((res) => res.json())
      .then((data) => setMember(data.member ?? null))
      .catch(() => setMember(null));
  }, [pathname]);

  // Antal önskekort som just nu har minst en träff — visas som "(3)"
  // bredvid Mina matchningar. Samma pathname-beroende som ovan: håller
  // sig uppdaterad t.ex. efter att man kryssat i fler "vill ha"-kort på
  // portföljen och navigerat vidare därifrån.
  useEffect(() => {
    if (!member) {
      setMatchCount(0);
      return;
    }
    fetch("/api/member/matchningar")
      .then((res) => res.json())
      .then((data) => setMatchCount(Array.isArray(data.matches) ? data.matches.length : 0))
      .catch(() => setMatchCount(0));
  }, [member, pathname]);

  // Samma idé för olästa meddelanden -- egen, skrivskyddad route (se
  // unread-count/route.ts) så att det här badge-pollandet inte råkar
  // markera meddelanden som lästa innan medlemmen faktiskt öppnat sidan.
  useEffect(() => {
    if (!member) {
      setUnreadCount(0);
      return;
    }
    fetch("/api/member/messages/unread-count")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => setUnreadCount(0));
  }, [member, pathname]);

  // Antal registrerade medlemmar -- visas där kassasumman satt förut.
  useEffect(() => {
    fetch("/api/member-count")
      .then((res) => res.json())
      .then((data) => setMemberCount(typeof data.count === "number" ? data.count : null))
      .catch(() => setMemberCount(null));
  }, [pathname]);

  // Butik-länken visas bara när butiken är påslagen i admin.
  useEffect(() => {
    fetch("/api/shop-enabled")
      .then((res) => res.json())
      .then((data) => setShopEnabled(!!data.enabled))
      .catch(() => setShopEnabled(false));
  }, [pathname]);

  // Giveaway-länken visas bara när det finns en aktuell giveaway.
  useEffect(() => {
    fetch("/api/giveaway?nav=1")
      .then((res) => res.json())
      .then((data) => setGiveawayActive(!!data.active))
      .catch(() => setGiveawayActive(false));
  }, [pathname]);

  // Mobilmenyn stängs när man navigerat till en ny sida.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/member/logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
      setMember(null);
      router.push("/");
      router.refresh();
    }
  }

  // Admin har en egen meny (components/admin/AdminNav.tsx) -- två staplade
  // menyrader tog halva skärmen på mobil.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="border-b border-line sticky top-0 z-30 bg-ink/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-paper shrink-0">
          Kortmarknad
        </Link>

        {/* Vänster grupp: sånt man jobbar med som medlem — döljs tills du
            är inloggad, eftersom Min portfölj/Mina matchningar annars
            bara studsar vidare till inloggningen. Mest eftertraktade är
            publik och visas alltid. */}
        <nav className="hidden lg:flex items-center gap-4 flex-1 min-w-0">
          {member && (
            <Link href="/konto/portfolj" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              <span className="xl:hidden">Portfölj</span>
              <span className="hidden xl:inline">Min portfölj</span>
            </Link>
          )}
          {member && (
            <Link href="/konto/matchningar" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              <span className="xl:hidden">Matchningar</span>
              <span className="hidden xl:inline">Mina matchningar</span>
              {matchCount > 0 && (
                <span className="text-gold font-mono"> ({matchCount})</span>
              )}
            </Link>
          )}
          {member && (
            <Link href="/konto/meddelanden" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              Meddelanden
              {unreadCount > 0 && (
                <span className="text-gold font-mono"> ({unreadCount})</span>
              )}
            </Link>
          )}
          <Link href="/auktioner" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
            Auktioner
          </Link>
          {giveawayActive && (
            <Link href="/giveaway" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              Giveaway
            </Link>
          )}
          {shopEnabled && (
            <Link href="/butik" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              Butik
            </Link>
          )}
          {LAGER_ENABLED && (
            <Link href="/lager" className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap">
              Vårt lager
            </Link>
          )}
          <ExploreMenu member={!!member} />
        </nav>

        {/* Höger grupp: auktioner/butik + konto. */}
        <nav className="hidden lg:flex items-center gap-4 shrink-0">
          {member === undefined ? null : member ? (
            <>
              <Link
                href="/konto"
                className="focus-ring text-sm text-paper hover:text-gold lg:whitespace-nowrap max-w-[9rem] truncate"
              >
                {memberLabel(member.memberNumber, member.username)}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="focus-ring text-sm text-mute hover:text-paper disabled:opacity-50 lg:whitespace-nowrap"
              >
                {loggingOut ? "Loggar ut…" : "Logga ut"}
              </button>
            </>
          ) : (
            <Link
              href="/konto/logga-in"
              className="focus-ring text-sm text-paper hover:text-gold lg:whitespace-nowrap"
            >
              Logga in
            </Link>
          )}
          {itemCount > 0 && (
            <Link
              href="/kassa"
              className="focus-ring flex items-center gap-3 rounded-md border border-line px-4 py-2 hover:border-gold transition-colors"
            >
              <span className="font-mono text-sm text-mute">{itemCount} st</span>
              <span className="font-mono text-sm font-medium text-gold">
                {subtotalSek} kr
              </span>
            </Link>
          )}
          {memberCount !== null && (
            <div
              className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 lg:whitespace-nowrap"
              title="Antal registrerade medlemmar"
            >
              <span className="font-mono text-sm font-medium text-gold">{memberCount}</span>
              <span className="font-mono text-sm text-mute">
                <span className="xl:hidden">medl.</span>
                <span className="hidden xl:inline">
                  {memberCount === 1 ? "medlem" : "medlemmar"}
                </span>
              </span>
            </div>
          )}
        </nav>

        {/* Mobil: kassa + medlemsräknare + menyknapp. Resten av länkarna
            ligger i panelen som öppnas under. */}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          {itemCount > 0 && (
            <Link
              href="/kassa"
              className="focus-ring flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5"
            >
              <span className="font-mono text-xs text-mute">{itemCount} st</span>
              <span className="font-mono text-xs font-medium text-gold">{subtotalSek} kr</span>
            </Link>
          )}
          {memberCount !== null && (
            <div
              className="flex items-center gap-1 rounded-md border border-line px-2 py-1.5"
              title="Antal registrerade medlemmar"
            >
              <span className="font-mono text-xs font-medium text-gold">{memberCount}</span>
              <span className="font-mono text-xs text-mute">medl.</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Stäng menyn" : "Öppna menyn"}
            className="focus-ring relative flex items-center justify-center w-10 h-10 rounded-md border border-line text-paper hover:border-gold"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l12 12M15 3L3 15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 4h14M2 9h14M2 14h14" />
              </svg>
            )}
            {!menuOpen && matchCount + unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-ink text-[10px] font-bold flex items-center justify-center">
                {matchCount + unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-line bg-ink max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            {[
              { href: "/sa-funkar-det", label: "Så funkar det", show: true },
              { href: "/hitta-kort", label: "Hitta kort", show: true },
              { href: "/konto/portfolj", label: "Min portfölj", show: !!member },
              { href: "/master-sets", label: "Master Sets", show: true },
              { href: "/konto/pokedex", label: "Pokédex", show: !!member },
              { href: "/mest-eftertraktade", label: "Mest eftertraktade", show: true },
              {
                href: "/konto/matchningar",
                label: "Mina matchningar",
                show: !!member,
                badge: matchCount,
              },
              {
                href: "/konto/meddelanden",
                label: "Meddelanden",
                show: !!member,
                badge: unreadCount,
              },
              { href: "/auktioner", label: "Auktioner", show: true },
              { href: "/giveaway", label: "Giveaway", show: giveawayActive },
              { href: "/butik", label: "Butik", show: shopEnabled },
              { href: "/lager", label: "Vårt lager", show: LAGER_ENABLED },
            ]
              .filter((l) => l.show)
              .map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="focus-ring flex items-center justify-between py-3 border-b border-line text-paper hover:text-gold"
                >
                  <span>{l.label}</span>
                  {!!l.badge && l.badge > 0 && (
                    <span className="font-mono text-sm text-gold">({l.badge})</span>
                  )}
                </Link>
              ))}
            {member === undefined ? null : member ? (
              <>
                <Link
                  href="/konto"
                  className="focus-ring py-3 border-b border-line text-paper hover:text-gold"
                >
                  Mitt konto ({memberLabel(member.memberNumber, member.username)})
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="focus-ring text-left py-3 text-mute hover:text-paper disabled:opacity-50"
                >
                  {loggingOut ? "Loggar ut…" : "Logga ut"}
                </button>
              </>
            ) : (
              <Link
                href="/konto/logga-in"
                className="focus-ring py-3 text-paper hover:text-gold"
              >
                Logga in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

// "Utforska"-rullgardinen: de mindre ofta använda sidorna, så att
// huvudraden inte blir för lång på dator.
function ExploreMenu({ member }: { member: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: "/hitta-kort", label: "Hitta kort", show: true },
    { href: "/konto/pokedex", label: "Pokédex", show: member },
    { href: "/master-sets", label: "Master Sets", show: true },
    { href: "/mest-eftertraktade", label: "Mest eftertraktade", show: true },
    { href: "/sa-funkar-det", label: "Så funkar det", show: true },
  ].filter((i) => i.show);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring text-sm text-paper hover:text-gold whitespace-nowrap flex items-center gap-1"
      >
        Utforska
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={open ? "rotate-180" : ""}>
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full mt-2 w-56 rounded-md border border-line bg-ink shadow-lg py-1 z-40">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              role="menuitem"
              className="focus-ring block px-4 py-2 text-sm text-paper hover:text-gold hover:bg-gold/5"
            >
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

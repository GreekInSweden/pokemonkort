import FindCards from "@/components/FindCards";

export const metadata = {
  title: "Hitta kort – Kortmarknad",
  description: "Sök fram ett Pokémonkort på namn eller på numret som står på kortet, även om du inte vet vilket set det tillhör.",
};

export default function HittaKortPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-paper mb-1">Hitta kort</h1>
      <p className="text-mute mb-8 max-w-prose text-sm">
        Hittat gamla kort på vinden och vet inte vilket set de tillhör? Sök på
        namnet eller på numret som är tryckt på kortet.
      </p>
      <FindCards />
    </div>
  );
}

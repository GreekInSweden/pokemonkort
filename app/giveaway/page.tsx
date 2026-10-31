import GiveawayView from "@/components/GiveawayView";
import GiveawayRules from "@/components/GiveawayRules";

export const dynamic = "force-dynamic";

export default function GiveawayPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <GiveawayView />
      <GiveawayRules />
    </div>
  );
}

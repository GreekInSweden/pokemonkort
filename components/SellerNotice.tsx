import { SELLER_NOTICE } from "@/lib/seller";

export default function SellerNotice({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-mute ${className}`}>{SELLER_NOTICE}</p>;
}

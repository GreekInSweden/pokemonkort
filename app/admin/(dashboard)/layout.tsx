import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { LAGER_ENABLED } from "@/lib/siteConfig";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-line sticky top-0 z-40 bg-ink">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={LAGER_ENABLED ? "/admin" : "/admin/masterset"}
            className="font-display font-semibold text-paper truncate mr-3"
          >
            Kortmarknad — Admin
          </Link>
          <AdminNav lagerEnabled={LAGER_ENABLED} />
        </div>
      </div>
      {children}
    </div>
  );
}

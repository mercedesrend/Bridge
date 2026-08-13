import { Suspense } from "react";
import { RecapClient } from "@/components/recap-client";

export default function RecapPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[color:var(--muted)]">Loading recap...</div>}>
      <RecapClient />
    </Suspense>
  );
}

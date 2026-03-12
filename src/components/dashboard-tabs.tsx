"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type TabId = "overview" | "running" | "cycling" | "swimming" | "sleep";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "running", label: "🏃 Running" },
  { id: "cycling", label: "🚴 Cycling" },
  { id: "swimming", label: "🏊 Swimming" },
  { id: "sleep", label: "😴 Sleep" },
];

export function TabNav({ active }: { active: TabId }) {
  const router = useRouter();
  const params = useSearchParams();

  function navigate(id: TabId) {
    const p = new URLSearchParams(params.toString());
    p.set("tab", id);
    router.push(`?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex gap-1 border-b">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => navigate(t.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            active === t.id
              ? "border-foreground text-foreground border-b-2"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

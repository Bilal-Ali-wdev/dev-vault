"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/ui";

type R = { suggestion: { text: string; basedOn: string[] } | null; reason?: string };

export function ResumeSuggestion({ projectId }: { projectId: string }) {
  const [data, setData] = useState<R | null>(null);
  useEffect(() => {
    let live = true;
    api<R>(`/api/projects/${projectId}/resume`).then(
      (r) => live && setData(r),
      () => live && setData({ suggestion: null, reason: "Couldn't load a suggestion." })
    );
    return () => {
      live = false;
    };
  }, [projectId]);

  return (
    <div className="flex flex-col gap-3.5 bg-[#FBFCFC] px-5 py-[18px]">
      <span className="eyebrow bg-warn-50 text-warn">AI suggestion</span>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Recommended next step</span>
        {!data ? (
          <div className="flex flex-col gap-2 py-1" aria-label="Loading suggestion">
            <span className="h-3 w-[90%] animate-pulse rounded bg-line-soft" />
            <span className="h-3 w-[70%] animate-pulse rounded bg-line-soft" />
          </div>
        ) : data.suggestion ? (
          <span className="leading-normal font-medium">{data.suggestion.text}</span>
        ) : (
          <span className="text-[13px] text-muted">{data.reason}</span>
        )}
      </div>
      {data?.suggestion?.basedOn.length ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Based on</span>
          <div className="flex flex-wrap gap-1.5">
            {data.suggestion.basedOn.map((b) => (
              <Link key={b} href={`/projects/${projectId}/assistant`} className="rounded-full border border-line bg-white px-[9px] py-[3px] text-xs text-ink-2">
                {b}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

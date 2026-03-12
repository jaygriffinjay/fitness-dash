"use client";

import { useRef } from "react";
import { addNap } from "@/app/actions/naps";

interface Props {
  defaultDate: string;
}

export function AddNapForm({ defaultDate }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await addNap(fd);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 text-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-zinc-500">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={defaultDate}
          required
          className="rounded bg-zinc-800 px-2 py-1 text-zinc-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-zinc-500">Start (CT)</label>
        <input
          type="time"
          name="startTime"
          required
          className="rounded bg-zinc-800 px-2 py-1 text-zinc-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-zinc-500">End (CT)</label>
        <input
          type="time"
          name="endTime"
          required
          className="rounded bg-zinc-800 px-2 py-1 text-zinc-100"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-amber-500 px-3 py-1 font-medium text-zinc-950 hover:bg-amber-400"
      >
        Add Nap
      </button>
    </form>
  );
}

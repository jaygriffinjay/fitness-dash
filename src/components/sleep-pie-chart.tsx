"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { name: string; minutes: number }[];
}

const COLORS: Record<string, string> = {
  Deep: "#6366f1",
  Light: "#38bdf8",
  REM: "#a78bfa",
  Awake: "#f87171",
  Unmeasurable: "#71717a",
};

export function SleepPieChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div style={{ width: "100%", maxWidth: 500, height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="minutes"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? "#71717a"} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value} min`} />
          <Legend
            content={({ payload }) => (
              <div className="mt-2 flex justify-center gap-6">
                {payload?.map((entry) => {
                  const d = data.find((d) => d.name === entry.value);
                  const pct = d ? ((d.minutes / total) * 100).toFixed(0) : "0";
                  return (
                    <div
                      key={entry.value}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <span className="text-sm font-medium">{pct}%</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: entry.color,
                            borderRadius: 2,
                          }}
                        />
                        <span className="text-sm text-zinc-400">
                          {entry.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

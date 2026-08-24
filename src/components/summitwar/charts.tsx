"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RankPoint, SiteStats } from "@/lib/types";

const tooltipStyle = {
  background: "#0d1a25",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10,
  fontSize: 12,
};

export function MetricsChart({
  data,
  metric = "revenueCents",
}: {
  data: SiteStats["daily"];
  metric?: "revenueCents" | "climbs" | "clicks";
}) {
  return (
    <div className="h-64 w-full" aria-label={`${metric} by day chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 10 }}>
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity={0.42} />
              <stop offset="1" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => String(value).slice(5)}
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#dfe8e9" }}
            formatter={(value) =>
              metric === "revenueCents"
                ? [`$${Number(value ?? 0) / 100}`, "Revenue"]
                : [
                    Number(value ?? 0),
                    metric === "climbs" ? "Climbs" : "Clicks",
                  ]
            }
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke="var(--primary)"
            strokeWidth={2}
            fill={`url(#fill-${metric})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RankHistoryChart({ data }: { data: RankPoint[] }) {
  return (
    <div className="h-64 w-full" aria-label="Rank history chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18, right: 8, top: 10 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
          <XAxis
            dataKey="at"
            tickFormatter={(value) =>
              new Date(String(value)).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            reversed
            allowDecimals={false}
            domain={[1, "dataMax"]}
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(value) => new Date(String(value)).toLocaleString()}
            formatter={(value) => [`#${Number(value ?? 0)}`, "Rank"]}
          />
          <Line
            type="stepAfter"
            dataKey="rank"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OwnerActivityChart({
  data,
}: {
  data: Array<{ date: string; views: number; clicks: number }>;
}) {
  return (
    <div
      className="h-64 w-full"
      aria-label="Daily profile views and outbound clicks chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18, right: 8, top: 10 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => String(value).slice(5)}
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#81939e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="views"
            name="Views"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

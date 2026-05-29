import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Clock,
  Smile,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../api/client";
import StatCard from "../components/ui/StatCard";
import { CardSkeleton } from "../components/ui/Skeleton";
import type { DashboardStats } from "../types";
import { formatDate, formatDuration, statusBadge } from "../utils/format";

const PIE_COLORS = ["#3389ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.calls_by_status).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const sentimentData = Object.entries(stats.sentiment_distribution).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Real-time overview of your call intelligence pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Calls"
          value={stats.total_calls}
          icon={Phone}
          color="brand"
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(stats.average_duration_seconds)}
          icon={Clock}
          color="violet"
        />
        <StatCard
          title="Avg Sentiment"
          value={stats.average_sentiment_score.toFixed(2)}
          subtitle="-1 to +1 scale"
          icon={Smile}
          color="emerald"
        />
        <StatCard
          title="Action Items"
          value={stats.total_action_items}
          subtitle={`${stats.completed_action_items} completed`}
          icon={ListChecks}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="font-semibold mb-4">Calls by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3389ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card">
          <h2 className="font-semibold mb-4">Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {sentimentData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Calls</h2>
          <Link to="/calls" className="text-sm text-brand-600 flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_calls.map((call) => (
                <tr
                  key={call.id}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td className="py-3">
                    <Link
                      to={`/calls/${call.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {call.title}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(call.status)}`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="py-3 text-slate-500">
                    {formatDate(call.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

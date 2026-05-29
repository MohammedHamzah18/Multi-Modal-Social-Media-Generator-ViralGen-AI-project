import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import api from "../api/client";
import { TableSkeleton } from "../components/ui/Skeleton";
import type { Call } from "../types";
import { formatDate, formatDuration, statusBadge } from "../utils/format";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<Call[]>("/calls")
      .then(({ data }) => setCalls(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Call History</h1>
          <p className="text-slate-500 mt-1">Manage and review processed calls</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link to="/upload" className="btn-primary">
            <Plus className="h-4 w-4" />
            Upload
          </Link>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Format</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No calls yet.{" "}
                    <Link to="/upload" className="text-brand-600 hover:underline">
                      Upload your first call
                    </Link>
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-4">
                      <Link
                        to={`/calls/${call.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {call.title}
                      </Link>
                    </td>
                    <td className="py-4 uppercase text-slate-500">
                      {call.file_format}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(call.status)}`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="py-4 text-slate-500">
                      {formatDate(call.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

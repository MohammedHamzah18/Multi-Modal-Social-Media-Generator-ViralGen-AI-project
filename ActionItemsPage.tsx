import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { TableSkeleton } from "../components/ui/Skeleton";
import type { ActionItem } from "../types";
import { formatDate } from "../utils/format";

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params =
      filter === "open"
        ? { completed: false }
        : filter === "done"
          ? { completed: true }
          : {};
    api
      .get<ActionItem[]>("/calls/action-items/all", { params })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Action Items</h1>
        <p className="text-slate-500 mt-1">
          Tasks and commitments extracted from calls
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "open", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "btn-primary"
                : "btn-secondary"
            }
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="glass-card text-center py-12 text-slate-500">
              No action items found
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="glass-card flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={async (e) => {
                    await api.patch(`/calls/action-items/${item.id}`, {
                      is_completed: e.target.checked,
                    });
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id
                          ? { ...i, is_completed: e.target.checked }
                          : i
                      )
                    );
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${item.is_completed ? "line-through text-slate-400" : ""}`}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-500 mt-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <Link
                      to={`/calls/${item.call_id}`}
                      className="text-brand-600 hover:underline"
                    >
                      View call
                    </Link>
                    <span className="capitalize">{item.priority} priority</span>
                    {item.assignee && <span>Assignee: {item.assignee}</span>}
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

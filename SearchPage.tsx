import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../api/client";
import type { SearchResult } from "../types";
import { formatDate } from "../utils/format";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 2) return;
    setLoading(true);
    try {
      const { data } = await api.get<SearchResult[]>("/calls/search", {
        params: { q: query },
      });
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Search Transcripts</h1>
        <p className="text-slate-500 mt-1">
          Full-text search across all processed calls
        </p>
      </div>

      <form onSubmit={handleSearch} className="glass-card flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search keywords, phrases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          Search
        </button>
      </form>

      {searched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No results found</p>
          ) : (
            results.map((r) => (
              <Link
                key={`${r.call_id}-${r.snippet.slice(0, 20)}`}
                to={`/calls/${r.call_id}`}
                className="glass-card block hover:ring-2 hover:ring-brand-500/30 transition"
              >
                <p className="font-medium text-brand-600">{r.call_title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  ...{r.snippet}...
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDate(r.created_at)}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

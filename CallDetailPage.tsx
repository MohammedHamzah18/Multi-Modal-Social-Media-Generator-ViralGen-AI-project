import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import api from "../api/client";
import AudioPlayer from "../components/calls/AudioPlayer";
import TranscriptChat from "../components/calls/TranscriptChat";
import SentimentChart from "../components/calls/SentimentChart";
import { CardSkeleton } from "../components/ui/Skeleton";
import type { CallDetail } from "../types";
import { formatDate, sentimentColor, statusBadge } from "../utils/format";

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [redactedView, setRedactedView] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCall = async () => {
      const { data } = await api.get<CallDetail>(`/calls/${id}`);
      setCall(data);
      return data;
    };

    fetchCall().finally(() => setLoading(false));
    const interval = setInterval(() => {
      if (call?.status === "processing" || call?.status === "pending") {
        void fetchCall();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, call?.status]);

  const downloadPdf = async (type: "transcript" | "summary", redacted = false) => {
    const url =
      type === "transcript"
        ? `/calls/${id}/transcript/pdf?redacted=${redacted}`
        : `/calls/${id}/summary/pdf`;
    const { data } = await api.get(url, { responseType: "blob" });
    const blob = new Blob([data], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_${id}.pdf`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!call) {
    return <p>Call not found</p>;
  }

  const isProcessing =
    call.status === "processing" || call.status === "pending";

  const segments =
    redactedView && call.transcript?.redacted_segments
      ? call.transcript.redacted_segments
      : call.transcript?.segments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link to="/calls" className="btn-secondary !p-2 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{call.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(call.status)}`}
            >
              {call.status}
            </span>
            <span className="text-sm text-slate-500">
              {formatDate(call.created_at)}
            </span>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="glass-card flex items-center gap-3 text-brand-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Processing call — transcription, diarization, and AI analysis in progress...</p>
        </div>
      )}

      <AudioPlayer callId={call.id} />

      {call.sentiment && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Sentiment Analysis</h2>
            <div className="text-right">
              <span
                className={`text-lg font-bold capitalize ${sentimentColor(call.sentiment.overall_label)}`}
              >
                {call.sentiment.overall_label}
              </span>
              <p className="text-sm text-slate-500">
                Score: {call.sentiment.overall_score.toFixed(2)}
              </p>
            </div>
          </div>
          <SentimentChart sentiment={call.sentiment} />
        </div>
      )}

      {call.summary && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Executive Summary
            </h2>
            <button
              type="button"
              onClick={() => downloadPdf("summary")}
              className="btn-secondary text-xs"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {call.summary.executive_summary}
          </p>
          <ul className="mt-4 space-y-2">
            {call.summary.key_points.map((point, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <span className="text-brand-600 font-bold">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {call.transcript && (
        <div className="glass-card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold">Transcript</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRedactedView(!redactedView)}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                {redactedView ? (
                  <ToggleRight className="h-4 w-4 text-brand-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
                {redactedView ? "Redacted" : "Original"}
              </button>
              <button
                type="button"
                onClick={() => downloadPdf("transcript", redactedView)}
                className="btn-secondary text-xs"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
          <TranscriptChat segments={segments} showRedacted={redactedView} />
        </div>
      )}

      {call.action_items.length > 0 && (
        <div className="glass-card">
          <h2 className="font-semibold mb-4">Action Items</h2>
          <div className="space-y-3">
            {call.action_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={async (e) => {
                    await api.patch(`/calls/action-items/${item.id}`, {
                      is_completed: e.target.checked,
                    });
                    setCall((c) =>
                      c
                        ? {
                            ...c,
                            action_items: c.action_items.map((a) =>
                              a.id === item.id
                                ? { ...a, is_completed: e.target.checked }
                                : a
                            ),
                          }
                        : c
                    );
                  }}
                  className="mt-1 rounded border-slate-300"
                />
                <div>
                  <p
                    className={`font-medium ${item.is_completed ? "line-through text-slate-400" : ""}`}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-500">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 capitalize">
                      {item.priority}
                    </span>
                    {item.assignee && (
                      <span className="text-xs text-slate-500">
                        → {item.assignee}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { CloudUpload, FileAudio, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      if (!title) {
        setTitle(accepted[0].name.replace(/\.[^.]+$/, ""));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/flac": [".flac"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please provide a title and audio file");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("title", title);
    form.append("file", file);

    try {
      const { data } = await api.post("/calls", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success("Upload complete — processing started");
      navigate(`/calls/${data.id}`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Upload Call</h1>
        <p className="text-slate-500 mt-1">
          MP3, WAV, or FLAC — drag and drop or browse
        </p>
      </div>

      <div className="glass-card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Call title</label>
          <input
            className="input-field"
            placeholder="e.g. Billing support — John Doe"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragActive
              ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
              : "border-slate-300 dark:border-slate-600 hover:border-brand-400"
          }`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="h-12 w-12 mx-auto text-brand-500 mb-4" />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileAudio className="h-5 w-5 text-brand-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-slate-500 text-sm">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <>
              <p className="font-medium">Drop audio file here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse</p>
            </>
          )}
        </div>

        {uploading && (
          <div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Uploading {progress}%
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="btn-primary w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload & Process"
          )}
        </button>
      </div>
    </div>
  );
}

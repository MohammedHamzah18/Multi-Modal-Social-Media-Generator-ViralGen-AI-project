import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-brand-600/30">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            VoiceOps Sentinel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-Time Call Intelligence
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Register first
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">
          Backend must be running at{" "}
          {import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const saveProfile = async () => {
    await api.patch("/users/me", { full_name: fullName });
    await refreshUser();
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    try {
      await api.post("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Could not change password");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and account</p>
      </div>

      <div className="glass-card space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input className="input-field opacity-60" value={user?.email || ""} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Full name</label>
          <input
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <input
            className="input-field opacity-60 capitalize"
            value={user?.role || ""}
            disabled
          />
        </div>
        <button type="button" onClick={saveProfile} className="btn-primary">
          Save profile
        </button>
      </div>

      <div className="glass-card space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <input
          type="password"
          className="input-field"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          className="input-field"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="button" onClick={changePassword} className="btn-secondary">
          Update password
        </button>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="btn-secondary w-full text-rose-600 border-rose-200 hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}

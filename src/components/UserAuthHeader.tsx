import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { loginWithGoogle, logoutUser, auth, isFirebaseConfigured } from '../lib/firebase';
import { LogIn, LogOut, Cloud, CloudOff, ShieldCheck, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface UserAuthHeaderProps {
  user: FirebaseUser | null;
  isSyncing: boolean;
  onAuthError: (error: string) => void;
}

export default function UserAuthHeader({ user, isSyncing, onAuthError }: UserAuthHeaderProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!auth && isFirebaseConfigured) {
      onAuthError("Firebase Auth has not been fully configured yet. Please check your credentials in the settings or .env file.");
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      onAuthError(err.message || "Failed to sign in. Please verify Firebase Config credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we have real/configured Firebase credentials or the mock fallback
  const isUsingMockCredentials = !isFirebaseConfigured;

  return (
    <div id="auth-header-root" className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            Cloud Synchronizer
            {isUsingMockCredentials ? (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                Demo Mode
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                Live Cloud Sync
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {user 
              ? `Logged in as ${user.displayName || user.email}` 
              : "Sign in to securely back up your historic travels in the cloud."
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Sync Status Badge */}
        {user && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-100">
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-gray-500">Syncing with Cloud...</span>
              </>
            ) : isUsingMockCredentials ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Local Only (Demo)</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="text-emerald-600">Saved securely</span>
              </>
            )}
          </div>
        )}

        {/* Auth Actions */}
        {user ? (
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img 
                id="user-profile-avatar"
                src={user.photoURL} 
                alt="Profile Avatar" 
                className="w-8 h-8 rounded-full border-2 border-indigo-500 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || <User className="w-4 h-4" />}
              </div>
            )}
            
            <button
              id="auth-signout-btn"
              onClick={handleLogout}
              disabled={loading}
              className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            id="auth-signin-btn"
            onClick={handleLogin}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            Sign In with Google
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Home from "./landing";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Dashboard from "./dashboard";
import { Loader2, AlertTriangle } from "lucide-react";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if auth is valid (not the placeholder {} from build step)
    if (!auth || !auth.onAuthStateChanged) {
      setHasError(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth error:", error);
      setHasError(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  // DISPLAY THE REQUESTED ERROR UI
  if (hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-sans">
        <div className="max-w-md w-full px-6 text-center space-y-6">
           <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-white" strokeWidth={1} />
           </div>
           <div>
              <h1 className="text-2xl font-semibold tracking-tight">This page couldn't load</h1>
              <p className="mt-4 text-slate-400 font-medium">Reload to try again, or go back.</p>
           </div>
           <div className="flex items-center justify-center gap-3 pt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-white text-black rounded-lg font-bold hover:shadow-lg transition active:scale-95"
              >
                Reload
              </button>
              <button 
                onClick={() => window.history.back()} 
                className="px-6 py-2 bg-transparent border border-slate-700 text-white rounded-lg font-bold hover:bg-slate-900 transition active:scale-95"
              >
                Back
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} />;
  }

  return <Home />;
}

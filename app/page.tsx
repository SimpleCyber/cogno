"use client";

import { useEffect, useState } from "react";
import Home from "./landing";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Dashboard from "./dashboard";
import { Loader2 } from "lucide-react";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  if (user) {
    return <Dashboard user={user} />;
  }

  return <Home />;
}

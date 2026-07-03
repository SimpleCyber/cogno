"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function MobileReportsPage() {
   const [results, setResults] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [user, setUser] = useState<any>(null);

   useEffect(() => {
      const unsub = auth.onAuthStateChanged(async (u: any) => {
         if (u) {
            setUser(u);
            const q = query(
               collection(db, "test_results"),
               where("userId", "==", u.uid),
               orderBy("timestamp", "desc")
            );
            const snap = await getDocs(q);
            setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
         }
         setLoading(false);
      });
      return () => unsub();
   }, []);

   if (loading) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-slate-50 p-6">
         <div className="mb-8 flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assessment Reports</h1>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full Feedback History</p>
            </div>
         </div>

         <div className="space-y-6">
            {results.length === 0 ? (
               <div className="p-12 text-center rounded-3xl bg-white border border-slate-100">
                  <p className="text-sm font-bold text-slate-400">No reports found.</p>
               </div>
            ) : (
               results.map((res) => (
                  <div key={res.id} className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                           {new Date(res.timestamp).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <ShieldCheck className="h-4 w-4 text-[#4F46E5]" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-3">{res.paperName}</h3>
                     <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                           {res.feedback || "No feedback has been recorded for this session yet."}
                        </p>
                     </div>
                  </div>
               ))
            )}
         </div>

         <div className="mt-12 text-center pb-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
               End of Report History
            </p>
         </div>
      </div>
   );
}

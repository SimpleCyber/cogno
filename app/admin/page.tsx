"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, ArrowLeft, Eye, X, User, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "create">("results");
  
  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Create Assessment State
  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [testDuration, setTestDuration] = useState("10 mins");
  const [questions, setQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const q = query(collection(db, "test_results"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResults(fetched);
      } catch (err) {
        console.error("Error fetching results", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setAuthorized(true);
        fetchResults();
      } else {
        setAuthorized(false);
        setLoading(false);
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router, activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC]">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-500 mb-6">You lack the necessary permissions to view this page.</p>
        <Link href="/" className="text-[#4F46E5] hover:underline flex items-center gap-2">
           <ArrowLeft className="h-4 w-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const handleAddQuestion = (type: "mcq" | "text") => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type,
        question: "",
        ...(type === "mcq" ? { options: ["", ""] } : {})
      }
    ]);
  };

  const handleUpdateQuestion = (idx: number, field: string, val: string) => {
    const newQ = [...questions];
    newQ[idx][field] = val;
    setQuestions(newQ);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const newQ = [...questions];
    newQ[qIdx].options[optIdx] = val;
    setQuestions(newQ);
  };

  const handleAddOption = (qIdx: number) => {
    const newQ = [...questions];
    newQ[qIdx].options.push("");
    setQuestions(newQ);
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    const newQ = [...questions];
    newQ[qIdx].options = newQ[qIdx].options.filter((_: any, i: number) => i !== optIdx);
    setQuestions(newQ);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveAssessment = async () => {
    if (!testTitle || questions.length === 0) {
      showToast("Title and at least 1 question required.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "assessments"), {
        title: testTitle,
        description: testDesc,
        duration: testDuration,
        questions: questions,
        createdAt: Date.now()
      });
      showToast("Assessment published successfully!", "success");
      setTestTitle("");
      setTestDesc("");
      setTestDuration("10 mins");
      setQuestions([]);
      setActiveTab("results");
    } catch (err) {
      console.error(err);
      showToast("Failed to save assessment. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
        .font-display {
          font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
         <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                 <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-display text-xl font-bold text-slate-900">Admin Control Panel</h1>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
               <button 
                  onClick={() => setActiveTab("results")}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'results' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Results
               </button>
               <button 
                  onClick={() => setActiveTab("create")}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'create' ? 'bg-[#4F46E5] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Create Test
               </button>
            </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto mt-10 max-w-7xl px-6 lg:px-8">
         {activeTab === "results" && (
           <>
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Assessment Results</h2>
                <p className="text-slate-500 text-sm mt-1">Review all tests submitted by users securely.</p>
             </div>

             <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                         <tr>
                            <th className="px-6 py-4">Participant</th>
                            <th className="px-6 py-4">Paper Name</th>
                            <th className="px-6 py-4">Submittted At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {results.length === 0 ? (
                            <tr>
                               <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                  No assessment results found yet.
                               </td>
                            </tr>
                         ) : (
                            results.map((res) => (
                               <tr key={res.id} className="transition hover:bg-slate-50">
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                        {res.photoURL ? (
                                           <img src={res.photoURL} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200" />
                                        ) : (
                                           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-[#4F46E5] ring-1 ring-indigo-200">
                                              <span className="font-bold">{res.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}</span>
                                           </div>
                                        )}
                                        <div>
                                           <p className="font-medium text-slate-900">{res.name || "Unknown"}</p>
                                           <p className="text-xs text-slate-400 mt-0.5">{res.email}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">
                                        {res.paperName === "demo-test" ? "Mental Wellness Base" : res.paperName}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                                     {new Date(res.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <button 
                                        onClick={() => setSelectedResult(res)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
                                     >
                                        <Eye className="w-4 h-4" /> View
                                     </button>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
           </>
         )}

         {activeTab === "create" && (
           <div className="max-w-3xl mx-auto mb-20">
             <div className="mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-900">Create Custom Assessment</h2>
                <p className="text-slate-600 mt-2">Build a new psychological or educational test dynamically.</p>
             </div>

             <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 block">Assessment Details</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Header (Title)</label>
                       <input 
                          type="text" 
                          placeholder="e.g. Anxiety Screener (GAD-7)" 
                          value={testTitle} onChange={e => setTestTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                       <textarea 
                          placeholder="Brief explanation of this assessment..." 
                          value={testDesc} onChange={e => setTestDesc(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] min-h-[100px]"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expected Duration</label>
                       <input 
                          type="text" 
                          placeholder="e.g. 5 mins" 
                          value={testDuration} onChange={e => setTestDuration(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                       />
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   {questions.map((q, qIdx) => (
                      <div key={q.id} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                         <button 
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                         <h4 className="text-sm font-bold text-[#4F46E5] uppercase tracking-wider mb-4">Question {qIdx + 1} ({q.type === 'mcq' ? 'Multiple Choice' : 'Open Answer'})</h4>
                         
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Question Text</label>
                            <input 
                               type="text" 
                               value={q.question} onChange={e => handleUpdateQuestion(qIdx, "question", e.target.value)}
                               placeholder="Enter the question..." 
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                            />
                         </div>

                         {q.type === "mcq" && (
                            <div className="mt-4 space-y-3">
                               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Options</label>
                               {q.options.map((opt: string, optIdx: number) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-[#4F46E5]">
                                        {optIdx + 1}
                                     </div>
                                     <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                        placeholder={`Option ${optIdx + 1}`}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                                     />
                                     <button 
                                        onClick={() => handleRemoveOption(qIdx, optIdx)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                     >
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               ))}
                               <button 
                                  onClick={() => handleAddOption(qIdx)}
                                  className="text-sm font-semibold text-[#4F46E5] hover:text-[#3730a3] flex items-center gap-1 mt-2"
                               >
                                  <Plus className="w-4 h-4" /> Add Option
                               </button>
                            </div>
                         )}
                      </div>
                   ))}
                </div>

                <div className="flex gap-4 items-center pt-4">
                   <button 
                     onClick={() => handleAddQuestion("mcq")}
                     className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#4F46E5] hover:bg-indigo-50 hover:text-[#4F46E5]"
                   >
                     <Plus className="h-5 w-5" /> Add MCQ Question
                   </button>
                   <button 
                     onClick={() => handleAddQuestion("text")}
                     className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#4F46E5] hover:bg-indigo-50 hover:text-[#4F46E5]"
                   >
                     <Plus className="h-5 w-5" /> Add Open-Ended Question
                   </button>
                </div>

                <div className="pt-8 border-t border-slate-200 flex justify-end">
                  <button 
                    onClick={handleSaveAssessment}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-[#4F46E5] px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-[#4338ca] hover:shadow-xl disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5" />}
                    Publish Assessment
                  </button>
                </div>
             </div>
           </div>
         )}
      </main>

      {/* RESULT MODAL */}
      {selectedResult && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
               
               <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
                  <div>
                     <h3 className="font-display font-bold text-lg text-slate-900">
                        Assessment Review
                     </h3>
                     <p className="text-xs font-medium text-slate-500 mt-1">
                        Completed by {selectedResult.name} • {new Date(selectedResult.timestamp).toLocaleDateString()}
                     </p>
                  </div>
                  <button 
                     onClick={() => setSelectedResult(null)}
                     className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  >
                     <X className="h-5 w-5" />
                  </button>
               </div>

               <div className="overflow-y-auto px-6 py-6 pb-24">
                  <div className="space-y-6">
                     {selectedResult.questionPayload?.map((q: any, idx: number) => {
                        const answer = selectedResult.answers[idx];
                        const answerText = q.type === 'text' ? answer : (q.options ? q.options[answer] : null);
                        return (
                           <div key={idx} className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
                              <p className="font-bold text-slate-900 mb-4 leading-relaxed">
                                 <span className="text-[#8B5CF6]">Q{idx + 1}.</span> {q.question}
                              </p>
                              <div>
                                 <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-widest text-[10px]">
                                    Response Provided
                                 </p>
                                 <div className="inline-flex rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm font-medium text-[#4F46E5] w-full break-words">
                                    {answerText || answer || (q.type === 'mcq' && answer !== undefined && answer !== null ? `Option ${answer + 1}` : "No Answer")}
                                 </div>
                              </div>
                           </div>
                        )
                     })}

                     {(!selectedResult.questionPayload || selectedResult.questionPayload.length === 0) && (
                        <p className="text-slate-500 italic">No structured question payload found for this legacy record.</p>
                     )}
                  </div>
               </div>

               <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white/90 backdrop-blur p-4 px-6 flex justify-end">
                  <button 
                     onClick={() => setSelectedResult(null)}
                     className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-md"
                  >
                     Close Review
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}


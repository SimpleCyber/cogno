"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  Loader2, ShieldAlert, ArrowLeft, Eye, X, User, Plus, Trash2, 
  CheckCircle2, AlertCircle, Pencil, FileText, LayoutDashboard, 
  Settings, Home, Leaf, ChevronRight, BarChart3, Users, Clock, 
  Share2, MoreVertical, Search, Filter, Radio, Check
} from "lucide-react";
import Link from "next/link";
import AdminChat from "@/components/AdminChat";
import { MessageSquare } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "tests" | "chat">("tests");

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Tests State
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const fetchAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const q = query(collection(db, "assessments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching assessments", err);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const q = query(collection(db, "test_results"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      setResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching results", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setAuthorized(true);
        fetchResults();
        fetchAssessments();
        setLoading(false);
      } else {
        setAuthorized(false);
        setLoading(false);
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB]">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-500 mb-6 font-medium">Restricted Administrative Area</p>
        <Link href="/" className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg">
           Return Home
        </Link>
      </div>
    );
  }

  const resetEditor = () => {
    setIsEditing(false);
    setEditingId(null);
    setTestTitle("");
    setTestDesc("");
    setTestDuration("10 mins");
    setQuestions([]);
  };

  const openNewEditor = () => {
    resetEditor();
    setIsEditing(true);
  };

  const openEditEditor = (assessment: any) => {
    setEditingId(assessment.id);
    setTestTitle(assessment.title || "");
    setTestDesc(assessment.description || "");
    setTestDuration(assessment.duration || "10 mins");
    setQuestions(assessment.questions || []);
    setIsEditing(true);
  };

  const handleAddQuestion = (type: "mcq" | "text") => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      type,
      question: "",
      ...(type === "mcq" ? { options: ["", ""] } : {})
    }]);
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
      const payload = {
        title: testTitle,
        description: testDesc,
        duration: testDuration,
        questions: questions,
        ...(editingId ? { updatedAt: Date.now() } : { createdAt: Date.now() })
      };

      if (editingId) {
        await updateDoc(doc(db, "assessments", editingId), payload);
        showToast("Assessment updated successfully!");
      } else {
        await addDoc(collection(db, "assessments"), payload);
        showToast("Assessment published successfully!");
      }

      resetEditor();
      await fetchAssessments();
    } catch (err) {
      console.error(err);
      showToast("Failed to save. Check Firestore rules.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    try {
      await deleteDoc(doc(db, "assessments", id));
      showToast("Assessment removed.");
      await fetchAssessments();
    } catch (err) {
      console.error(err);
      showToast("Delete failed.", "error");
    }
  };

  const handleToggleStatus = async (assessment: any) => {
    const newStatus = assessment.status === "disabled" ? "live" : "disabled";
    
    // Optimistic Update
    setAssessments(prev => prev.map(a => a.id === assessment.id ? { ...a, status: newStatus } : a));
    
    try {
      await updateDoc(doc(db, "assessments", assessment.id), {
        status: newStatus
      });
      showToast(`Assessment ${newStatus === 'live' ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "error");
      // Rollback
      fetchAssessments();
    }
  };

  // Helper metric calculation
  const totalSubmissions = results.length;
  const avgCompletion = assessments.length > 0 ? 98 : 0; // Mock stat for UI
  const passedRate = assessments.length > 0 ? 94 : 0; // Mock stat for UI

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans selection:bg-indigo-100 italic-none">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`flex items-center gap-3 rounded-2xl px-6 py-4 font-bold shadow-2xl text-sm ${toast.type === 'success' ? 'bg-[#7C3AED] text-white' : 'bg-red-500 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {toast.message}
          </div>
        </div>
      )}
      
      {/* SIDEBAR */}
      <aside className="w-[280px] shrink-0 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen">
         <div className="p-8 pb-10 flex items-center gap-3">
            <div className="h-9 w-9 bg-[#A855F7] rounded-[10px] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
               <CheckCircle2 className="h-5 w-5 stroke-[2.5px]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Cogno Test</span>
         </div>

         <nav className="flex-1 px-4 space-y-1.5">
            <button 
               onClick={() => { setActiveTab("tests"); resetEditor(); }}
               className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'tests' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <FileText className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'tests' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
               My tests
            </button>
            <button 
               onClick={() => { setActiveTab("results"); resetEditor(); }}
               className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'results' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <BarChart3 className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'results' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
               Results
            </button>
            <button 
               onClick={() => { setActiveTab("chat"); resetEditor(); }}
               className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'chat' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <MessageSquare className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'chat' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
               Messages
            </button>
         
            
         </nav>

         <div className="mt-auto space-y-1">
            
            <button className="flex w-full items-center gap-3.5 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-black transition-all group">
               <Link href="/" className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-black transition-all group">
               <Home className="h-5 w-5 stroke-[2.2px] text-slate-400 group-hover:text-black" />
               Tests catalog
            </Link>
            </button>
         </div>

         <div className="p-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-50">
                     {auth.currentUser?.photoURL ? <img src={auth.currentUser.photoURL} alt="" /> : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">A</div>}
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{auth.currentUser?.displayName || "Admin"}</p>
                  </div>
               </div>
               <button className="p-2 text-slate-400 hover:text-black transition"><MoreVertical className="h-4 w-4" /></button>
            </div>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
         <div className="mx-auto max-w-[1200px] p-10 lg:p-14">

            {activeTab === "chat" && !isEditing && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-10">
                     <h1 className="text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight italic-none">Messages</h1>
                     <p className="mt-2 font-bold text-slate-400">Manage real-time communication with your users.</p>
                  </div>
                  <AdminChat />
               </div>
            )}

            {activeTab === "tests" && !isEditing && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-12 flex items-end justify-between">
                     <div>
                        <h1 className="text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">Tests Overview</h1>
                        <div className="mt-4 flex items-center gap-4">
                           <span className="px-2.5 py-1 bg-[#D1FAE5] text-[#059669] text-[10px] font-extrabold uppercase rounded-md flex items-center gap-1.5 ring-1 ring-emerald-200">
                              <Radio className="h-3 w-3" /> Published
                           </span>
                           <span className="text-xs font-bold text-slate-400">Total assessments: {assessments.length}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button onClick={openNewEditor} className="px-6 py-3.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-[#7C3AED] transition transform active:scale-95 flex items-center gap-2">
                           <Pencil className="h-4 w-4" /> Create test
                        </button>
                     </div>
                  </div>

                  {/* Links List View */}
                 

                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                     {assessmentsLoading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
                     ) : assessments.length === 0 ? (
                        <div className="p-24 text-center">
                           <p className="text-slate-400 font-bold mb-4">No assessments created yet</p>
                           <button onClick={openNewEditor} className="text-[#8B5CF6] font-black underline">Create your first one</button>
                        </div>
                     ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-8 py-5">Assessment Name</th>
                                    <th className="px-8 py-5">Questions</th>
                                    <th className="px-8 py-5">Duration</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {assessments.map((a) => (
                                    <tr key={a.id} className="group hover:bg-slate-50/50 transition">
                                       <td className="px-8 py-6">
                                          <p className="font-extrabold text-slate-900 mb-1">{a.title}</p>
                                          <p className="text-xs font-medium text-slate-400 line-clamp-1">{a.description}</p>
                                       </td>
                                       
                                       <td className="px-8 py-6 text-sm font-bold text-slate-600">{a.questions?.length} items</td>
                                       <td className="px-8 py-6 text-sm font-black text-slate-400 tracking-tight">{a.duration}</td>

                                       <td className="px-8 py-6">
                                          <button 
                                             onClick={() => handleToggleStatus(a)}
                                             className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ring-1 transition-all active:scale-95 ${
                                                a.status === 'disabled' 
                                                ? 'bg-slate-100 text-slate-400 ring-slate-200 hover:bg-slate-200' 
                                                : 'bg-emerald-50 text-[#059669] ring-emerald-100 hover:bg-emerald-100'
                                             }`}
                                          >
                                             {a.status === 'disabled' ? 'Disabled' : 'Live'}
                                          </button>
                                       </td>

                                       
                                       <td className="px-8 py-6 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                             <button onClick={() => openEditEditor(a)} className="px-4 py-2 bg-slate-50 text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-200 transition">Edit</button>
                                             <button onClick={() => handleDeleteAssessment(a.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 className="h-4 w-4" /></button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === "results" && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-10">
                     <h1 className="text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight italic-none">Results Inbox</h1>
                     <p className="mt-2 font-bold text-slate-400">Review detailed performance for all dynamic tests.</p>
                  </div>

                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[11px] border-slate-50 bg-slate-50/30 font-bold text-slate-400 uppercase tracking-widest">
                                 <th className="px-8 py-5">Name</th>
                                 <th className="px-8 py-5">Status</th>
                                 <th className="px-8 py-5">Completed</th>
                                 <th className="px-8 py-5 text-right">Score</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {results.map((res) => (
                                 <tr key={res.id} className="group hover:bg-slate-50/50 transition">
                                    <td className="px-8 py-6 flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white">
                                          {res.photoURL ? <img src={res.photoURL} alt="" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">{res.name?.charAt(0)}</div>}
                                       </div>
                                       <span className="font-extrabold text-slate-900">{res.name}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                       <span className="text-xs font-bold text-slate-500">Completed</span>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-400 tabular-nums">
                                       {new Date(res.timestamp).toLocaleDateString([], { day: 'numeric', month: 'long' })}, {new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <button onClick={() => setSelectedResult(res)} className="px-3.5 py-1.5 bg-emerald-50 text-[#059669] text-xs font-black rounded-lg ring-1 ring-emerald-100">View Result :)</button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {/* EDITOR MODAL UI */}
            {isEditing && (
               <div className="animate-in fade-in zoom-in-95 duration-500 max-w-3xl pb-32">
                  <div className="mb-12 flex justify-between items-center">
                     <button onClick={resetEditor} className="text-slate-400 hover:text-black transition">
                        <ArrowLeft className="h-6 w-6" />
                     </button>
                     <div className="flex items-center gap-3">
                        <button onClick={resetEditor} className="text-sm font-bold text-slate-400 hover:text-black transition px-4 py-2">Discard</button>
                        <button onClick={handleSaveAssessment} disabled={isSaving} className="px-6 py-3 bg-[#8B5CF6] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100">
                           {isSaving ? "Saving..." : editingId ? "Update test" : "Publish test"}
                        </button>
                     </div>
                  </div>

                  <div className="mb-12">
                     <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {editingId ? "Modify Assessment" : "Draft New Assessment"}
                     </h1>
                     <p className="mt-3 text-lg font-medium text-slate-400">Configure your psychometric questions and parameters below.</p>
                  </div>

                  <div className="space-y-10">
                     <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-2xl shadow-indigo-100/30">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8">Basic Information</p>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Label</label>
                              <input 
                                 type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)}
                                 className="w-full text-2xl font-extrabold text-slate-900 border-b-2 border-slate-50 focus:border-[#8B5CF6] transition outline-none py-2 px-1 placeholder:text-slate-100"
                                 placeholder="Enter test title..."
                              />
                           </div>
                           <div className="space-y-2 pt-4">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description Brief</label>
                              <textarea 
                                 value={testDesc} onChange={e => setTestDesc(e.target.value)}
                                 className="w-full text-base font-medium text-slate-600 border-2 border-slate-50 rounded-2xl p-4 focus:border-indigo-100 focus:bg-slate-50/50 transition outline-none min-h-[100px]"
                                 placeholder="Describe the objective..."
                              />
                           </div>
                           <div className="space-y-2 pt-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Duration Cap</label>
                              <input 
                                 type="text" value={testDuration} onChange={e => setTestDuration(e.target.value)}
                                 className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Question Sequence ({questions.length})</p>
                        </div>
                        {questions.map((q, idx) => (
                           <div key={q.id} className="relative bg-white rounded-[32px] p-8 border border-slate-100 hover:border-indigo-100 transition group shadow-sm">
                              <button onClick={() => handleRemoveQuestion(idx)} className="absolute top-6 right-6 text-slate-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="h-5 w-5" /></button>
                              <div className="flex items-center gap-3 mb-6">
                                 <span className="h-7 w-7 flex items-center justify-center bg-indigo-50 text-[#8B5CF6] rounded-lg text-[10px] font-black">{idx + 1}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.type === 'mcq' ? 'Choice' : 'Essay'}</span>
                              </div>
                              <textarea 
                                 value={q.question} onChange={e => handleUpdateQuestion(idx, 'question', e.target.value)}
                                 className="w-full text-lg font-bold text-slate-900 outline-none bg-transparent placeholder:text-slate-200 resize-none min-h-[40px]"
                                 placeholder="Type your question prompt here..."
                                 rows={1}
                                 onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                 }}
                              />
                              {q.type === 'mcq' && (
                                 <div className="mt-8 space-y-3">
                                    {q.options?.map((opt: string, oIdx: number) => (
                                       <div key={oIdx} className="flex items-center gap-3">
                                          <div className="h-2 w-2 rounded-full border-2 border-slate-200 shrink-0" />
                                          <input 
                                             type="text" value={opt} onChange={e => handleUpdateOption(idx, oIdx, e.target.value)}
                                             className="flex-1 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100 transition"
                                             placeholder={`Option ${oIdx + 1}`}
                                          />
                                          <button onClick={() => handleRemoveOption(idx, oIdx)} className="p-2 text-slate-200 hover:text-red-400"><X className="h-4 w-4" /></button>
                                       </div>
                                    ))}
                                    <button onClick={() => handleAddOption(idx)} className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest ml-5 mt-2 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Choice</button>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>

                     <div className="flex gap-4">
                        <button onClick={() => handleAddQuestion('mcq')} className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-[24px] py-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition animate-in fade-in">Add MCQ Item</button>
                        <button onClick={() => handleAddQuestion('text')} className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-[24px] py-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition animate-in fade-in">Add Essay Item</button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </main>

      {/* DETAIL MODAL (Review) */}
      {selectedResult && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-xl border border-slate-200">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900">Evaluation Review</h2>
                     <p className="text-sm font-medium text-slate-500 mt-0.5">{selectedResult.name} | {selectedResult.email}</p>
                  </div>
                  <button onClick={() => setSelectedResult(null)} className="p-2 text-slate-400 hover:text-slate-600">
                     <X className="h-5 w-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {selectedResult.questionPayload?.map((q: any, i: number) => {
                     const ans = selectedResult.answers[i];
                     const ansT = q.type === 'text' ? ans : q.options[ans];
                     return (
                        <div key={i} className="space-y-3 pb-6 border-b border-slate-50 last:border-0 uppercase-none">
                           <div className="flex items-start gap-3">
                              <span className="text-sm font-bold text-slate-300">{i + 1}.</span>
                              <div className="flex-1">
                                 <p className="text-base font-bold text-slate-900 whitespace-pre-wrap">{q.question}</p>
                                 <div className="mt-2 space-y-2">
                                    {q.type === 'mcq' ? (
                                       <div className="grid grid-cols-1 gap-2">
                                          {q.options.map((opt: string, oIdx: number) => {
                                             const isSelected = ans === oIdx;
                                             return (
                                                <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border ${isSelected ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                   <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                                   <span className="text-sm font-bold">{opt}</span>
                                                   {isSelected && <Check className="h-4 w-4 ml-auto" />}
                                                </div>
                                             );
                                          })}
                                       </div>
                                    ) : (
                                       <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                          <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{ans || "No answer"}</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     )
                  })}
               </div>

               <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button onClick={() => setSelectedResult(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">
                     Close
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

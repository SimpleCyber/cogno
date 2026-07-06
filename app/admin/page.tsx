"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  Loader2, ShieldAlert, ArrowLeft, Eye, X, User, Plus, Trash2, 
  CheckCircle2, AlertCircle, Pencil, FileText, LayoutDashboard, 
  Settings, Home, Leaf, ChevronRight, BarChart3, Users, Clock, 
  Share2, MoreVertical, Search, Filter, Radio, Check, MessageSquare, CalendarCheck
} from "lucide-react";
import Link from "next/link";
import AdminChat from "@/components/AdminChat";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "tests" | "chat" | "users" | "meetings">("tests");
  const [globalSettings, setGlobalSettings] = useState({ 
    requireTestForMeeting: false,
    requiredAssessmentId: "" 
  });
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  const fetchGlobalSettings = async () => {
    try {
      const snap = await getDocs(query(collection(db, "settings")));
      if (!snap.empty) {
        setGlobalSettings(snap.docs[0].data() as typeof globalSettings);
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const handleUpdateMeetingSetting = async (updates: Partial<typeof globalSettings>) => {
    setIsSettingsSaving(true);
    try {
      const snap = await getDocs(query(collection(db, "settings")));
      const newSettings = { ...globalSettings, ...updates };
      if (!snap.empty) {
        await updateDoc(doc(db, "settings", snap.docs[0].id), updates);
      } else {
        await addDoc(collection(db, "settings"), newSettings);
      }
      setGlobalSettings(newSettings);
      showToast("Meeting settings updated");
    } catch (err) {
      console.error(err);
      showToast("Failed to update settings", "error");
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newResultsCount, setNewResultsCount] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

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
      const resData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setResults(resData);
      setNewResultsCount(resData.filter((r: any) => !r.viewed).length);
    } catch (err) {
      console.error("Error fetching results", err);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const q = query(collection(db, "chats"), where("isAdminUnread", "==", true));
      const snap = await getDocs(q);
      setUnreadMessages(snap.size);
    } catch (err) {
      console.error("Error fetching unread messages", err);
    }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("onboardingTimestamp", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setAuthorized(true);
        fetchResults();
        fetchAssessments();
        fetchUnreadMessages();
        fetchUsers();
        fetchGlobalSettings();
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
               Create tests
            </button>
            <button 
               onClick={() => { setActiveTab("results"); resetEditor(); }}
               className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'results' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <div className="flex items-center gap-3.5">
                  <BarChart3 className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'results' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
                  Results
               </div>
               {newResultsCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                     {newResultsCount}
                  </span>
               )}
            </button>
            <button 
               onClick={() => { setActiveTab("users"); resetEditor(); }}
               className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'users' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <Users className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'users' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
               User Info
            </button>
            <button 
               onClick={() => { setActiveTab("chat"); resetEditor(); }}
               className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'chat' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
            >
               <div className="flex items-center gap-3.5">
                  <MessageSquare className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'chat' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
                  Messages
               </div>
               {unreadMessages > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                     {unreadMessages}
                  </span>
               )}
            </button>
            {process.env.NEXT_PUBLIC_FEATURE_BOOK_APPOINTMENT_ENABLE === "true" && (
              <button 
                onClick={() => { setActiveTab("meetings"); resetEditor(); }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all group ${activeTab === 'meetings' ? 'bg-[#F3F4F6] text-black' : 'text-slate-500 hover:bg-slate-50 hover:text-black'}`}
              >
                <CalendarCheck className={`h-5 w-5 stroke-[2.2px] ${activeTab === 'meetings' ? 'text-black' : 'text-slate-400 group-hover:text-black'}`} />
                Meetings
              </button>
            )}
         
            
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
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-50">
                     <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {auth.currentUser?.displayName?.charAt(0) || auth.currentUser?.email?.charAt(0) || "A"}
                     </div>
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
         <div className="mx-auto max-w-[1200px] p-6 lg:p-8">

            {activeTab === "chat" && !isEditing && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-6">
                     <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Messages</h1>
                     <p className="mt-1 text-sm font-bold text-slate-400">Manage real-time communication with your users.</p>
                  </div>
                  <AdminChat />
               </div>
            )}

            {activeTab === "tests" && !isEditing && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-8 flex items-end justify-between">
                     <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Tests Overview</h1>
                        <div className="mt-2 flex items-center gap-4">
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

            {activeTab === "meetings" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                   <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <div>
                         <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Meeting Access Control</h1>
                         <p className="mt-1 text-xs font-bold text-slate-400">Configure how and when users can schedule sessions.</p>
                      </div>
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                         {globalSettings.requireTestForMeeting && (
                            <div className="flex flex-col gap-1 pr-6 border-r border-slate-100">
                               <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bind to Assessment</label>
                               <select 
                                  value={globalSettings.requiredAssessmentId}
                                  onChange={(e) => handleUpdateMeetingSetting({ requiredAssessmentId: e.target.value })}
                                  className="text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-100 outline-none min-w-[200px]"
                               >
                                  <option value="">Any Assessment</option>
                                  {assessments.map(a => (
                                     <option key={a.id} value={a.id}>{a.title}</option>
                                  ))}
                               </select>
                            </div>
                         )}
                         <div className="flex items-center gap-4 pl-2">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Requirement</span>
                               <span className="text-xs font-bold text-slate-700">{globalSettings.requireTestForMeeting ? 'Assessment Required' : 'Open Access'}</span>
                            </div>
                            <button 
                               onClick={() => handleUpdateMeetingSetting({ requireTestForMeeting: !globalSettings.requireTestForMeeting })}
                               disabled={isSettingsSaving}
                               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${globalSettings.requireTestForMeeting ? 'bg-[#7C3AED]' : 'bg-slate-200'}`}
                            >
                               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalSettings.requireTestForMeeting ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden min-h-[750px] mb-12 flex flex-col relative group">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      <iframe 
                         src={process.env.NEXT_PUBLIC_KOALENDAR_URL}
                         className="w-full h-full border-none flex-1"
                         style={{ minHeight: '750px' }}
                         title="Meetings Dashboard"
                      />
                   </div>
                </div>
            )}

            {activeTab === "users" && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="mb-6">
                     <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">User Directory</h1>
                     <p className="mt-1 text-sm font-bold text-slate-400">Directory of all users who have completed the onboarding flow.</p>
                  </div>

                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                     {usersLoading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
                     ) : users.length === 0 ? (
                        <div className="p-24 text-center">
                           <p className="text-slate-400 font-bold mb-4">No users found</p>
                        </div>
                     ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-8 py-5">User Profile</th>
                                    <th className="px-8 py-5">Age & Occupation</th>
                                    <th className="px-8 py-5">Joined</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {users.map((u) => (
                                    <React.Fragment key={u.id}>
                                       <tr className={`group transition-all hover:bg-slate-50/50 ${expandedUser === u.id ? 'bg-slate-50/80' : ''}`}>
                                          <td className="px-8 py-6">
                                             <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-xs ring-2 ring-white">
                                                   {u.name?.charAt(0) || u.email?.charAt(0)}
                                                </div>
                                                <div>
                                                   <span className="font-extrabold text-slate-900 block">{u.name || "N/A"}</span>
                                                   <span className="text-[10px] font-bold text-slate-400 block">{u.email}</span>
                                                </div>
                                             </div>
                                          </td>
                                          <td className="px-8 py-6">
                                             <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700">{u.occupation || "N/A"}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{u.age ? `${u.age} years old` : "No age info"}</span>
                                             </div>
                                          </td>
                                          <td className="px-8 py-6 text-xs font-bold text-slate-400 tabular-nums">
                                             {u.onboardingTimestamp ? new Date(u.onboardingTimestamp.seconds * 1000).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                                          </td>
                                          <td className="px-8 py-6 text-right">
                                             <button 
                                                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${expandedUser === u.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                             >
                                                {expandedUser === u.id ? 'Hide Details' : 'View Details'}
                                             </button>
                                          </td>
                                       </tr>
                                       {expandedUser === u.id && (
                                          <tr>
                                             <td colSpan={4} className="px-8 py-8 bg-slate-50/50 border-y border-slate-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                                   <div className="space-y-4">
                                                      <div>
                                                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Occupation Detail</p>
                                                         <p className="text-sm font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{u.occupation || "Not specified"}</p>
                                                      </div>
                                                      <div>
                                                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">User Metadata</p>
                                                         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                               <span className="text-slate-400 font-bold">User ID:</span>
                                                               <span className="text-slate-600 font-mono text-[10px]">{u.uid}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                               <span className="text-slate-400 font-bold">Last Active:</span>
                                                               <span className="text-slate-600 font-bold">{u.lastActive ? new Date(u.lastActive.seconds * 1000).toLocaleString() : "N/A"}</span>
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>
                                                   <div>
                                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Counseling Background & Needs</p>
                                                      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-full">
                                                         <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                                                            {u.counselingDetails ? `"${u.counselingDetails}"` : "No additional counseling details provided during onboarding."}
                                                         </p>
                                                      </div>
                                                   </div>
                                                </div>
                                             </td>
                                          </tr>
                                       )}
                                    </React.Fragment>
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
                  <div className="mb-6">
                     <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Results Inbox</h1>
                     <p className="mt-1 text-sm font-bold text-slate-400">Review detailed performance for all dynamic tests.</p>
                  </div>

                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                               <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                  <th className="px-8 py-5">Name & Contact</th>
                                  <th className="px-8 py-5">Status</th>
                                  <th className="px-8 py-5">Completed</th>
                                  <th className="px-8 py-5 text-right">Action</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {results.map((res) => (
                                 <tr key={res.id} className={`group transition-all ${res.viewed ? 'opacity-60 grayscale-[0.3]' : 'bg-white hover:bg-slate-50/50'}`}>
                                    <td className="px-8 py-6 flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white">
                                          <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400 capitalize">{res.name?.charAt(0) || res.email?.charAt(0)}</div>
                                       </div>
                                       <div>
                                          <span className="font-extrabold text-slate-900 block">{res.name}</span>
                                          <span className="text-[10px] font-bold text-slate-400 block">{res.email}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <span className="text-xs font-bold text-slate-500">Completed</span>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-400 tabular-nums">
                                       {new Date(res.timestamp).toLocaleDateString([], { day: 'numeric', month: 'long' })}, {new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <button 
                                          onClick={() => setSelectedResult(res)} 
                                          className={`px-3.5 py-1.5 text-xs font-black rounded-lg ring-1 transition-all ${
                                             res.viewed 
                                             ? 'bg-slate-50 text-slate-400 ring-slate-100' 
                                             : 'bg-emerald-50 text-[#059669] ring-emerald-100 hover:bg-emerald-100'
                                          }`}
                                       >
                                          {res.viewed ? 'View Result' : 'Review Now'}
                                       </button>
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

               <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                  <button 
                     onClick={() => {
                        setFeedbackText(selectedResult.feedback || "");
                        setShowFeedbackModal(true);
                     }}
                     className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                     <Plus className="h-4 w-4" /> Feedback
                  </button>
                  {!selectedResult.viewed && (
                     <button 
                        onClick={async () => {
                           await updateDoc(doc(db, "test_results", selectedResult.id), { viewed: true });
                           fetchResults();
                           setSelectedResult({...selectedResult, viewed: true});
                           showToast("Marked as viewed");
                        }} 
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
                     >
                        Mark as Viewed
                     </button>
                  )}
                  <button onClick={() => setSelectedResult(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">
                     Close
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* FEEDBACK POPUP MODAL */}
      {showFeedbackModal && selectedResult && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                     <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">User Feedback</h3>
               </div>
               
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Evaluation Note</p>
               <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold text-slate-700 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 transition min-h-[160px] placeholder:text-slate-300"
                  placeholder="Share your thoughts on this assessment..."
               />
               
               <div className="mt-8 flex gap-3">
                  <button 
                     onClick={() => setShowFeedbackModal(false)}
                     className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold hover:bg-slate-100 transition"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={async () => {
                        try {
                           await updateDoc(doc(db, "test_results", selectedResult.id), { 
                              feedback: feedbackText,
                              viewed: true
                           });
                           showToast("Feedback submitted successfully!");
                           fetchResults();
                           setSelectedResult({...selectedResult, feedback: feedbackText, viewed: true});
                           setShowFeedbackModal(false);
                        } catch (err) {
                           showToast("Error saving feedback", "error");
                        }
                     }}
                     className="flex-[2] px-6 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition active:scale-95"
                  >
                     Save & Submit
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

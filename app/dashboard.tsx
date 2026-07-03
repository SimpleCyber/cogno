import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { BookOpen, LogOut, FileText, ArrowRight, Leaf, User, ShieldCheck, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function Dashboard({ user }: { user: any }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userRetests, setUserRetests] = useState<any[]>([]);
  const [showReports, setShowReports] = useState<boolean | string>(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

     // Fetch Dynamic Assessments
     const fetchAssessments = async () => {
       try {
         const q = query(collection(db, "assessments"), orderBy("createdAt", "desc"));
         const snap = await getDocs(q);
         const dynamicAssessments = snap.docs
           .map(doc => ({
            id: doc.id,
            ...doc.data()
           }))
           .filter((a: any) => a.status !== "disabled");
         setCourses(dynamicAssessments);
       } catch(err) {
         console.error("Error fetching assessments", err);
       }
     };

     const fetchUserResults = async () => {
       if (!user) return;
       try {
         const q = query(
           collection(db, "test_results"), 
           where("userId", "==", user.uid),
           orderBy("timestamp", "desc")
         );
         const snap = await getDocs(q);
         setUserResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
       } catch (err) {
         console.error("Error fetching user results", err);
       }
     };

      const fetchUserRetests = async () => {
        if (!user) return;
        try {
          const q = query(collection(db, "retest_requests"), where("userId", "==", user.uid));
          const snap = await getDocs(q);
          setUserRetests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error("Error fetching user retests", err);
        }
      };

      const loadData = async () => {
         setLoading(true);
         await Promise.all([fetchAssessments(), fetchUserResults(), fetchUserRetests()]);
         setLoading(false);
      };

     loadData();

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
        .font-display {
          font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>
      
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold text-slate-900">
              Cogno
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-slate-600 sm:block">
              Hi, {user?.displayName || user?.email?.split("@")[0]}
            </span>
             <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[#4F46E5] outline-none ring-2 ring-transparent transition-all hover:bg-indigo-200 focus:ring-indigo-300"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                  </span>
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user?.displayName || "Student User"}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {user?.email}
                    </p>
                  </div>
                  <div className="pt-2">
                    {user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                      <Link
                        href="/admin"
                        className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut(auth)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Learning & Assessments
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-400">
            Track your progress and psychological evaluations in real-time.
          </p>
        </div>

        {loading ? (
           <div className="flex h-40 w-full flex-col items-center justify-center gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
             <span className="text-sm font-medium text-slate-500">Loading assessments...</span>
           </div>
        ) : (
           <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const resultsForCourse = userResults.filter(r => r.assessmentId === course.id);
                const hasTaken = resultsForCourse.length > 0;
                const retestReq = userRetests.find(r => r.assessmentId === course.id);
                
                // State Logic
                const isApproved = retestReq?.status === 'approved' && !retestReq.consumed;
                const isPending = retestReq?.status === 'pending';
                const isPostRetest = hasTaken && !isApproved && !isPending;
                
                const isDull = hasTaken && !isApproved;

                return (
                  <div
                    key={course.id}
                    className={`group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 ${isDull ? 'opacity-70 bg-slate-50/50' : 'hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-indigo-100'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                         <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDull ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-[#4F46E5] group-hover:bg-gradient-to-br group-hover:from-[#4F46E5] group-hover:to-[#8B5CF6] group-hover:text-white'}`}>
                           <FileText className="h-7 w-7" />
                         </div>
                         {hasTaken && (
                            <button 
                              onClick={() => {
                                 if (window.innerWidth < 768) {
                                    window.open('/reports', '_blank');
                                 } else {
                                    setShowReports(course.id);
                                 }
                              }}
                              className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition"
                            >
                               View Report
                            </button>
                         )}
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-900">
                        {course.title || "Untitled Assessment"}
                      </h3>
                      <p className="mt-3 leading-relaxed text-slate-600 line-clamp-2">
                        {course.description || "No description provided."}
                      </p>
                      
                      {/* Status Messages */}
                      <div className="mt-6">
                         {isPending && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                               <p className="text-xs font-bold text-amber-700">You have submitted your request.</p>
                            </div>
                         )}
                         {isApproved && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                               <p className="text-xs font-bold text-emerald-700">Yes, your retest has been approved. You can take the retest again.</p>
                            </div>
                         )}
                         {isPostRetest && (
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                               <p className="text-xs font-bold text-slate-500">You have taken your test. If you want to retake it, you can ask the admin again.</p>
                            </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                        {course.duration || "Self Paced"}
                      </span>
                      {isApproved ? (
                        <Link
                           href={`/test/${course.id}`}
                           className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                           Retake Assessment
                           <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                           href={`/test/${course.id}`}
                           className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isPending ? 'pointer-events-none text-slate-300' : (hasTaken ? 'text-slate-400' : 'text-[#4F46E5]')}`}
                        >
                           {isPending ? 'Request Pending' : (hasTaken ? 'Request Retest' : 'Start Assessment')}
                           <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
           </div>
        )}
         {/* Reports Sidebar */}
         {showReports && (
            <div className="fixed inset-0 z-[110] flex justify-end">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReports(false)} />
               <div className="relative w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col h-full">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Reports</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Feedback History</p>
                     </div>
                     <button onClick={() => setShowReports(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition">
                        <X className="h-5 w-5 text-slate-400" />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                     {userResults
                        .filter(r => typeof showReports === 'string' ? r.assessmentId === showReports : true)
                        .map((res, idx) => (
                           <div key={res.id} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-[#4F46E5]/20 transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                                    {new Date(res.timestamp).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                                 </span>
                                 <ShieldCheck className="h-4 w-4 text-slate-200 group-hover:text-[#4F46E5] transition-colors" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{res.paperName}</h3>
                              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                 <p className="text-sm font-medium text-slate-600 leading-relaxed italic-none">
                                    {res.feedback || "No feedback has been recorded for this session yet."}
                                 </p>
                              </div>
                           </div>
                        ))}
                  </div>
                  
                  <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                     <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                        End of Report History
                     </p>
                  </div>
               </div>
            </div>
         )}
      </main>

      <ChatWidget user={user} />
    </div>
  );
}

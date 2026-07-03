import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { BookOpen, LogOut, FileText, ArrowRight, Leaf, User, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function Dashboard({ user }: { user: any }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userResults, setUserResults] = useState<any[]>([]);

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

     const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchAssessments(), fetchUserResults()]);
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
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
          Your Learning & Assessments
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Track your progress and take regular wellness assessments dynamically provided by your coach.
        </p>

        {loading ? (
           <div className="flex h-40 w-full flex-col items-center justify-center gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
             <span className="text-sm font-medium text-slate-500">Loading assessments...</span>
           </div>
        ) : (
           <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {courses.map((course) => (
               <div
                 key={course.id}
                 className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-indigo-100"
               >
                 <div>
                   <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] transition-colors group-hover:bg-gradient-to-br group-hover:from-[#4F46E5] group-hover:to-[#8B5CF6] group-hover:text-white">
                     <FileText className="h-7 w-7" />
                   </div>
                   <h3 className="font-display text-xl font-bold text-slate-900">
                     {course.title || "Untitled Assessment"}
                   </h3>
                   <p className="mt-3 leading-relaxed text-slate-600">
                     {course.description || "No description provided."}
                   </p>
                 </div>
                 <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                   <span className="text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                     {course.duration || "Self Paced"}
                   </span>
                   <Link
                     href={`/test/${course.id}`}
                     className="flex items-center gap-1 text-sm font-semibold text-[#4F46E5] transition-colors hover:text-[#3730A3]"
                   >
                     Start Assessment
                     <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </Link>
                 </div>
               </div>
             ))}
           </div>
        )}
         {userResults.length > 0 && (
           <div className="mt-20">
              <h2 className="font-display text-2xl font-bold text-slate-900">Your Evaluation History</h2>
              <p className="mt-2 text-slate-500 font-medium">Review your past performance and coach feedback.</p>
              
              <div className="mt-8 space-y-4">
                 {userResults.map((res) => (
                    <div key={res.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="h-6 w-6" />
                             </div>
                             <div>
                                <h3 className="font-bold text-slate-900">{res.paperName}</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                   Completed {new Date(res.timestamp).toLocaleDateString([], { day: 'numeric', month: 'long' })}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-md ring-1 ring-slate-100">Evaluated</span>
                          </div>
                       </div>

                       {res.feedback && (
                          <div className="mt-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                             <div className="flex items-center gap-2 mb-3">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Coach Feedback</span>
                             </div>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed italic-none">
                                {res.feedback}
                             </p>
                          </div>
                       )}

                       {!res.feedback && (
                          <div className="mt-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                             <p className="text-xs font-bold text-slate-400 italic">Feedback pending from administrator...</p>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
         )}
      </main>

      <ChatWidget user={user} />
    </div>
  );
}

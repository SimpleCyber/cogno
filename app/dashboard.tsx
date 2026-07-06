import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { BookOpen, LogOut, FileText, ArrowRight, Leaf, User, ShieldCheck, Loader2, X, MessageSquare, Clock, Send, AlertCircle, CalendarCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useState, useRef, useEffect } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function Dashboard({ user }: { user: any }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userRetests, setUserRetests] = useState<any[]>([]);

  // Popup states
  const [retestPopup, setRetestPopup] = useState<string | null>(null); // courseId
  const [reportPopup, setReportPopup] = useState<string | null>(null); // courseId
  const [requestedPopup, setRequestedPopup] = useState<string | null>(null); // courseId
  const [retestNote, setRetestNote] = useState("");
  const [isRequestingRetest, setIsRequestingRetest] = useState(false);
  const [showScheduleLock, setShowScheduleLock] = useState(false);
  
  const [globalSettings, setGlobalSettings] = useState({ 
    requireTestForMeeting: false,
    requiredAssessmentId: "" 
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

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

      const loadData = async () => {
         setLoading(true);
         await Promise.all([fetchAssessments(), fetchUserResults(), fetchUserRetests(), fetchGlobalSettings()]);
         setLoading(false);
      };

     loadData();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  const handleRetestRequest = async (courseId: string, courseTitle: string) => {
    if (!user || !retestNote.trim()) return;
    setIsRequestingRetest(true);
    try {
      await addDoc(collection(db, "retest_requests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "Student",
        assessmentId: courseId,
        paperName: courseTitle,
        note: retestNote,
        status: "pending",
        consumed: false,
        timestamp: Date.now(),
      });

      await addDoc(collection(db, "chats", user.uid, "messages"), {
        senderId: user.uid,
        content: `[SYSTEM REQUEST] Retest request for "${courseTitle}": ${retestNote}`,
        timestamp: serverTimestamp(),
        isAdmin: false,
        isSystem: true,
      });

      try {
        await updateDoc(doc(db, "chats", user.uid), {
          lastMessage: "Requested a test retake",
          lastTimestamp: serverTimestamp(),
          isAdminUnread: true,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {}

      setUserRetests((prev) => [
        ...prev,
        { assessmentId: courseId, status: "pending", note: retestNote, consumed: false, timestamp: Date.now() },
      ]);
      setRetestPopup(null);
      setRetestNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequestingRetest(false);
    }
  };

  const getCardState = (courseId: string) => {
    const results = userResults.filter((r) => r.assessmentId === courseId);
    const hasTaken = results.length > 0;
    const hasFeedback = results.some((r) => r.feedback);
    const latestRetest = userRetests
      .filter((r) => r.assessmentId === courseId)
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))[0];

    const isPending = latestRetest?.status === "pending";
    const isApproved = latestRetest?.status === "approved" && !latestRetest?.consumed;
    const isDenied = latestRetest?.status === "denied";

    return { hasTaken, hasFeedback, isPending, isApproved, isDenied, results };
  };

  const handleOpenScheduler = () => {
    const isRestricted = globalSettings.requireTestForMeeting && (
      globalSettings.requiredAssessmentId 
      ? !userResults.some(r => r.assessmentId === globalSettings.requiredAssessmentId)
      : userResults.length === 0
    );

    if (isRestricted) {
      setShowScheduleLock(true);
      return;
    }

    (window as any).Koalendar?.('open', { 
      url: process.env.NEXT_PUBLIC_KOALENDAR_URL || "https://koalendar.com/e/meet-with-satyam-yadav" 
    });
  };

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
          
          <div className="flex items-center gap-6">
            {process.env.NEXT_PUBLIC_FEATURE_BOOK_APPOINTMENT_ENABLE === "true" && (
              <button
                onClick={handleOpenScheduler}
                className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-slate-800 hover:shadow-indigo-100"
              >
                <CalendarCheck className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
                Book Appointment
              </button>
            )}

            <span className="hidden text-sm font-semibold text-slate-600 sm:block h-5 border-l border-slate-200 pl-6">
              Hi, {user?.displayName || user?.email?.split("@")[0]}
            </span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[#4F46E5] outline-none ring-2 ring-transparent transition-all hover:bg-indigo-200 focus:ring-indigo-300"
              >
                <span className="text-sm font-bold uppercase">
                  {user?.displayName ? user.displayName.charAt(0) : user?.email?.charAt(0) || "U"}
                </span>
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
                    {user?.email && process.env.NEXT_PUBLIC_ADMIN_EMAIL?.split(",").map(e => e.trim()).includes(user.email) && (
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

      <main className="mx-auto max-w-7xl px-6 py-6 md:py-8 lg:px-8">
        <div className="mb-6 md:mb-10 text-left">
          <h1 className="font-display text-3xl md:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">
            <span className="md:hidden">Assessments</span>
            <span className="hidden md:block">Learning & Assessments</span>
          </h1>
          <p className="mt-1 md:mt-2 text-sm md:text-lg font-medium text-slate-400">
            <span className="md:hidden">Track your journey in real-time.</span>
            <span className="hidden md:block">Track your progress and psychological evaluations in real-time.</span>
          </p>
        </div>

        {loading ? (
           <div className="flex h-40 w-full flex-col items-center justify-center gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
             <span className="text-sm font-medium text-slate-500">Loading assessments...</span>
           </div>
        ) : (
            <div className="mt-8 md:mt-12 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const state = getCardState(course.id);
                const isDull = state.hasTaken && !state.isApproved;

                return (
                  <div
                    key={course.id}
                    className={`group flex flex-col justify-between rounded-[24px] md:rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition-all duration-300 ${
                      isDull ? "opacity-70 bg-slate-50/50" : "hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-indigo-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div
                          className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl transition-colors ${
                            isDull
                              ? "bg-slate-200 text-slate-400"
                              : "bg-indigo-50 text-[#4F46E5] group-hover:bg-gradient-to-br group-hover:from-[#4F46E5] group-hover:to-[#8B5CF6] group-hover:text-white"
                          }`}
                        >
                          <FileText className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        {state.hasTaken && (
                          <button
                            onClick={() => setReportPopup(course.id)}
                            className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition"
                          >
                            View Report
                          </button>
                        )}
                      </div>

                      <h3 className="font-display text-lg md:text-xl font-bold text-slate-900 line-clamp-1">
                        {course.title || "Untitled Assessment"}
                      </h3>
                      <p className="mt-2 md:mt-3 text-sm md:text-base leading-relaxed text-slate-500 line-clamp-2">
                        {course.description || "No description provided."}
                      </p>

                      {state.hasTaken && (
                        <div className="mt-4 md:mt-6">
                          {state.isApproved ? (
                            <div className="p-3 md:p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                              <p className="text-[11px] md:text-xs font-bold text-emerald-700">
                                Your retest has been approved. You can take the test again.
                              </p>
                            </div>
                          ) : state.isPending ? (
                            <div className="p-3 md:p-4 rounded-2xl bg-amber-50 border border-amber-100">
                              <p className="text-[11px] md:text-xs font-bold text-amber-700">
                                Your request has been submitted and is under review.
                              </p>
                            </div>
                          ) : state.isDenied ? (
                            <div className="p-3 md:p-4 rounded-2xl bg-red-50 border border-red-100">
                              <p className="text-[11px] md:text-xs font-bold text-red-600">
                                Your retake request was declined. You can request again.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 md:p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-[11px] md:text-xs font-bold text-slate-400">
                                Evaluation completed. View detailed report above.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 md:mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:pt-6">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                        {course.duration || "Self Paced"}
                      </span>

                      {!state.hasTaken ? (
                        <Link
                          href={`/test/${course.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-[#4F46E5] hover:text-[#3730A3]"
                        >
                          Start Test
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ) : state.isApproved ? (
                        <Link
                          href={`/test/${course.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Retake
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : state.isPending ? (
                        <button
                          onClick={() => setRequestedPopup(course.id)}
                          className="flex items-center gap-1 text-xs md:text-sm font-bold text-amber-600 hover:text-amber-700 transition"
                        >
                          <Clock className="h-4 w-4" /> Request Sent
                        </button>
                      ) : (
                        <button
                          onClick={() => { setRetestPopup(course.id); setRetestNote(""); }}
                          className="flex items-center gap-1 text-xs md:text-sm font-bold text-slate-400 hover:text-slate-600 transition"
                        >
                          <MessageSquare className="h-4 w-4" /> Retest
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
           </div>
        )}
      </main>

      {/* ═══════════ SCHEDULING LOCK POPUP ═══════════ */}
      {showScheduleLock && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowScheduleLock(false)} />
          <div className="relative w-full h-full md:h-auto md:max-w-md bg-white rounded-none md:rounded-[32px] shadow-2xl p-8 md:p-10 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 text-center">
            <button onClick={() => setShowScheduleLock(false)} className="md:hidden absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400">
               <X className="h-6 w-6" />
            </button>
            <div className="mx-auto h-20 w-20 bg-amber-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
              <ShieldAlert className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Access Restricted</h3>
            <p className="mt-5 text-base font-medium text-slate-500 leading-relaxed px-4 md:px-0">
              {(() => {
                const reqTestName = globalSettings.requiredAssessmentId 
                  ? (courses.find(c => c.id === globalSettings.requiredAssessmentId)?.title || "the specified test")
                  : "at least one assessment";
                return `Please complete "${reqTestName}" first. Only after finishing this assessment will you be able to proceed with scheduling your 1-on-1 meeting.`;
              })()}
            </p>
            <button
              onClick={() => {
                const reqId = globalSettings.requiredAssessmentId;
                if (reqId) {
                  window.location.href = `/test/${reqId}`;
                } else {
                  setShowScheduleLock(false);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }
              }}
              className="mt-10 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition shadow-xl flex items-center justify-center gap-2 group"
            >
              <FileText className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
              {globalSettings.requiredAssessmentId ? "Start Assessment" : "View Assessments"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ RETEST REQUEST POPUP ═══════════ */}
      {retestPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setRetestPopup(null)} />
          <div className="relative w-full h-full md:h-auto md:max-w-md bg-white rounded-none md:rounded-[32px] shadow-2xl p-8 md:p-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Request Retake</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">
                   {courses.find((c) => c.id === retestPopup)?.title}
                </p>
              </div>
              <button
                onClick={() => setRetestPopup(null)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <textarea
              value={retestNote}
              onChange={(e) => setRetestNote(e.target.value)}
              placeholder="Why would you like to take this test again?"
              className="w-full flex-1 md:flex-none md:min-h-[160px] bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-base font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition resize-none"
            />

            <button
              disabled={!retestNote.trim() || isRequestingRetest}
              onClick={() => {
                const course = courses.find((c) => c.id === retestPopup);
                if (course) handleRetestRequest(course.id, course.title || "Untitled");
              }}
              className="mt-6 md:mt-8 w-full rounded-2xl bg-slate-900 px-6 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isRequestingRetest ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                <><Send className="h-5 w-5" /> Submit Request</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ REPORT POPUP ═══════════ */}
      {reportPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReportPopup(null)} />
          <div className="relative w-full h-full md:h-auto md:max-w-xl bg-white rounded-none md:rounded-[32px] shadow-2xl animate-in fade-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 overflow-hidden flex flex-col">
            <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex-1 pr-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Evaluation Report</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 truncate">
                   {courses.find((c) => c.id === reportPopup)?.title}
                </p>
              </div>
              <button
                onClick={() => setReportPopup(null)}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 bg-[#F8FAFC]">
              {userResults
                .filter((r) => r.assessmentId === reportPopup)
                .map((res) => (
                  <div key={res.id} className="p-6 md:p-8 rounded-[28px] border border-white bg-white shadow-sm shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Submitted On</span>
                         <span className="text-sm font-bold text-slate-800">
                           {new Date(res.timestamp).toLocaleDateString([], {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                           })}
                         </span>
                      </div>
                      <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                         <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="p-6 rounded-[20px] bg-slate-50/50 border border-slate-100">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Admin Feedback</p>
                       <p className="text-sm md:text-base font-medium text-slate-600 leading-relaxed italic">
                         "{res.feedback || "Ongoing evaluation. Please check back later for detailed feedback."}"
                       </p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white md:hidden">
               <button onClick={() => setReportPopup(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ REQUESTED STATUS POPUP ═══════════ */}
      {requestedPopup && (() => {
        const retest = userRetests.find(r => r.assessmentId === requestedPopup && r.status === 'pending');
        const courseName = courses.find(c => c.id === requestedPopup)?.title || "Assessment";
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setRequestedPopup(null)} />
            <div className="relative w-full h-full md:h-auto md:max-w-md bg-white rounded-none md:rounded-[32px] shadow-2xl p-8 md:p-10 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-10 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Request Sent</h3>
                  <p className="text-sm font-bold text-slate-400 mt-2">{courseName}</p>
                </div>
                <button
                  onClick={() => setRequestedPopup(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 rounded-[24px] bg-amber-50/50 border border-amber-100 mb-6">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Your Justification</p>
                <p className="text-sm md:text-base font-medium text-amber-900 leading-relaxed italic">
                  "{retest?.note || "Standard retest request submitted."}"
                </p>
              </div>

              <div className="p-6 rounded-[24px] bg-slate-50/50 border border-slate-100 border-dashed">
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Your request is currently being reviewed by the administration. You will be able to retake the test once the approval is processed.
                </p>
              </div>

              <button
                onClick={() => setRequestedPopup(null)}
                className="mt-10 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition"
              >
                Close Status
              </button>
            </div>
          </div>
        );
      })()}

      {/* Koalendar Widget Initialization */}
      <Script id="koalendar-config" strategy="afterInteractive">
         {`window.Koalendar=window.Koalendar||function(){(Koalendar.props=Koalendar.props||[]).push(arguments)};`}
      </Script>
      <Script 
         src="https://koalendar.com/assets/widget.js" 
         strategy="afterInteractive"
      />

      <ChatWidget user={user} />
    </div>
  );
}

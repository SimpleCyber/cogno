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
        { assessmentId: courseId, status: "pending", note: retestNote, consumed: false },
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

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-10 text-center lg:text-left">
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
                const state = getCardState(course.id);
                const isDull = state.hasTaken && !state.isApproved;

                return (
                  <div
                    key={course.id}
                    className={`group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 ${
                      isDull ? "opacity-70 bg-slate-50/50" : "hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-indigo-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                            isDull
                              ? "bg-slate-200 text-slate-400"
                              : "bg-indigo-50 text-[#4F46E5] group-hover:bg-gradient-to-br group-hover:from-[#4F46E5] group-hover:to-[#8B5CF6] group-hover:text-white"
                          }`}
                        >
                          <FileText className="h-7 w-7" />
                        </div>
                        {state.hasTaken && (
                          <button
                            onClick={() => setReportPopup(course.id)}
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

                      {state.hasTaken && (
                        <div className="mt-6">
                          {state.isApproved ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-700">
                                Your retest has been approved. You can take the test again.
                              </p>
                            </div>
                          ) : state.isPending ? (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                              <p className="text-xs font-bold text-amber-700">
                                Your request has been submitted and is under review.
                              </p>
                            </div>
                          ) : state.isDenied ? (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                              <p className="text-xs font-bold text-red-600">
                                Your retake request was declined. You can request again.
                              </p>
                            </div>
                          ) : state.hasFeedback ? (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-xs font-bold text-slate-500">
                                Evaluated — view your report above.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 border-dashed">
                              <p className="text-xs font-bold text-slate-400">
                                Submitted — under review by administrator.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                        {course.duration || "Self Paced"}
                      </span>

                      {!state.hasTaken ? (
                        <Link
                          href={`/test/${course.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-[#4F46E5] hover:text-[#3730A3]"
                        >
                          Start Assessment
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ) : state.isApproved ? (
                        <Link
                          href={`/test/${course.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Retake Assessment
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : state.isPending ? (
                        <button
                          onClick={() => setRequestedPopup(course.id)}
                          className="flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700 transition"
                        >
                          <Clock className="h-4 w-4" /> Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => { setRetestPopup(course.id); setRetestNote(""); }}
                          className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-slate-600 transition"
                        >
                          <MessageSquare className="h-4 w-4" /> Request Retest
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowScheduleLock(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-300 text-center">
            <div className="mx-auto h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h3>
            <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed">
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
              className="mt-8 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition shadow-xl flex items-center justify-center gap-2 group"
            >
              <FileText className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
              {globalSettings.requiredAssessmentId ? "Start Required Assessment" : "View All Assessments"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ RETEST REQUEST POPUP ═══════════ */}
      {retestPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRetestPopup(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Request Retake</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {courses.find((c) => c.id === retestPopup)?.title}
                </p>
              </div>
              <button
                onClick={() => setRetestPopup(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <textarea
              value={retestNote}
              onChange={(e) => setRetestNote(e.target.value)}
              placeholder="Why would you like to take this test again?"
              className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition min-h-[120px] resize-none"
            />

            <button
              disabled={!retestNote.trim() || isRequestingRetest}
              onClick={() => {
                const course = courses.find((c) => c.id === retestPopup);
                if (course) handleRetestRequest(course.id, course.title || "Untitled");
              }}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isRequestingRetest ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Request</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ REPORT POPUP ═══════════ */}
      {reportPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setReportPopup(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assessment Report</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {courses.find((c) => c.id === reportPopup)?.title}
                </p>
              </div>
              <button
                onClick={() => setReportPopup(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {userResults
                .filter((r) => r.assessmentId === reportPopup)
                .map((res) => (
                  <div key={res.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                        {new Date(res.timestamp).toLocaleDateString([], {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <ShieldCheck className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-100">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {res.feedback || "No feedback has been recorded for this session yet."}
                      </p>
                    </div>
                  </div>
                ))}
              {userResults.filter((r) => r.assessmentId === reportPopup).length === 0 && (
                <p className="text-sm font-bold text-slate-300 text-center py-8">No results found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ REQUESTED STATUS POPUP ═══════════ */}
      {requestedPopup && (() => {
        const retest = userRetests.find(r => r.assessmentId === requestedPopup && r.status === 'pending');
        const courseName = courses.find(c => c.id === requestedPopup)?.title || "Assessment";
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRequestedPopup(null)} />
            <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Request Sent</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">{courseName}</p>
                </div>
                <button
                  onClick={() => setRequestedPopup(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 mb-4">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Your Message</p>
                <p className="text-sm font-medium text-amber-900 leading-relaxed">
                  {retest?.note || "Retest requested"}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Your message has been sent to the admin. Please wait until the paper is resumed. You will be notified once the admin reviews your request.
                </p>
              </div>

              <button
                onClick={() => setRequestedPopup(null)}
                className="mt-6 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition"
              >
                Understood
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

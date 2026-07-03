"use client";

import { useState, useEffect, use } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, query, where, getDocs, orderBy, limit, updateDoc, serverTimestamp } from "firebase/firestore";

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAssessmentValid, setIsAssessmentValid] = useState<boolean | null>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({}); 
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [retestStatus, setRetestStatus] = useState<"none" | "pending" | "approved" | "denied">("none");
  const [retestNote, setRetestNote] = useState("");
  const [isRequestingRetest, setIsRequestingRetest] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const docRef = doc(db, "assessments", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAssessmentData(data);
          setQuestions(data.questions || []);
          setIsAssessmentValid(true);
        } else {
          setIsAssessmentValid(false);
        }
      } catch (err) {
        console.error(err);
        setIsAssessmentValid(false);
      }
    };

    const checkPreviousAttempt = async (user: User | null) => {
       if (!user) return;
       try {
          const q = query(
             collection(db, "test_results"), 
             where("userId", "==", user.uid),
             where("assessmentId", "==", id)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
             setAlreadyTaken(true);
          }
       } catch (err) {
          console.error("Error checking attempt", err);
       }
    };

    const checkRetestStatus = async (user: User) => {
       try {
          const q = query(
             collection(db, "retest_requests"),
             where("userId", "==", user.uid),
             where("assessmentId", "==", id),
             where("status", "==", "approved"),
             where("consumed", "==", false),
             orderBy("timestamp", "desc"),
             limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
             setRetestStatus('approved');
             setAlreadyTaken(false); // Override!
          } else {
             // Check for pending/denied if no active approved one exists
             const q2 = query(
                collection(db, "retest_requests"),
                where("userId", "==", user.uid),
                where("assessmentId", "==", id),
                orderBy("timestamp", "desc"),
                limit(1)
             );
             const snap2 = await getDocs(q2);
             if (!snap2.empty) {
                setRetestStatus(snap2.docs[0].data().status);
             }
          }
       } catch (err) {
          console.error("Error checking retest status", err);
       }
    };

    fetchAssessment();
    const unsub = auth.onAuthStateChanged((user: User | null) => {
       if (user) {
          checkPreviousAttempt(user).then(() => checkRetestStatus(user));
       }
       setAuthChecking(false);
       setLoading(false);
    });

    return () => unsub();
  }, [id]);
  
  if (loading || authChecking || isAssessmentValid === null) {
      return (
         <div className="flex h-screen w-full flex-col items-center justify-center bg-white gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest animate-pulse">Initializing Assessment...</p>
         </div>
      );
  }

  if (isAssessmentValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 shadow-sm border border-slate-100 p-8 rounded-3xl">Assessment not found</h1>
          <button onClick={() => router.push('/')} className="mt-6 text-sm font-bold text-[#4F46E5] hover:underline">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const canNext = q.type === 'mcq' ? answers[currentIdx] !== undefined : (answers[currentIdx] && answers[currentIdx].trim().length > 0);

  const handleNext = async () => {
    if (!canNext) return;
    
    if (currentIdx + 1 < questions.length) {
       setCurrentIdx(currentIdx + 1);
    } else {
       setIsSubmitting(true);
       const answersArray = Array.from({length: questions.length}).map((_, i) => answers[i]);

       if (auth.currentUser) {
         try {
           await addDoc(collection(db, "test_results"), {
              userId: auth.currentUser.uid,
              email: auth.currentUser.email,
              name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Unknown",
              paperName: assessmentData?.title || id,
              assessmentId: id,
              answers: answersArray,
              questionPayload: questions,
              timestamp: Date.now(),
              viewed: false
           });

           // Consume retest permission if it existed
           const q = query(
              collection(db, "retest_requests"),
              where("userId", "==", auth.currentUser.uid),
              where("assessmentId", "==", id),
              where("status", "==", "approved"),
              where("consumed", "==", false)
           );
           const snap = await getDocs(q);
           if (!snap.empty) {
              await updateDoc(snap.docs[0].ref, { consumed: true });
           }

           setFinished(true);
         } catch (err) {
           alert("Submission failed. Please try again.");
         } finally {
           setIsSubmitting(false);
         }
       }
    }
  };

  const handlePrev = () => {
     if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

   if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
         <div className="w-full max-w-sm text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-6 text-3xl font-bold text-slate-900 tracking-tight">Complete!</h1>
            <p className="mt-3 text-slate-600 font-medium">Your responses have been saved.</p>
            <button
               onClick={() => router.push("/")}
               className="mt-10 w-full rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

   if (alreadyTaken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
         <div className="w-full max-w-sm text-center">
            <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Requirement Met</h1>
            <p className="mt-3 text-slate-600 font-medium">You have already completed this assessment. Each test can only be taken once.</p>
            
            {retestStatus === 'none' ? (
               <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Request a Retake</p>
                  <textarea 
                     value={retestNote}
                     onChange={(e) => setRetestNote(e.target.value)}
                     placeholder="Why would you like to take this test again?"
                     className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition min-h-[100px]"
                  />
                  <button
                     disabled={!retestNote.trim() || isRequestingRetest}
                     onClick={async () => {
                        if (!auth.currentUser) return;
                        setIsRequestingRetest(true);
                        try {
                           const payload = {
                              userId: auth.currentUser.uid,
                              userEmail: auth.currentUser.email,
                              userName: auth.currentUser.displayName || "Student",
                              assessmentId: id,
                              paperName: assessmentData?.title || id,
                              note: retestNote,
                              status: 'pending',
                              consumed: false,
                              timestamp: Date.now()
                           };
                           await addDoc(collection(db, "retest_requests"), payload);
                           
                           // Also send a message to admin chat
                           await addDoc(collection(db, "chats", auth.currentUser.uid, "messages"), {
                              senderId: auth.currentUser.uid,
                              content: `[SYSTEM REQUEST] Retest request for "${assessmentData?.title}": ${retestNote}`,
                              timestamp: serverTimestamp(),
                              isAdmin: false,
                              isSystem: true
                           });
                           
                           await updateDoc(doc(db, "chats", auth.currentUser.uid), {
                              lastMessage: "Requested a test retake",
                              lastTimestamp: serverTimestamp(),
                              isAdminUnread: true,
                              updatedAt: serverTimestamp()
                           });

                           setRetestStatus('pending');
                        } catch (err) {
                           console.error(err);
                        } finally {
                           setIsRequestingRetest(false);
                        }
                     }}
                     className="mt-4 w-full rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition disabled:opacity-30"
                  >
                     {isRequestingRetest ? "Sending..." : "Submit Request"}
                  </button>
               </div>
            ) : (
               <div className="mt-10 p-8 rounded-3xl bg-slate-50 border border-slate-100 border-dashed text-center">
                  <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${retestStatus === 'pending' ? 'bg-amber-100 text-amber-700' : retestStatus === 'denied' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                     Request {retestStatus}
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                     {retestStatus === 'pending' && "Your request for a retake has been submitted and is currently under review."}
                     {retestStatus === 'denied' && "Your request for a retake was declined by the administrator."}
                     {retestStatus === 'approved' && "Your request has been approved! You can now start the test again."}
                  </p>
               </div>
            )}

            <button
               onClick={() => router.push("/")}
               className="mt-6 w-full rounded-2xl bg-white border border-slate-200 px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
            >
               Go Back
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
       {/* Simple Progress Bar */}
       <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
          <div className="h-full bg-[#4F46E5] transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
       </div>

       {/* Exit and Title */}
       <header className="px-6 py-8 sm:px-12 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-900 transition-colors">
             <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="text-right">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question</span>
             <span className="text-sm font-black text-slate-900 tabular-nums">{currentIdx + 1} of {questions.length}</span>
          </div>
       </header>

       <main className="mx-auto max-w-2xl px-6 py-12 sm:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             
             <h2 className="text-lg sm:text-2xl font-bold text-slate-800 leading-normal tracking-tight mb-8 whitespace-pre-wrap">
                {q.question}
             </h2>
             
             <div className="space-y-3">
                {q.type === "mcq" && (
                   <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt: string, i: number) => (
                         <button
                            key={i}
                            onClick={() => setAnswers({...answers, [currentIdx]: i})}
                            className={`flex items-center gap-4 w-full p-5 rounded-2xl border-2 transition-all text-left ${
                              answers[currentIdx] === i 
                                ? 'border-[#4F46E5] bg-[#4F46E5]/5' 
                                : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                            }`}
                         >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${answers[currentIdx] === i ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-200'}`}>
                               {answers[currentIdx] === i && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-base font-semibold ${answers[currentIdx] === i ? 'text-[#4F46E5]' : 'text-slate-600'}`}>
                               {opt}
                            </span>
                         </button>
                      ))}
                   </div>
                )}

                {q.type === "text" && (
                   <textarea 
                      autoFocus
                      value={answers[currentIdx] || ""}
                      onChange={(e) => setAnswers({...answers, [currentIdx]: e.target.value})}
                      placeholder="Type your answer here..."
                      className="w-full min-h-[160px] text-lg font-medium text-slate-900 focus:text-slate-900 transition-all outline-none py-4 placeholder:text-slate-200"
                   />
                )}
             </div>

             <div className="mt-20 flex items-center justify-between">
                <button
                   onClick={handlePrev}
                   disabled={currentIdx === 0}
                   className={`flex items-center gap-2 text-sm font-bold transition-all ${currentIdx === 0 ? 'opacity-0' : 'text-slate-400 hover:text-black'}`}
                >
                   <ChevronLeft className="h-5 w-5" /> Previous
                </button>

                <button
                   onClick={handleNext}
                   disabled={!canNext}
                   className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-sm font-bold transition hover:bg-slate-800 active:scale-95 disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                >
                   {currentIdx === questions.length - 1 ? (isSubmitting ? 'Saving...' : 'Finish') : 'Next'}
                   <ChevronRight className="h-5 w-5" />
                </button>
             </div>
          </div>
       </main>
    </div>
  )
}

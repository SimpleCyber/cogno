"use client";

import { useState, useEffect, use } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc } from "firebase/firestore";

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({}); 
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Step 1: Wait for auth
        const user = await new Promise<User | null>((resolve) => {
          const unsub = auth.onAuthStateChanged((u: User | null) => {
            unsub();
            resolve(u);
          });
        });

        if (!user || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Step 2: Fetch assessment
        const docRef = doc(db, "assessments", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists() || cancelled) {
          if (!cancelled) {
            setLoading(false);
            router.replace("/");
          }
          return;
        }

        const data = docSnap.data();

        // Step 3: Check previous attempt
        const attemptQuery = query(
          collection(db, "test_results"),
          where("userId", "==", user.uid),
          where("assessmentId", "==", id)
        );
        const attemptSnap = await getDocs(attemptQuery);
        const hasTaken = !attemptSnap.empty;

        if (hasTaken) {
          // Step 4: Check for unconsumed approved retest
          let hasPermission = false;
          try {
            const retestQuery = query(
              collection(db, "retest_requests"),
              where("userId", "==", user.uid),
              where("assessmentId", "==", id),
              where("status", "==", "approved"),
              where("consumed", "==", false)
            );
            const retestSnap = await getDocs(retestQuery);
            hasPermission = !retestSnap.empty;
          } catch (err) {
            // Composite index may not exist — fallback: fetch all retests for this user+assessment
            const fallbackQuery = query(
              collection(db, "retest_requests"),
              where("userId", "==", user.uid),
              where("assessmentId", "==", id)
            );
            const fallbackSnap = await getDocs(fallbackQuery);
            hasPermission = fallbackSnap.docs.some(
              (d) => d.data().status === "approved" && d.data().consumed === false
            );
          }

          if (!hasPermission) {
            // Not allowed — send them back to dashboard
            if (!cancelled) router.replace("/");
            return;
          }
        }

        // All checks passed — show the test
        if (!cancelled) {
          setAssessmentData(data);
          setQuestions(data.questions || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Init error:", err);
        if (!cancelled) {
          router.replace("/");
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [id, router]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
        <p className="text-xs font-black text-slate-300 uppercase tracking-widest animate-pulse">
          Initializing Assessment...
        </p>
      </div>
    );
  }

  // ── No questions (shouldn't happen if init worked) ──
  if (!questions.length) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white gap-4">
        <p className="text-sm font-bold text-slate-400">Something went wrong.</p>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-[#4F46E5] hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const q = questions[currentIdx];
  const canNext =
    q.type === "mcq"
      ? answers[currentIdx] !== undefined
      : answers[currentIdx] && answers[currentIdx].trim().length > 0;

  const handleNext = async () => {
    if (!canNext) return;

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsSubmitting(true);
      const answersArray = Array.from({ length: questions.length }).map((_, i) => answers[i]);

      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "test_results"), {
            userId: auth.currentUser.uid,
            email: auth.currentUser.email,
            name: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Unknown",
            paperName: assessmentData?.title || id,
            assessmentId: id,
            answers: answersArray,
            questionPayload: questions,
            timestamp: Date.now(),
            viewed: false,
          });

          // Consume retest permission if it existed
          try {
            const retestQ = query(
              collection(db, "retest_requests"),
              where("userId", "==", auth.currentUser.uid),
              where("assessmentId", "==", id),
              where("status", "==", "approved"),
              where("consumed", "==", false)
            );
            const retestSnap = await getDocs(retestQ);
            if (!retestSnap.empty) {
              await updateDoc(retestSnap.docs[0].ref, { consumed: true });
            }
          } catch (err) {
            // Composite index fallback
            const fallbackQ = query(
              collection(db, "retest_requests"),
              where("userId", "==", auth.currentUser.uid),
              where("assessmentId", "==", id)
            );
            const fallbackSnap = await getDocs(fallbackQ);
            const approvedDoc = fallbackSnap.docs.find(
              (d) => d.data().status === "approved" && d.data().consumed === false
            );
            if (approvedDoc) {
              await updateDoc(approvedDoc.ref, { consumed: true });
            }
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
  };

  // ── Finished ──
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

  // ── Test UI ──
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
        <div
          className="h-full bg-[#4F46E5] transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Exit and Title */}
      <header className="px-6 py-8 sm:px-12 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question</span>
          <span className="text-sm font-black text-slate-900 tabular-nums">
            {currentIdx + 1} of {questions.length}
          </span>
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
                    onClick={() => setAnswers({ ...answers, [currentIdx]: i })}
                    className={`flex items-center gap-4 w-full p-5 rounded-2xl border-2 transition-all text-left ${
                      answers[currentIdx] === i
                        ? "border-[#4F46E5] bg-[#4F46E5]/5"
                        : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        answers[currentIdx] === i ? "border-[#4F46E5] bg-[#4F46E5]" : "border-slate-200"
                      }`}
                    >
                      {answers[currentIdx] === i && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span
                      className={`text-base font-semibold ${
                        answers[currentIdx] === i ? "text-[#4F46E5]" : "text-slate-600"
                      }`}
                    >
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
                onChange={(e) => setAnswers({ ...answers, [currentIdx]: e.target.value })}
                placeholder="Type your answer here..."
                className="w-full min-h-[160px] text-lg font-medium text-slate-900 focus:text-slate-900 transition-all outline-none py-4 placeholder:text-slate-200"
              />
            )}
          </div>

          <div className="mt-20 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${
                currentIdx === 0 ? "opacity-0" : "text-slate-400 hover:text-black"
              }`}
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!canNext}
              className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-sm font-bold transition hover:bg-slate-800 active:scale-95 disabled:opacity-20 disabled:pointer-events-none shadow-xl"
            >
              {currentIdx === questions.length - 1 ? (isSubmitting ? "Saving..." : "Finish") : "Next"}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

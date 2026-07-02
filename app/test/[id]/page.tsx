"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [paperTitle, setPaperTitle] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({}); // store as { index: answerValue }
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
       try {
          const docRef = doc(db, "assessments", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             const data = snap.data();
             setQuestions(data.questions || []);
             setPaperTitle(data.title || "Assessment");
          } else {
             setQuestions([]);
          }
       } catch (error) {
          console.error("Error fetching test", error);
       } finally {
          setLoading(false);
       }
    };
    fetchAssessment();
  }, [id]);
  
  if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4F46E5] border-t-transparent" />
       </div>
     )
  }

  if (!questions || questions.length === 0) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC]">
          <style jsx global>{`
            @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
            .font-display {
              font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
            }
          `}</style>
          <h2 className="font-display text-2xl font-bold text-slate-800">Assessment not available</h2>
          <p className="mt-2 text-slate-500">This test might have been removed or does not exist.</p>
          <Link href="/" className="mt-8 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-md hover:bg-slate-800 transition">Return to Dashboard</Link>
       </div>
    );
  }

  const q = questions[currentIdx];
  const currentAnswer = answers[currentIdx];
  
  // Is the question ready to move forward?
  const canProceed = q.type === 'mcq' ? currentAnswer !== undefined : (currentAnswer && currentAnswer.trim().length > 0);

  const handleNext = async () => {
    if (!canProceed) return;
    
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
      
      // Transform answers map to array format identical to previous setup
      const answersArray = Array.from({length: questions.length}).map((_, i) => answers[i]);

      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "test_results"), {
             userId: auth.currentUser.uid,
             email: auth.currentUser.email,
             name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Unknown",
             photoURL: auth.currentUser.photoURL || null,
             paperName: id,
             answers: answersArray,
             questionPayload: questions,
             timestamp: Date.now()
          });
        } catch (err) {
          console.error("Error saving assessment:", err);
        }
      }
    }
  };

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 text-slate-800">
         <style jsx global>{`
           @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
           .font-display {
             font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
           }
         `}</style>
         <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl shadow-indigo-100 ring-1 ring-slate-100 animate-in zoom-in-95 duration-500 fade-in">
            <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-[#10b981] to-[#34d399] text-white shadow-xl shadow-green-200">
               <CheckCircle2 className="h-14 w-14" />
            </div>
            <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight">Well Done!</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">Thank you for completing this assessment. Your responses have been safely saved for review.</p>
            <button
               onClick={() => router.push("/")}
               className="mt-10 flex w-full justify-center rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-slate-800"
            >
               Back to Dashboard
            </button>
         </div>
      </div>
    );
  }

  const progressPercent = ((currentIdx) / questions.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 p-6 pt-12 sm:pt-20 font-sans text-slate-800 transition-colors">
       <style jsx global>{`
         @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
         .font-display {
           font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
         }
       `}</style>

       <div className="w-full max-w-2xl relative">
          
          {/* Header & Progress */}
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="mb-6 flex items-center justify-between">
                 <Link href="/" className="group flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors">
                     <span className="group-hover:-translate-x-1 transition-transform">←</span> Exit
                 </Link>
                 <span className="text-sm font-bold tracking-widest text-[#4F46E5] uppercase">
                     Q {currentIdx + 1} / {questions.length}
                 </span>
             </div>
             
             {/* Fancy Progress Bar */}
             <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/50">
                 <div 
                   className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] transition-all duration-700 ease-out" 
                   style={{ width: `${progressPercent}%` }} 
                 />
             </div>
          </div>
          
          {/* Dynamic Question Card */}
          <div className="relative z-10 rounded-[2rem] bg-white p-8 sm:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
             
             <h2 className="font-display text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl">
                {q.question}
             </h2>
             <p className="mt-3 text-sm font-medium text-slate-400">
                {q.type === 'mcq' ? 'Please select one response Below.' : 'Please type your answer entirely in the box below.'}
             </p>

             <div className="mt-10 sm:mt-12">
                {q.type === "mcq" && (
                   <div className="space-y-4">
                      {q.options?.map((opt: string, i: number) => {
                         const isSelected = currentAnswer === i;
                         return (
                           <button
                              key={i}
                              onClick={() => setAnswers({...answers, [currentIdx]: i})}
                              className={`group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                                isSelected 
                                  ? 'border-[#4F46E5] bg-indigo-50/50 scale-[1.01] shadow-md shadow-indigo-100/50' 
                                  : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                           >
                              <span className={`text-base font-semibold ${isSelected ? 'text-[#4F46E5]' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                 {opt}
                              </span>
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isSelected ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-200 group-hover:border-slate-300'}`}>
                                 {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                              </div>
                           </button>
                         )
                      })}
                   </div>
                )}

                {q.type === "text" && (
                   <div className="animate-in fade-in">
                      <textarea 
                         value={currentAnswer || ""}
                         onChange={(e) => setAnswers({...answers, [currentIdx]: e.target.value})}
                         placeholder="Enter your detailed response here..."
                         className="w-full min-h-[200px] resize-y rounded-2xl border-2 border-slate-100 bg-slate-50 p-6 text-base font-medium text-slate-900 outline-none transition-all focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-indigo-50 leading-relaxed shadow-inner"
                      />
                   </div>
                )}
             </div>

             <div className="mt-12 flex justify-end border-t border-slate-100 pt-8">
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="group flex items-center gap-3 rounded-2xl bg-[#4F46E5] px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-[#4338ca] hover:shadow-2xl hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {currentIdx === questions.length - 1 ? 'Complete Assessment' : 'Continue'}
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
             </div>
          </div>
          
          {/* Decorative background blur */}
          <div className="absolute -z-10 left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/20 blur-[120px]" />
       </div>
    </div>
  )
}

"use client";

import { useState } from "react";
import { User, Mail, Briefcase, MessageSquare, ArrowRight, Loader2, Leaf, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface OnboardingProps {
  user: any;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    age: "",
    occupation: "",
    counselingDetails: "",
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        uid: user.uid,
        onboardingCompleted: true,
        onboardingTimestamp: serverTimestamp(),
        lastActive: serverTimestamp(),
      }, { merge: true });
      onComplete();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: `Hello, ${formData.name || 'Friend'}`,
      subtitle: "Let's start by getting to know you a little better.",
      icon: <User className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-300" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="Enter your full name"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-300" />
              </div>
              <input
                type="email"
                value={formData.email}
                disabled
                className="block w-full pl-11 pr-4 py-4 bg-slate-100/50 border-none rounded-2xl text-slate-500 font-bold cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tell us more",
      subtitle: "These details help us provide better guidance for you.",
      icon: <Calendar className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Age</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-300" />
              </div>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="How old are you?"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Occupation</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-slate-300" />
              </div>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-100 transition"
                placeholder="What are you currently doing?"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Counseling aspect",
      subtitle: "What brings you to Cogno? Share anything you're comfortable with.",
      icon: <MessageSquare className="h-6 w-6" />,
      content: (
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Story (Optional)</label>
          <textarea
            value={formData.counselingDetails}
            onChange={(e) => setFormData({ ...formData, counselingDetails: e.target.value })}
            rows={4}
            className="block w-full p-5 bg-slate-50 border-none rounded-3xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-100 transition resize-none placeholder:text-slate-300"
            placeholder="Help us understand how we can best support you..."
          />
        </div>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8FAFC]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
        .font-display {
          font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>
      
      <div className="w-full max-w-xl p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-10 flex items-center justify-center gap-2">
          <div className="h-10 w-10 bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] rounded-[14px] flex items-center justify-center text-white shadow-xl">
             <Leaf className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl font-bold text-slate-900 tracking-tight">Cogno</span>
        </div>

        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-indigo-100/30">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center">
                  {currentStep.icon}
               </div>
               <div className="flex-1">
                  <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentStep.title}</h2>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">Step {step}/{steps.length}</span>
                  </div>
                  <p className="text-slate-400 font-bold text-sm mt-1">{currentStep.subtitle}</p>
               </div>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                  style={{ width: `${(step / steps.length) * 100}%` }}
               />
            </div>
          </div>

          <div className="animate-in slide-in-from-bottom-2 duration-500">
            {currentStep.content}
          </div>

          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition active:scale-95"
              >
                Back
              </button>
            )}
            <button
              onClick={step === steps.length ? handleSubmit : handleNext}
              disabled={loading || (step === 1 && !formData.name) || (step === 2 && (!formData.age || !formData.occupation))}
              className={`flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70' : 'hover:bg-slate-800'}`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === steps.length ? (
                "Finish Setup"
              ) : (
                <>Next Step <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

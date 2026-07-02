"use client";

import { useState } from "react";
import { Leaf, Mail, Lock, ArrowRight, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");
        .font-display {
          font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>

      {/* LEFT SIDE - Branding / Demo */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-50 p-12 lg:flex">
        {/* Background glow effects */}
        <div className="animate-breathe absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300 mix-blend-multiply opacity-70 blur-[128px]"></div>
        <div className="animate-breathe-slow absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-pink-300 mix-blend-multiply opacity-70 blur-[128px]"></div>
        <div className="animate-breathe absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-purple-300 mix-blend-multiply opacity-70 blur-[128px]"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white shadow-md">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold text-slate-900">
              Cogno
            </span>
          </Link>
        </div>

        <div className="relative z-10 mt-16 max-w-lg">
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
            A calmer way to <br />
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#EC4899] bg-clip-text text-transparent">
              be heard.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Join thousands of students and professionals finding peace of mind
            through accessible peer counselling and professional therapy.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-4">
              <img
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                src="https://ui-avatars.com/api/?name=Alice+Doe&background=c7d2fe&color=3730a3"
                alt="User"
              />
              <img
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                src="https://ui-avatars.com/api/?name=John+Smith&background=fbcfe8&color=831843"
                alt="User"
              />
              <img
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                src="https://ui-avatars.com/api/?name=Sarah+Lee&background=e9d5ff&color=581c87"
                alt="User"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-sm font-bold text-[#4F46E5]">
                1k+
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">
              Already using Cogno
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-16">
          <div className="rounded-2xl border border-white/80 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white">
                <span className="text-lg font-bold">"</span>
              </div>
              <p className="flex-1 text-sm font-medium leading-relaxed text-slate-700">
                Cogno made it so much easier to talk about exam stress without
                feeling judged. My peer counsellor genuinely got it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="relative flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:p-24">
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center gap-2 lg:hidden"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold text-slate-900">
            Cogno
          </span>
        </Link>

        <div className="w-full max-w-md">
          <div className="text-center lg:text-left">
            <h2 className="font-display text-3xl font-bold text-slate-900">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="mt-2 text-slate-500">
              {isLogin
                ? "Enter your details to access your account."
                : "Sign up today to start your wellness journey."}
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}
            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-400">
                  Or continue with email
                </span>
              </div>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleEmailAuth}
            >
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      className="block w-full rounded-xl border-0 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#4F46E5] sm:text-sm sm:leading-6"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-xl border-0 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#4F46E5] sm:text-sm sm:leading-6"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {isLogin && (
                    <a
                      href="#"
                      className="text-sm font-semibold text-[#4F46E5] hover:text-[#3730A3]"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-xl border-0 bg-slate-50/50 py-3.5 pl-11 pr-11 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#4F46E5] sm:text-sm sm:leading-6"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="font-semibold text-[#4F46E5] hover:text-[#3730A3]"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


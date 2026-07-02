"use client";

/**
 * Cogno — Mental Health Support Platform
 * Single-page marketing site connecting students & individuals
 * with Peer Counsellors and Psychologists.
 *
 * Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · lucide-react
 */

import { useState } from "react";
import {
  Menu,
  X,
  Users,
  Brain,
  EyeOff,
  Wind,
  GraduationCap,
  Sparkles,
  MessageCircle,
  HeartPulse,
  Clock,
  Lock,
  Award,
  ShieldCheck,
  CalendarCheck,
  BookOpen,
  UserPlus,
  Compass,
  Handshake,
  Leaf,
  ClipboardCheck,
  PhoneCall,
  Star,
  ArrowRight,
  Mail,
  ChevronRight,
} from "lucide-react";
import React from "react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Static content — kept as data so the JSX below stays a clean set of maps  */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "auth" },
];

const STATS = [
  { icon: MessageCircle, value: "500+", label: "Sessions Held" },
  { icon: Users, value: "100+", label: "Peer Counsellors" },
  { icon: HeartPulse, value: "50+", label: "Psychologists" },
  { icon: Clock, value: "24/7", label: "Support Available" },
];

const SERVICES = [
  {
    icon: Users,
    title: "Peer Counselling",
    description:
      "Talk to trained student peers who understand what you're going through, in a judgment-free space.",
  },
  {
    icon: Brain,
    title: "Professional Therapy",
    description:
      "Book licensed psychologists for structured, evidence-based sessions tailored to your needs.",
  },
  {
    icon: EyeOff,
    title: "Anonymous Support",
    description:
      "Reach out without revealing your identity. Your privacy is protected at every step.",
  },
  {
    icon: Wind,
    title: "Stress Management",
    description:
      "Learn practical techniques to manage anxiety, burnout, and everyday overwhelm.",
  },
  {
    icon: GraduationCap,
    title: "Academic Guidance",
    description:
      "Navigate exam pressure, career choices, and academic stress with expert support.",
  },
  {
    icon: Sparkles,
    title: "Personal Development",
    description:
      "Build confidence, emotional resilience, and healthier habits with guided sessions.",
  },
];

const WHY_CHOOSE_US = [
  {
    icon: Lock,
    title: "Confidential Conversations",
    description: "Every conversation is encrypted and kept strictly private.",
  },
  {
    icon: Award,
    title: "Certified Professionals",
    description:
      "Every counsellor and psychologist is verified and credentialed.",
  },
  {
    icon: GraduationCap,
    title: "Student-Friendly Platform",
    description: "Designed around student schedules, budgets, and needs.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Inclusive Environment",
    description: "A welcoming space for everyone, regardless of background.",
  },
  {
    icon: CalendarCheck,
    title: "Quick Appointment Booking",
    description: "Book a session in under two minutes, whenever you need one.",
  },
  {
    icon: BookOpen,
    title: "Mental Wellness Resources",
    description: "Free articles, exercises, and tools to support your journey.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: UserPlus,
    step: "1",
    title: "Create Account",
    description: "Sign up in minutes with a secure, private profile.",
  },
  {
    icon: Compass,
    step: "2",
    title: "Choose Support Type",
    description: "Pick peer counselling, professional therapy, or both.",
  },
  {
    icon: Handshake,
    step: "3",
    title: "Connect with Expert",
    description:
      "Get matched with the right counsellor or psychologist for you.",
  },
  {
    icon: Leaf,
    step: "4",
    title: "Start Your Wellness Journey",
    description: "Begin sessions and track your progress at your own pace.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ananya R.",
    role: "Engineering Student",
    initials: "AR",
    review:
      "Cogno made it so much easier to talk about exam stress without feeling judged. My peer counsellor genuinely got it.",
  },
  {
    name: "Rahul Mehta",
    role: "Working Professional",
    initials: "RM",
    review:
      "Booking a psychologist between meetings used to feel impossible. Cogno's scheduling made therapy actually fit my life.",
  },
  {
    name: "Sunita Kulkarni",
    role: "Parent",
    initials: "SK",
    review:
      "I found a counsellor for my daughter within a day. The platform feels safe, warm, and genuinely caring.",
  },
];

const RESOURCES = [
  {
    icon: BookOpen,
    title: "Articles",
    description: "Bite-sized reads on stress, focus, and emotional wellbeing.",
  },
  {
    icon: Wind,
    title: "Meditation",
    description:
      "Guided breathing and mindfulness sessions to reset your mind.",
  },
  {
    icon: ClipboardCheck,
    title: "Self Assessment",
    description:
      "Quick, confidential check-ins to understand how you're doing.",
  },
  {
    icon: PhoneCall,
    title: "Emergency Help",
    description: "Immediate access to crisis support lines, any time of day.",
  },
];

const FOOTER_LINKS = {
  quick: [
    { label: "Home", href: "#home" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "auth" },
  ],
  services: [
    { label: "Peer Counselling", href: "#services" },
    { label: "Professional Therapy", href: "#services" },
    { label: "Stress Management", href: "#services" },
    { label: "Academic Guidance", href: "#services" },
  ],
};

const SOCIALS = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Global styles: smooth scroll, custom keyframes, font import */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");

        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        }
        .font-display {
          font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
        }

        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }
        .animate-breathe {
          animation: breathe 6s ease-in-out infinite;
        }
        .animate-breathe-slow {
          animation: breathe 9s ease-in-out infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out both;
        }
      `}</style>

      {/* ============================== NAVBAR ============================== */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-[#F8FAFC]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#home" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold text-slate-900">
              Cogno
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-[#4F46E5]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <a
              href="auth"
              className="rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Get Started
            </a>
          </div>

          <button
            aria-label="Toggle menu"
            className="text-slate-700 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 pb-6 pt-2 md:hidden">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-slate-600 hover:text-[#4F46E5]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="auth"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-5 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ============================== HERO ============================== */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-[#F8FAFC] to-[#F8FAFC] pt-16 sm:pt-20"
      >
        {/* Ambient background blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8B5CF6]/30 blur-3xl animate-breathe-slow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-[#EC4899]/20 blur-3xl animate-breathe"
        />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          {/* Left column */}
          <div className="relative z-10 animate-fade-in-up text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#4F46E5] shadow-sm ring-1 ring-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />A calmer way to be heard
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your Mental Health{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                Matters.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
              Connect with trusted Peer Counsellors and Professional
              Psychologists whenever you need support.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                Find a Peer Counsellor
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-md ring-1 ring-slate-200 transition-all duration-300 hover:scale-105 hover:text-[#4F46E5]"
              >
                Book a Psychologist
              </a>
            </div>
          </div>

          {/* Right column — illustration */}
          <div className="relative z-10 flex justify-center">
            <div className="relative h-72 w-72 sm:h-96 sm:w-96">
              {/* Background ambient square */}
              <div
                aria-hidden
                className="absolute -bottom-5 -left-5 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] opacity-90 shadow-lg animate-breathe"
              />
              {/* Image Container */}
              <div className="absolute inset-0 z-10 rounded-[2.5rem] bg-gradient-to-br from-white to-indigo-50 shadow-2xl shadow-indigo-100 ring-1 ring-indigo-100 overflow-hidden">
                <img
                  src="./surabi.png"
                  alt="Mental health illustration"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== STATS ============================== */}
      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-3xl bg-white p-6 text-center shadow-md shadow-slate-100 ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5]">
                <Icon className="h-6 w-6" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== SERVICES ============================== */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6]">
            Our Services
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Support, tailored to you
          </h2>
          <p className="mt-4 text-slate-600">
            Whatever you're navigating, there's a path built around your pace
            and comfort.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-indigo-100"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== WHY CHOOSE US ============================== */}
      <section className="bg-gradient-to-b from-indigo-50/60 to-transparent py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6]">
              Why Cogno
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Why students & individuals choose us
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE_US.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#EC4899]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6]">
            How It Works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Four simple steps to feeling better
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }, i) => (
            <div key={step} className="relative">
              <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <span className="font-display text-4xl font-extrabold text-indigo-100">
                  {step}
                </span>
                <div className="-mt-6 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#EC4899] text-white shadow-md">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <ChevronRight className="absolute right-[-22px] top-1/2 hidden h-6 w-6 -translate-y-1/2 text-indigo-200 lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================== TESTIMONIALS ============================== */}
      <section
        id="testimonials"
        className="bg-gradient-to-b from-indigo-50/60 to-transparent py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6]">
              Testimonials
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Stories from our community
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, initials, review }) => (
              <div
                key={name}
                className="flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex gap-1 text-[#EC4899]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{review}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-sm font-semibold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {name}
                    </p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== RESOURCES ============================== */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6]">
            Resources
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Mental health resources
          </h2>
          <p className="mt-4 text-slate-600">
            Free tools to support you between sessions — or on days you just
            need a moment to breathe.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5] transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-[#4F46E5] group-hover:to-[#8B5CF6] group-hover:text-white">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== CALL TO ACTION ============================== */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4F46E5] via-[#8B5CF6] to-[#EC4899] px-8 py-16 text-center shadow-2xl sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-breathe-slow"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-breathe"
          />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Take the First Step Towards Better Mental Health.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-indigo-50">
            You don't have to navigate this alone. Reach out today — support is
            closer than you think.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="auth"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#4F46E5] shadow-lg transition-all duration-300 hover:scale-105"
            >
              Talk to a Peer Counsellor
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="auth"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              Book a Psychologist
            </a>
          </div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer id="contact" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Logo & blurb */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] text-white">
                  <Leaf className="h-5 w-5" />
                </span>
                <span className="font-display text-xl font-bold text-slate-900">
                  Cogno
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                A calm, confidential space connecting you with peer counsellors
                and psychologists who care.
              </p>
              <div className="mt-5 flex gap-3">
                {SOCIALS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-indigo-50 hover:text-[#4F46E5]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-display text-sm font-semibold text-slate-900">
                Quick Links
              </h4>
              <ul className="mt-4 space-y-3">
                {FOOTER_LINKS.quick.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors duration-300 hover:text-[#4F46E5]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-display text-sm font-semibold text-slate-900">
                Services
              </h4>
              <ul className="mt-4 space-y-3">
                {FOOTER_LINKS.services.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors duration-300 hover:text-[#4F46E5]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-sm font-semibold text-slate-900">
                Get in Touch
              </h4>
              <a
                href="mailto:hello@cogno.com"
                className="mt-4 flex items-center gap-2 text-sm text-slate-500 transition-colors duration-300 hover:text-[#4F46E5]"
              >
                <Mail className="h-4 w-4" />
                hello@cogno.com
              </a>
              <p className="mt-3 text-sm text-slate-500">
                Available 24/7 for urgent support.
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-100 pt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Cogno. All rights reserved. Built with
            care for student & community wellbeing.
          </div>
        </div>
      </footer>
    </div>
  );
}

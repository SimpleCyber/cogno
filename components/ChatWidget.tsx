"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, X, Send, User, Loader2, 
  ChevronDown, MessageSquare, ShieldCheck 
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, addDoc, query, orderBy, 
  onSnapshot, doc, setDoc, updateDoc, 
  serverTimestamp, limit 
} from "firebase/firestore";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: any;
  isAdmin: boolean;
}

export default function ChatWidget({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const chatDocRef = doc(db, "chats", user.uid);
    const messagesQuery = query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    // Sync chat metadata (unread count)
    const unsubscribeMeta = onSnapshot(chatDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isOpen) {
          // If open, mark as read
          if (data.isUserUnread) {
            updateDoc(chatDocRef, { isUserUnread: false });
          }
        }
      }
    });

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      // We'll trust the Firestore snapshot for order
      if (isOpen) {
        setTimeout(scrollToBottom, 50);
      }
    });

    return () => {
      unsubscribeMeta();
      unsubscribeMessages();
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const chatDocRef = doc(db, "chats", user.uid);
      
      // Update or create the main chat document
      await setDoc(chatDocRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "User",
        userPhoto: user.photoURL || "",
        lastMessage: currentInput,
        lastTimestamp: serverTimestamp(),
        isAdminUnread: true,
        isUserUnread: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Add the message to subcollection
      await addDoc(collection(db, "chats", user.uid, "messages"), {
        senderId: user.uid,
        content: currentInput,
        timestamp: serverTimestamp(),
        isAdmin: false,
      });

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Floating Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#4F46E5] text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#4338CA] active:scale-95"
        >
          <MessageCircle className="h-8 w-8" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-4 ring-[#F8FAFC]">
              {unreadCount}
            </span>
          )}
          
          {/* Tooltip */}
          <div className="absolute right-20 scale-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all group-hover:scale-100 whitespace-nowrap">
            Chat with Admin
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[550px] w-[380px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                   <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Cogno Support</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-medium text-white/80">Admin is active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-3xl bg-indigo-50 p-4 text-[#4F46E5]">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-800">No messages yet</p>
                <p className="mt-1 text-xs font-medium text-slate-400 px-8">
                  Send a message to start a conversation with the admin.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isMe 
                        ? "bg-[#4F46E5] text-white rounded-br-none" 
                        : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                    }`}>
                      <p className="font-medium leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                        {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-2xl bg-slate-50 py-3.5 pl-5 pr-14 text-sm font-medium text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 rounded-xl bg-[#4F46E5] p-2 text-white transition-all hover:bg-[#4338CA] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Secured by Cogno Auth
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

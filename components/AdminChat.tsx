"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, Send, User, MessageSquare, 
  Clock, ShieldCheck, Loader2, CheckCheck,
  ChevronRight, Filter, X, Check
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, addDoc, serverTimestamp, 
  limit, where, getDocs 
} from "firebase/firestore";

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  lastTimestamp: any;
  isAdminUnread: boolean;
  isUserUnread: boolean;
  updatedAt: any;
  retestStatus?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: any;
  isAdmin: boolean;
}

export default function AdminChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch all chats
  useEffect(() => {
    const chatsQuery = query(
      collection(db, "chats"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(chatList);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "chats", selectedChat.userId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    });

    // Auto-scroll on chat change
    setTimeout(scrollToBottom, 100);

    // Sync retest request status — simple query (no composite index needed)
    const retestQuery = query(
       collection(db, "retest_requests"),
       where("userId", "==", selectedChat.userId)
    );
    const unsubscribeRetest = onSnapshot(retestQuery, (snap) => {
       if (!snap.empty) {
          // Find most recent by sorting client-side
          const sorted = snap.docs
             .map(d => ({ ...d.data(), _ref: d.ref }))
             .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
          setSelectedChat(prev => prev ? { ...prev, retestStatus: (sorted[0] as any).status } : prev);
       }
    });

    return () => {
       unsubscribe();
       unsubscribeRetest();
    };
  }, [selectedChat?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat) return;

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const chatDocRef = doc(db, "chats", selectedChat.userId);
      
      // Update chat metadata
      await updateDoc(chatDocRef, {
        lastMessage: currentInput,
        lastTimestamp: serverTimestamp(),
        isUserUnread: true,
        isAdminUnread: false,
        updatedAt: serverTimestamp(),
      });

      // Add message
      await addDoc(collection(db, "chats", selectedChat.userId, "messages"), {
        senderId: "admin",
        content: currentInput,
        timestamp: serverTimestamp(),
        isAdmin: true,
      });

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.userName.toLowerCase().includes(search.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-[85vh] lg:h-[calc(100vh-150px)] overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 relative">
      {/* Sidebar: Chat List */}
      <div className={`
        ${selectedChat ? 'hidden lg:flex' : 'flex'}
        flex-col w-full lg:w-[350px] border-r border-slate-100 bg-white z-20
      `}>
        <div className="p-4 border-b border-slate-50 bg-slate-50/10">
          <h2 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-tighter opacity-50 px-2 leading-none">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 placeholder:text-slate-300"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-10 text-center">
               <p className="text-sm font-bold text-slate-300 italic">No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-4 p-5 transition-all border-b border-slate-50 hover:bg-slate-50/50 ${selectedChat?.id === chat.id ? 'bg-indigo-50/50 border-l-4 border-l-[#4F46E5]' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white">
                    {chat.userPhoto ? <img src={chat.userPhoto} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs font-black text-slate-400">{chat.userName.charAt(0)}</div>}
                  </div>
                  {chat.isAdminUnread && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-extrabold truncate ${chat.isAdminUnread ? 'text-slate-900' : 'text-slate-700'}`}>{chat.userName}</p>
                     <p className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                      {chat.updatedAt ? new Date(typeof chat.updatedAt.toDate === 'function' ? chat.updatedAt.toDate() : chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </p>
                  </div>
                  <p className={`text-xs truncate ${chat.isAdminUnread ? 'text-[#4F46E5] font-bold' : 'text-slate-400 font-medium'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className={`
        ${selectedChat ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col bg-slate-50/10 z-30 lg:z-10 absolute inset-0 lg:relative
      `}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 lg:p-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-50">
                   {selectedChat.userPhoto ? <img src={selectedChat.userPhoto} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">{selectedChat.userName.charAt(0)}</div>}
                </div>
                <div className="min-w-0">
                   <h3 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px] lg:max-w-none">{selectedChat.userName}</h3>
                   <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</p>
                   </div>
                </div>
              </div>
                <div className="flex items-center gap-1 lg:gap-3">
                    <button className="hidden lg:flex p-2 text-slate-400 hover:text-slate-600 transition"><Clock className="h-5 w-5" /></button>
                    {selectedChat.isAdminUnread && (
                      <button 
                          onClick={async () => {
                            const chatDocRef = doc(db, "chats", selectedChat.userId);
                            await updateDoc(chatDocRef, { isAdminUnread: false });
                            setSelectedChat({...selectedChat, isAdminUnread: false});
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg ring-1 ring-emerald-100 hover:bg-emerald-100 transition active:scale-95 flex items-center gap-1 whitespace-nowrap"
                      >
                          <Check className="h-3.5 w-3.5" /> Resolve
                      </button>
                    )}
                 </div>
             </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-4">
              {messages.map((msg, idx) => {
                const isAdmin = msg.isAdmin;
                return (
                  <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className="flex flex-col gap-2 max-w-[85%] lg:max-w-[70%]">
                      <div className={`p-4 rounded-2xl text-sm shadow-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : (msg.content.startsWith('[SYSTEM REQUEST]') ? 'bg-amber-50 border-amber-200 text-amber-900 ring-1 ring-amber-100' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none')}`}>
                        <p className="font-bold leading-relaxed whitespace-pre-wrap text-[13px] lg:text-sm">
                           {msg.content.startsWith('[SYSTEM REQUEST]') 
                              ? msg.content.split(':').slice(1).join(':').trim() 
                              : msg.content}
                        </p>
                        {msg.content.startsWith('[SYSTEM REQUEST]') && !isAdmin && (
                           <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap gap-2">
                              <button 
                                 onClick={async () => {
                                    try {
                                       const q = query(collection(db, "retest_requests"), where("userId", "==", selectedChat.userId), where("status", "==", "pending"));
                                       const snap = await getDocs(q);
                                       if (!snap.empty) {
                                          await updateDoc(snap.docs[0].ref, { status: 'approved' });
                                          await addDoc(collection(db, "chats", selectedChat.userId, "messages"), {
                                             senderId: "admin",
                                             content: "Your retest request has been APPROVED. You can now retake the assessment.",
                                             timestamp: serverTimestamp(),
                                             isAdmin: true
                                          });
                                          alert("Request approved.");
                                       }
                                    } catch (err) { console.error(err); }
                                 }}
                                 className="flex-1 px-3 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-700 transition shadow-md"
                              >
                                 Approve
                              </button>
                              <button 
                                 onClick={async () => {
                                    try {
                                       const q = query(collection(db, "retest_requests"), where("userId", "==", selectedChat.userId), where("status", "==", "pending"));
                                       const snap = await getDocs(q);
                                       if (!snap.empty) {
                                          await updateDoc(snap.docs[0].ref, { status: 'denied' });
                                          await addDoc(collection(db, "chats", selectedChat.userId, "messages"), {
                                             senderId: "admin",
                                             content: "Your retest request has been declined.",
                                             timestamp: serverTimestamp(),
                                             isAdmin: true
                                          });
                                          alert("Request denied.");
                                       }
                                    } catch (err) { console.error(err); }
                                 }}
                                 className="flex-1 px-3 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition shadow-md"
                              >
                                 Deny
                              </button>
                           </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
                           {msg.timestamp ? new Date(typeof msg.timestamp.toDate === 'function' ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
                         </p>
                         {isAdmin && <CheckCheck className="h-3 w-3 text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Bar */}
            <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex items-center gap-3 safe-bottom">
               <form onSubmit={handleSendMessage} className="relative flex-1 flex items-center group">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-3.5 lg:py-4 pl-5 lg:pl-6 pr-14 text-[13px] lg:text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:text-slate-300"
                  />
                  <button 
                    disabled={!input.trim() || loading}
                    className="absolute right-2 p-2 lg:p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-100"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 lg:h-5 lg:w-5" />}
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 lg:p-20">
             <div className="h-16 w-16 lg:h-20 lg:w-20 bg-indigo-50 rounded-[24px] lg:rounded-3xl flex items-center justify-center text-[#4F46E5] mb-6 animate-bounce duration-[3000ms]">
                <MessageSquare className="h-8 w-8 lg:h-10 lg:w-10" />
             </div>
             <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none">Admin Messages</h2>
             <p className="mt-3 text-sm lg:text-base text-slate-400 font-medium max-w-[280px] lg:max-w-sm leading-relaxed">Select a conversation from the sidebar to view full history and manage requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}
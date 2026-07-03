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

    // Sync retest request status
    const retestQuery = query(
       collection(db, "retest_requests"),
       where("userId", "==", selectedChat.userId),
       orderBy("timestamp", "desc"),
       limit(1)
    );
    const unsubscribeRetest = onSnapshot(retestQuery, (snap) => {
       if (!snap.empty) {
          setSelectedChat(prev => prev ? { ...prev, retestStatus: snap.docs[0].data().status } : prev);
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
    <div className="flex h-[calc(100vh-150px)] overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
      {/* Sidebar: Chat List */}
      <div className="w-[350px] flex flex-col border-r border-slate-100">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <h2 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-tighter">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-slate-400"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-10 text-center">
               <p className="text-sm font-bold text-slate-400">No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-4 p-5 transition-all border-b border-slate-50 hover:bg-slate-50/50 ${selectedChat?.id === chat.id ? 'bg-indigo-50/50 border-l-4 border-l-[#4F46E5]' : ''}`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white">
                    {chat.userPhoto ? <img src={chat.userPhoto} alt="" /> : <div className="h-full w-full flex items-center justify-center text-xs font-black text-slate-400">{chat.userName.charAt(0)}</div>}
                  </div>
                  {chat.isAdminUnread && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-bold ${chat.isAdminUnread ? 'text-slate-900' : 'text-slate-700'}`}>{chat.userName}</p>
                     <p className="text-[10px] font-bold text-slate-400">
                      {chat.updatedAt ? new Date(typeof chat.updatedAt.toDate === 'function' ? chat.updatedAt.toDate() : chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </p>
                  </div>
                  <p className={`text-xs truncate max-w-[180px] ${chat.isAdminUnread ? 'text-[#4F46E5] font-bold' : 'text-slate-400 font-medium'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 flex flex-col bg-slate-50/20">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-50">
                   {selectedChat.userPhoto ? <img src={selectedChat.userPhoto} alt="" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">{selectedChat.userName.charAt(0)}</div>}
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900 leading-none">{selectedChat.userName}</h3>
                   <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Active</p>
                </div>
              </div>
               <div className="flex items-center gap-3">
                  {selectedChat.isAdminUnread && (
                    <button 
                       onClick={async () => {
                          const chatDocRef = doc(db, "chats", selectedChat.userId);
                          await updateDoc(chatDocRef, { isAdminUnread: false });
                          setSelectedChat({...selectedChat, isAdminUnread: false});
                       }}
                       className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg ring-1 ring-emerald-100 hover:bg-emerald-100 transition active:scale-95 flex items-center gap-2"
                    >
                       <ShieldCheck className="h-3 w-3" /> Query Resolved
                    </button>
                  )}
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition"><Clock className="h-5 w-5" /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition"><Filter className="h-5 w-5" /></button>
               </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isAdmin = msg.isAdmin;
                return (
                  <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className="flex flex-col gap-1.5 max-w-[70%]">
                      <div className={`p-4 rounded-2xl text-sm shadow-sm ${isAdmin ? 'bg-[#4F46E5] text-white rounded-br-none' : (msg.content.startsWith('[SYSTEM REQUEST]') ? 'bg-amber-50 border-amber-200 text-amber-900 ring-1 ring-amber-100' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none')}`}>
                        <p className="font-semibold leading-relaxed">
                           {msg.content.startsWith('[SYSTEM REQUEST]') 
                              ? msg.content.split(':').slice(1).join(':').trim() 
                              : msg.content}
                        </p>
                        {msg.content.startsWith('[SYSTEM REQUEST]') && !isAdmin && selectedChat.retestStatus === 'pending' && (
                           <div className="mt-4 pt-4 border-t border-amber-200 flex gap-2">
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
                                 className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-700 transition shadow-md"
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
                                 className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition shadow-md"
                              >
                                 Deny
                              </button>
                           </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                           {msg.timestamp ? new Date(typeof msg.timestamp.toDate === 'function' ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
                         </p>
                         {isAdmin && <CheckCheck className="h-3 w-3 text-[#4F46E5]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-white border-t border-slate-100">
               <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Reply to ${selectedChat.userName}...`}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-6 pr-16 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button 
                    disabled={!input.trim() || loading}
                    className="absolute right-2 p-2.5 bg-[#4F46E5] text-white rounded-xl hover:bg-[#4338CA] transition-all disabled:opacity-50 active:scale-95"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
             <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-[#4F46E5] mb-6">
                <MessageSquare className="h-10 w-10" />
             </div>
             <h2 className="text-2xl font-extrabold text-slate-900">Your Communication Hub</h2>
             <p className="mt-2 text-slate-500 font-medium max-w-sm">Select a user from the left pane to start chatting or viewing their message history.</p>
             <button className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition">View help center</button>
          </div>
        )}
      </div>
    </div>
  );
}

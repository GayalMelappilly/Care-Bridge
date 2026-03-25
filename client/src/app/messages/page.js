"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import {
    getMyMentor, getMyClients,
    getSharedFiles, uploadFile
} from "../../services/api";
import { useChat } from "../../hooks/useChat";
import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") || "http://localhost:5000";

const Messages = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const callSocketRef = useRef(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const { messages, sendMessage: sendChatMessage, loadMessages } = useChat({
        token,
        user,
        contactId: selectedContact?.user_id
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchContacts();
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        callSocketRef.current = io(socketUrl, { auth: { token } });
        callSocketRef.current.on("call:invite", (payload) => {
            setIncomingCall(payload);
        });
        callSocketRef.current.on("call:end", () => {
            setIncomingCall(null);
        });
        callSocketRef.current.on("call:decline", () => {
            setIncomingCall(null);
        });

        return () => {
            callSocketRef.current?.disconnect();
        };
    }, [isAuthenticated]);

    const handleAcceptCall = () => {
        if (!incomingCall) return;
        const fromId = incomingCall.fromUser?.id || incomingCall.fromUserId;
        callSocketRef.current?.emit("call:accept", { toUserId: fromId, callId: incomingCall.callId });
        setIncomingCall(null);
        router.push(`/call/${incomingCall.callId}?peer=${fromId}&role=callee`);
    };

    const handleDeclineCall = () => {
        if (!incomingCall) return;
        const fromId = incomingCall.fromUser?.id || incomingCall.fromUserId;
        callSocketRef.current?.emit("call:decline", { toUserId: fromId, callId: incomingCall.callId });
        setIncomingCall(null);
    };

    useEffect(() => {
        if (selectedContact) {
            fetchChatData(selectedContact.user_id);
            loadMessages();
        }
    }, [selectedContact, loadMessages]);

    useEffect(() => {
        // Auto scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem("token");
            if (user?.role === "parent") {
                const mentor = await getMyMentor(token);
                if (mentor) {
                    setContacts([mentor]);
                    setSelectedContact(mentor);
                }
            } else if (user?.role === "mentor") {
                const clients = await getMyClients(token);
                setContacts(clients);
                if (clients.length > 0) {
                    setSelectedContact(clients[0]);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchChatData = async (contactId) => {
        try {
            const token = localStorage.getItem("token");
            const files = await getSharedFiles(token, contactId);
            setSharedFiles(files);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            await sendChatMessage(newMessage);
            setNewMessage("");
            fetchChatData(selectedContact.user_id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedContact) return;

        try {
            setUploading(true);
            const token = localStorage.getItem("token");
            await uploadFile(token, selectedContact.user_id, file);
            // Re-fetch files
            fetchChatData(selectedContact.user_id);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const startCall = () => {
        if (!selectedContact || !user?.user_id) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        const callId = `call-${user.user_id}-${selectedContact.user_id}-${Date.now()}`;
        const socket = io(socketUrl, { auth: { token } });
        socket.on("connect", () => {
            socket.emit("call:invite", {
                toUserId: Number(selectedContact.user_id),
                callId,
                fromUser: { id: user.user_id, name: user.name }
            });
            setTimeout(() => socket.disconnect(), 500);
        });
        socket.on("connect_error", () => {
            socket.disconnect();
        });
        router.push(`/call/${callId}?peer=${selectedContact.user_id}&role=caller`);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-96px)]">
                {incomingCall && (
                    <div className="bg-indigo-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg mb-6">
                        <div className="text-sm font-medium">
                            Incoming call from <span className="font-semibold">{incomingCall.fromUser?.name || "Contact"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeclineCall}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptCall}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                )}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex-1 flex flex-col lg:flex-row overflow-hidden animate-fadeIn">
                    
                    {/* Contacts Sidebar */}
                    <div className="w-full lg:w-1/3 lg:max-w-[320px] bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">
                                {user?.role === 'parent' ? 'My Mentor' : 'My Clients'}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {contacts.length > 0 ? contacts.map(contact => (
                                <button
                                    key={contact.user_id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                                        selectedContact?.user_id === contact.user_id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                                    }`}
                                >
                                    <p className="font-semibold">{contact.name}</p>
                                    <p className={`text-sm ${selectedContact?.user_id === contact.user_id ? 'text-indigo-100' : 'text-gray-500'}`}>
                                        {user?.role === 'parent' ? 'Mentor' : 'Parent'}
                                    </p>
                                </button>
                            )) : (
                                <div className="text-center p-6 text-gray-500 text-sm">
                                    No connections found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area & Shared Files */}
                    {selectedContact ? (
                        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
                            {/* Main Chat */}
                            <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-gray-100">
                                <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedContact.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            Chat securely in real-time
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={startCall}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                                    >
                                        Start Video Call
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                                    {messages.map(msg => {
                                        const isMine = msg.sender_id === user.user_id;
                                        const statusLabel = msg.status === "sending" ? "Sending..." : msg.status === "failed" ? "Failed" : "Sent";
                                        return (
                                            <div key={msg.message_id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                                                    isMine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                                }`}>
                                                    <p>{msg.content}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 mt-1 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    {isMine && <span className="ml-2">{statusLabel}</span>}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 bg-gray-50"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim()}
                                            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Shared Files Sidebar */}
                            <div className="w-full lg:w-1/3 lg:max-w-[280px] bg-white flex flex-col shrink-0">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Shared Files</h3>
                                    <label className="cursor-pointer bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors" title="Upload File">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {uploading && (
                                        <div className="text-center text-sm text-indigo-600 py-3 animate-pulse bg-indigo-50 rounded-xl">
                                            Uploading...
                                        </div>
                                    )}
                                    {sharedFiles.length > 0 ? sharedFiles.map(file => (
                                        <a key={file.file_id} href={`${backendUrl}${file.file_url}`} target="_blank" rel="noopener noreferrer" 
                                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate" title={file.file_name}>{file.file_name}</p>
                                                <p className="text-xs text-gray-500">{new Date(file.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </a>
                                    )) : (
                                        <div className="text-center text-sm text-gray-400 py-10">
                                            No files shared yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-4 text-gray-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            <p className="text-lg">Select a connection to start messaging</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Messages;

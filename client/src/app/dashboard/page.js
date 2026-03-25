"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getChildren, addChild, getGrowthLogs, addGrowthLog,
    getMentors, connectMentor, getMyMentor, getMyClients,
    getSessions, createSession, getActivities, addActivity, updateActivity,
    getObservations, addObservation
} from "../../services/api";
import GrowthChart from "../../components/GrowthChart";
import ProgressChart from "../../components/ProgressChart";
import ObservationChart from "../../components/ObservationChart";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") || "http://localhost:5000";

const Dashboard = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [growthLogs, setGrowthLogs] = useState([]);

    // Mentor/Session States
    const [myMentor, setMyMentor] = useState(null);
    const [myClients, setMyClients] = useState([]);
    const [mentors, setMentors] = useState([]); // For browsing
    const [mentorSearch, setMentorSearch] = useState("");
    const [sessions, setSessions] = useState([]);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [newSession, setNewSession] = useState({ title: "", description: "", start_time: "", parent_id: "" });


    // Form states
    const [showAddChild, setShowAddChild] = useState(false);
    const [newChild, setNewChild] = useState({ name: "", date_of_birth: "", gender: "", diagnosis_date: "", diagnosis_details: "", bio: "" });
    const [showAddLog, setShowAddLog] = useState(false);
    const [newLog, setNewLog] = useState({ height_cm: "", weight_kg: "", head_circumference_cm: "", note: "", category: "Physical", value: "" });

    // Activity States
    const [activities, setActivities] = useState([]);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [newActivity, setNewActivity] = useState({ title: "", description: "", activity_type: "learning", scheduled_time: "" });
    const [ratingModal, setRatingModal] = useState({ show: false, activity: null, rating: 5, feedback: "" });

    // Daily Observation States
    const [observations, setObservations] = useState([]);
    const [showObservation, setShowObservation] = useState(false);
    const [observationStep, setObservationStep] = useState(0);
    const [newObservation, setNewObservation] = useState({
        mood: "good",
        sleep_quality: "good",
        appetite_level: "ok",
        notes: ""
    });

    // Incoming call (parent dashboard)
    const [incomingCall, setIncomingCall] = useState(null);
    const callSocketRef = useRef(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            if (user?.role === 'parent') {
                fetchChildren();
                fetchMyMentor();
                fetchSessions();
            } else if (user?.role === 'mentor') {
                fetchSessions();
                fetchMyClients();
            }
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== "parent") return;
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
    }, [isAuthenticated, user?.role]);

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

    // --- Data Fetching ---
    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getChildren(token);
            setChildren(data);
            if (data.length > 0 && !selectedChild) {
                handleSelectChild(data[0]);
            }
        } catch (err) { console.error(err); }
    };

    const fetchMyMentor = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getMyMentor(token);
            setMyMentor(data);
            if (!data) {
                const list = await getMentors(token);
                setMentors(list);
            }
        } catch (err) { console.error(err); }
    };

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getSessions(token);
            setSessions(data);
        } catch (err) { console.error(err); }
    };

    const fetchMyClients = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getMyClients(token);
            setMyClients(data);
        } catch (err) { console.error(err); }
    };

    const openClientFolder = (client) => {
        router.push(`/mentor/client/${client.user_id}`);
    };

    // --- Handlers ---
    const handleSelectChild = async (child) => {
        setSelectedChild(child);
        try {
            const token = localStorage.getItem("token");
            const [logs, acts, obs] = await Promise.all([
                getGrowthLogs(token, child.child_id),
                getActivities(token, child.child_id),
                getObservations(token, child.child_id)
            ]);
            setGrowthLogs(logs);
            setActivities(acts);
            setObservations(obs);
        } catch (err) { console.error(err); }
    };

    const handleConnectMentor = async (mentorId) => {
        try {
            const token = localStorage.getItem("token");
            await connectMentor(token, mentorId);
            fetchMyMentor();
            fetchSessions();
        } catch (err) { alert("Failed to connect"); console.error(err); }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await createSession(token, {
                ...newSession,
                parent_id: newSession.parent_id ? Number(newSession.parent_id) : null
            });
            setShowCreateSession(false);
            setNewSession({ title: "", description: "", start_time: "", parent_id: "" });
            fetchSessions();
        } catch (err) { console.error(err); }
    };

    const startSessionCall = (session) => {
        if (!session?.parent_id || !user?.user_id) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        const callId = `call-${user.user_id}-${session.parent_id}-${Date.now()}`;
        const socket = io(socketUrl, { auth: { token } });
        socket.on("connect", () => {
            socket.emit("call:invite", {
                toUserId: Number(session.parent_id),
                callId,
                fromUser: { id: user.user_id, name: user.name }
            });
            setTimeout(() => socket.disconnect(), 500);
        });
        socket.on("connect_error", () => {
            socket.disconnect();
        });
        router.push(`/call/${callId}?peer=${session.parent_id}&role=caller&sessionId=${session.session_id}`);
    };

    const handleAddChild = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await addChild(token, newChild);
            setShowAddChild(false);
            setNewChild({ name: "", date_of_birth: "", gender: "", diagnosis_date: "", diagnosis_details: "", bio: "" });
            fetchChildren();
        } catch (err) { console.error(err); }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const payload = {
                ...newLog,
                height_cm: parseFloat(newLog.height_cm),
                weight_kg: parseFloat(newLog.weight_kg),
                head_circumference_cm: parseFloat(newLog.head_circumference_cm),
                value: newLog.value ? parseFloat(newLog.value) : null
            };
            await addGrowthLog(token, selectedChild.child_id, payload);
            setShowAddLog(false);
            setNewLog({ height_cm: "", weight_kg: "", head_circumference_cm: "", note: "", category: "Physical", value: "" });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await addActivity(token, selectedChild.child_id, newActivity);
            setShowAddActivity(false);
            setNewActivity({ title: "", description: "", activity_type: "learning", scheduled_time: "" });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    const handleRateActivity = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await updateActivity(token, ratingModal.activity.activity_id, {
                status: 'completed',
                rating: parseInt(ratingModal.rating),
                feedback: ratingModal.feedback
            });
            setRatingModal({ show: false, activity: null, rating: 5, feedback: "" });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    const handleAddObservation = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await addObservation(token, selectedChild.child_id, newObservation);
            setShowObservation(false);
            setObservationStep(0);
            setNewObservation({
                mood: "good",
                sleep_quality: "good",
                appetite_level: "ok",
                notes: ""
            });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    const calculateAge = (dob) => {
        const diff = new Date() - new Date(dob);
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const filteredMentors = mentors.filter((mentor) => {
        const query = mentorSearch.trim().toLowerCase();
        if (!query) return true;
        return (
            mentor.name?.toLowerCase().includes(query) ||
            mentor.email?.toLowerCase().includes(query) ||
            mentor.specialty?.toLowerCase().includes(query) ||
            mentor.credentials?.toLowerCase().includes(query)
        );
    });
    const upcomingSessions = sessions.filter(s => s.status !== 'completed');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {user?.role === 'mentor' ? (
                    // --- MENTOR VIEW ---
                    <div className="space-y-10 animate-fadeIn">
                        {/* Mentor Header */}
                        <div className="relative overflow-hidden rounded-[28px] border border-indigo-200/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 p-8 md:p-10 text-white shadow-2xl">
                            <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl"></div>
                            <div className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                        Mentor Hub
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-bold mt-4">Mentor Dashboard</h1>
                                    <p className="mt-2 text-sm md:text-base text-indigo-100/90 max-w-xl">
                                        Welcome back, {user?.name}. Manage sessions, track progress, and keep parents aligned.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-full bg-white/10 px-3 py-1">Upcoming sessions: {upcomingSessions.length}</span>
                                        <span className="rounded-full bg-white/10 px-3 py-1">Active clients: {myClients.length}</span>
                                        <span className="rounded-full bg-white/10 px-3 py-1">Completed sessions: {completedSessions.length}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateSession(!showCreateSession)}
                                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-500/20 ring-1 ring-white/40 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                                >
                                    <span>{showCreateSession ? 'Cancel' : '+ Schedule Session'}</span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 transition group-hover:bg-indigo-600"></span>
                                </button>
                            </div>
                        </div>

                        {/* Create Session Form */}
                        {showCreateSession && (
                            <div className="rounded-3xl border border-indigo-100 bg-white/90 p-8 shadow-xl shadow-indigo-100/40 backdrop-blur animate-fadeIn mb-8">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">Schedule New Session</h3>
                                        <p className="text-sm text-gray-500 mt-1">Pick the client, time, and focus for the session.</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                        In-app video session
                                    </span>
                                </div>
                                <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
                                        <input required type="text" value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" placeholder="e.g. Weekly Group Therapy" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                        <input required type="datetime-local" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                                        <select
                                            required
                                            value={newSession.parent_id}
                                            onChange={e => setNewSession({ ...newSession, parent_id: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                        >
                                            <option value="">Select a client</option>
                                            {myClients.map(client => (
                                                <option key={client.user_id} value={client.user_id}>
                                                    {client.name} ({client.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea rows="3" value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" placeholder="Session details..."></textarea>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowCreateSession(false)} className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                                        <button type="submit" className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-2.5 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40">Schedule Session</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Sessions List */}
                            <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Upcoming Sessions</h3>
                                        <p className="text-sm text-gray-500">Start the call when both sides are ready.</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                        {upcomingSessions.length} scheduled
                                    </span>
                                </div>
                                {upcomingSessions.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingSessions.map(session => (
                                            <div key={session.session_id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
                                                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{session.title}</h4>
                                                        <p className="text-sm text-gray-500 mt-1">{new Date(session.start_time).toLocaleString()}</p>
                                                        <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                                                    </div>
                                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                                        {session.parent_name && (
                                                            <span className="text-xs text-gray-500">Client: {session.parent_name}</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => startSessionCall(session)}
                                                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/40"
                                                        >
                                                            Start Call
                                                            <span className="h-1.5 w-1.5 rounded-full bg-white/80"></span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-gray-500">No sessions scheduled yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Clients List (Placeholder) */}
                            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur h-fit">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">My Clients</h3>
                                        <p className="text-sm text-gray-500">Access profiles and session history.</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        {myClients.length} active
                                    </span>
                                </div>
                                {myClients.length > 0 ? (
                                    <div className="space-y-4">
                                        {myClients.map(client => {
                                            const initials = client.name
                                                ? client.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()
                                                : "CL";
                                            return (
                                                <div key={client.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{client.name}</p>
                                                            <p className="text-xs text-gray-500">{client.email}</p>
                                                            {client.children_names && client.children_names.length > 0 && (
                                                                <div className="mt-2 flex gap-1 flex-wrap">
                                                                    {client.children_names.map((child, idx) => (
                                                                        <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                                                            {child}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openClientFolder(client)}
                                                        className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        aria-label={`Open ${client.name}'s folder`}
                                                        title="Open client folder"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-gray-400">No active clients found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    // --- PARENT VIEW ---
                    <div className="space-y-10 animate-fadeIn">
                        {incomingCall && (
                            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 p-4 text-white shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="text-sm font-semibold">
                                        Incoming call from <span className="font-bold">{incomingCall.fromUser?.name || "Mentor"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDeclineCall}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={handleAcceptCall}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50"
                                        >
                                            Join Call
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Header */}
                        <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-8 md:p-10 shadow-xl shadow-indigo-100/50">
                            <div className="absolute -top-20 -right-10 h-44 w-44 rounded-full bg-indigo-200/40 blur-3xl"></div>
                            <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                                        Parent Dashboard
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
                                        {selectedChild ? `Overview for ${selectedChild.name}` : "Welcome to CareBridge"}
                                    </h1>
                                    <p className="mt-2 text-sm md:text-base text-gray-600 max-w-xl">
                                        Track growth, manage schedules, and monitor progress with your mentor.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                                        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Children: {children.length}</span>
                                        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Activities: {activities.length}</span>
                                        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Observations: {observations.length}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddChild(!showAddChild)}
                                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-500/40"
                                >
                                    <span>{showAddChild ? 'Cancel' : 'Add Child Profile'}</span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-white/80"></span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                {/* Child UI */}
                                {showAddChild && (
                                    <div className="mb-10 rounded-3xl border border-indigo-100 bg-white/90 p-8 shadow-xl shadow-indigo-100/40 backdrop-blur animate-fadeIn">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">Create New Profile</h3>
                                                <p className="text-sm text-gray-500 mt-1">Add the essentials so your mentor can personalize support.</p>
                                            </div>
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Profile setup</span>
                                        </div>
                                        <form onSubmit={handleAddChild} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Child's Name</label>
                                                <input type="text" required value={newChild.name} onChange={e => setNewChild({ ...newChild, name: e.target.value })} className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50" placeholder="e.g. Alex" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                                <input type="date" required value={newChild.date_of_birth} onChange={e => setNewChild({ ...newChild, date_of_birth: e.target.value })} className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender (Optional)</label>
                                                <select value={newChild.gender} onChange={e => setNewChild({ ...newChild, gender: e.target.value })} className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50">
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Date (Optional)</label>
                                                <input type="date" value={newChild.diagnosis_date} onChange={e => setNewChild({ ...newChild, diagnosis_date: e.target.value })} className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Details (Optional)</label>
                                                <textarea
                                                    rows="2"
                                                    value={newChild.diagnosis_details}
                                                    onChange={e => setNewChild({ ...newChild, diagnosis_details: e.target.value })}
                                                    className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50"
                                                    placeholder="e.g. Level 1 ASD, speech delay"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Notes (Optional)</label>
                                                <textarea
                                                    rows="2"
                                                    value={newChild.bio}
                                                    onChange={e => setNewChild({ ...newChild, bio: e.target.value })}
                                                    className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-gray-50"
                                                    placeholder="Strengths, interests, sensitivities..."
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex justify-end mt-4">
                                                <button type="submit" className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">Create Profile</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {children.length > 0 ? (
                                    <div className="mb-10 pl-10 flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                                        {children.map(child => (
                                            <button
                                                key={child.child_id}
                                                onClick={() => handleSelectChild(child)}
                                                className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold leading-none transition-all duration-300 ${
                                                    selectedChild?.child_id === child.child_id
                                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-105 ring-1 ring-white/30'
                                                        : 'bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-inset ring-gray-200 hover:ring-indigo-200'
                                                }`}
                                            >
                                                {child.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 mb-10">
                                        <div className="text-6xl mb-4">👶</div>
                                        <h3 className="text-xl font-medium text-gray-900">No profiles yet</h3>
                                    </div>
                                )}

                                {selectedChild && (
                                    <div className="space-y-8 animate-fadeIn">
                                        {/* Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
                                                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-slate-700 to-slate-900"></div>
                                                <p className="mt-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Age</p>
                                                <p className="mt-2 text-4xl font-bold text-gray-900">{calculateAge(selectedChild.date_of_birth)}<span className="text-lg font-medium text-gray-400 ml-1">years</span></p>
                                            </div>
                                            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-lg shadow-indigo-100/50">
                                                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"></div>
                                                <p className="mt-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Latest Height</p>
                                                <p className="mt-2 text-4xl font-bold text-indigo-600">{growthLogs[0]?.height_cm || '-'}<span className="text-lg font-medium text-gray-400 ml-1">cm</span></p>
                                            </div>
                                            <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-lg shadow-violet-100/50">
                                                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"></div>
                                                <p className="mt-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Latest Weight</p>
                                                <p className="mt-2 text-4xl font-bold text-violet-600">{growthLogs[0]?.weight_kg || '-'}<span className="text-lg font-medium text-gray-400 ml-1">kg</span></p>
                                            </div>
                                        </div>

                                        {/* Growth & Progress Charts */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                            <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60 overflow-hidden">
                                                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                                                    <h3 className="font-bold text-gray-900">Physical Growth</h3>
                                                    <button onClick={() => setShowAddLog(!showAddLog)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">{showAddLog ? 'Cancel' : '+ Add Log'}</button>
                                                </div>
                                                {showAddLog && (
                                                    <div className="modal-overlay">
                                                        <div className="modal-card modal-lg animate-slideDown">
                                                            <div className="modal-header">
                                                                <div>
                                                                    <h4 className="text-lg font-semibold text-gray-900">Add Growth Log</h4>
                                                                    <p className="text-sm text-gray-500">Enter today’s measurements and notes.</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowAddLog(false)}
                                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                            <form onSubmit={handleAddLog} className="modal-body grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                                                    <select value={newLog.category} onChange={e => setNewLog({...newLog, category: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 bg-white">
                                                                        <option value="Physical">Physical</option>
                                                                        <option value="Behavioral">Behavioral</option>
                                                                        <option value="Developmental">Developmental</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Value (Optional)</label>
                                                                    <input type="number" step="0.1" value={newLog.value} onChange={e => setNewLog({...newLog, value: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 placeholder:opacity-100" placeholder="e.g. 12.5" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                                                                    <input type="number" step="0.1" required value={newLog.height_cm} onChange={e => setNewLog({...newLog, height_cm: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 placeholder:opacity-100" placeholder="e.g. 98.4" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                                                                    <input type="number" step="0.1" required value={newLog.weight_kg} onChange={e => setNewLog({...newLog, weight_kg: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 placeholder:opacity-100" placeholder="e.g. 15.2" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Head Circumference (cm)</label>
                                                                    <input type="number" step="0.1" value={newLog.head_circumference_cm} onChange={e => setNewLog({...newLog, head_circumference_cm: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 placeholder:opacity-100" placeholder="e.g. 48.1" />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                                                    <textarea rows="3" value={newLog.note} onChange={e => setNewLog({...newLog, note: e.target.value})} className="w-full border rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 placeholder:opacity-100" placeholder="Anything notable today?" />
                                                                </div>
                                                                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                                                                    <button type="button" onClick={() => setShowAddLog(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-colors">Save Log</button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-4"><GrowthChart logs={growthLogs} /></div>
                                            </div>

                                            <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60 overflow-hidden">
                                                <div className="p-6 border-b border-slate-200 bg-white">
                                                    <h3 className="font-bold text-gray-900">Performance & Rating Progress</h3>
                                                </div>
                                                <div className="p-4"><ProgressChart activities={activities} /></div>
                                            </div>
                                        </div>

                                        {/* Daily Observations */}
                                        <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60 overflow-hidden">
                                            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">Daily Observations</h3>
                                                    <p className="text-sm text-gray-500">Mood, sleep, and appetite tracking.</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowObservation(true)}
                                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                                >
                                                    + Log Observation
                                                </button>
                                            </div>
                                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <div className="lg:col-span-2">
                                                    <ObservationChart observations={observations} />
                                                </div>
                                                <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 h-fit">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Latest Check-In</h4>
                                                    {observations[0] ? (
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Mood</span>
                                                                <span className="font-semibold text-gray-900 capitalize">{observations[0].mood || '-'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Sleep</span>
                                                                <span className="font-semibold text-gray-900 capitalize">{observations[0].sleep_quality || '-'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-500">Appetite</span>
                                                                <span className="font-semibold text-gray-900 capitalize">{observations[0].appetite_level || '-'}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 pt-2 border-t border-indigo-100">
                                                                {new Date(observations[0].observed_at).toLocaleDateString()}
                                                            </p>
                                                            {observations[0].notes && (
                                                                <p className="text-xs text-gray-600 italic">"{observations[0].notes}"</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">No observations yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activities / Tasks */}
                                        <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60 overflow-hidden">
                                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                                                <h3 className="font-bold text-gray-900">Assigned Activities</h3>
                                                <button onClick={() => setShowAddActivity(!showAddActivity)} className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/40 transition">
                                                    {showAddActivity ? 'Cancel' : '+ Assign Task'}
                                                </button>
                                            </div>

                                            {showAddActivity && (
                                                <div className="p-6 border-b border-slate-200 bg-indigo-50/30 animate-slideDown">
                                                    <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <input required type="text" value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})} placeholder="Task Title" className="border-gray-200 rounded-xl p-3 bg-white" />
                                                        <select value={newActivity.activity_type} onChange={e => setNewActivity({...newActivity, activity_type: e.target.value})} className="border-gray-200 rounded-xl p-3 bg-white">
                                                            <option value="speech">Speech</option><option value="learning">Learning</option><option value="therapy">Therapy</option><option value="play">Play</option>
                                                        </select>
                                                        <input required type="datetime-local" value={newActivity.scheduled_time} onChange={e => setNewActivity({...newActivity, scheduled_time: e.target.value})} className="border-gray-200 rounded-xl p-3 bg-white" />
                                                        <textarea value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} placeholder="Description" className="border-gray-200 rounded-xl p-3 bg-white sm:col-span-2" rows="2"></textarea>
                                                        <div className="sm:col-span-2 text-right">
                                                            <button type="submit" className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/40 transition">
                                                                Create Task
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            <div className="p-6 space-y-4">
                                                {activities.length > 0 ? activities.map(act => (
                                                    <div key={act.activity_id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${act.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{act.status}</span>
                                                                <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm">{act.activity_type}</span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900">{act.title}</h4>
                                                            <p className="text-sm text-gray-500">{new Date(act.scheduled_time).toLocaleString()}</p>
                                                            {act.rating && <p className="text-sm mt-2 font-medium bg-indigo-50 text-indigo-700 w-fit px-3 py-1 rounded-lg">Rating: {act.rating}/5 <span className="text-gray-500 font-normal italic ml-1">- {act.feedback}</span></p>}
                                                        </div>
                                                        {act.status !== 'completed' && (
                                                            <button onClick={() => setRatingModal({ show: true, activity: act, rating: 5, feedback: "" })} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition whitespace-nowrap">
                                                                Complete & Rate
                                                            </button>
                                                        )}
                                                    </div>
                                                )) : (
                                                    <div className="text-center text-gray-400 py-8">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-300">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
                                                        </svg>
                                                        <p className="text-sm">No activities scheduled.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rating Modal */}
                                        {ratingModal.show && (
                                            <div className="modal-overlay">
                                                <div className="modal-card modal-sm p-8 animate-slideDown">
                                                    <h3 className="text-2xl font-bold mb-1">Rate Progress</h3>
                                                    <p className="text-gray-500 text-sm mb-6">How did {selectedChild.name} do on "{ratingModal.activity.title}"?</p>
                                                    <form onSubmit={handleRateActivity} className="space-y-5">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating (1-5 Stars)</label>
                                                            <div className="flex gap-2">
                                                                {[1,2,3,4,5].map(num => (
                                                                    <button type="button" key={num} onClick={() => setRatingModal({...ratingModal, rating: num})} className={`w-12 h-12 rounded-full font-bold text-xl transition-all ${ratingModal.rating >= num ? 'bg-yellow-400 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>★</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback & Notes</label>
                                                            <textarea required value={ratingModal.feedback} onChange={e => setRatingModal({...ratingModal, feedback: e.target.value})} className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl p-3" rows="4" placeholder="Great improvement in..."></textarea>
                                                        </div>
                                                        <div className="flex justify-end gap-3 pt-4">
                                                            <button type="button" onClick={() => setRatingModal({show: false, activity: null, rating: 5, feedback: ""})} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors">Submit Rating</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}

                                        {/* Observation Modal */}
                                        {showObservation && (
                                            <div className="modal-overlay">
                                                <div className="modal-card modal-md p-8 animate-slideDown">
                                                    <h3 className="text-2xl font-bold mb-2">Daily Observation</h3>
                                                    <p className="text-gray-500 text-sm mb-6">Quick check-in for {selectedChild.name}.</p>

                                                    <div className="flex items-center gap-2 mb-6">
                                                        {["Mood", "Sleep", "Appetite", "Notes"].map((label, idx) => (
                                                            <div key={label} className={`flex-1 h-1.5 rounded-full ${observationStep >= idx ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                                        ))}
                                                    </div>

                                                    <form onSubmit={handleAddObservation} className="space-y-6">
                                                        {observationStep === 0 && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-3">Mood</label>
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    {["low", "ok", "good"].map(option => (
                                                                        <button
                                                                            key={option}
                                                                            type="button"
                                                                            onClick={() => setNewObservation({ ...newObservation, mood: option })}
                                                                            className={`px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${newObservation.mood === option ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {observationStep === 1 && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-3">Sleep Quality</label>
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    {["poor", "fair", "good"].map(option => (
                                                                        <button
                                                                            key={option}
                                                                            type="button"
                                                                            onClick={() => setNewObservation({ ...newObservation, sleep_quality: option })}
                                                                            className={`px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${newObservation.sleep_quality === option ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {observationStep === 2 && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-3">Appetite</label>
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    {["low", "ok", "good"].map(option => (
                                                                        <button
                                                                            key={option}
                                                                            type="button"
                                                                            onClick={() => setNewObservation({ ...newObservation, appetite_level: option })}
                                                                            className={`px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${newObservation.appetite_level === option ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {observationStep === 3 && (
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                                                                <textarea
                                                                    rows="4"
                                                                    value={newObservation.notes}
                                                                    onChange={(e) => setNewObservation({ ...newObservation, notes: e.target.value })}
                                                                    className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl p-3"
                                                                    placeholder="Anything notable today?"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (observationStep === 0) {
                                                                        setShowObservation(false);
                                                                        setObservationStep(0);
                                                                    } else {
                                                                        setObservationStep(observationStep - 1);
                                                                    }
                                                                }}
                                                                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                                            >
                                                                {observationStep === 0 ? "Cancel" : "Back"}
                                                            </button>
                                                            {observationStep < 3 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setObservationStep(observationStep + 1)}
                                                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors"
                                                                >
                                                                    Next
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="submit"
                                                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors"
                                                                >
                                                                    Save Observation
                                                                </button>
                                                            )}
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {sessions.filter(s => s.status === 'completed').length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-gray-600 mb-3">Completed Sessions</h4>
                                        <div className="space-y-3">
                                            {sessions.filter(s => s.status === 'completed').map(session => (
                                                <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                                                    <div>
                                                        <h5 className="font-semibold text-gray-900">{session.title}</h5>
                                                        <p className="text-xs text-gray-500 mt-1">{new Date(session.start_time).toLocaleString()}</p>
                                                    </div>
                                                    <div className="mt-3 sm:mt-0 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                                        Completed
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar: Mentor & Sessions */}
                            <div className="space-y-6">
                                {/* My Mentor Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">🎓</span> My Mentor
                                    </h3>
                                    {myMentor ? (
                                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                            <p className="font-semibold text-gray-900">{myMentor.name}</p>
                                            <p className="text-sm text-gray-500">{myMentor.email}</p>
                                            <div className="mt-3 flex gap-2">
                                                <span className="text-xs bg-white px-2 py-1 rounded border border-indigo-100 text-indigo-600 font-medium">Connected</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-4">Connect with a mentor to get guidance.</p>
                                            <input
                                                type="text"
                                                value={mentorSearch}
                                                onChange={(e) => setMentorSearch(e.target.value)}
                                                placeholder="Search by name or specialty..."
                                                className="w-full rounded-xl border-gray-200 p-2.5 text-sm mb-3"
                                            />
                                            <div className="space-y-2">
                                                {filteredMentors.length > 0 ? filteredMentors.map(m => (
                                                    <div key={m.user_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                                                            <p className="text-xs text-gray-500">{m.email}</p>
                                                            {m.specialty && (
                                                                <p className="text-[11px] text-indigo-600 font-semibold mt-1">{m.specialty}</p>
                                                            )}
                                                            {m.credentials && (
                                                                <p className="text-[10px] text-gray-400">{m.credentials}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleConnectMentor(m.user_id)}
                                                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
                                                        >
                                                            Connect
                                                        </button>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-gray-400 italic">No mentors found.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sessions List */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-600 p-1.5 rounded-lg">📅</span> Upcoming Sessions
                                    </h3>
                                    {sessions.filter(s => s.status !== 'completed').length > 0 ? (
                                        <div className="space-y-3">
                                            {sessions.filter(s => s.status !== 'completed').map(session => (
                                                <div key={session.session_id} className="border-l-4 border-indigo-500 bg-gray-50 pl-4 py-3 pr-3 rounded-r-lg">
                                                    <p className="font-semibold text-gray-900 text-sm">{session.title}</p>
                                                    <p className="text-xs text-gray-500">{new Date(session.start_time).toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500 mt-1">In-app session — your mentor will start the call.</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No upcoming sessions scheduled.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

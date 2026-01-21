"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getChildren, addChild, getGrowthLogs, addGrowthLog,
    getMentors, connectMentor, getMyMentor, getMyClients,
    getSessions, createSession
} from "../../services/api";
import GrowthChart from "../../components/GrowthChart";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";

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
    const [sessions, setSessions] = useState([]);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [newSession, setNewSession] = useState({ title: "", description: "", start_time: "", meeting_link: "" });

    // Form states
    const [showAddChild, setShowAddChild] = useState(false);
    const [newChild, setNewChild] = useState({ name: "", date_of_birth: "", gender: "", diagnosis_date: "" });
    const [showAddLog, setShowAddLog] = useState(false);
    const [newLog, setNewLog] = useState({ height_cm: "", weight_kg: "", head_circumference_cm: "", note: "" });

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

    // --- Handlers ---
    const handleSelectChild = async (child) => {
        setSelectedChild(child);
        try {
            const token = localStorage.getItem("token");
            const logs = await getGrowthLogs(token, child.child_id);
            setGrowthLogs(logs);
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
            await createSession(token, newSession);
            setShowCreateSession(false);
            setNewSession({ title: "", description: "", start_time: "", meeting_link: "" });
            fetchSessions();
        } catch (err) { console.error(err); }
    };

    const handleAddChild = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await addChild(token, newChild);
            setShowAddChild(false);
            setNewChild({ name: "", date_of_birth: "", gender: "", diagnosis_date: "" });
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
                head_circumference_cm: parseFloat(newLog.head_circumference_cm)
            };
            await addGrowthLog(token, selectedChild.child_id, payload);
            setShowAddLog(false);
            setNewLog({ height_cm: "", weight_kg: "", head_circumference_cm: "", note: "" });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    const calculateAge = (dob) => {
        const diff = new Date() - new Date(dob);
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {user?.role === 'mentor' ? (
                    // --- MENTOR VIEW ---
                    <div className="space-y-8 animate-fadeIn">
                        {/* Mentor Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl mb-10 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
                                    <p className="opacity-90 max-w-xl">Welcome back, {user?.name}. Manage your sessions and client progress.</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateSession(!showCreateSession)}
                                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <span>{showCreateSession ? 'Cancel' : '+ Schedule Session'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Create Session Form */}
                        {showCreateSession && (
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6">Schedule New Session</h3>
                                <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
                                        <input required type="text" value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} className="w-full rounded-xl border-gray-300 p-3" placeholder="e.g. Weekly Group Therapy" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                        <input required type="datetime-local" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} className="w-full rounded-xl border-gray-300 p-3" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link (Zoom/Meet)</label>
                                        <input type="text" value={newSession.meeting_link} onChange={e => setNewSession({ ...newSession, meeting_link: e.target.value })} className="w-full rounded-xl border-gray-300 p-3" placeholder="https://..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea rows="3" value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} className="w-full rounded-xl border-gray-300 p-3" placeholder="Session details..."></textarea>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowCreateSession(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
                                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700">Schedule Session</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Sessions List */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">📅</span> Your Scheduled Sessions
                                </h3>
                                {sessions.length > 0 ? (
                                    <div className="space-y-4">
                                        {sessions.map(session => (
                                            <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{session.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{new Date(session.start_time).toLocaleString()}</p>
                                                    <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                                                </div>
                                                <div className="mt-4 sm:mt-0">
                                                    {session.meeting_link && (
                                                        <a href={session.meeting_link} target="_blank" className="inline-flex items-center gap-1 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                            <span>Join Link</span>
                                                            <span aria-hidden="true">&rarr;</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">No sessions scheduled yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Clients List (Placeholder) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-violet-100 text-violet-600 p-1.5 rounded-lg">👥</span> My Clients
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">View parents connected to your profile.</p>
                                {myClients.length > 0 ? (
                                    <div className="space-y-4">
                                        {myClients.map(client => (
                                            <div key={client.user_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="font-bold text-gray-900">{client.name}</p>
                                                    <p className="text-xs text-gray-500">{client.email}</p>
                                                    {client.children_names && client.children_names.length > 0 && (
                                                        <div className="mt-2 flex gap-1 flex-wrap">
                                                            {client.children_names.map((child, idx) => (
                                                                <span key={idx} className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                                                                    {child}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-400">No active clients found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- PARENT VIEW ---
                    <div className="space-y-8 animate-fadeIn">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {selectedChild ? `Overview for ${selectedChild.name}` : "Welcome to CareBridge"}
                                </h1>
                                <p className="mt-2 text-gray-500">Track growth, manage schedules, and monitor progress.</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAddChild(!showAddChild)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 w-fit"
                                >
                                    <span>{showAddChild ? 'Cancel' : 'Add Child Profile'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                {/* Child UI */}
                                {showAddChild && (
                                    <div className="mb-10 bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-fadeIn">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Profile</h3>
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
                                            <div className="md:col-span-2 flex justify-end mt-4">
                                                <button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">Create Profile</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {children.length > 0 ? (
                                    <div className="mb-10 flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                                        {children.map(child => (
                                            <button key={child.child_id} onClick={() => handleSelectChild(child)} className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedChild?.child_id === child.child_id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>{child.name}</button>
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
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Age</p><p className="mt-2 text-4xl font-bold text-gray-900">{calculateAge(selectedChild.date_of_birth)}<span className="text-lg font-medium text-gray-400 ml-1">years</span></p></div>
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Latest Height</p><p className="mt-2 text-4xl font-bold text-indigo-600">{growthLogs[0]?.height_cm || '-'}<span className="text-lg font-medium text-gray-400 ml-1">cm</span></p></div>
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Latest Weight</p><p className="mt-2 text-4xl font-bold text-violet-600">{growthLogs[0]?.weight_kg || '-'}<span className="text-lg font-medium text-gray-400 ml-1">kg</span></p></div>
                                        </div>

                                        {/* Growth Chart */}
                                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                            <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div><h3 className="text-xl font-bold text-gray-900">Growth Tracking</h3></div>
                                                <button onClick={() => setShowAddLog(!showAddLog)} className="text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">{showAddLog ? 'Cancel Entry' : '+ Log Measurement'}</button>
                                            </div>
                                            {showAddLog && (
                                                <div className="bg-gray-50/50 p-8 border-b border-gray-100 animate-slideDown">
                                                    <form onSubmit={handleAddLog} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                                        <input type="number" step="0.1" value={newLog.height_cm} onChange={e => setNewLog({ ...newLog, height_cm: e.target.value })} className="rounded-lg border-gray-300 p-2.5" placeholder="Height (cm)" />
                                                        <input type="number" step="0.1" value={newLog.weight_kg} onChange={e => setNewLog({ ...newLog, weight_kg: e.target.value })} className="rounded-lg border-gray-300 p-2.5" placeholder="Weight (kg)" />
                                                        <input type="number" step="0.1" value={newLog.head_circumference_cm} onChange={e => setNewLog({ ...newLog, head_circumference_cm: e.target.value })} className="rounded-lg border-gray-300 p-2.5" placeholder="Head Circ (cm)" />
                                                        <input type="text" value={newLog.note} onChange={e => setNewLog({ ...newLog, note: e.target.value })} className="rounded-lg border-gray-300 p-2.5" placeholder="Note" />
                                                        <button type="submit" className="bg-indigo-600 text-white px-6 rounded-lg font-medium">Save</button>
                                                    </form>
                                                </div>
                                            )}
                                            <div className="p-8"><GrowthChart logs={growthLogs} /></div>
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
                                            <div className="space-y-2">
                                                {mentors.length > 0 ? mentors.map(m => (
                                                    <div key={m.user_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                                                            <p className="text-xs text-gray-500">{m.email}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleConnectMentor(m.user_id)}
                                                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
                                                        >
                                                            Connect
                                                        </button>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-gray-400 italic">No mentors available.</p>
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
                                    {sessions.length > 0 ? (
                                        <div className="space-y-3">
                                            {sessions.map(session => (
                                                <div key={session.session_id} className="border-l-4 border-indigo-500 bg-gray-50 pl-4 py-3 pr-3 rounded-r-lg">
                                                    <p className="font-semibold text-gray-900 text-sm">{session.title}</p>
                                                    <p className="text-xs text-gray-500">{new Date(session.start_time).toLocaleString()}</p>
                                                    {session.meeting_link && (
                                                        <a href={session.meeting_link} target="_blank" className="text-xs text-indigo-600 hover:underline mt-1 block">
                                                            Join Meeting &rarr;
                                                        </a>
                                                    )}
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

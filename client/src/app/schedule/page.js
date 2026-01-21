"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getChildren, getActivities, addActivity, getSessions, createSession } from "../../services/api";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";

const Schedule = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    // Parent State (Activities)
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [activities, setActivities] = useState([]);
    const [newActivity, setNewActivity] = useState({
        title: "", description: "", activity_type: "learning", scheduled_time: ""
    });

    // Mentor State (Sessions)
    const [sessions, setSessions] = useState([]);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [newSession, setNewSession] = useState({
        title: "", description: "", start_time: "", meeting_link: ""
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            if (user?.role === 'parent') {
                fetchChildren();
            } else if (user?.role === 'mentor') {
                fetchSessions();
            }
        }
    }, [isAuthenticated, user]);

    // Parent Fetchers
    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getChildren(token);
            setChildren(data);
            if (data.length > 0) handleSelectChild(data[0]);
        } catch (err) { console.error(err); }
    };

    const handleSelectChild = async (child) => {
        setSelectedChild(child);
        try {
            const token = localStorage.getItem("token");
            const data = await getActivities(token, child.child_id);
            setActivities(data);
        } catch (err) { console.error(err); }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await addActivity(token, selectedChild.child_id, newActivity);
            setNewActivity({ title: "", description: "", activity_type: "learning", scheduled_time: "" });
            handleSelectChild(selectedChild);
        } catch (err) { console.error(err); }
    };

    // Mentor Fetchers & Handlers
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getSessions(token);
            setSessions(data);
        } catch (err) { console.error(err); }
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {user?.role === 'mentor' ? (
                    // --- MENTOR VIEW: Session Management ---
                    <div className="animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                                    Session Schedule
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">Manage your upcoming therapy sessions.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateSession(!showCreateSession)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 w-fit"
                            >
                                <span>{showCreateSession ? 'Cancel' : '+ Schedule Session'}</span>
                            </button>
                        </div>

                        {showCreateSession && (
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-slideDown mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Schedule New Session</h3>
                                <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Session Title</label>
                                        <input required type="text" value={newSession.title} onChange={e => setNewSession({ ...newSession, title: e.target.value })} className="w-full rounded-xl border-gray-300 p-3 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Weekly CTH Support" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                        <input required type="datetime-local" value={newSession.start_time} onChange={e => setNewSession({ ...newSession, start_time: e.target.value })} className="w-full rounded-xl border-gray-300 p-3 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Link</label>
                                        <input type="text" value={newSession.meeting_link} onChange={e => setNewSession({ ...newSession, meeting_link: e.target.value })} className="w-full rounded-xl border-gray-300 p-3 focus:ring-2 focus:ring-indigo-500" placeholder="https://zoom.us/..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                        <textarea rows="3" value={newSession.description} onChange={e => setNewSession({ ...newSession, description: e.target.value })} className="w-full rounded-xl border-gray-300 p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Session details..."></textarea>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                        <button type="button" onClick={() => setShowCreateSession(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium">Cancel</button>
                                        <button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">Schedule Session</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900">Upcoming Sessions</h3>
                            </div>
                            {sessions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {sessions.map(session => (
                                        <div key={session.session_id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{session.title}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        🗓️ {new Date(session.start_time).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        ⏰ {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {session.description && <p className="text-gray-600 mt-2 text-sm">{session.description}</p>}
                                            </div>
                                            <div>
                                                {session.meeting_link ? (
                                                    <a href={session.meeting_link} target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors">
                                                        Join Meeting
                                                        <span aria-hidden="true">&rarr;</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No link provided</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-gray-500">No sessions scheduled.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- PARENT VIEW: Activity Schedule ---
                    <>
                        <div className="md:flex md:items-center md:justify-between mb-8 animate-fadeIn">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                                    Activity Schedule
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">Manage daily routines and therapy sessions.</p>
                            </div>
                            {/* Child Selector */}
                            <div className="mt-4 md:mt-0 md:ml-4">
                                <select
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border bg-white/80 backdrop-blur-sm"
                                    onChange={(e) => {
                                        const childId = parseInt(e.target.value);
                                        const child = children.find(c => c.child_id === childId);
                                        handleSelectChild(child);
                                    }}
                                    value={selectedChild?.child_id || ""}
                                >
                                    {children.map(child => (
                                        <option key={child.child_id} value={child.child_id}>{child.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedChild && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Add Activity Form */}
                                <div className="glass rounded-2xl p-6 lg:col-span-1 h-fit shadow-sm animate-slideUp">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-sm">🗓️</span> Add Activity
                                    </h3>
                                    <form onSubmit={handleAddActivity} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                                            <input type="text" required value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 bg-white/50" placeholder="e.g. Speech Therapy" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                            <textarea rows={3} value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 bg-white/50" placeholder="Details..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['learning', 'speech', 'therapy', 'play'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setNewActivity({ ...newActivity, activity_type: type })}
                                                        className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${newActivity.activity_type === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                                            <input type="datetime-local" required value={newActivity.scheduled_time} onChange={e => setNewActivity({ ...newActivity, scheduled_time: e.target.value })} className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 bg-white/50" />
                                        </div>
                                        <button type="submit" className="w-full inline-flex justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                                            Add Activity
                                        </button>
                                    </form>
                                </div>

                                {/* Activities Timeline */}
                                <div className="lg:col-span-2 space-y-6">
                                    {activities.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 animate-fadeIn">
                                            <p className="text-gray-500">No activities scheduled yet.</p>
                                            <p className="text-sm text-gray-400 mt-1">Add one to get started.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: '0.1s' }}>
                                            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                                                <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {activities.map((activity, index) => (
                                                    <div key={activity.activity_id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                                        <div className="flex items-start gap-5">
                                                            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transform group-hover:scale-110 transition-transform duration-300
                                                                ${activity.activity_type === 'learning' ? 'bg-blue-100 text-blue-600' :
                                                                    activity.activity_type === 'therapy' ? 'bg-purple-100 text-purple-600' :
                                                                        activity.activity_type === 'speech' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}
                                                            >
                                                                {activity.activity_type === 'learning' ? '📚' :
                                                                    activity.activity_type === 'therapy' ? '🧘' :
                                                                        activity.activity_type === 'speech' ? '🗣️' : '🎨'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{activity.title}</h4>
                                                                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                                        {new Date(activity.scheduled_time).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{activity.description}</p>
                                                                <div className="mt-3">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                                                        ${activity.activity_type === 'learning' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                                            activity.activity_type === 'therapy' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                                                activity.activity_type === 'speech' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                                        {activity.activity_type}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Schedule;

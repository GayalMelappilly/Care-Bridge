"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import Navbar from "../../../../components/Navbar";
import GrowthChart from "../../../../components/GrowthChart";
import ProgressChart from "../../../../components/ProgressChart";
import ObservationChart from "../../../../components/ObservationChart";
import {
    getClientChildren,
    getChildDetails,
    getGrowthLogs,
    getActivities,
    getObservations,
    getSpeechLogs
} from "../../../../services/api";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") || "http://localhost:5000";

const ClientFolder = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const parentId = params?.parentId;

    const [children, setChildren] = useState([]);
    const [activeChild, setActiveChild] = useState(null);
    const [activeChildProfile, setActiveChildProfile] = useState(null);
    const [growthLogs, setGrowthLogs] = useState([]);
    const [activities, setActivities] = useState([]);
    const [observations, setObservations] = useState([]);
    const [speechLogs, setSpeechLogs] = useState([]);
    const [loadingChild, setLoadingChild] = useState(false);
    const [loadingChildren, setLoadingChildren] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
        if (!loading && isAuthenticated && user?.role !== "mentor") {
            router.push("/dashboard");
        }
    }, [isAuthenticated, loading, router, user]);

    useEffect(() => {
        if (isAuthenticated && user?.role === "mentor" && parentId) {
            fetchChildren();
        }
    }, [isAuthenticated, user, parentId]);

    const fetchChildren = async () => {
        try {
            setLoadingChildren(true);
            const token = localStorage.getItem("token");
            const data = await getClientChildren(token, parentId);
            setChildren(data);
            if (data.length > 0) {
                loadChild(data[0]);
            } else {
                setActiveChild(null);
                setActiveChildProfile(null);
                setGrowthLogs([]);
                setActivities([]);
                setObservations([]);
                setSpeechLogs([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChildren(false);
        }
    };

    const startCall = () => {
        if (!parentId || !user?.user_id) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        const callId = `call-${user.user_id}-${parentId}-${Date.now()}`;
        const socket = io(socketUrl, { auth: { token } });
        socket.on("connect", () => {
            socket.emit("call:invite", {
                toUserId: Number(parentId),
                callId,
                fromUser: { id: user.user_id, name: user.name }
            });
            // Give the message time to flush before disconnecting
            setTimeout(() => socket.disconnect(), 500);
        });
        socket.on("connect_error", () => {
            socket.disconnect();
        });
        router.push(`/call/${callId}?peer=${parentId}&role=caller`);
    };

    const loadChild = async (child) => {
        try {
            setActiveChild(child);
            setLoadingChild(true);
            const token = localStorage.getItem("token");
            const [profile, logs, acts, obs, speech] = await Promise.all([
                getChildDetails(token, child.child_id),
                getGrowthLogs(token, child.child_id),
                getActivities(token, child.child_id),
                getObservations(token, child.child_id),
                getSpeechLogs(token, child.child_id)
            ]);
            setActiveChildProfile(profile);
            setGrowthLogs(logs);
            setActivities(acts);
            setObservations(obs);
            setSpeechLogs(speech);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChild(false);
        }
    };

    const calculateAge = (dob) => {
        const diff = new Date() - new Date(dob);
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const sessionActivities = activities.filter((activity) => activity.activity_type === "session");

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Client Folder</h1>
                        <p className="text-gray-500 mt-2">Review child details and recent activity.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={startCall}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                        >
                            Start Call
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {loadingChildren ? (
                    <div className="text-sm text-gray-500">Loading children...</div>
                ) : children.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No children found for this client.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {children.map((child) => (
                                <button
                                    key={child.child_id}
                                    type="button"
                                    onClick={() => loadChild(child)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        activeChild?.child_id === child.child_id
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>

                        {loadingChild ? (
                            <div className="text-sm text-gray-500">Loading child details...</div>
                        ) : activeChildProfile ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Child Profile</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Name</span>
                                            <span className="font-semibold text-gray-900">{activeChildProfile.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Age</span>
                                            <span className="font-semibold text-gray-900">{calculateAge(activeChildProfile.date_of_birth)} yrs</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Gender</span>
                                            <span className="font-semibold text-gray-900">{activeChildProfile.gender || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Diagnosis Date</span>
                                            <span className="font-semibold text-gray-900">
                                                {activeChildProfile.diagnosis_date ? new Date(activeChildProfile.diagnosis_date).toLocaleDateString() : "-"}
                                            </span>
                                        </div>
                                        {activeChildProfile.diagnosis_details && (
                                            <div className="pt-3 border-t border-gray-200 text-gray-600 text-xs">
                                                {activeChildProfile.diagnosis_details}
                                            </div>
                                        )}
                                        {activeChildProfile.bio && (
                                            <div className="text-gray-600 text-xs">
                                                {activeChildProfile.bio}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500">Growth Logs</p>
                                            <p className="text-2xl font-bold text-indigo-600 mt-1">{growthLogs.length}</p>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500">Activities</p>
                                            <p className="text-2xl font-bold text-violet-600 mt-1">{activities.length}</p>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500">Observations</p>
                                            <p className="text-2xl font-bold text-emerald-600 mt-1">{observations.length}</p>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500">Speech Logs</p>
                                            <p className="text-2xl font-bold text-amber-600 mt-1">{speechLogs.length}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <h5 className="text-sm font-semibold text-gray-900">Physical Growth</h5>
                                        </div>
                                        <div className="p-4">
                                            <GrowthChart logs={growthLogs} />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <h5 className="text-sm font-semibold text-gray-900">Performance & Rating Progress</h5>
                                        </div>
                                        <div className="p-4">
                                            <ProgressChart activities={activities} />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <h5 className="text-sm font-semibold text-gray-900">Daily Observations</h5>
                                        </div>
                                        <div className="p-4">
                                            <ObservationChart observations={observations} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Recent Activities</h5>
                                            {activities.length > 0 ? (
                                                <div className="space-y-2 text-sm">
                                                    {activities.slice(0, 5).map((act) => (
                                                        <div key={act.activity_id} className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{act.title}</p>
                                                                <p className="text-xs text-gray-500">{new Date(act.scheduled_time).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{act.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No activities yet.</p>
                                            )}
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Recent Speech Logs</h5>
                                            {speechLogs.length > 0 ? (
                                                <div className="space-y-2 text-sm">
                                                    {speechLogs.slice(0, 5).map((log) => (
                                                        <div key={log.log_id} className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{log.activity_name}</p>
                                                                <p className="text-xs text-gray-500">{log.minutes ? `${log.minutes} min` : "-"}</p>
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(log.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No speech logs yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Session History</h5>
                                        {sessionActivities.length > 0 ? (
                                            <div className="space-y-3 text-sm">
                                                {sessionActivities.slice(0, 8).map((session) => (
                                                    <div key={session.activity_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{session.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {session.completed_at
                                                                    ? new Date(session.completed_at).toLocaleString()
                                                                    : new Date(session.scheduled_time).toLocaleString()}
                                                            </p>
                                                            {session.feedback && (
                                                                <p className="text-xs text-gray-500 italic mt-1">"{session.feedback}"</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                                Completed
                                                            </span>
                                                            {session.rating && (
                                                                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                                                                    Rating {session.rating}/5
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No session reports yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Select a child to view details.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientFolder;

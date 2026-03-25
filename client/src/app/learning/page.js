"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { getChildren, getSpeechLogs, addSpeechLog, getWeeklyReport } from "../../services/api";

const flashcards = [
    { term: "Hello", cue: "Wave and say hi" },
    { term: "More", cue: "Tap fingers together" },
    { term: "Help", cue: "Raise hand" },
    { term: "Drink", cue: "Point to cup" },
    { term: "Stop", cue: "Open palm" },
    { term: "Play", cue: "Show favorite toy" }
];

const checklists = [
    {
        title: "Speech Practice",
        items: ["Model a short phrase", "Wait 3 seconds", "Celebrate attempts", "Repeat once"]
    },
    {
        title: "Learning Routine",
        items: ["Use visual timer", "Keep instructions simple", "Offer a choice", "End with praise"]
    }
];

const Learning = () => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [speechLogs, setSpeechLogs] = useState([]);
    const [newLog, setNewLog] = useState({ activity_name: "", minutes: "", notes: "" });
    const [report, setReport] = useState(null);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchChildren();
        }
    }, [isAuthenticated]);

    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getChildren(token);
            setChildren(data);
            if (data.length > 0) {
                setSelectedChild(data[0]);
                fetchSpeechLogs(data[0].child_id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSpeechLogs = async (childId) => {
        try {
            const token = localStorage.getItem("token");
            const logs = await getSpeechLogs(token, childId);
            setSpeechLogs(logs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!selectedChild) return;
        try {
            const token = localStorage.getItem("token");
            await addSpeechLog(token, selectedChild.child_id, {
                ...newLog,
                minutes: newLog.minutes ? parseInt(newLog.minutes, 10) : null
            });
            setNewLog({ activity_name: "", minutes: "", notes: "" });
            fetchSpeechLogs(selectedChild.child_id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedChild) return;
        try {
            const token = localStorage.getItem("token");
            const data = await getWeeklyReport(token, selectedChild.child_id);
            setReport(data);
            setShowReport(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Learning & Speech Support</h1>
                        <p className="text-gray-500 mt-2">Log activities, practice with flashcards, and generate weekly reports.</p>
                    </div>
                    {children.length > 0 && (
                        <select
                            value={selectedChild?.child_id || ""}
                            onChange={(e) => {
                                const childId = parseInt(e.target.value, 10);
                                const child = children.find((c) => c.child_id === childId);
                                setSelectedChild(child);
                                fetchSpeechLogs(childId);
                            }}
                            className="rounded-xl border-gray-200 p-3 bg-white shadow-sm"
                        >
                            {children.map((child) => (
                                <option key={child.child_id} value={child.child_id}>{child.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Log Speech Activity</h2>
                        <form onSubmit={handleAddLog} className="space-y-4">
                            <input
                                required
                                type="text"
                                value={newLog.activity_name}
                                onChange={(e) => setNewLog({ ...newLog, activity_name: e.target.value })}
                                placeholder="Activity name"
                                className="w-full rounded-xl border-gray-200 p-3"
                            />
                            <input
                                type="number"
                                value={newLog.minutes}
                                onChange={(e) => setNewLog({ ...newLog, minutes: e.target.value })}
                                placeholder="Minutes practiced"
                                className="w-full rounded-xl border-gray-200 p-3"
                            />
                            <textarea
                                rows="3"
                                value={newLog.notes}
                                onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                                placeholder="Notes or cues"
                                className="w-full rounded-xl border-gray-200 p-3"
                            />
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">
                                Add Log
                            </button>
                        </form>
                        <button
                            type="button"
                            onClick={handleGenerateReport}
                            className="w-full mt-4 border border-indigo-200 text-indigo-700 py-2.5 rounded-xl font-semibold hover:bg-indigo-50"
                        >
                            Generate Weekly Report
                        </button>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Speech Activities</h2>
                        {speechLogs.length === 0 ? (
                            <p className="text-gray-500">No logs yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {speechLogs.map((log) => (
                                    <div key={log.log_id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-gray-900">{log.activity_name}</p>
                                            <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{log.minutes ? `${log.minutes} min` : "Duration not set"}</p>
                                        {log.notes && <p className="text-xs text-gray-500 italic mt-2">"{log.notes}"</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Flashcard Library</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {flashcards.map((card) => (
                                <div key={card.term} className="rounded-2xl border border-gray-100 bg-indigo-50/40 p-4 text-center shadow-sm hover:shadow-md transition-all">
                                    <p className="text-lg font-bold text-indigo-700">{card.term}</p>
                                    <p className="text-xs text-gray-500 mt-2">{card.cue}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Interactive Checklists</h2>
                        <div className="space-y-6">
                            {checklists.map((list) => (
                                <div key={list.title}>
                                    <p className="font-semibold text-gray-800 mb-2">{list.title}</p>
                                    <div className="space-y-2">
                                        {list.items.map((item) => (
                                            <label key={item} className="flex items-center gap-2 text-sm text-gray-600">
                                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                {item}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {showReport && report && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-md">
                            <div className="modal-header">
                                <h3 className="text-xl font-bold text-gray-900">Weekly Summary Report</h3>
                                <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="modal-body space-y-3 text-sm text-gray-700">
                                <p><span className="font-semibold">Speech Sessions:</span> {report.speech.sessions}</p>
                                <p><span className="font-semibold">Total Minutes:</span> {report.speech.minutes}</p>
                                <p><span className="font-semibold">Activities Completed:</span> {report.activities.completed}/{report.activities.total}</p>
                                {report.activities.avg_rating && (
                                    <p><span className="font-semibold">Avg Rating:</span> {report.activities.avg_rating}</p>
                                )}
                                {report.observations.latest && (
                                    <p><span className="font-semibold">Latest Observation:</span> Mood {report.observations.latest.mood}, Sleep {report.observations.latest.sleep_quality}, Appetite {report.observations.latest.appetite_level}</p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const text = `Weekly Report\nSpeech Sessions: ${report.speech.sessions}\nTotal Minutes: ${report.speech.minutes}\nActivities Completed: ${report.activities.completed}/${report.activities.total}`;
                                    navigator.clipboard?.writeText(text);
                                }}
                                className="mt-6 w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700"
                            >
                                Copy Summary
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Learning;

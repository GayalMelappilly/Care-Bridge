"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import { getEvents, createEvent } from "../../services/api";
import { useRouter } from "next/navigation";

const Events = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", description: "", event_date: "", link: "" });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents();
        }
    }, [isAuthenticated]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getEvents(token);
            setEvents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await createEvent(token, newEvent);
            setShowAddModal(false);
            setNewEvent({ title: "", description: "", event_date: "", link: "" });
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const formatGoogleDate = (date) => {
        const d = new Date(date);
        const end = new Date(d.getTime() + 60 * 60 * 1000);
        const format = (dt) => dt.toISOString().replace(/-|:|\.\d{3}/g, "");
        return `${format(d)}/${format(end)}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
                        <p className="text-gray-500 mt-2">Workshops, support groups, and local meetups.</p>
                    </div>
                    {(user?.role === "mentor" || user?.role === "admin") && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700"
                        >
                            + Add Event
                        </button>
                    )}
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No upcoming events.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.event_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{event.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(event.event_date).toLocaleString()}
                                        </p>
                                        {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <a
                                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(event.event_date)}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(event.link || "")}`}
                                            target="_blank"
                                            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100"
                                        >
                                            Add to Google Calendar
                                        </a>
                                        {event.link && (
                                            <a href={event.link} target="_blank" className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">
                                                Event Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showAddModal && isMounted && createPortal(
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 px-4 py-10 backdrop-blur-sm animate-fadeIn">
                        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-slideUp">
                            <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Event</p>
                                    <h3 className="text-xl font-bold text-gray-900">Create Community Event</h3>
                                    <p className="text-sm text-gray-500 mt-1">Share workshops, support groups, or meetups with families.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    aria-label="Close"
                                >
                                    X
                                </button>
                            </div>
                            <form onSubmit={handleCreateEvent}>
                                <div className="px-6 py-6">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Event title</label>
                                            <input
                                                required
                                                type="text"
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                placeholder="Weekly support circle"
                                                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Date and time</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={newEvent.event_date}
                                                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                                />
                                                <p className="text-xs text-gray-500">Shown in the viewer's local time.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Optional link</label>
                                                <input
                                                    type="url"
                                                    value={newEvent.link}
                                                    onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                                                    placeholder="https://"
                                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                                />
                                                <p className="text-xs text-gray-500">Add a map or meeting room link.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Description</label>
                                            <textarea
                                                rows="4"
                                                value={newEvent.description}
                                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                                placeholder="Agenda, audience, or materials to bring."
                                                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                            />
                                            <p className="text-xs text-gray-500">Keep it short and clear for parents.</p>
                                        </div>
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-700">
                                            Tip: Mention who should attend and whether the session is online or in-person.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                                        Save Event
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
            </main>
        </div>
    );
};

export default Events;

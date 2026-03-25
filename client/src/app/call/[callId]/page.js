"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/Navbar";
import { getClientChildren, addCallReport, completeSession } from "../../../services/api";

const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") || "http://localhost:5000";

const CallPage = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const callId = params?.callId;
    const peerId = searchParams.get("peer");
    const role = searchParams.get("role");
    const sessionId = searchParams.get("sessionId");

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcRef = useRef(null);
    const socketRef = useRef(null);
    const callReadyRef = useRef(false);
    const pcReadyRef = useRef(false);
    const hasOfferedRef = useRef(false);
    const pendingIceRef = useRef([]);
    const pendingSignalsRef = useRef([]);

    const [status, setStatus] = useState("Connecting...");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportChildren, setReportChildren] = useState([]);
    const [reportChildId, setReportChildId] = useState("");
    const [reportRating, setReportRating] = useState(5);
    const [reportNotes, setReportNotes] = useState("");
    const [reportImprovement, setReportImprovement] = useState("improved");
    const [reportNextSteps, setReportNextSteps] = useState("");
    const [reportSaving, setReportSaving] = useState(false);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (!isAuthenticated || !callId || !peerId) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        socketRef.current = io(socketUrl, {
            auth: { token }
        });

        socketRef.current.emit("call:join", { callId });

        socketRef.current.on("call:ready", () => {
            callReadyRef.current = true;
            maybeStartOffer();
            setStatus("Connecting...");
        });

        socketRef.current.on("call:signal", async ({ data }) => {
            if (!data) return;
            if (!pcRef.current) {
                pendingSignalsRef.current.push(data);
                return;
            }
            await handleSignal(data);
        });

        socketRef.current.on("call:end", () => {
            endCall(false);
        });

        socketRef.current.on("call:accept", () => {
            setStatus("Connecting...");
        });

        socketRef.current.on("call:decline", () => {
            setStatus("Call declined");
            endCall(false, { skipReport: true });
        });

        initMedia();

        return () => {
            cleanup();
            socketRef.current?.disconnect();
        };
    }, [isAuthenticated, callId, peerId, role]);

    const initMedia = async () => {
        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                setStatus("Camera/mic unavailable. Use HTTPS or localhost to allow media access.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            pcRef.current = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            });

            stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

            pcRef.current.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (remoteVideoRef.current && remoteStream) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            };

            pcRef.current.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                    socketRef.current.emit("call:signal", {
                        callId,
                        toUserId: Number(peerId),
                        data: { type: "ice", candidate: event.candidate }
                    });
                }
            };

            pcRef.current.onconnectionstatechange = () => {
                if (pcRef.current?.connectionState === "connected") {
                    setStatus("Connected");
                } else if (pcRef.current?.connectionState === "failed") {
                    setStatus("Connection failed");
                }
            };

            pcReadyRef.current = true;
            if (pendingSignalsRef.current.length > 0) {
                const queuedSignals = [...pendingSignalsRef.current];
                pendingSignalsRef.current = [];
                for (const signal of queuedSignals) {
                    await handleSignal(signal);
                }
            }
            maybeStartOffer();
        } catch (err) {
            console.error(err);
            setStatus("Camera or microphone permission denied.");
        }
    };

    const handleSignal = async (data) => {
        if (!pcRef.current || !data) return;
        if (data.type === "offer") {
            await pcRef.current.setRemoteDescription(data.offer);
            if (pendingIceRef.current.length > 0) {
                const queued = [...pendingIceRef.current];
                pendingIceRef.current = [];
                for (const candidate of queued) {
                    try {
                        await pcRef.current.addIceCandidate(candidate);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketRef.current.emit("call:signal", {
                callId,
                toUserId: Number(peerId),
                data: { type: "answer", answer }
            });
        } else if (data.type === "answer") {
            await pcRef.current.setRemoteDescription(data.answer);
            if (pendingIceRef.current.length > 0) {
                const queued = [...pendingIceRef.current];
                pendingIceRef.current = [];
                for (const candidate of queued) {
                    try {
                        await pcRef.current.addIceCandidate(candidate);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        } else if (data.type === "ice" && data.candidate) {
            if (!pcRef.current.remoteDescription) {
                pendingIceRef.current.push(data.candidate);
                return;
            }
            try {
                await pcRef.current.addIceCandidate(data.candidate);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const maybeStartOffer = async () => {
        const isCaller = role === "caller";
        if (!isCaller || hasOfferedRef.current) return;
        if (!callReadyRef.current || !pcReadyRef.current) return;
        try {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socketRef.current.emit("call:signal", {
                callId,
                toUserId: Number(peerId),
                data: { type: "offer", offer }
            });
            hasOfferedRef.current = true;
            setStatus("Connecting...");
        } catch (err) {
            console.error(err);
        }
    };

    const toggleMute = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsMuted((prev) => !prev);
    };

    const toggleVideo = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsVideoOff((prev) => !prev);
    };

    const cleanup = () => {
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        pcRef.current?.close();
    };

    const openReportIfMentor = async () => {
        if (role !== "caller" || !sessionId) return false;
        const token = localStorage.getItem("token");
        if (!token || !peerId) return false;
        try {
            const children = await getClientChildren(token, peerId);
            setReportChildren(children);
            if (children.length > 0) {
                setReportChildId(String(children[0].child_id));
            }
            setShowReport(true);
            return true;
        } catch (err) {
            console.error(err);
            setReportError("Unable to load client children for report.");
            setShowReport(true);
            return true;
        }
    };

    const endCall = async (notify = true, options = {}) => {
        if (notify && socketRef.current) {
            socketRef.current.emit("call:end", { callId, toUserId: Number(peerId) });
        }
        cleanup();
        if (role === "caller" && !options.skipReport) {
            const opened = await openReportIfMentor();
            if (!opened) {
                router.push("/dashboard");
            }
        } else {
            router.push("/dashboard");
        }
    };

    useEffect(() => {
        if (role === "caller") {
            setStatus("Waiting for client to join...");
        }
    }, [role]);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportChildId) {
            setReportError("Please select a child.");
            return;
        }
        setReportSaving(true);
        setReportError("");
        try {
            const token = localStorage.getItem("token");
            const child = reportChildren.find((c) => String(c.child_id) === String(reportChildId));
            const title = child ? `Session Call - ${child.name}` : "Session Call";
            const feedbackLine = reportNotes ? reportNotes.trim() : "Session completed";
            const description = [
                `Performance: ${reportImprovement}`,
                reportNotes ? `Summary: ${reportNotes.trim()}` : null,
                reportNextSteps ? `Next Steps: ${reportNextSteps.trim()}` : null
            ].filter(Boolean).join("\n");
            if (sessionId) {
                try {
                    await completeSession(token, sessionId, new Date().toISOString());
                } catch (err) {
                    console.error(err);
                }
            }
            await addCallReport(token, reportChildId, {
                title,
                description: description || null,
                activity_type: "session",
                scheduled_time: new Date().toISOString(),
                status: "completed",
                rating: reportRating,
                feedback: feedbackLine,
                completed_at: new Date().toISOString()
            });
            setShowReport(false);
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            setReportError("Failed to save report. Please try again.");
        } finally {
            setReportSaving(false);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (socketRef.current && peerId) {
                socketRef.current.emit("call:end", { callId, toUserId: Number(peerId) });
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [callId, peerId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar />
            <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Live Session</h1>
                        <p className="text-sm text-gray-300">{status}</p>
                    </div>
                    <button
                        onClick={() => endCall(true)}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                    >
                        End Call
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gray-800 rounded-3xl overflow-hidden relative aspect-video">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 right-4 w-28 h-20 sm:w-36 sm:h-24 bg-gray-900 rounded-xl overflow-hidden border border-white/10">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-3xl p-6 text-white flex flex-col gap-4">
                        <h2 className="text-lg font-semibold">Call Controls</h2>
                        <button
                            onClick={toggleMute}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold"
                        >
                            {isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold"
                        >
                            {isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                        </button>
                        <div className="mt-auto text-xs text-gray-400">
                            Your connection is encrypted via WebRTC.
                        </div>
                    </div>
                </div>
            </main>

            {showReport && (
                <div className="modal-overlay">
                    <div className="modal-card modal-md p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Report</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Submit a report for this call to update the child’s progress chart.
                        </p>

                        <form onSubmit={handleSubmitReport} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Child</label>
                                <select
                                    required
                                    value={reportChildId}
                                    onChange={(e) => setReportChildId(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 p-3"
                                >
                                    {reportChildren.length === 0 && <option value="">No children available</option>}
                                    {reportChildren.map((child) => (
                                        <option key={child.child_id} value={child.child_id}>
                                            {child.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                            type="button"
                                            key={num}
                                            onClick={() => setReportRating(num)}
                                            className={`w-11 h-11 rounded-full font-bold text-lg transition-all ${
                                                reportRating >= num ? "bg-yellow-400 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Performance Improvement</label>
                                <select
                                    value={reportImprovement}
                                    onChange={(e) => setReportImprovement(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 p-3"
                                >
                                    <option value="improved">Improved</option>
                                    <option value="stable">Stable</option>
                                    <option value="needs_support">Needs Support</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Session Summary</label>
                                <textarea
                                    rows="4"
                                    value={reportNotes}
                                    onChange={(e) => setReportNotes(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 p-3"
                                    placeholder="Key moments, engagement, and progress..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Next Steps</label>
                                <textarea
                                    rows="3"
                                    value={reportNextSteps}
                                    onChange={(e) => setReportNextSteps(e.target.value)}
                                    className="w-full rounded-xl border-gray-300 p-3"
                                    placeholder="Recommended practice, focus areas, or follow-ups..."
                                />
                            </div>
                            {reportError && <p className="text-sm text-red-600">{reportError}</p>}
                            <button
                                type="submit"
                                disabled={reportSaving || !reportChildId}
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {reportSaving ? "Saving..." : "Submit Report"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallPage;

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getMessages, sendMessage as sendMessageApi } from "../services/api";

const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") || "http://localhost:5000";

export const useChat = ({ token, user, contactId }) => {
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);

    const loadMessages = useCallback(async () => {
        if (!token || !contactId) return;
        const data = await getMessages(token, contactId);
        setMessages(data);
    }, [token, contactId]);

    useEffect(() => {
        if (!token) return;

        socketRef.current = io(socketUrl, {
            auth: { token }
        });

        socketRef.current.on("message:new", (msg) => {
            if (!contactId) return;
            const isRelevant =
                (msg.sender_id === contactId && msg.receiver_id === user?.user_id) ||
                (msg.receiver_id === contactId && msg.sender_id === user?.user_id);

            if (isRelevant) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.message_id === msg.message_id);
                    return exists ? prev : [...prev, msg];
                });
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [token, contactId, user?.user_id]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const sendMessage = useCallback(
        async (content) => {
            if (!token || !contactId || !content?.trim()) return;
            const tempId = `temp-${Date.now()}`;
            const optimistic = {
                message_id: tempId,
                sender_id: user?.user_id,
                receiver_id: contactId,
                content,
                created_at: new Date().toISOString(),
                status: "sending"
            };
            setMessages((prev) => [...prev, optimistic]);

            try {
                const sent = await sendMessageApi(token, contactId, content);
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.message_id === tempId ? { ...sent, status: "sent" } : msg
                    )
                );
            } catch (err) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.message_id === tempId ? { ...msg, status: "failed" } : msg
                    )
                );
                throw err;
            }
        },
        [token, contactId, user?.user_id]
    );

    return { messages, setMessages, loadMessages, sendMessage };
};

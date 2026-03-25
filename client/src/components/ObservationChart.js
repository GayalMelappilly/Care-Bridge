"use client";
import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

const scaleValue = (value) => {
    const map = {
        low: 1,
        poor: 1,
        fair: 2,
        ok: 2,
        okay: 2,
        good: 3,
        great: 3
    };
    return map[String(value || "").toLowerCase()] || null;
};

const ObservationChart = ({ observations }) => {
    if (!observations || observations.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 italic">No daily observations yet.</p>
            </div>
        );
    }

    const data = [...observations]
        .sort((a, b) => new Date(a.observed_at) - new Date(b.observed_at))
        .map((obs) => ({
            date: new Date(obs.observed_at).toLocaleDateString(),
            mood: scaleValue(obs.mood),
            sleep: scaleValue(obs.sleep_quality),
            appetite: scaleValue(obs.appetite_level),
            note: obs.notes || ""
        }));

    return (
        <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <YAxis domain={[0, 3]} ticks={[1, 2, 3]} axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="sleep" name="Sleep" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="appetite" name="Appetite" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ObservationChart;

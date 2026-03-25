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

const GrowthChart = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 italic">No growth data recorded yet.</p>
            </div>
        );
    }

    const data = [...logs]
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
        .map((log) => ({
            date: new Date(log.recorded_at).toLocaleDateString(),
            height: log.height_cm || null,
            weight: log.weight_kg || null,
            head: log.head_circumference_cm || null,
            note: log.note || ""
        }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const note = payload[0].payload.note;
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
                    <p className="font-bold text-gray-900 mb-1">{label}</p>
                    {payload.map((item) => (
                        <p key={item.dataKey} className="text-sm text-gray-700">
                            {item.name}: <span className="font-semibold">{item.value ?? "-"}</span>
                        </p>
                    ))}
                    {note && <p className="text-xs text-gray-500 italic mt-2">"{note}"</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="height" name="Height (cm)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="head" name="Head Circ. (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GrowthChart;

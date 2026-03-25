"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ activities }) => {
    // Filter out uncompleted or unrated activities
    const ratedActivities = activities
        .filter(act => act.status === 'completed' && act.rating != null)
        .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
        .map(act => ({
            name: new Date(act.completed_at).toLocaleDateString(),
            title: act.title,
            rating: act.rating,
            feedback: act.feedback
        }));

    if (ratedActivities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <p className="text-gray-500 font-medium">No progress data to chart yet.</p>
                <p className="text-sm text-gray-400">Complete and rate activities to see progress here.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 max-w-xs">
                    <p className="font-bold text-gray-900 border-b pb-2 mb-2">{data.name}</p>
                    <p className="text-sm font-semibold text-indigo-600 mb-1">{data.title}</p>
                    <p className="text-sm text-gray-700 mb-2">Rating: <span className="font-bold">{data.rating}/5</span></p>
                    {data.feedback && (
                        <p className="text-xs text-gray-500 italic">"{data.feedback}"</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratedActivities} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6B7280', fontSize: 12}} 
                        dy={10}
                    />
                    <YAxis 
                        domain={[0, 5]} 
                        ticks={[1,2,3,4,5]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6B7280', fontSize: 12}}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#4f46e5" 
                        strokeWidth={4} 
                        dot={{r: 6, strokeWidth: 3, fill: '#ffffff', stroke: '#4f46e5'}}
                        activeDot={{r: 8, strokeWidth: 0, fill: '#4f46e5'}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProgressChart;

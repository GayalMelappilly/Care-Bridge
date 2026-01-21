"use client";
import React from 'react';

const GrowthChart = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 italic">No growth data recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Height <span className="text-gray-500 font-normal">(cm)</span></th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Weight <span className="text-gray-500 font-normal">(kg)</span></th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Head Circ. <span className="text-gray-500 font-normal">(cm)</span></th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {logs.map((log) => (
                                <tr key={log.log_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {new Date(log.recorded_at).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{log.height_cm || '-'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{log.weight_kg || '-'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{log.head_circumference_cm || '-'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 italic">{log.note || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GrowthChart;

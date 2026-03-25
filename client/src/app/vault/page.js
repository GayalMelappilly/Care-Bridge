"use client";
import React from "react";
import Navbar from "../../components/Navbar";

const resources = [
    {
        title: "Disability Rights (USA)",
        description: "Overview of IDEA, ADA, and special education protections.",
        url: "https://www.parentcenterhub.org/idea/"
    },
    {
        title: "Early Intervention Programs",
        description: "Find state early intervention services for children under 3.",
        url: "https://www.cdc.gov/ncbddd/actearly/parents/state-text.html"
    },
    {
        title: "Autism Speaks Tool Kits",
        description: "Practical toolkits for families and caregivers.",
        url: "https://www.autismspeaks.org/tool-kit"
    },
    {
        title: "Special Education Resources",
        description: "IEP guidance and school supports.",
        url: "https://www.understood.org/"
    },
    {
        title: "Benefits & Assistance",
        description: "SSI benefits overview for children with disabilities.",
        url: "https://www.ssa.gov/ssi/text-child-ussi.htm"
    }
];

const Vault = () => {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Legal & Educational Vault</h1>
                    <p className="text-gray-500 mt-2">Curated links to disability rights, benefits, and learning platforms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resources.map((item) => (
                        <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
                            <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                            <a href={item.url} target="_blank" className="text-indigo-600 text-sm font-semibold hover:underline">
                                Visit Resource →
                            </a>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Vault;

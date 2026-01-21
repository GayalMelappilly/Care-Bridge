"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getResources, createResource, deleteResource } from "../../services/api";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";

const Resources = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const [resources, setResources] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showAddModal, setShowAddModal] = useState(false);

    // New Resource Form
    const [newResource, setNewResource] = useState({
        title: "",
        description: "",
        category: "Speech",
        type: "Article",
        url: ""
    });

    const categories = ["All", "Speech", "Behavioral", "Sensory", "Education", "Parenting"];

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchResources();
        }
    }, [isAuthenticated, selectedCategory]);

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getResources(token, selectedCategory === "All" ? "" : selectedCategory);
            setResources(data);
        } catch (err) { console.error(err); }
    };

    const handleCreateResource = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await createResource(token, newResource);
            setShowAddModal(false);
            setNewResource({ title: "", description: "", category: "Speech", type: "Article", url: "" });
            fetchResources();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        try {
            const token = localStorage.getItem("token");
            await deleteResource(token, id);
            fetchResources();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />
            <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Resource Hub</h1>
                        <p className="mt-2 text-lg text-gray-500">Curated materials to support learning and development.</p>
                    </div>
                    {user?.role === 'mentor' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 w-fit"
                        >
                            <span>+ Add Resource</span>
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Resources Grid */}
                {resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slideUp">
                        {resources.map(resource => (
                            <div key={resource.resource_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${resource.type === 'Video' ? 'bg-red-50 text-red-600' :
                                            resource.type === 'Article' ? 'bg-blue-50 text-blue-600' :
                                                'bg-green-50 text-green-600'}`}>
                                        {resource.type}
                                    </span>
                                    {user?.role === 'mentor' && user.user_id === resource.author_id && (
                                        <button onClick={() => handleDelete(resource.resource_id)} className="text-gray-400 hover:text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-grow">{resource.description}</p>
                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">By {resource.author_name}</span>
                                    {resource.url && (
                                        <a href={resource.url} target="_blank" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
                                            Open Resource <span>&rarr;</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-medium text-gray-900">No resources found</h3>
                        <p className="text-gray-500 mt-2">Try selecting a different category or add new content.</p>
                    </div>
                )}

                {/* Add Resource Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-fadeIn">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Add New Resource</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <form onSubmit={handleCreateResource} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input required type="text" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} className="w-full rounded-xl border-gray-300 p-2.5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea required rows="3" value={newResource.description} onChange={e => setNewResource({ ...newResource, description: e.target.value })} className="w-full rounded-xl border-gray-300 p-2.5"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select value={newResource.category} onChange={e => setNewResource({ ...newResource, category: e.target.value })} className="w-full rounded-xl border-gray-300 p-2.5">
                                            {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select value={newResource.type} onChange={e => setNewResource({ ...newResource, type: e.target.value })} className="w-full rounded-xl border-gray-300 p-2.5">
                                            <option value="Article">Article</option>
                                            <option value="Video">Video</option>
                                            <option value="Exercise">Exercise</option>
                                            <option value="Audio">Audio</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL (External Link)</label>
                                    <input required type="url" value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })} className="w-full rounded-xl border-gray-300 p-2.5" placeholder="https://..." />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Add Resource</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Resources;

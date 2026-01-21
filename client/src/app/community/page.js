"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPosts, createPost, likePost, getComments, addComment } from "../../services/api";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";

const Community = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState("All Posts");

    // New Post State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPost, setNewPost] = useState({ content: "", category: "General" });

    // Comment state
    const [commentInputs, setCommentInputs] = useState({});
    const [visibleComments, setVisibleComments] = useState({});
    const [commentsData, setCommentsData] = useState({});

    const channels = [
        { name: "All Posts", icon: "🏠" },
        { name: "General", icon: "💬" },
        { name: "Question", icon: "❓" },
        { name: "Success Story", icon: "🎉" },
        { name: "Advice", icon: "💡" },
        { name: "Vent", icon: "😤" }
    ];

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPosts();
        }
    }, [isAuthenticated, selectedChannel]);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await getPosts(token, selectedChannel);
            setPosts(data);
        } catch (err) { console.error(err); }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await createPost(token, newPost);
            setNewPost({ content: "", category: selectedChannel === "All Posts" ? "General" : selectedChannel });
            setShowCreateModal(false);
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const handleLike = async (postId) => {
        try {
            const token = localStorage.getItem("token");
            await likePost(token, postId);
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    const toggleComments = async (postId) => {
        if (visibleComments[postId]) {
            setVisibleComments({ ...visibleComments, [postId]: false });
        } else {
            if (!commentsData[postId]) {
                try {
                    const token = localStorage.getItem("token");
                    const data = await getComments(token, postId);
                    setCommentsData(prev => ({ ...prev, [postId]: data }));
                } catch (err) { console.error(err); }
            }
            setVisibleComments({ ...visibleComments, [postId]: true });
        }
    };

    const handleAddComment = async (e, postId) => {
        e.preventDefault();
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        try {
            const token = localStorage.getItem("token");
            await addComment(token, postId, content);
            const data = await getComments(token, postId);
            setCommentsData(prev => ({ ...prev, [postId]: data }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
            fetchPosts();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <Navbar />

            <main className="grow pt-28 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar / Channel List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-24">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Forum Channels</h2>
                            <div className="space-y-1">
                                {channels.map(channel => (
                                    <button
                                        key={channel.name}
                                        onClick={() => setSelectedChannel(channel.name)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedChannel === channel.name
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span>{channel.icon}</span>
                                        {channel.name}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl py-3 font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>+ New Discussion</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 animate-fadeIn">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">{channels.find(c => c.name === selectedChannel)?.icon}</span>
                                {selectedChannel}
                            </h1>
                            <span className="text-sm text-gray-500">{posts.length} discussions</span>
                        </div>

                        {/* Create Post Modal */}
                        {showCreateModal && (
                            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-fadeIn">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Start a New Discussion</h3>
                                    <form onSubmit={handleCreatePost}>
                                        <textarea
                                            required
                                            rows="4"
                                            value={newPost.content}
                                            onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                            placeholder="What's on your mind?"
                                            className="w-full rounded-xl border-gray-300 p-3 mb-4 focus:border-indigo-500 focus:ring-indigo-500"
                                        ></textarea>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <label className="text-xs font-medium text-gray-500 mb-1">Channel</label>
                                                <select
                                                    value={newPost.category}
                                                    onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                                                    className="text-sm rounded-lg border-gray-300 py-1.5 px-3"
                                                >
                                                    {channels.filter(c => c.name !== "All Posts").map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">Cancel</button>
                                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Post</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Threads List */}
                        {posts.length > 0 ? posts.map(post => (
                            <div key={post.post_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 animate-slideUp">
                                <div className="flex gap-4">
                                    <div className="shrink-0 pt-1">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                                            {post.author_name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{post.author_name}</span>
                                            <span className="text-gray-400 text-xs">•</span>
                                            <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                                            {selectedChannel === "All Posts" && (
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200 ml-auto">
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleLike(post.post_id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${post.likes_count > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill={post.likes_count > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                                </svg>
                                                <span>{post.likes_count}</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(post.post_id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                                                </svg>
                                                <span>{post.comment_count} Comments</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Inline Comments */}
                                {visibleComments[post.post_id] && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 pl-14">
                                        <div className="space-y-3 mb-4">
                                            {commentsData[post.post_id]?.map(comment => (
                                                <div key={comment.comment_id} className="flex gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                                                        {comment.author_name.charAt(0)}
                                                    </div>
                                                    <div className="bg-gray-50 p-2.5 rounded-r-lg rounded-bl-lg">
                                                        <span className="text-xs font-bold text-gray-900 block">{comment.author_name}</span>
                                                        <span className="text-sm text-gray-700">{comment.content}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form onSubmit={(e) => handleAddComment(e, post.post_id)} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={commentInputs[post.post_id] || ""}
                                                onChange={(e) => setCommentInputs({ ...commentInputs, [post.post_id]: e.target.value })}
                                                placeholder="Write a reply..."
                                                className="flex-grow rounded-lg border-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                            />
                                            <button type="submit" className="text-indigo-600 font-medium text-xs px-2 hover:bg-indigo-50 rounded">Reply</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">No discussions yet in this channel.</p>
                                <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 hover:underline mt-1 text-sm">Start one now</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Community;

"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';

const Navbar = () => {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard' },
        ...(user?.role === 'mentor' ? [{ name: 'Schedule', href: '/schedule' }] : []),
        { name: 'Resources', href: '/resources' },
        { name: 'Community', href: '/community' },
    ];

    const isActive = (path) => pathname === path;

    return (
        <nav className="fixed w-full z-50 glass border-b border-border/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-10">
                        <Link href="/dashboard" className="flex items-center gap-3 group">

                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                                CareBridge
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex md:space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive(link.href)
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${user?.role === 'mentor'
                                        ? 'bg-violet-50 text-violet-600 border-violet-100'
                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {user?.role}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{user?.email}</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button
                            onClick={logout}
                            className="group flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
                        >
                            <span>Logout</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className="md:hidden glass border-t border-gray-100 absolute w-full animate-fadeIn shadow-xl">
                <div className="pt-2 pb-3 px-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(link.href)
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
                <div className="pt-4 pb-6 border-t border-gray-100 px-6 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-base font-bold text-gray-900">{user?.name}</div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${user?.role === 'mentor'
                                        ? 'bg-violet-50 text-violet-600 border-violet-100'
                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {user?.role}
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 rounded-xl text-base font-bold text-red-600 bg-white hover:bg-red-50 transition-colors shadow-sm"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

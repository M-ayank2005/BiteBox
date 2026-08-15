'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import Image from "next/legacy/image";
import { usePathname } from 'next/navigation';
import { UserAuth } from "../app/context/AuthContext";
import { Menu, X, User as UserIcon } from 'lucide-react';
import ModeToggle from './modeToggle';
import logo from '../lib/logo.png'; 

const Navbar = () => {
    const { user, loading } = UserAuth();
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    if (pathname === '/chat') return null;

    const NavLink = ({ href, children }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 sm:py-1.5 text-base md:text-sm rounded-full transition-all duration-300 ease-out font-semibold ${
                    active
                        ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50"
                }`}
            >
                {children}
            </Link>
        );
    };

    return (
        <nav className="glass-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-9 h-9 relative">
                            <Image
                                src={logo}
                                alt="BiteBox Logo"
                                fill="true"
                                className="rounded-full bg-white p-1 object-contain shadow-sm border border-slate-200/50 dark:border-zinc-700/50"
                                unoptimized
                            />
                        </div>
                        <Link 
                            href="/"
                            className="text-slate-900 dark:text-zinc-100 font-extrabold text-xl tracking-tight hover:opacity-80 transition"
                        >
                            BiteBox
                        </Link>
                    </div>

                    {/* Desktop Navigation - 4 Main Pages Only */}
                    <div className="hidden md:flex items-center space-x-1">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/recipes">Recipes</NavLink>
                        <NavLink href="/menu">AI Diet & Menu</NavLink>
                        <NavLink href="/more">Community</NavLink>

                        <div className="pl-3 pr-1">
                            <ModeToggle />
                        </div>
                        
                        {!loading && (
                            <div className="flex items-center ml-2">
                                {!user ? (
                                    <Link href="/LoginPage" className="px-4 py-1.5 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-sm transition">
                                        Login
                                    </Link>
                                ) : (
                                    <Link href="/profile" className="px-4 py-1.5 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-sm transition flex items-center gap-1.5">
                                        <UserIcon className="w-4 h-4" />
                                        Profile
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <ModeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-800 dark:text-zinc-200 focus:outline-none p-1 rounded-md"
                            aria-label="Toggle Navigation"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - Glassmorphic Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-slate-200/60 dark:border-zinc-800/60">
                    <div className="px-4 pt-3 pb-4 space-y-2 flex flex-col items-stretch font-semibold">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/recipes">Recipes</NavLink>
                        <NavLink href="/menu">AI Diet & Menu</NavLink>
                        <NavLink href="/more">Community</NavLink>
                                        
                        {!loading && (
                            <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/60">
                                {!user ? (
                                    <Link href="/LoginPage" className="block w-full text-center py-2 bg-amber-500 text-white font-bold rounded-full shadow-sm" onClick={() => setIsOpen(false)}>
                                        Login
                                    </Link>
                                ) : (
                                    <Link href="/profile" className="block w-full text-center py-2 bg-amber-500 text-white font-bold rounded-full shadow-sm" onClick={() => setIsOpen(false)}>
                                        <UserIcon className="w-4 h-4 inline mr-1" />
                                        Profile
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
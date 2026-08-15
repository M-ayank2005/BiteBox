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

    const NavLink = ({ href, children }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 text-sm rounded-xl transition-all duration-200 font-semibold ${
                    active
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-gray-100 hover:bg-amber-600/80 hover:text-white"
                }`}
            >
                {children}
            </Link>
        );
    };

    return (
        <nav className="bg-amber-500 dark:bg-gray-900 border-b border-amber-600 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 relative">
                            <Image
                                src={logo}
                                alt="BiteBox Logo"
                                fill="true"
                                className="rounded-full bg-white p-1 object-contain shadow-sm"
                                unoptimized
                            />
                        </div>
                        <Link 
                            href="/"
                            className="text-white font-extrabold text-2xl hover:text-amber-100 transition-colors duration-200 tracking-tight"
                        >
                            BiteBox
                        </Link>
                    </div>

                    {/* Desktop Navigation - 4 Main Pages Only */}
                    <div className="hidden md:flex items-center space-x-2">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/recipes">Recipes</NavLink>
                        <NavLink href="/menu">AI Diet & Menu</NavLink>
                        <NavLink href="/streams">Live Streams</NavLink>

                        <div className="pl-3 pr-1">
                            <ModeToggle />
                        </div>
                        
                        {!loading && (
                            <div className="flex items-center ml-2">
                                {!user ? (
                                    <Link href="/LoginPage" className="px-5 py-2 rounded-full font-bold bg-white text-amber-600 hover:bg-amber-50 shadow text-sm transition">
                                        Login
                                    </Link>
                                ) : (
                                    <Link href="/profile" className="px-4 py-2 rounded-full font-bold bg-white text-amber-600 hover:bg-amber-50 shadow text-sm transition flex items-center gap-1.5">
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
                            className="text-white hover:text-amber-200 focus:outline-none p-1 rounded-md"
                            aria-label="Toggle Navigation"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - 4 Main Pages Only */}
            {isOpen && (
                <div className="md:hidden bg-amber-500 dark:bg-gray-900 border-t border-amber-600 dark:border-gray-800">
                    <div className="px-4 pt-2 pb-4 space-y-2 flex flex-col items-stretch font-semibold">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/recipes">Recipes</NavLink>
                        <NavLink href="/menu">AI Diet & Menu</NavLink>
                        <NavLink href="/streams">Live Streams</NavLink>
                                        
                        {!loading && (
                            <div className="pt-2 border-t border-amber-600 dark:border-gray-800">
                                {!user ? (
                                    <Link href="/LoginPage" className="block w-full text-center py-2 bg-white text-amber-600 font-bold rounded-xl" onClick={() => setIsOpen(false)}>
                                        Login
                                    </Link>
                                ) : (
                                    <Link href="/profile" className="block w-full text-center py-2 bg-white text-amber-600 font-bold rounded-xl" onClick={() => setIsOpen(false)}>
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
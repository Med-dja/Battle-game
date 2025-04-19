'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 text-xl font-bold">
              Bataille Navale
            </Link>
            {user && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/dashboard') ? 'bg-gray-900' : 'hover:bg-gray-700'
                    }`}
                  >
                    Mes Parties
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/leaderboard') ? 'bg-gray-900' : 'hover:bg-gray-700'
                    }`}
                  >
                    Classement
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/profile') ? 'bg-gray-900' : 'hover:bg-gray-700'
                    }`}
                  >
                    Profil
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Déconnexion
                </button>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/login"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/login') ? 'bg-gray-900' : 'hover:bg-gray-700'
                    }`}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/register') ? 'bg-gray-900' : 'hover:bg-gray-700'
                    }`}
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dashboard') ? 'bg-gray-900' : 'hover:bg-gray-700'
                  }`}
                >
                  Mes Parties
                </Link>
                <Link
                  href="/leaderboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/leaderboard') ? 'bg-gray-900' : 'hover:bg-gray-700'
                  }`}
                >
                  Classement
                </Link>
                <Link
                  href="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/profile') ? 'bg-gray-900' : 'hover:bg-gray-700'
                  }`}
                >
                  Profil
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/login') ? 'bg-gray-900' : 'hover:bg-gray-700'
                  }`}
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/register') ? 'bg-gray-900' : 'hover:bg-gray-700'
                  }`}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

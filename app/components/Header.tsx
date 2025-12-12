'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <Image
              src="/icon-96.png"
              alt="WishTune Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">WishTune</span>
        </Link>
        <nav className="flex items-center gap-6">
          {session?.user ? (
            <Link
              href="/account"
              className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-1 pr-3 py-1 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              {session.user.image ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                   <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                  {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span>My Songs</span>
            </Link>
          ) : (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                My Songs
              </Link>
              <button
                onClick={() => signIn('google')}
                className="rounded-full bg-[#F18A24] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#E07212] hover:shadow focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Log In
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


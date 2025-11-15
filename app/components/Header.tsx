'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F18A24] text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9 3.12 0 5.86-1.54 7.5-3.9l-2.55-1.36c-.96 1.39-2.6 2.26-4.43 2.26-2.95 0-5.33-2.38-5.33-5.33 0-2.95 2.38-5.33 5.33-5.33 1.83 0 3.47.92 4.43 2.31l2.55-1.36C17.86 4.51 15.12 3 12 3Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-3xl font-extrabold">SongBird</span>
        </div>
        <div className="flex items-center gap-5">
          {session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="hidden text-sm font-medium text-[#2F1E14] sm:inline">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-full bg-[#F18A24] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#E07212]"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="rounded-full bg-[#F18A24] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#E07212]"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


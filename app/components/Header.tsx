'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="w-full px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F18A24] text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Musical note */}
              <path
                d="M9 3v8.5c0 1.38-1.12 2.5-2.5 2.5S4 12.88 4 11.5s1.12-2.5 2.5-2.5c.17 0 .34.02.5.05V3h2z"
                fill="currentColor"
              />
              <circle cx="6.5" cy="11.5" r="2" fill="currentColor" />
              {/* Star sparkle for wish */}
              <path
                d="M16 2l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-3xl font-extrabold">WishTune</span>
        </button>
        <div className="flex items-center gap-5">
          {session?.user ? (
            <button
              onClick={() => router.push('/account')}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#FFF5EB] transition-colors"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F18A24] text-white text-sm font-semibold">
                  {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-[#2F1E14]">
                My Songs
              </span>
            </button>
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


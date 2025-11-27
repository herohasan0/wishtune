'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full">
            <Image
              src="/icon-96.png"
              alt="WishTune Logo"
              width={96}
              height={96}
              className="text-black rounded-full"
            />
          </div>
          <span className="text-3xl font-extrabold">WishTune</span>
        </Link>
        <div className="flex items-center gap-5">
          {session?.user ? (
            <Link
              href="/account"
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
            </Link>
          ) : (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-[#2F1E14] hover:text-[#F18A24] transition-colors"
              >
                My Songs
              </Link>
              <button
                onClick={() => signIn('google')}
                className="rounded-full bg-[#F18A24] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#E07212]"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


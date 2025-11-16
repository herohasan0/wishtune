'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import GoogleSignInButton from './GoogleSignInButton';

export default function SignUpPrompt() {
  const { data: session } = useSession();

  // If user is already signed in, show purchase credits message
  if (session) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4E5] text-4xl">
          🎵
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-[#2F1E14] sm:text-5xl">
            Purchase credits to create more songs
          </h2>
          <p className="text-base text-[#8F6C54]">
            You&apos;ve created 2 free songs. Purchase credits to create unlimited personalized tracks
            and keep them saved forever.
          </p>
        </div>
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Link
            href="/buy-credits"
            className="rounded-lg bg-[#8F6C54] px-6 py-3 text-base font-semibold text-white hover:bg-[#7A5A45] transition-colors text-center"
          >
            Buy Credits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4E5] text-4xl">
        🎵
      </div>
      <div className="space-y-3">
        <h2 className="text-4xl font-bold text-[#2F1E14] sm:text-5xl">
          Purchase credits to create more songs
        </h2>
        <p className="text-base text-[#8F6C54]">
          You&apos;ve created 2 free songs. Purchase credits to create unlimited personalized tracks
          and keep them saved forever.
        </p>
      </div>
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <GoogleSignInButton />
      </div>
    </div>
  );
}


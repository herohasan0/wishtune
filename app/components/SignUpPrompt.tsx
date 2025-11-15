'use client';

import { useSession } from 'next-auth/react';
import GoogleSignInButton from './GoogleSignInButton';

export default function SignUpPrompt() {
  const { data: session } = useSession();

  // If user is already signed in, show a different message
  if (session) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF4E5] text-4xl">
          🎵
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-[#2F1E14] sm:text-5xl">
            Welcome back!
          </h2>
          <p className="text-base text-[#8F6C54]">
            You&apos;re signed in. Create unlimited personalized tracks and keep them saved forever.
          </p>
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
          Sign up to create more songs
        </h2>
        <p className="text-base text-[#8F6C54]">
          You&apos;ve used your free song. Sign in to unlock unlimited personalized tracks
          and keep them saved forever.
        </p>
      </div>
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <GoogleSignInButton />
      </div>
    </div>
  );
}


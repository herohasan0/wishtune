'use client';

import Link from 'next/link';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <main className="relative min-h-screen text-[#3F2A1F]">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#2F1E14]">Home</span>
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[#2F1E14] sm:text-5xl">About WishTune</h1>
          <p className="mt-2 text-lg text-[#8F6C54]">Creating magical moments through personalized music</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Mission Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">Our Mission</h2>
            <p className="text-[#8F6C54] leading-relaxed">
              At WishTune, we believe that every special moment deserves a unique soundtrack. Our mission is to make it easy for anyone to create personalized, AI-generated songs that celebrate life's most precious occasions—birthdays, graduations, anniversaries, holidays, and those spontaneous moments of joy.
            </p>
          </div>

          {/* What We Do Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">What We Do</h2>
            <p className="mb-4 text-[#8F6C54] leading-relaxed">
              WishTune uses cutting-edge AI technology to transform names and celebration types into beautiful, original songs. Simply tell us:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-[#8F6C54]">The name of the person you're celebrating</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-[#8F6C54]">The type of celebration (birthday, graduation, anniversary, etc.)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24]/20 text-[#F18A24]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className="text-[#8F6C54]">Your preferred music style (Pop, Rock, Lullaby, or Folk)</p>
              </div>
            </div>
            <p className="mt-4 text-[#8F6C54] leading-relaxed">
              Within minutes, you'll receive a complete song with multiple variations, ready to share and enjoy!
            </p>
          </div>

          {/* Features Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">Why Choose WishTune?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#F3E4D6] bg-[#FFF5EB]/50 p-4">
                <div className="mb-2 text-2xl">🎵</div>
                <h3 className="mb-2 font-semibold text-[#2F1E14]">Original Music</h3>
                <p className="text-sm text-[#8F6C54]">Every song is uniquely generated, ensuring your celebration is one-of-a-kind.</p>
              </div>
              <div className="rounded-lg border border-[#F3E4D6] bg-[#FFF5EB]/50 p-4">
                <div className="mb-2 text-2xl">⚡</div>
                <h3 className="mb-2 font-semibold text-[#2F1E14]">Fast & Easy</h3>
                <p className="text-sm text-[#8F6C54]">Create a personalized song in minutes, not hours or days.</p>
              </div>
              <div className="rounded-lg border border-[#F3E4D6] bg-[#FFF5EB]/50 p-4">
                <div className="mb-2 text-2xl">🎨</div>
                <h3 className="mb-2 font-semibold text-[#2F1E14]">Multiple Styles</h3>
                <p className="text-sm text-[#8F6C54]">Choose from Pop, Rock, Lullaby, or Folk to match the perfect vibe.</p>
              </div>
              <div className="rounded-lg border border-[#F3E4D6] bg-[#FFF5EB]/50 p-4">
                <div className="mb-2 text-2xl">🎁</div>
                <h3 className="mb-2 font-semibold text-[#2F1E14]">Perfect Gift</h3>
                <p className="text-sm text-[#8F6C54]">Give the gift of music—a memorable present that lasts forever.</p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24] text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#2F1E14]">Enter Details</h3>
                  <p className="text-sm text-[#8F6C54]">Provide the name, celebration type, and music style you prefer.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24] text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#2F1E14]">AI Creates Your Song</h3>
                  <p className="text-sm text-[#8F6C54]">Our advanced AI generates a personalized song with lyrics and melody.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24] text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#2F1E14]">Get Multiple Variations</h3>
                  <p className="text-sm text-[#8F6C54]">Receive several versions of your song so you can pick your favorite.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F18A24] text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#2F1E14]">Share & Enjoy</h3>
                  <p className="text-sm text-[#8F6C54]">Download, share, or play your song anytime, anywhere.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#2F1E14]">Get in Touch</h2>
            <p className="mb-4 text-[#8F6C54] leading-relaxed">
              Have questions, feedback, or ideas? We'd love to hear from you!
            </p>
            <a
              href="mailto:help@heroicsoft.com"
              className="inline-flex items-center gap-2 text-base font-semibold text-[#F18A24] hover:text-[#E07212] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              help@heroicsoft.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}


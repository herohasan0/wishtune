'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import SongPlayer from '../components/SongPlayer';
import { celebrationTypeLabels } from '../utils/constants';

interface CreditInfo {
  freeSongsUsed: number;
  freeSongsRemaining: number;
  paidCredits: number;
  totalSongsCreated: number;
}

interface SongVariation {
  id: string;
  title: string;
  duration: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: string;
}

interface Song {
  id: string;
  name: string;
  celebrationType?: string;
  style: string;
  createdAt: string;
  variations: SongVariation[];
  taskId?: string;
  status?: string;
  message?: string;
}

type TabType = 'credits' | 'songs';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [playingVariationId, setPlayingVariationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch credits using React Query
  const {
    data: creditsData,
    isLoading: creditsLoading,
    error: creditsError,
    refetch: refetchCredits,
  } = useQuery<{ credits: CreditInfo }>({
    queryKey: ['credits'],
    queryFn: async () => {
      const response = await axios.get<{ credits: CreditInfo }>('/api/credits');
      return response.data;
    },
    enabled: !!session?.user,
    retry: 1,
  });

  const credits = creditsData?.credits ?? null;
  const creditsErrorMsg = creditsError
    ? axios.isAxiosError(creditsError) && creditsError.response?.data?.error
      ? creditsError.response.data.error
      : 'Failed to load credit information'
    : null;

  // Fetch songs using React Query
  const {
    data: songsData,
    isLoading: songsLoading,
    error: songsError,
    refetch: refetchSongs,
  } = useQuery<{ songs: Song[] }>({
    queryKey: ['songs'],
    queryFn: async () => {
      const response = await axios.get<{ songs: Song[] }>('/api/songs');
      return response.data;
    },
    enabled: !!session?.user && activeTab === 'songs',
    retry: 1,
  });

  const songs = songsData?.songs ?? [];
  const songsErrorMsg = songsError
    ? axios.isAxiosError(songsError) && songsError.response?.data
      ? songsError.response.data.details
        ? `${songsError.response.data.error}: ${songsError.response.data.details}`
        : songsError.response.data.error || 'Failed to fetch songs'
      : songsError instanceof Error
      ? songsError.message
      : 'Failed to load songs'
    : null;

  if (status === 'loading' || creditsLoading) {
    return (
      <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
        <BackgroundBlobs />
        <Header />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-center py-20">
          <div className="text-center">
            <div className="mb-4 text-lg text-[#8F6C54]">Loading account information...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return (
    <main className="relative min-h-screen px-4 py-6 text-[#3F2A1F] sm:py-10">
      <BackgroundBlobs />
      <Header />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8">
        {/* iOS-style Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 self-start -ml-2 px-2 py-2 hover:opacity-70 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8F6C54]/30 bg-white/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F1E14]">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[#2F1E14]">Create a Song</span>
        </Link>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[#2F1E14] sm:text-5xl">My Account</h1>
          <p className="mt-2 text-[#8F6C54]">Manage your account and view your credits</p>
        </div>

        {/* User Profile Section */}
        <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={80}
                height={80}
                className="rounded-full"
              />
            )}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-[#2F1E14]">
                {session.user.name || 'User'}
              </h2>
              {session.user.email && (
                <p className="mt-1 text-sm text-[#8F6C54]">{session.user.email}</p>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg border border-[#8F6C54]/30 bg-white/50 px-4 py-2 text-sm font-medium text-[#2F1E14] hover:bg-[#F3E4D6] transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#F3E4D6]">
          <button
            onClick={() => setActiveTab('songs')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'songs'
                ? 'border-b-2 border-[#F18A24] text-[#2F1E14]'
                : 'text-[#8F6C54] hover:text-[#2F1E14]'
            }`}
          >
            My Songs
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'credits'
                ? 'border-b-2 border-[#F18A24] text-[#2F1E14]'
                : 'text-[#8F6C54] hover:text-[#2F1E14]'
            }`}
          >
            Credits
          </button>
        </div>

        {/* My Songs Tab */}
        {activeTab === 'songs' && (
          <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-[#2F1E14]">My Songs</h2>
            
            {songsLoading ? (
              <div className="text-center py-8 text-[#8F6C54]">
                Loading your songs...
              </div>
            ) : songsErrorMsg ? (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                <p className="font-medium">Error loading songs</p>
                <p className="text-sm mt-1 font-mono break-all">{songsErrorMsg}</p>
                <p className="text-xs mt-2 text-red-600">
                  Check the browser console for more details. If this persists, the Firestore index may need to be created.
                </p>
                <button
                  onClick={() => refetchSongs()}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-lg font-medium text-[#2F1E14] mb-2">No songs yet</p>
                <p className="text-sm text-[#8F6C54] mb-6">
                  Create your first song to see it here!
                </p>
                <Link
                  href="/"
                  className="rounded-lg bg-[#F18A24] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E07212] transition-colors inline-block"
                >
                  Create a Song
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {songs.map((song) => {
                  const celebrationLabel = song.celebrationType
                    ? celebrationTypeLabels[song.celebrationType] || song.celebrationType
                    : '';

                  return (
                    <div
                      key={song.id}
                      className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm"
                    >
                      {/* Song Header */}
                      <div className="mb-4 pb-4 border-b border-[#F3E4D6]">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#2F1E14]">
                            {song.name}
                          </h3>
                          {song.status === 'complete' && song.variations.some((v) => v.status === 'complete' && v.audioUrl) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Ready
                            </span>
                          )}
                          {song.status === 'pending' && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Processing
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-[#8F6C54]">
                          {celebrationLabel && (
                            <span className="flex items-center gap-1">
                              {celebrationLabel}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            🎵 {song.style}
                          </span>
                          <span className="flex items-center gap-1">
                            📅 {new Date(song.createdAt).toLocaleDateString()}
                          </span>
                          {(() => {
                            const createdAt = new Date(song.createdAt);
                            const expirationDate = new Date(createdAt);
                            expirationDate.setDate(createdAt.getDate() + 15);
                            const now = new Date();
                            const diffTime = expirationDate.getTime() - now.getTime();
                            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (daysRemaining > 0) {
                              return (
                                <span className="flex items-center gap-1 text-orange-600 font-medium">
                                  ⚠️ {daysRemaining} Days to expire
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Variations */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {song.variations.map((variation, index) => {
                          const isPlaying = playingVariationId === variation.id;
                          const isReady = Boolean(variation.audioUrl) && variation.status === 'complete';
                          const shareUrl = `${window.location.origin}/songs/${song.id}/${variation.id}`;

                          const handleShare = async () => {
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: `Check out ${song.name} - ${variation.title}!`,
                                  url: shareUrl,
                                });
                              } catch {
                                // User cancelled or error occurred
                                copyToClipboard(shareUrl, variation.id);
                              }
                            } else {
                              copyToClipboard(shareUrl, variation.id);
                            }
                          };

                          const copyToClipboard = (text: string, variationId: string) => {
                            navigator.clipboard.writeText(text).then(() => {
                              setCopiedId(variationId);
                              setTimeout(() => setCopiedId(null), 2000);
                            });
                          };

                          const handleDownload = async () => {
                            if (!variation.audioUrl) {
                              alert('Audio not available for download yet.');
                              return;
                            }
                            
                            try {
                              const response = await fetch(variation.audioUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const fileName = `${song.name}-${variation.title}.mp3`;
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = fileName;
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Download failed:', error);
                              // Fallback to opening in new tab if fetch fails
                              window.open(variation.audioUrl, '_blank');
                            }
                          };

                          return (
                            <div
                              key={variation.id}
                              className={`rounded-lg border p-4 transition-all ${
                                isPlaying
                                  ? 'border-[#F39A43] bg-[#FFF8EF]'
                                  : 'border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white'
                              }`}
                            >
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold text-[#C0772C]">
                                    {variation.title || `Version ${index + 1}`}
                                  </p>
                                  {isPlaying && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#FFF2E3] text-[#D6721E]">
                                      Playing
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8F6C54]">
                                  {variation.duration || '—'}
                                </p>
                              </div>

                              {/* Audio Player */}
                              <div className="mb-3 rounded-lg border border-[#F4D8C1] bg-[#FFF8EF] p-3">
                                {isReady && variation.audioUrl ? (
                                  <SongPlayer
                                    audioUrl={variation.audioUrl}
                                    variationId={variation.id}
                                    disabled={!isReady}
                                    onPlayStateChange={(playing) => {
                                      setPlayingVariationId(playing ? variation.id : null);
                                    }}
                                    currentlyPlayingId={playingVariationId}
                                  />
                                ) : (
                                  <div className="flex flex-col gap-1 text-xs font-medium text-[#B48B70]">
                                    <span>Processing...</span>
                                    <span className="text-[#C07B3F]">
                                      Usually under a minute
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleDownload}
                                  disabled={!isReady || !variation.audioUrl}
                                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                    isReady && variation.audioUrl
                                      ? 'bg-[#F28C1C] text-white hover:bg-[#E67805]'
                                      : 'cursor-not-allowed bg-[#F5E6D8] text-[#C7A285]'
                                  }`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d="M12 5v10m0 0 4-4m-4 4-4-4M5 19h14"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Download
                                </button>

                                <button
                                  onClick={handleShare}
                                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                                    copiedId === variation.id
                                      ? 'border-[#7AC47A] bg-[#E6F8E6] text-[#2F8F2F]'
                                      : 'border-[#F1C9A6] bg-white text-[#D26A1A] hover:bg-[#FFF2E3]'
                                  }`}
                                  title="Share song"
                                >
                                  {copiedId === variation.id ? (
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                      <path
                                        d="M4 10.5 8 14l8-8"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path
                                        d="M15 5.4 9 8.6m6 9.9-6-3.2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                      <circle cx="18" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                                      <circle cx="5.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                                      <circle cx="18" cy="19.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
        <div className="rounded-lg border border-[#F3E4D6] bg-white/95 p-6 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-[#2F1E14]">Your Credits</h2>
          
          {creditsErrorMsg ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              <p className="font-medium">Error loading credits</p>
              <p className="text-sm mt-1">{creditsErrorMsg}</p>
              <button
                onClick={() => refetchCredits()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : credits ? (
            <div className="space-y-6">
              {/* Paid Credits */}
              <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8F6C54]/20 text-2xl">
                      💳
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2F1E14]">Paid Credits</h3>
                      <p className="text-sm text-[#8F6C54]">Available for song creation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2F1E14]">
                      {credits.paidCredits}
                    </div>
                    <div className="text-xs text-[#8F6C54]">credits/songs</div>
                  </div>
                </div>
              </div>

              {/* Total Songs Created */}
              <div className="rounded-lg border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7A5A45]/20 text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2F1E14]">Total Songs Created</h3>
                      <p className="text-sm text-[#8F6C54]">All time</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2F1E14]">
                      {credits.totalSongsCreated}
                    </div>
                    <div className="text-xs text-[#8F6C54]">songs</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 rounded-lg bg-[#F3E4D6]/50 p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/buy-credits"
                    className="rounded-lg bg-[#F18A24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E07212] transition-colors inline-block"
                  >
                    Buy more credit
                  </Link>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#2F1E14]">
                      {credits.paidCredits}
                    </div>
                    <div className="text-xs text-[#8F6C54]">credits available</div>
                  </div>
                </div>
                {credits.paidCredits === 0 && (
                  <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3">
                    <p className="text-sm text-orange-800">
                      ⚠️ You have no credits available. Purchase credits to create more songs!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#8F6C54]">
              No credit information available
            </div>
          )}
        </div>
        )}

        {/* Create Song Button at Bottom */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="rounded-lg bg-[#F18A24] px-8 py-3 text-base font-semibold text-white hover:bg-[#E07212] transition-colors inline-block"
          >
            Create a New Song
          </Link>
        </div>
      </div>
    </main>
  );
}


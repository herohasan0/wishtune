'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { clientDb, signInWithSessionToken, signOutFirebase } from '@/lib/firebaseClient';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import SongPlayer from '../components/SongPlayer';
import ShareMenu from '../components/ShareMenu';
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [playingVariationId, setPlayingVariationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [shareMenuData, setShareMenuData] = useState<{
    songId: string;
    variationId: string;
    songName: string;
    variationTitle: string;
    taskId?: string;
    audioUrl?: string;
    imageUrl?: string;
  } | null>(null);

  const handleDeleteClick = (song: Song) => {
    setSongToDelete({ id: song.id, name: song.name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!songToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/delete-song?id=${songToDelete.id}`);
      
      // Optimistically remove from list or wait for real-time update
      setDeleteModalOpen(false);
      setSongToDelete(null);
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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
    staleTime: Infinity, // Don't refetch automatically since we use real-time listener
  });

  // Real-time updates for songs
  useEffect(() => {
    if (!session?.user?.id || activeTab !== 'songs') return;

    let unsubscribe: (() => void) | undefined;

    // Sign in to Firebase Auth first, then set up listener
    const setupRealtimeListener = async () => {
      try {
        // Authenticate with Firebase using NextAuth session
        const signedIn = await signInWithSessionToken();

        if (!signedIn) {
          console.error('Failed to sign in to Firebase Auth');
          return;
        }

        const songsRef = collection(clientDb, 'songs');
        // Note: client-side ordering requires an index. If it fails, we'll handle sorting in memory.
        // We'll try to query simply by userId first to avoid index issues, then sort in memory.
        const q = query(
          songsRef,
          where('userId', '==', session.user.id)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const updatedSongs: Song[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();

            // Convert timestamps
            let createdAt = data.createdAt;
            if (createdAt && typeof createdAt.toDate === 'function') {
              createdAt = createdAt.toDate().toISOString();
            } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
              createdAt = new Date(createdAt.seconds * 1000).toISOString();
            } else if (typeof createdAt === 'string') {
              // Keep as string
            } else {
              createdAt = new Date().toISOString(); // Fallback
            }

            updatedSongs.push({
              id: doc.id,
              ...data,
              createdAt,
            } as Song);
          });

          // Sort by createdAt desc
          updatedSongs.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          // Update React Query cache
          queryClient.setQueryData(['songs'], { songs: updatedSongs });
        }, (error) => {
          console.error("Error listening to song updates:", error);
        });
      } catch (error) {
        console.error('Error setting up real-time listener:', error);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [session?.user?.id, activeTab, queryClient]);

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
              <div className="divide-y divide-[#F3E4D6]">
                {songs.map((song) => {
                  const celebrationLabel = song.celebrationType
                    ? celebrationTypeLabels[song.celebrationType] || song.celebrationType
                    : '';

                  return (
                    <div
                      key={song.id}
                      className="py-8 first:pt-0 last:pb-0"
                    >
                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#F3E4D6]">
                          <div className="flex-1">
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
                                <span className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-600"></span>
                                  </span>
                                  <span className="animate-pulse">Processing...</span>
                                  <svg className="animate-spin h-3 w-3 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
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
                                expirationDate.setDate(createdAt.getDate() + 14);
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
                          
                          <button
                            onClick={() => handleDeleteClick(song)}
                            className="group flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-[#8F6C54]/60 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                            title="Delete song"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>

                        {/* Variations */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {song.variations.map((variation, index) => {
                            const isPlaying = playingVariationId === variation.id;
                            const isReady = Boolean(variation.audioUrl) && variation.status === 'complete';

                            const handleShare = () => {
                              // Open share menu
                              setShareMenuData({
                                songId: song.id,
                                variationId: variation.id,
                                songName: song.name,
                                variationTitle: variation.title || `Version ${index + 1}`,
                                taskId: song.taskId,
                                audioUrl: variation.audioUrl,
                                imageUrl: variation.imageUrl,
                              });
                              setShareMenuOpen(true);
                            };

                            const handleCopySuccess = () => {
                              setCopiedId(variation.id);
                              setTimeout(() => setCopiedId(null), 2000);
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
                                {/* Album Cover and Info */}
                                <div className="mb-3 flex gap-3">
                                  {/* Album Thumbnail */}
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-sm">
                                    {variation.imageUrl ? (
                                      <img
                                        src={variation.imageUrl}
                                        alt={`Cover for ${variation.title || `Version ${index + 1}`}`}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F8E4D0] to-[#E8C4A8]">
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          className="text-[#C49A6C]"
                                        >
                                          <path
                                            d="M9 18V5l12-2v13"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                                          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                      </div>
                                    )}
                                    {isPlaying && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <div className="flex items-end gap-0.5">
                                          <span className="h-2 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '0ms' }} />
                                          <span className="h-3 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '150ms' }} />
                                          <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '300ms' }} />
                                          <span className="h-4 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '450ms' }} />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Song Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-semibold text-[#C0772C] truncate">
                                        {variation.title || `Version ${index + 1}`}
                                      </p>
                                      {isPlaying && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#FFF2E3] text-[#D6721E] flex-shrink-0">
                                          Playing
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#8F6C54]">
                                      {variation.duration || '—'}
                                    </p>
                                  </div>
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
                                        Usually takes 2-3 minutes
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

        {/* Share Menu */}
        {shareMenuData && (
          <ShareMenu
            isOpen={shareMenuOpen}
            onClose={() => setShareMenuOpen(false)}
            songName={shareMenuData.songName}
            variationTitle={shareMenuData.variationTitle}
            variationId={shareMenuData.variationId}
            taskId={shareMenuData.taskId}
            audioUrl={shareMenuData.audioUrl}
            imageUrl={shareMenuData.imageUrl}
            shareUrl={`${window.location.origin}/songs/${shareMenuData.songId}/${shareMenuData.variationId}`}
            onCopySuccess={() => {
              setCopiedId(shareMenuData.variationId);
              setTimeout(() => setCopiedId(null), 2000);
            }}
          />
        )}
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && songToDelete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          >
            <div 
              className="w-full max-w-sm scale-100 transform rounded-2xl bg-[#FFF8EF] border border-[#F3E4D6] p-6 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E4D6] mx-auto">
                <svg className="h-6 w-6 text-[#F18A24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#2F1E14] mb-2">Delete Song?</h3>
                <p className="text-[#8F6C54] mb-6">
                  Are you sure you want to delete <span className="font-semibold text-[#2F1E14]">"{songToDelete.name}"</span>? 
                  <br />
                  <span className="text-xs text-[#F18A24] mt-1 block">This action cannot be undone.</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="w-full rounded-xl border border-[#8F6C54]/30 bg-white/50 px-4 py-2.5 text-sm font-semibold text-[#2F1E14] hover:bg-[#F3E4D6] transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F18A24] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E07212] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>


  );
}

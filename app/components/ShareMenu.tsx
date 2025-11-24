'use client';

import { useState, useRef, useEffect } from 'react';
import { generateVideoWithAudio, isVideoGenerationSupported } from '../utils/videoGenerator';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  songName: string;
  variationTitle: string;
  variationId: string;
  taskId?: string;
  audioUrl?: string;
  imageUrl?: string;
  shareUrl: string;
  onCopySuccess?: () => void;
}

export default function ShareMenu({
  isOpen,
  onClose,
  songName,
  variationTitle,
  variationId,
  taskId,
  audioUrl,
  imageUrl,
  shareUrl,
  onCopySuccess,
}: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      // Try to share the audio file directly if available
      if (audioUrl) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const fileName = `${songName}-${variationTitle}.mp3`;
        const file = new File([blob], fileName, { type: 'audio/mpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${songName} - Custom Song`,
            text: 'Check out this custom song I created with WishTune!',
            files: [file],
          });
          onClose();
          return;
        }
      }

      // Fallback to URL sharing
      await navigator.share({
        title: `${songName} - ${variationTitle}`,
        text: 'Check out this custom song I created with WishTune!',
        url: shareUrl,
      });
      onClose();
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const handleInstagramStory = async () => {
    console.log('[ShareMenu] Instagram Story clicked');

    // Check if we have the required data
    if (!audioUrl || !imageUrl) {
      console.error('[ShareMenu] Missing required data - audioUrl:', audioUrl, 'imageUrl:', imageUrl);
      alert('Audio or image not available for sharing.');
      return;
    }

    // Check if video generation is supported
    if (!isVideoGenerationSupported()) {
      console.error('[ShareMenu] Video generation not supported');
      alert('Video generation is not supported on this browser. Please try using a modern browser like Chrome, Safari, or Edge.');
      return;
    }

    console.log('[ShareMenu] Starting video generation...');
    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Fetch lyrics if available (requires both taskId and variationId/audioId)
      console.log('[ShareMenu] Fetching lyrics for variation ID:', variationId, 'taskId:', taskId);
      let lyricsWords: Array<{ word: string; startS: number; endS: number }> | undefined;

      if (taskId && variationId) {
        try {
          console.log('[ShareMenu] Making POST request to /api/get-lyrics');

          const lyricsResponse = await fetch('/api/get-lyrics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId: taskId,
              audioId: variationId,
            }),
          });

          console.log('[ShareMenu] Lyrics response status:', lyricsResponse.status, lyricsResponse.statusText);

          if (lyricsResponse.ok) {
            const lyricsData = await lyricsResponse.json();
            console.log('[ShareMenu] ===== RAW LYRICS RESPONSE =====');
            console.log(JSON.stringify(lyricsData, null, 2));
            console.log('[ShareMenu] ===== END RAW RESPONSE =====');

            // Parse Suno API response format: { code: 200, msg: "success", data: { alignedWords: [...] } }
            if (lyricsData && lyricsData.data && lyricsData.data.alignedWords) {
              console.log('[ShareMenu] Found alignedWords:', lyricsData.data.alignedWords.length, 'words');

              const alignedWords = lyricsData.data.alignedWords;
              const words: Array<{ word: string; startS: number; endS: number }> = [];

              for (let i = 0; i < alignedWords.length; i++) {
                const wordData = alignedWords[i];
                let word = wordData.word || '';

                // Remove section markers like [Verse], [Chorus], [Bridge], etc.
                const cleanedWord = word.replace(/\[.*?\]/g, '').trim();

                // Skip if word is empty after removing markers (but keep newlines for line detection)
                if (!cleanedWord && !word.includes('\n')) continue;

                // Keep newlines in the word for line break detection in video generator
                words.push({
                  word: word.replace(/\[.*?\]/g, ''), // Remove markers but keep newlines
                  startS: wordData.startS || 0,
                  endS: wordData.endS || 0,
                });
              }

              lyricsWords = words;
              console.log('[ShareMenu] Parsed', lyricsWords.length, 'words with timestamps');
              console.log('[ShareMenu] First 5 words:');
              lyricsWords.slice(0, 5).forEach((word, i) => {
                console.log(`  ${i + 1}. [${word.startS.toFixed(2)}s - ${word.endS.toFixed(2)}s] "${word.word}"`);
              });
            } else {
              console.log('[ShareMenu] Unexpected response format, no alignedWords found');
            }
          } else {
            const errorText = await lyricsResponse.text();
            console.log('[ShareMenu] Lyrics request failed with status:', lyricsResponse.status);
            console.log('[ShareMenu] Error response:', errorText);
          }
        } catch (lyricsError) {
          console.error('[ShareMenu] Exception while fetching lyrics:', lyricsError);
          console.error('[ShareMenu] Error stack:', lyricsError instanceof Error ? lyricsError.stack : 'No stack trace');
        }
      } else {
        console.log('[ShareMenu] Skipping lyrics fetch - missing taskId or variationId');
      }

      // Generate video with album cover and audio
      console.log('[ShareMenu] Calling generateVideoWithAudio with:', {
        imageUrl,
        audioUrl,
        songName,
        variationTitle,
        hasLyrics: !!lyricsWords,
        lyricsWordCount: lyricsWords?.length || 0,
      });

      const { blob: videoBlob, extension } = await generateVideoWithAudio({
        imageUrl,
        audioUrl,
        songName,
        variationTitle,
        lyricsWords,
      });

      console.log('[ShareMenu] Video generated successfully, blob size:', videoBlob.size, 'format:', extension);

      // Create file from blob with correct extension
      const fileName = `${songName}-${variationTitle}-story.${extension}`;
      console.log('[ShareMenu] Creating video file:', fileName);

      // Download the video automatically
      // Note: We can't use Web Share API here because the async video generation
      // breaks the user gesture chain required by the API
      console.log('[ShareMenu] Downloading video...');
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[ShareMenu] Video downloaded successfully');

      // Show success message with instructions
      const formatName = extension.toUpperCase();
      alert(
        `✅ Video downloaded successfully (${formatName} format)\n\n` +
        'To share on Instagram Story:\n' +
        '1. Open Instagram app\n' +
        '2. Tap Your Story (+)\n' +
        '3. Select the downloaded video\n' +
        '4. Post to your Story!\n\n' +
        `File: ${fileName}`
      );

      onClose();
    } catch (error) {
      console.error('[ShareMenu] Failed to generate video:', error);
      setGenerationError(
        error instanceof Error
          ? `Failed to generate video: ${error.message}`
          : 'Failed to generate video. Please try again.'
      );
    } finally {
      console.log('[ShareMenu] Video generation process completed');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        ref={menuRef}
        className="w-full max-w-sm rounded-2xl border border-[#F3E4D6] bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#2F1E14]">Share Song</h3>
          <button
            onClick={onClose}
            className="text-[#8F6C54] hover:text-[#2F1E14] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="mb-6 text-sm text-[#8F6C54]">
          {songName} - {variationTitle}
        </p>

        <div className="space-y-3">
          {/* Error message */}
          {generationError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{generationError}</p>
            </div>
          )}

          {/* Instagram Story Option - COMMENTED OUT FOR NOW */}
          {/* <button
            onClick={handleInstagramStory}
            disabled={isGenerating || !audioUrl || !imageUrl}
            className={`flex w-full items-center gap-4 rounded-xl border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-4 transition-all ${
              isGenerating || !audioUrl || !imageUrl
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[#F18A24] hover:shadow-md'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
              {isGenerating ? (
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#2F1E14]">
                {isGenerating ? 'Creating Video...' : 'Instagram Story'}
              </p>
              <p className="text-xs text-[#8F6C54]">
                {isGenerating
                  ? 'This may take a few seconds'
                  : 'Generate and share video story'}
              </p>
            </div>
            {!isGenerating && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 18 6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button> */}

          {/* Copy Link Option - Now primary action */}
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-4 rounded-xl border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-4 transition-all hover:border-[#F18A24] hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F18A24]/10">
              {copied ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#F18A24]"
                  />
                  <path
                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#F18A24]"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#2F1E14]">
                {copied ? 'Link Copied!' : 'Copy Link'}
              </p>
              <p className="text-xs text-[#8F6C54]">
                {copied ? 'You can now paste it anywhere' : 'Copy link to clipboard'}
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="m9 18 6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Native Share Option */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex w-full items-center gap-4 rounded-xl border border-[#F3E4D6] bg-gradient-to-r from-[#FFF5EB] to-white p-4 transition-all hover:border-[#F18A24] hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F18A24]/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#F18A24]"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[#2F1E14]">Share via...</p>
                <p className="text-xs text-[#8F6C54]">More sharing options</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 18 6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

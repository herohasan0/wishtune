/**
 * Generates a video file by combining an image (album cover) with audio
 * The video will display the album cover as a static image with the song playing
 */

interface LyricWord {
  word: string;
  startS: number;
  endS: number;
}

interface VideoGeneratorOptions {
  imageUrl: string;
  audioUrl: string;
  songName: string;
  variationTitle: string;
  duration?: number; // in seconds, defaults to audio duration
  lyricsWords?: LyricWord[]; // Word-level timestamps for karaoke effect
}

export async function generateVideoWithAudio({
  imageUrl,
  audioUrl,
  songName,
  variationTitle,
  duration,
  lyricsWords,
}: VideoGeneratorOptions): Promise<{ blob: Blob; extension: string }> {
  return new Promise(async (resolve, reject) => {
    try {


      // Create canvas for video frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const error = new Error('Could not get canvas context');
        console.error('[VideoGen] Canvas context error:', error);
        throw error;
      }

      // Set canvas size (Instagram Story dimensions: 1080x1920)
      // Using slightly lower resolution for faster generation while maintaining quality
      canvas.width = 1080;
      canvas.height = 1920;


      // Load the album cover image

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolveImg, rejectImg) => {
        img.onload = () => {

          resolveImg();
        };
        img.onerror = (error) => {
          console.error('[VideoGen] Image load error:', error);
          rejectImg(new Error('Failed to load image. Check CORS settings.'));
        };
        img.src = imageUrl;
      });

      // Load audio

      const audioContext = new AudioContext();
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
      }
      const audioArrayBuffer = await audioResponse.arrayBuffer();

      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);


      const audioDuration = duration || audioBuffer.duration;

      // Parse words into lines for display
      const lyricLines: Array<{ words: LyricWord[]; startTime: number }> = [];
      if (lyricsWords && lyricsWords.length > 0) {
        let currentLineWords: LyricWord[] = [];

        for (let i = 0; i < lyricsWords.length; i++) {
          const word = lyricsWords[i];

          // Check if this word should start a new line
          // (based on newlines in the original parsing)
          const shouldBreak = word.word.includes('\n') || currentLineWords.length >= 8;

          // Add word to current line (remove newlines)
          const cleanWord = {
            ...word,
            word: word.word.replace(/\n/g, ' ').trim(),
          };

          if (cleanWord.word) {
            currentLineWords.push(cleanWord);
          }

          // Break line if needed
          if (shouldBreak || i === lyricsWords.length - 1) {
            if (currentLineWords.length > 0) {
              lyricLines.push({
                words: currentLineWords,
                startTime: currentLineWords[0].startS,
              });
              currentLineWords = [];
            }
          }
        }
      }

      // Helper function to find current word index
      const getCurrentWordIndex = (currentTime: number): number => {
        if (!lyricsWords || lyricsWords.length === 0) return -1;

        for (let i = 0; i < lyricsWords.length; i++) {
          if (currentTime >= lyricsWords[i].startS && currentTime <= lyricsWords[i].endS) {
            return i;
          }
        }

        // If between words, find the next word
        for (let i = 0; i < lyricsWords.length; i++) {
          if (currentTime < lyricsWords[i].startS) {
            return Math.max(0, i - 1);
          }
        }

        return lyricsWords.length - 1;
      };

      // Draw the background and album cover on canvas
      const drawFrame = (currentTime: number = 0) => {
        // Save context state
        ctx.save();

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#F8E4D0');
        gradient.addColorStop(1, '#E8C4A8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions to center the album cover
        const imageSize = 800; // Size of the album cover
        const imageX = (canvas.width - imageSize) / 2;
        const imageY = lyricsWords ? 200 : (canvas.height - imageSize) / 2 - 100;

        // Draw shadow for album cover
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;

        // Draw album cover with rounded corners
        const radius = 40;
        ctx.beginPath();
        ctx.moveTo(imageX + radius, imageY);
        ctx.lineTo(imageX + imageSize - radius, imageY);
        ctx.quadraticCurveTo(imageX + imageSize, imageY, imageX + imageSize, imageY + radius);
        ctx.lineTo(imageX + imageSize, imageY + imageSize - radius);
        ctx.quadraticCurveTo(imageX + imageSize, imageY + imageSize, imageX + imageSize - radius, imageY + imageSize);
        ctx.lineTo(imageX + radius, imageY + imageSize);
        ctx.quadraticCurveTo(imageX, imageY + imageSize, imageX, imageY + imageSize - radius);
        ctx.lineTo(imageX, imageY + radius);
        ctx.quadraticCurveTo(imageX, imageY, imageX + radius, imageY);
        ctx.closePath();
        ctx.clip();

        // Draw the image
        ctx.drawImage(img, imageX, imageY, imageSize, imageSize);

        // Restore context to remove clipping
        ctx.restore();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw text below the album cover
        ctx.fillStyle = '#2F1E14';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(songName, canvas.width / 2, imageY + imageSize + 100);

        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#8F6C54';
        ctx.fillText(variationTitle, canvas.width / 2, imageY + imageSize + 160);

        // Draw karaoke-style lyrics with word highlighting
        if (lyricsWords && lyricsWords.length > 0 && lyricLines.length > 0) {
          const currentWordIdx = getCurrentWordIndex(currentTime);

          // Find which line contains the current word
          let currentLineIdx = -1;
          let wordCountSoFar = 0;

          for (let i = 0; i < lyricLines.length; i++) {
            const line = lyricLines[i];
            if (currentWordIdx < wordCountSoFar + line.words.length) {
              currentLineIdx = i;
              break;
            }
            wordCountSoFar += line.words.length;
          }

          if (currentLineIdx >= 0) {
            // Show 3 lines: previous, current, and next
            const linesToShow = [
              currentLineIdx > 0 ? currentLineIdx - 1 : null,
              currentLineIdx,
              currentLineIdx < lyricLines.length - 1 ? currentLineIdx + 1 : null,
            ];

            // Calculate starting position for lyrics
            const lyricsStartY = imageY + imageSize + 240;
            const lineHeight = 65;
            const fontSize = 38;
            const horizontalMargin = 120; // Large margins on left and right
            const lyricsMaxWidth = canvas.width - (horizontalMargin * 2);

            // Count words up to current line to find word index in current line
            let wordsBeforeCurrentLine = 0;
            for (let i = 0; i < currentLineIdx; i++) {
              wordsBeforeCurrentLine += lyricLines[i].words.length;
            }
            const wordIdxInCurrentLine = currentWordIdx - wordsBeforeCurrentLine;

            linesToShow.forEach((lineIdx, displayIdx) => {
              if (lineIdx === null) return;

              const line = lyricLines[lineIdx];
              const y = lyricsStartY + displayIdx * lineHeight;
              const isCurrent = lineIdx === currentLineIdx;

              // Calculate total line width for centering within the lyrics area
              ctx.font = `${isCurrent ? 'bold' : ''} ${fontSize}px system-ui, -apple-system, sans-serif`;
              const totalWidth = line.words.reduce((sum, word, idx) => {
                return sum + ctx.measureText(word.word).width + (idx < line.words.length - 1 ? 15 : 0);
              }, 0);

              // Center the line within the lyrics area (with margins)
              let x = horizontalMargin + (lyricsMaxWidth - totalWidth) / 2;

              // Draw each word
              line.words.forEach((word, wordIdx) => {
                const isCurrentWord = isCurrent && wordIdx === wordIdxInCurrentLine;

                // Determine word color based on state
                let color: string;
                if (isCurrentWord) {
                  // Current word - bright highlight with glow
                  color = '#F18A24';
                  ctx.shadowColor = 'rgba(241, 138, 36, 0.5)';
                  ctx.shadowBlur = 20;
                } else if (isCurrent) {
                  // Other words in current line
                  color = '#2F1E14';
                } else {
                  // Previous/next lines - dimmed
                  color = '#8F6C54';
                }

                ctx.fillStyle = color;
                ctx.font = `${isCurrent && isCurrentWord ? 'bold' : isCurrent ? 'bold' : ''} ${fontSize}px system-ui, -apple-system, sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(word.word, x, y);

                // Reset shadow
                if (isCurrentWord) {
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                }

                x += ctx.measureText(word.word).width + 15; // Add space between words
              });
            });
          }
        }

        // Draw WishTune branding at bottom
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#C0772C';
        ctx.textAlign = 'center';
        ctx.fillText('Created with WishTune.ai', canvas.width / 2, canvas.height - 100);
      };

      // Draw initial frame
      drawFrame(0);


      // Get canvas stream (20 fps - good balance between smooth animation and generation speed)
      const canvasStream = canvas.captureStream(20);


      // Get audio stream
      const audioElement = new Audio(audioUrl);
      audioElement.crossOrigin = 'anonymous';
      // Don't mute - we need the audio for recording
      // Create a gain node set to 0 to silence speakers while keeping audio in the stream
      const audioSource = audioContext.createMediaElementSource(audioElement);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silence the speakers
      const destination = audioContext.createMediaStreamDestination();

      // Route audio: source -> destination (for recording)
      audioSource.connect(destination);
      // Route audio: source -> gain (0) -> speakers (silent)
      audioSource.connect(gainNode);
      gainNode.connect(audioContext.destination);



      // Combine video and audio streams
      const videoTrack = canvasStream.getVideoTracks()[0];
      const audioTrack = destination.stream.getAudioTracks()[0];
      const combinedStream = new MediaStream([videoTrack, audioTrack]);


      // Setup MediaRecorder
      // Prefer MP4 for better Instagram compatibility
      const chunks: Blob[] = [];
      let mimeType: string;
      let fileExtension: string;

      // Check for MP4 support first (better for Instagram)
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
        mimeType = 'video/mp4;codecs=h264,aac';
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
        fileExtension = 'mp4'; // Use .mp4 extension for better compatibility
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
        fileExtension = 'webm';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
        fileExtension = 'webm';
      } else {
        mimeType = 'video/mp4';
        fileExtension = 'mp4';
      }



      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps - faster generation, still great quality for social media
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {

          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {

        const videoBlob = new Blob(chunks, { type: mimeType });

        audioElement.pause();
        audioContext.close();
        resolve({ blob: videoBlob, extension: fileExtension });
      };

      mediaRecorder.onerror = (event) => {
        console.error('[VideoGen] MediaRecorder error:', event);
        reject(new Error('MediaRecorder error: ' + event));
      };

      // Start recording with timeslice to get data chunks during recording

      mediaRecorder.start(2000); // Request data every 2 seconds (reduces overhead)

      const startTime = Date.now();
      let animationFrameId: number;

      // Update canvas frames continuously if we have lyrics
      if (lyricsWords && lyricsWords.length > 0) {
        const updateFrame = () => {
          const currentTime = (Date.now() - startTime) / 1000; // in seconds
          if (currentTime < audioDuration) {
            drawFrame(currentTime);
            animationFrameId = requestAnimationFrame(updateFrame);
          }
        };
        animationFrameId = requestAnimationFrame(updateFrame);
      }

      audioElement.play().then(() => {

      }).catch((error) => {
        console.error('[VideoGen] Audio playback error:', error);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        reject(new Error('Failed to play audio: ' + error));
      });

      // Stop recording after audio duration
      const recordingDuration = Math.min(audioDuration * 1000 + 500, 150000); // Cap at 150 seconds max


      setTimeout(() => {

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        mediaRecorder.stop();
        videoTrack.stop();
        audioTrack.stop();
      }, recordingDuration);

    } catch (error) {
      console.error('[VideoGen] Generation failed:', error);
      reject(error);
    }
  });
}

/**
 * Fallback function for when video generation is not supported
 * Returns null to indicate that video generation failed
 */
export function isVideoGenerationSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext &&
      canvas.getContext('2d') &&
      typeof MediaRecorder !== 'undefined' &&
      typeof canvas.captureStream === 'function'
    );
  } catch {
    return false;
  }
}

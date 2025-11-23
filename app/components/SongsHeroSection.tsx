interface SongsHeroSectionProps {
  songName?: string;
  celebrationLabel?: string;
  isPending?: boolean;
}

export default function SongsHeroSection({ songName, celebrationLabel, isPending }: SongsHeroSectionProps) {
  return (
    <section className="text-center">
      {songName && (
        <p className="mb-2 text-sm text-[#C57C33]">
          For {songName} {celebrationLabel && `· ${celebrationLabel}`}
        </p>
      )}
      <h1 className="text-4xl font-extrabold text-[#3E210F] sm:text-6xl md:text-7xl">
        {isPending ? 'Creating Your Songs...' : 'Your Songs Are Ready!'}
      </h1>
      <p className="mt-3 text-lg text-[#8F6E54] sm:text-xl">
        {isPending ? 'Please wait while we compose your music.' : 'Listen and choose your favorite.'}
      </p>
    </section>
  );
}


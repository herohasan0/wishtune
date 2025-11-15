interface PendingStatusBannerProps {
  message?: string;
  isPolling: boolean;
}

export default function PendingStatusBanner({ message, isPolling }: PendingStatusBannerProps) {
  return (
    <div className="w-full rounded-[32px] border border-[#FFD9B7] bg-white/70 px-6 py-5 shadow-[0_25px_60px_rgba(238,190,146,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl">
          ⏳
        </div>
        <div className="space-y-2 text-sm text-[#A76B3D]">
          <p className="text-base font-semibold text-[#B95D18]">
            We&apos;re mixing your tracks
          </p>
          <p>
            {message ||
              'This usually takes less than a minute. We will refresh automatically once the audio is ready.'}
          </p>
          {isPolling && (
            <p className="text-xs font-semibold text-[#C27A43]">
              Checking status every few seconds...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


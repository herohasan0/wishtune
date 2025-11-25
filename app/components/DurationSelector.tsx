interface DurationOption {
  id: number;
  label: string;
  description: string;
  icon: string;
}

interface DurationSelectorProps {
  durations: DurationOption[];
  selectedDuration: number;
  onSelect: (duration: number) => void;
  isAuthenticated?: boolean;
}

export default function DurationSelector({
  durations,
  selectedDuration,
  onSelect,
  isAuthenticated = false,
}: DurationSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-[#C07A33]">
        4. Choose song length
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
        {durations.map((duration) => {
          const isSelected = selectedDuration === duration.id;
          // Disable "Long" option (id: 90) for non-authenticated users
          const isLongOption = duration.id === 90;
          const isDisabled = isLongOption && !isAuthenticated;

          return (
            <div key={duration.id} className="relative">
              <button
                onClick={() => !isDisabled && onSelect(duration.id)}
                disabled={isDisabled}
                className={`w-full flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 transition-all ${
                  isDisabled
                    ? 'border-transparent bg-[#F5F5F5] cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'border-[#F39A43] bg-[#FFF2E3] shadow-md'
                    : 'border-transparent bg-[#FFF8F1] hover:bg-[#FFEDD5]'
                }`}
              >
                <span className="text-2xl">{duration.icon}</span>
                <span
                  className={`text-sm font-semibold ${
                    isDisabled
                      ? 'text-[#999]'
                      : isSelected
                      ? 'text-[#C0772C]'
                      : 'text-[#5C3D2E]'
                  }`}
                >
                  {duration.label}
                </span>
                <span className={`text-xs ${isDisabled ? 'text-[#999]' : 'text-[#A18072]'}`}>
                  {duration.description}
                </span>
              </button>
              {isDisabled && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F18A24] text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#A18072]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>
          {!isAuthenticated
            ? 'Sign in to create longer songs'
            : 'Longer songs take more time to generate'
          }
        </span>
      </div>
    </div>
  );
}

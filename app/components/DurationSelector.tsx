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
}

export default function DurationSelector({
  durations,
  selectedDuration,
  onSelect,
}: DurationSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-[#C07A33]">
        4. Choose song length
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {durations.map((duration) => {
          const isSelected = selectedDuration === duration.id;
          return (
            <button
              key={duration.id}
              onClick={() => onSelect(duration.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 transition-all ${
                isSelected
                  ? 'border-[#F39A43] bg-[#FFF2E3] shadow-md'
                  : 'border-transparent bg-[#FFF8F1] hover:bg-[#FFEDD5]'
              }`}
            >
              <span className="text-2xl">{duration.icon}</span>
              <span
                className={`text-sm font-semibold ${
                  isSelected ? 'text-[#C0772C]' : 'text-[#5C3D2E]'
                }`}
              >
                {duration.label}
              </span>
              <span className="text-xs text-[#A18072]">{duration.description}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#A18072]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>Longer songs take more time to generate</span>
      </div>
    </div>
  );
}

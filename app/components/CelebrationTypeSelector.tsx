interface CelebrationType {
  id: string;
  label: string;
  icon: string;
}

interface CelebrationTypeSelectorProps {
  celebrationTypes: CelebrationType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
}

export default function CelebrationTypeSelector({
  celebrationTypes,
  selectedType,
  onSelect,
}: CelebrationTypeSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-[#C07A33]">
        2. What are you celebrating?
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {celebrationTypes.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#FDF8F3] px-4 py-4 text-center transition ${
                isActive
                  ? 'border-[#F18A24] bg-[#FFF5EA]'
                  : 'border-transparent hover:border-[#F18A24]/30'
              }`}
            >
              <span className="text-3xl">{type.icon}</span>
              <span className="text-sm font-semibold text-[#2F1E14]">
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


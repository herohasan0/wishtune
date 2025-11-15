interface MusicStyle {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface MusicStyleSelectorProps {
  musicStyles: MusicStyle[];
  selectedStyle: string;
  onSelect: (styleId: string) => void;
}

export default function MusicStyleSelector({
  musicStyles,
  selectedStyle,
  onSelect,
}: MusicStyleSelectorProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-[#C07A33]">
        3. Choose a song style
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {musicStyles.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#FFF8F1] px-5 py-5 text-center transition ${
                isSelected
                  ? 'border-[#F18A24]'
                  : 'border-transparent hover:border-[#F18A24]/35'
              }`}
            >
              <div className="text-2xl">{style.icon}</div>
              <p className="text-sm font-semibold text-[#2F1E14]">
                {style.label}
              </p>
              <p className="text-sm text-[#A17F67]">{style.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}


interface NameInputProps {
  name: string;
  nameError: boolean;
  onNameChange: (value: string) => void;
}

export default function NameInput({ name, nameError, onNameChange }: NameInputProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase text-[#C07A33]">
        1. Who is this song for?
      </p>
      <label
        htmlFor="name"
        className="text-left text-sm font-semibold text-[#8F6C54]"
      >
        Celebrant&apos;s Name
      </label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter a name"
        className={`w-full mt-2 rounded-full border px-5 py-4 text-base font-medium placeholder:text-[#C6B0A0] focus:outline-none focus-visible:ring-2 ${
          nameError
            ? 'border-red-400 bg-[#FFF2F2] focus-visible:ring-red-300'
            : 'border-[#F1E1D4] bg-[#FFF9F3] focus-visible:ring-[#F18A24]/40'
        }`}
      />
      {nameError && (
        <p className="text-sm font-semibold text-red-500">
          Name is required to create a song
        </p>
      )}
    </div>
  );
}


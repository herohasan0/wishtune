interface CreateButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export default function CreateButton({ isLoading, onClick }: CreateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#EE8220] px-8 py-4 text-xl font-semibold text-white transition ${
        isLoading ? 'cursor-wait opacity-80' : 'hover:bg-[#E0710A]'
      }`}
    >
      {isLoading ? (
        <>
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 10h2zm2 5.291A7.962 7.962 0 014 10H2c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Creating...
        </>
      ) : (
        'Create My Song!'
      )}
    </button>
  );
}


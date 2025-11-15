export default function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-10 top-0 h-64 w-64 rounded-full bg-[#FFD9B4] opacity-40 blur-[80px]" />
      <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#FFE9CC] opacity-30 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#F9C58C] opacity-30 blur-[90px]" />
    </div>
  );
}


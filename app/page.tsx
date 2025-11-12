export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-main-text mb-4">Welcome</h1>
      
      {/* Examples of using colors with Tailwind */}
      <div className="space-y-4">
        <div className="bg-primary text-white p-4 rounded">
          Primary/Action color
        </div>
        <div className="bg-accent-1 p-4 rounded">
          Accent 1 color
        </div>
        <div className="bg-accent-2 p-4 rounded">
          Accent 2 color
        </div>
        <div className="bg-accent-3 p-4 rounded">
          Accent 3 color
        </div>
        <div className="text-primary font-bold">
          Text with primary color
        </div>
      </div>
    </main>
  );
}

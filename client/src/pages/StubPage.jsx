export default function StubPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-32">
      <h1 className="text-3xl font-bold mb-4 text-slate-800">{title}</h1>
      <p className="text-xl">This feature is coming soon...</p>
    </div>
  );
}

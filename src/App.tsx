import clubs from '@/data/clubs.snapshot.json'

export default function App() {
  const eventCount = clubs.reduce((n, v) => n + v.events.length, 0)
  return (
    <main className="min-h-dvh bg-black p-6 font-mono text-white">
      <h1 className="text-4xl font-bold uppercase">Jobb elöl</h1>
      <p className="mt-2">
        {clubs.length} helyszín · {eventCount} esemény (snapshot)
      </p>
    </main>
  )
}

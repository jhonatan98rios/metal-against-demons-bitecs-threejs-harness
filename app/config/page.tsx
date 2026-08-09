import Link from 'next/link'

export default function ConfigPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-900">
      <h1 className="font-mono text-2xl font-bold text-zinc-100">Config</h1>
      <Link
        href="/"
        className="rounded bg-zinc-600 px-4 py-2 font-mono text-sm text-zinc-100 transition-colors hover:bg-zinc-500"
      >
        Back
      </Link>
    </div>
  )
}

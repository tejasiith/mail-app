"use client"
import { useState } from "react"

interface Props {
  value: string
  onChange: (query: string) => void
}

export default function FilterBar({ value, onChange }: Props) {
  const [search, setSearch] = useState("")

  const applyPreset = (preset: string) => onChange(preset)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        className="flex-1 min-w-40 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 outline-none placeholder-zinc-400"
        placeholder="Search emails..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onChange(search)}
      />
      <button
        onClick={() => applyPreset("is:unread")}
        className="text-xs px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        Unread
      </button>
      <button
        onClick={() => applyPreset("newer_than:7d")}
        className="text-xs px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        This week
      </button>
      <button
        onClick={() => { setSearch(""); onChange("") }}
        className="text-xs px-2 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
      >
        Clear
      </button>
    </div>
  )
}
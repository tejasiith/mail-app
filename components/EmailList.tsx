"use client"
import { Email } from "@/types"
import { useRouter } from "next/navigation"

interface Props {
  emails: Email[]
  loading?: boolean
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function getSenderName(from: string) {
  const match = from.match(/^(.+?)\s*</)
  return match ? match[1].replace(/"/g, "") : from.split("@")[0]
}

export default function EmailList({ emails, loading }: Props) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex flex-col divide-y dark:divide-zinc-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 animate-pulse">
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
            </div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-1" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-64" />
          </div>
        ))}
      </div>
    )
  }

  if (!emails.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
        No emails found
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y dark:divide-zinc-800">
      {emails.map(email => (
        <div
          key={email.id}
          onClick={() => router.push(`/email/${email.id}`)}
          className={`px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
            email.isUnread ? "bg-blue-50/40 dark:bg-zinc-800/30" : ""
          }`}
        >
          <div className="flex justify-between items-baseline mb-0.5">
            <span className={`text-sm ${email.isUnread ? "font-semibold" : "font-medium text-zinc-600 dark:text-zinc-400"}`}>
              {getSenderName(email.from)}
            </span>
            <span className="text-xs text-zinc-400">{formatDate(email.date)}</span>
          </div>
          <div className={`text-sm truncate mb-0.5 ${email.isUnread ? "font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
            {email.subject}
          </div>
          <div className="text-xs text-zinc-400 truncate">{email.snippet}</div>
        </div>
      ))}
    </div>
  )
}
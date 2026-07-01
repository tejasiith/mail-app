"use client"
import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import EmailList from "@/components/EmailList"
import ComposeModal from "@/components/ComposeModal"
import AssistantPanel from "@/components/AssistantPanel"
import FilterBar from "@/components/FilterBar"
import { Email, ComposeState } from "@/types"
import { AssistantAction } from "@/lib/claude"

export default function InboxPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [folder, setFolder] = useState<"inbox" | "sent">("inbox")
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeValues, setComposeValues] = useState<Partial<ComposeState>>({})
  const [showAssistant, setShowAssistant] = useState(true)

  const fetchEmails = useCallback(async (q = query, f = folder) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/emails?folder=${f}&query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setEmails(data.emails || [])
    } catch {
      setEmails([])
    } finally {
      setLoading(false)
    }
  }, [query, folder])

  useEffect(() => {
    if (status === "unauthenticated") signIn("google")
    if (status === "authenticated") fetchEmails()
  }, [status])

  // Poll every 30s for new emails
  useEffect(() => {
    if (status !== "authenticated") return
    const interval = setInterval(() => fetchEmails(), 120000)
    return () => clearInterval(interval)
  }, [status, fetchEmails])

  const handleFilterChange = (newQuery: string) => {
    setQuery(newQuery)
    fetchEmails(newQuery, folder)
  }

  const handleFolderChange = (f: "inbox" | "sent") => {
    setFolder(f)
    setQuery("")
    fetchEmails("", f)
  }

  const handleAction = (action: AssistantAction) => {
    switch (action.type) {
      case "compose_email":
        setComposeValues({ to: action.to, subject: action.subject, body: action.body })
        setComposeOpen(true)
        break
      case "search_emails":
        if (action.folder === "sent") setFolder("sent")
        else setFolder("inbox")
        setQuery(action.query)
        fetchEmails(action.query, (action.folder as "inbox" | "sent") || "inbox")
        break
      case "open_email":
        router.push(`/email/${action.emailId}`)
        break
      case "navigate_to":
        if (action.view === "compose") {
          setComposeOpen(true)
        } else {
          handleFolderChange(action.view as "inbox" | "sent")
        }
        break
      case "reply_to_current":
        // No current email open here — assistant will handle from email detail page
        break
    }
  }

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-sm text-zinc-400">Loading...</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 border-r dark:border-zinc-800 flex flex-col py-4 px-3 gap-1">
        <div className="text-sm font-bold px-2 mb-4">✉ Mail</div>
        {(["inbox", "sent"] as const).map(f => (
          <button
            key={f}
            onClick={() => handleFolderChange(f)}
            className={`text-left text-sm px-3 py-2 rounded-lg capitalize ${
              folder === f
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setComposeOpen(true)}
          className="mt-auto text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium"
        >
          + Compose
        </button>
        <button
          onClick={() => setShowAssistant(p => !p)}
          className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1"
        >
          {showAssistant ? "Hide" : "Show"} Assistant
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b dark:border-zinc-800 px-4 py-2">
          <FilterBar value={query} onChange={handleFilterChange} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <EmailList emails={emails} loading={loading} />
        </div>
      </main>

      {/* Assistant Panel */}
      {showAssistant && (
        <aside className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <AssistantPanel
            context={{ currentView: folder }}
            recentEmails={emails.slice(0, 10).map(e => ({
              id: e.id,
              subject: e.subject,
              from: e.from,
              date: e.date,
            }))}
            onAction={handleAction}
          />
        </aside>
      )}

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => { setComposeOpen(false); setComposeValues({}) }}
        initialValues={composeValues}
        onSent={() => fetchEmails()}
      />
    </div>
  )
}
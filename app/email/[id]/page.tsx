"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AssistantPanel from "@/components/AssistantPanel"
import ComposeModal from "@/components/ComposeModal"
import { Email, ComposeState } from "@/types"
import { AssistantAction } from "@/lib/claude"

export default function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeValues, setComposeValues] = useState<Partial<ComposeState>>({})

  useEffect(() => {
    fetch(`/api/emails/${id}`)
      .then(r => r.json())
      .then(d => { setEmail(d.email); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleAction = (action: AssistantAction) => {
    switch (action.type) {
      case "reply_to_current":
        if (email) {
          setComposeValues({
            to: email.from,
            subject: `Re: ${email.subject}`,
            body: action.body || "",
            replyToId: email.threadId,
          })
          setComposeOpen(true)
        }
        break
      case "compose_email":
        setComposeValues({ to: action.to, subject: action.subject, body: action.body })
        setComposeOpen(true)
        break
      case "navigate_to":
        router.push(`/${action.view}`)
        break
      case "search_emails":
        router.push(`/inbox?q=${encodeURIComponent(action.query)}`)
        break
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-zinc-400">Loading...</div>
  }

  if (!email) {
    return <div className="flex h-screen items-center justify-center text-sm text-zinc-400">Email not found</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold mb-4">{email.subject}</h1>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium">{email.from}</p>
              <p className="text-xs text-zinc-400 mt-0.5">To: {email.to}</p>
            </div>
            <p className="text-xs text-zinc-400">{new Date(email.date).toLocaleString()}</p>
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap border-t dark:border-zinc-800 pt-6">
            {email.body}
          </div>
        </div>
      </div>

      <aside className="w-72 flex-shrink-0 border-l dark:border-zinc-800 flex flex-col overflow-hidden">
        <AssistantPanel
          context={{
            currentView: "email",
            openEmailId: email.id,
            openEmailSubject: email.subject,
            openEmailFrom: email.from,
          }}
          onAction={handleAction}
        />
      </aside>

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => { setComposeOpen(false); setComposeValues({}) }}
        initialValues={composeValues}
      />
    </div>
  )
}
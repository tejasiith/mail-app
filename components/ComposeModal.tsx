"use client"
import { useState, useEffect } from "react"
import { ComposeState } from "@/types"

interface Props {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<ComposeState>
  onSent?: () => void
}

export default function ComposeModal({ isOpen, onClose, initialValues, onSent }: Props) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setTo(initialValues.to || "")
      setSubject(initialValues.subject || "")
      setBody(initialValues.body || "")
    }
  }, [initialValues])

  const handleSend = async () => {
    if (!to || !subject || !body) return
    setSending(true)
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, replyToMessageId: initialValues?.replyToId }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          setSent(false)
          setSending(false)
          onClose()
          onSent?.()
        }, 1500)
      }
    } catch {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-700">
          <h2 className="font-semibold text-sm">New Message</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-lg">×</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <input
              className="w-full text-sm border-b dark:border-zinc-700 pb-2 outline-none bg-transparent placeholder-zinc-400"
              placeholder="To"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div>
            <input
              className="w-full text-sm border-b dark:border-zinc-700 pb-2 outline-none bg-transparent placeholder-zinc-400"
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <textarea
            className="w-full text-sm outline-none bg-transparent placeholder-zinc-400 resize-none min-h-[160px]"
            placeholder="Write your message..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
        <div className="flex justify-end px-4 pb-4">
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-medium"
          >
            {sent ? "Sent ✓" : sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
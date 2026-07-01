"use client"
import { useState } from "react"
import { AppContext } from "@/types"
import { AssistantAction } from "@/lib/claude"

interface Message {
  role: "user" | "assistant"
  text: string
  action?: AssistantAction
}

interface Props {
  context: AppContext
  recentEmails?: Array<{ id: string; subject: string; from: string; date: string }>
  onAction: (action: AssistantAction) => void
}

export default function AssistantPanel({ context, recentEmails, onAction }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hey! I can help you compose, search, or navigate your emails. Try: \"Show unread emails from this week\" or \"Reply to this\".",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: { ...context, recentEmails },
        }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: data.message, action: data.action },
      ])
      if (data.action) {
        onAction(data.action)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong, try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l dark:border-zinc-800">
      <div className="px-4 py-3 border-b dark:border-zinc-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm font-semibold">Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] text-sm px-3 py-2 rounded-xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm"
              }`}
            >
              {msg.text}
              {msg.action && (
                <div className="mt-1 text-xs opacity-60">
                  ↳ {msg.action.type.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-3 border-t dark:border-zinc-800">
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder-zinc-400"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="text-blue-600 disabled:opacity-40 text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
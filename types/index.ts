export interface Email {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  snippet?: string
  body?: string
  isUnread: boolean
}

export interface AppContext {
  currentView: "inbox" | "sent" | "email"
  openEmailId?: string
  openEmailSubject?: string
  openEmailFrom?: string
}

export interface ComposeState {
  to: string
  subject: string
  body: string
  replyToId?: string
}
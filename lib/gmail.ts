import { google } from "googleapis"

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: "v1", auth })
}

function decodeBase64(str: string): string {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

export async function fetchEmails(
  accessToken: string,
  options: {
    folder?: "inbox" | "sent"
    query?: string
    maxResults?: number
  } = {}
) {
  const gmail = getGmailClient(accessToken)
  const { folder = "inbox", query = "", maxResults = 30 } = options

  let q = folder === "sent" ? "in:sent" : "in:inbox"
  if (query) q += ` ${query}`

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults,
  })

  const messages = listRes.data.messages || []

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      })

      const headers = detail.data.payload?.headers || []
      const get = (name: string) => headers.find(h => h.name === name)?.value || ""

      return {
        id: msg.id!,
        threadId: detail.data.threadId!,
        from: get("From"),
        to: get("To"),
        subject: get("Subject") || "(no subject)",
        date: get("Date"),
        snippet: detail.data.snippet || "",
        isUnread: detail.data.labelIds?.includes("UNREAD") || false,
      }
    })
  )

  return emails
}

export async function fetchEmailById(accessToken: string, id: string) {
  const gmail = getGmailClient(accessToken)

  const detail = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  })

  const headers = detail.data.payload?.headers || []
  const get = (name: string) => headers.find(h => h.name === name)?.value || ""

  // Extract body
  let body = ""
  const parts = detail.data.payload?.parts || []

  function extractBody(parts: any[]): string {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data)
      }
      if (part.parts) {
        const nested = extractBody(part.parts)
        if (nested) return nested
      }
    }
    // Single part email
    if (detail.data.payload?.body?.data) {
      return decodeBase64(detail.data.payload.body.data)
    }
    return ""
  }

  body = parts.length > 0 ? extractBody(parts) : decodeBase64(detail.data.payload?.body?.data || "")

  return {
    id,
    threadId: detail.data.threadId!,
    from: get("From"),
    to: get("To"),
    subject: get("Subject") || "(no subject)",
    date: get("Date"),
    body,
    isUnread: detail.data.labelIds?.includes("UNREAD") || false,
    labelIds: detail.data.labelIds || [],
  }
}

export async function sendEmail(
  accessToken: string,
  options: { to: string; subject: string; body: string; replyToMessageId?: string }
) {
  const gmail = getGmailClient(accessToken)
  const { to, subject, body, replyToMessageId } = options

  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    body,
  ]

  const raw = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: replyToMessageId },
  })
}

export async function markAsRead(accessToken: string, id: string) {
  const gmail = getGmailClient(accessToken)
  await gmail.users.messages.modify({
    userId: "me",
    id,
    requestBody: { removeLabelIds: ["UNREAD"] },
  })
}
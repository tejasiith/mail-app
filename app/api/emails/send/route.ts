import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/gmail"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { to, subject, body: emailBody, replyToMessageId } = body

  if (!to || !subject || !emailBody) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  try {
    await sendEmail(session.accessToken, { to, subject, body: emailBody, replyToMessageId })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}
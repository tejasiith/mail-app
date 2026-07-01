import { auth } from "@/lib/auth"
import { fetchEmails } from "@/lib/gmail"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const folder = (searchParams.get("folder") || "inbox") as "inbox" | "sent"
  const query = searchParams.get("query") || ""

  try {
    const emails = await fetchEmails(session.accessToken, { folder, query })
    return NextResponse.json({ emails })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
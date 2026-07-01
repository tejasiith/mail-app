import { auth } from "@/lib/auth"
import { fetchEmailById, markAsRead } from "@/lib/gmail"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const email = await fetchEmailById(session.accessToken, id)
    await markAsRead(session.accessToken, id)
    return NextResponse.json({ email })
  } catch (e) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
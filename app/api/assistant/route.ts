import { auth } from "@/lib/auth"
import { runAssistant } from "@/lib/claude"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message, context } = await req.json()

  try {
    const result = await runAssistant(message, context)
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 })
  }
}
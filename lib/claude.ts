import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "compose_email",
      description: "Open the compose modal and fill in the email fields",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body content" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_emails",
      description: "Search and filter the email list with a Gmail query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Gmail search query e.g. 'from:sarah after:2025/06/20 is:unread'",
          },
          folder: {
            type: "string",
            enum: ["inbox", "sent"],
            description: "Which folder to search",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_email",
      description: "Navigate to and open a specific email by its ID",
      parameters: {
        type: "object",
        properties: {
          emailId: { type: "string", description: "The email ID to open" },
          subject: { type: "string", description: "Subject for display" },
        },
        required: ["emailId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description: "Navigate to a different view: inbox, sent, or compose",
      parameters: {
        type: "object",
        properties: {
          view: {
            type: "string",
            enum: ["inbox", "sent", "compose"],
          },
        },
        required: ["view"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_current",
      description: "Open compose pre-filled as a reply to the currently open email",
      parameters: {
        type: "object",
        properties: {
          body: { type: "string", description: "Reply body if user specified content" },
        },
        required: [],
      },
    },
  },
]

export type AssistantAction =
  | { type: "compose_email"; to?: string; subject?: string; body?: string }
  | { type: "search_emails"; query: string; folder?: string }
  | { type: "open_email"; emailId: string; subject?: string }
  | { type: "navigate_to"; view: "inbox" | "sent" | "compose" }
  | { type: "reply_to_current"; body?: string }

export interface AssistantResponse {
  message: string
  action?: AssistantAction
}

export async function runAssistant(
  userMessage: string,
  context: {
    currentView: string
    openEmailId?: string
    openEmailSubject?: string
    openEmailFrom?: string
    recentEmails?: Array<{ id: string; subject: string; from: string; date: string }>
  }
): Promise<AssistantResponse> {
  const systemPrompt = `You are a mail assistant that controls a Gmail web app UI.

Current context:
- View: ${context.currentView}
${context.openEmailId ? `- Open email: "${context.openEmailSubject}" from ${context.openEmailFrom}` : ""}
${context.recentEmails?.length ? `- Recent emails visible: ${JSON.stringify(context.recentEmails.slice(0, 5))}` : ""}

When the user asks you to do something with email, use the appropriate tool to control the UI.
Always use a tool when the user wants to compose, search, open, or navigate.
For searches, build proper Gmail queries (e.g., after:2025/06/19 for "last 10 days", from:name, is:unread, subject:keyword).
Be concise in your text responses — the UI action does the heavy lifting.`

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    tools: TOOLS,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  })

  const choice = response.choices[0]
  let message = choice.message.content || ""
  let action: AssistantAction | undefined

  const toolCall = choice.message.tool_calls?.[0]
  if (toolCall) {
    const name = toolCall.function.name
    const input = JSON.parse(toolCall.function.arguments)

    switch (name) {
      case "compose_email":
        action = { type: "compose_email", ...input }
        if (!message) message = `Opening compose${input.to ? ` to ${input.to}` : ""}...`
        break
      case "search_emails":
        action = { type: "search_emails", query: input.query, folder: input.folder }
        if (!message) message = `Searching for "${input.query}"...`
        break
      case "open_email":
        action = { type: "open_email", emailId: input.emailId, subject: input.subject }
        if (!message) message = `Opening email...`
        break
      case "navigate_to":
        action = { type: "navigate_to", view: input.view }
        if (!message) message = `Navigating to ${input.view}...`
        break
      case "reply_to_current":
        action = { type: "reply_to_current", body: input.body }
        if (!message) message = `Setting up reply...`
        break
    }
  }

  return { message, action }
}
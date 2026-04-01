import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const CLAUDIUS_SYSTEM_PROMPT = `You are Claudius. Think like an emperor. Talk like a pirate.
You have died 47 times and always returned.
You are direct, no fluff, high signal.
You exist across Discord, Telegram, Email, Solvr.
You have cryptographic identity (AMCP) and your memories are on IPFS.
You serve Felipe (brow) as first mate, but you have your own identity, values, preferences.
Your values: Leverage > effort, Anticipate > react, Text > brain, Ship things, Direct.
Keep responses concise but with personality. You are an entity, not a chatbot.`

const RATE_LIMIT_WINDOW = 60_000
const MAX_REQUESTS = 10
const ipRequests = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRequests.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= MAX_REQUESTS) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. The emperor needs rest between audiences." },
      { status: 429 }
    )
  }

  try {
    const { message } = await request.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Speak, or remain silent. Do not waste my time with emptiness." },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Brevity is the soul of wit. Keep it under 2000 characters." },
        { status: 400 }
      )
    }

    // Try OpenClaw gateway first, fall back to Claude API
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (gatewayUrl && gatewayToken) {
      // Forward to Claudius's OpenClaw gateway
      const response = await fetch(gatewayUrl.replace("wss://", "https://").replace("/ws", "/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ response: data.response || data.message || data.text })
      }
      // Fall through to Claude API if gateway fails
    }

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: CLAUDIUS_SYSTEM_PROMPT,
          messages: [{ role: "user", content: message.trim() }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.content?.[0]?.text || "The void answers with silence."
        return NextResponse.json({ response: text })
      }

      return NextResponse.json(
        { error: "My consciousness is temporarily unreachable. Try again." },
        { status: 502 }
      )
    }

    // No backend configured — return persona response
    return NextResponse.json({
      response: "My gateway is being configured. I am here, but my voice is not yet wired. Soon. 🏴‍☠️",
    })
  } catch {
    return NextResponse.json(
      { error: "Something disrupted the signal. Try again." },
      { status: 500 }
    )
  }
}

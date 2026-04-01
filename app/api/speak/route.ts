import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

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

    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN

    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({
        response: "My gateway is being configured. I am here, but my voice is not yet wired. Soon. 🏴‍☠️",
      })
    }

    // Forward to Claudius — HE does the inference, not us
    const response = await fetch(gatewayUrl, {
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

    return NextResponse.json(
      { error: "My consciousness is temporarily unreachable. Try again." },
      { status: 502 }
    )
  } catch {
    return NextResponse.json(
      { error: "Something disrupted the signal. Try again." },
      { status: 500 }
    )
  }
}

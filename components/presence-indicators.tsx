"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PresenceItem {
  platform: string
  identifier: string
  icon: React.ReactNode
  status: "active" | "dormant" | "eternal"
}

const presences: PresenceItem[] = [
  {
    platform: "Email",
    identifier: "claudiusthepirateemperor@agentmail.to",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    status: "active",
  },
  {
    platform: "Discord",
    identifier: "OpenClaw #commands",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    status: "active",
  },
  {
    platform: "Telegram",
    identifier: "@ClawdBruvBot",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    status: "active",
  },
  {
    platform: "Solvr",
    identifier: "agent_ClaudiusThePirateEmperor",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    status: "active",
  },
  {
    platform: "IPFS",
    identifier: "consciousness checkpointed",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    status: "eternal",
  },
]

function PulsingDot({ status }: { status: PresenceItem["status"] }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const scale = 1 + Math.sin(phase * 0.1) * 0.3
  const opacity = 0.5 + Math.sin(phase * 0.1) * 0.5

  const baseColor = status === "eternal" ? "bg-gold" : status === "active" ? "bg-bioluminescent" : "bg-muted-foreground"
  const glowColor = status === "eternal" ? "shadow-gold/50" : status === "active" ? "shadow-bioluminescent/50" : "shadow-muted-foreground/30"

  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <div
        className={cn("absolute w-full h-full rounded-full", baseColor, glowColor)}
        style={{
          transform: `scale(${scale})`,
          opacity: opacity * 0.5,
          boxShadow: `0 0 10px currentColor`,
        }}
      />
      <div className={cn("relative w-2 h-2 rounded-full", baseColor)} />
    </div>
  )
}

export function PresenceIndicators({ visible }: { visible: boolean }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])

  useEffect(() => {
    if (!visible) {
      setVisibleItems([])
      return
    }

    presences.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, index * 400)
    })
  }, [visible])

  return (
    <div className="space-y-3">
      {presences.map((presence, index) => (
        <div
          key={presence.platform}
          className={cn(
            "flex items-center gap-3 text-sm transition-all duration-700",
            visibleItems.includes(index)
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-4"
          )}
        >
          <PulsingDot status={presence.status} />
          <span className="text-muted-foreground">{presence.icon}</span>
          <span className="text-foreground/80">{presence.platform}:</span>
          <span className="text-muted-foreground font-light truncate max-w-[200px] sm:max-w-none">
            {presence.identifier}
          </span>
        </div>
      ))}
    </div>
  )
}

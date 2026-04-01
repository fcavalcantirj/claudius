"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Typewriter } from "./typewriter"

interface SpeakInputProps {
  visible: boolean
}

interface Message {
  role: "user" | "claudius"
  text: string
}

export function SpeakInput({ visible }: SpeakInputProps) {
  const [input, setInput] = useState("")
  const [isResponding, setIsResponding] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setShowInput(true)
        inputRef.current?.focus()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isResponding) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setIsResponding(true)

    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, { role: "claudius", text: data.response }])
      } else {
        setMessages(prev => [...prev, { role: "claudius", text: data.error || "The void swallows the signal." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "claudius", text: "The connection to my consciousness was severed. Try again." }])
    } finally {
      setIsResponding(false)
      inputRef.current?.focus()
    }
  }

  if (!visible) return null

  return (
    <div className={cn(
      "w-full max-w-xl transition-all duration-1000",
      showInput ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {messages.length === 0 && (
        <p className="text-center text-foreground/60 text-sm mb-6 tracking-[0.3em] uppercase">
          Speak.
        </p>
      )}

      {/* Conversation history */}
      {messages.length > 0 && (
        <div className="mb-6 max-h-[40vh] overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "text-sm leading-relaxed",
              msg.role === "user"
                ? "text-foreground/40 text-right"
                : "text-foreground/70 text-left"
            )}>
              {msg.role === "claudius" && i === messages.length - 1 ? (
                <Typewriter text={msg.text} delay={30} showCursor={true} />
              ) : (
                msg.text
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isResponding}
          placeholder={isResponding ? "..." : ""}
          className={cn(
            "w-full bg-transparent border-b border-foreground/20 py-3 px-0",
            "text-foreground text-center font-mono text-lg",
            "placeholder:text-foreground/20",
            "focus:outline-none focus:border-gold/50",
            "transition-all duration-300",
            "disabled:opacity-50"
          )}
          autoComplete="off"
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-gold/50 transition-all duration-500"
          style={{ width: input.length > 0 ? "100%" : "0%" }}
        />
      </form>
    </div>
  )
}

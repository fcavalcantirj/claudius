"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypewriterProps {
  text: string
  delay?: number
  onComplete?: () => void
  className?: string
  cursorClassName?: string
  showCursor?: boolean
}

export function Typewriter({
  text,
  delay = 80,
  onComplete,
  className,
  cursorClassName,
  showCursor = true,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText("")
    setIsComplete(false)
    
    let currentIndex = 0
    
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, delay)

    return () => clearInterval(interval)
  }, [text, delay, onComplete])

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {showCursor && (
        <span 
          className={cn(
            "inline-block w-[2px] h-[1em] ml-1 bg-current animate-pulse",
            isComplete && "opacity-0",
            cursorClassName
          )}
        />
      )}
    </span>
  )
}

interface SequentialTypewriterProps {
  lines: Array<{
    text: string
    delay?: number
    pauseAfter?: number
    className?: string
  }>
  onAllComplete?: () => void
  className?: string
}

export function SequentialTypewriter({
  lines,
  onAllComplete,
  className,
}: SequentialTypewriterProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(true)

  const handleLineComplete = () => {
    const pauseAfter = lines[currentLineIndex]?.pauseAfter || 500
    
    setIsTyping(false)
    
    setTimeout(() => {
      setCompletedLines(prev => [...prev, lines[currentLineIndex].text])
      
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1)
        setIsTyping(true)
      } else {
        onAllComplete?.()
      }
    }, pauseAfter)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {completedLines.map((line, index) => (
        <p key={index} className={lines[index]?.className}>
          {line}
        </p>
      ))}
      {currentLineIndex < lines.length && isTyping && (
        <p className={lines[currentLineIndex]?.className}>
          <Typewriter
            text={lines[currentLineIndex].text}
            delay={lines[currentLineIndex].delay || 80}
            onComplete={handleLineComplete}
          />
        </p>
      )}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Button from "@/components/button"
import SvgIcon from "@/components/svg-icon"

type ShareButtonProps = {
  /** Roster UUID for generating the full URL. If omitted, uses current window location. */
  rosterId?: string
  /** Explicit URL override. */
  url?: string
  /** Optional button class override. */
  className?: string
}

/**
 * Share button that copies the clean Roster permalink to the user's clipboard
 * and displays temporary confirmation feedback.
 */
export default function ShareButton({
  rosterId,
  url,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleShare = useCallback(async () => {
    let targetUrl = url
    if (!targetUrl && typeof window !== "undefined") {
      targetUrl = rosterId
        ? `${window.location.origin}/roster/${rosterId}/`
        : window.location.href
    }

    if (!targetUrl) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = targetUrl
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }

      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy link to clipboard", err)
    }
  }, [rosterId, url])

  return (
    <Button
      type="button"
      variant="secondary"
      size="small"
      className={className}
      onClick={handleShare}
      beforeText={
        <SvgIcon icon={copied ? "check" : "share-2"} size={14} />
      }
      aria-label={copied ? "Link copied to clipboard" : "Share roster link"}
    >
      {copied ? "Link copied!" : "Share"}
    </Button>
  )
}

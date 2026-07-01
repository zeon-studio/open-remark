// components/dashboard/administration/smtp-password-reveal.tsx
"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function SmtpPasswordReveal({ value }: { value: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{show ? value : "•".repeat(12)}</span>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeOff className="size-3.5" aria-hidden="true" />
        ) : (
          <Eye className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

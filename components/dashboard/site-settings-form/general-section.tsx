"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUpdateSite } from "@/lib/queries/sites"
import type { Site } from "./types"
import { parseOrigins } from "./utils"

type Props = {
  site: Site
}

export function GeneralSection({ site }: Props) {
  const updateSite = useUpdateSite(site.id)
  const [originsText, setOriginsText] = useState(() =>
    parseOrigins(site.allowedOrigins).join("\n")
  )

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const normalized = (form.get("allowedOrigins") as string)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (s === "*" || s.includes("*")) return s.replace(/\/+$/, "")
        try {
          const withProto = s.match(/^https?:\/\//i) ? s : `https://${s}`
          return new URL(withProto).origin
        } catch {
          return s.replace(/\/+$/, "")
        }
      })

    setOriginsText(normalized.join("\n"))

    updateSite.mutate(
      {
        name: (form.get("name") as string) || "",
        domain: (form.get("domain") as string) || "",
        autoApprove: form.get("autoApprove") === "on",
        allowedOrigins: normalized,
      },
      {
        onSuccess: (updated) => {
          toast.success("Settings saved")
          setOriginsText(parseOrigins(updated.allowedOrigins).join("\n"))
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Site name</Label>
            <Input id="name" name="name" defaultValue={site.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              name="domain"
              defaultValue={site.domain}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="allowedOrigins">
              Allowed origins (one per line)
            </Label>
            <Textarea
              id="allowedOrigins"
              name="allowedOrigins"
              value={originsText}
              onChange={(e) => setOriginsText(e.target.value)}
              rows={4}
              placeholder={"https://myblog.com\nhttps://www.myblog.com"}
            />
            <p className="text-xs text-muted-foreground">
              Only these origins can post comments via the embed. Use * to allow
              all (not recommended).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoApprove"
              name="autoApprove"
              defaultChecked={site.autoApprove}
              className="size-4 rounded-sm border-input"
            />
            <Label htmlFor="autoApprove" className="cursor-pointer">
              Auto-approve comments
            </Label>
          </div>
          <Button type="submit" disabled={updateSite.isPending}>
            {updateSite.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

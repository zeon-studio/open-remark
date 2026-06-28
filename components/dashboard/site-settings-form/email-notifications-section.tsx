"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUpdateSite } from "@/lib/queries/sites"
import type { Site } from "./types"

type Props = {
  site: Site
}

export function EmailNotificationsSection({ site }: Props) {
  const updateSite = useUpdateSite(site.id)
  const [emailEnabled, setEmailEnabled] = useState(
    site.emailNotificationsEnabled
  )
  const [likeNotificationLimit, setLikeNotificationLimit] = useState(
    String(site.likeNotificationLimit)
  )
  const [emailSubjectPrefix, setEmailSubjectPrefix] = useState(
    site.emailSubjectPrefix ?? ""
  )
  const [emailLogoUrl, setEmailLogoUrl] = useState(site.emailLogoUrl ?? "")
  const [emailAccentColor, setEmailAccentColor] = useState(
    site.emailAccentColor ?? ""
  )
  const [emailFooterText, setEmailFooterText] = useState(
    site.emailFooterText ?? ""
  )
  const [smtpHost, setSmtpHost] = useState(site.smtpHost ?? "")
  const [smtpPort, setSmtpPort] = useState(
    site.smtpPort ? String(site.smtpPort) : "465"
  )
  const [smtpUser, setSmtpUser] = useState(site.smtpUser ?? "")
  const [smtpPass, setSmtpPass] = useState(site.smtpPass ?? "")
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [smtpFrom, setSmtpFrom] = useState(site.smtpFrom ?? "")

  // smtpFrom is optional — falls back to smtpUser when smtpUser is an email
  const smtpConfigured =
    smtpHost.trim() !== "" && smtpUser.trim() !== "" && smtpPass.trim() !== ""

  // If SMTP config is removed, auto-disable notifications
  if (!smtpConfigured && emailEnabled) setEmailEnabled(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState<"new-comment" | "reply">(
    "new-comment"
  )
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)

  function handleSaveEmail() {
    updateSite.mutate(
      {
        emailNotificationsEnabled: emailEnabled,
        likeNotificationLimit: Math.max(
          0,
          Math.min(100, parseInt(likeNotificationLimit, 10) || 0)
        ),
        emailSubjectPrefix: emailSubjectPrefix || null,
        emailLogoUrl: emailLogoUrl || null,
        emailAccentColor: emailAccentColor || null,
        emailFooterText: emailFooterText || null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        smtpFrom: smtpFrom || null,
      },
      {
        onSuccess: () => {
          toast.success("Email settings saved")
        },
      }
    )
  }

  async function handlePreview(type: "new-comment" | "reply") {
    setPreviewType(type)
    setPreviewLoading(true)
    setPreviewOpen(true)
    try {
      const res = await fetch(
        `/api/v1/sites/${site.id}/email-preview?type=${type}`
      )
      if (!res.ok) throw new Error("Preview failed")
      setPreviewHtml(await res.text())
    } catch {
      toast.error("Failed to load preview")
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Notify site owners on new comments and commenters on replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <p className="text-sm font-medium">SMTP Relay</p>
            <p className="-mt-2 text-xs text-muted-foreground">
              Configure per-site SMTP credentials. Supports any provider
              including Resend (smtp.resend.com:465).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="smtp-host">Host</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.resend.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="465"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Sender identity</p>

            <div className="space-y-1.5">
              <Label htmlFor="smtp-from">
                From address{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="smtp-from"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The sender address shown to recipients. Leave blank to use the
                username below. Required for providers like Resend where the
                username isn&apos;t an email (e.g. &quot;resend&quot;).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtp-user">Username</Label>
              <Input
                id="smtp-user"
                placeholder="resend"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtp-pass">Password / API Key</Label>
              <div className="relative">
                <Input
                  id="smtp-pass"
                  type={showSmtpPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showSmtpPass ? "Hide password" : "Show password"}
                >
                  {showSmtpPass ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">Email appearance</p>

            <div className="space-y-1.5">
              <Label htmlFor="email-logo-url">Logo URL</Label>
              <Input
                id="email-logo-url"
                type="url"
                placeholder="https://yourdomain.com/logo.png"
                value={emailLogoUrl}
                onChange={(e) => setEmailLogoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-accent-color">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={emailAccentColor || "#6366f1"}
                  onChange={(e) => setEmailAccentColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
                  aria-label="Accent color"
                />
                <Input
                  id="email-accent-color"
                  placeholder="#6366f1"
                  value={emailAccentColor}
                  onChange={(e) => setEmailAccentColor(e.target.value)}
                  className="max-w-36 font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-subject-prefix">Subject prefix</Label>
              <Input
                id="email-subject-prefix"
                placeholder="[New Comment]"
                value={emailSubjectPrefix}
                onChange={(e) => setEmailSubjectPrefix(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-footer-text">Footer text</Label>
              <Textarea
                id="email-footer-text"
                placeholder="You're receiving this because you commented on this site."
                value={emailFooterText}
                onChange={(e) => setEmailFooterText(e.target.value)}
                rows={2}
                maxLength={300}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Like notification limit</p>
              <p className="text-xs text-muted-foreground">
                Notify commenters on likes up to this count. Set to 0 to
                disable.
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              className="w-20 text-right"
              value={likeNotificationLimit}
              onChange={(e) => setLikeNotificationLimit(e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable notifications</p>
              <p className="text-xs text-muted-foreground">
                {smtpConfigured
                  ? "Send email alerts for this site"
                  : "Configure SMTP relay before enabling"}
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              disabled={!smtpConfigured}
            />
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={handleSaveEmail}
              disabled={updateSite.isPending}
              size="sm"
            >
              {updateSite.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview("new-comment")}
            >
              Preview: New Comment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview("reply")}
            >
              Preview: Reply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewType === "new-comment"
                ? "New Comment Email"
                : "Reply Email"}{" "}
              Preview
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              className="h-[480px] w-full rounded border"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

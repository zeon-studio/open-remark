// components/dashboard/administration/read-only-site-settings.tsx
import type { ReactNode } from "react"
import type { getSiteForAdminView } from "@/lib/services/platform-admin-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SmtpPasswordReveal } from "./smtp-password-reveal"

type Site = Awaited<ReturnType<typeof getSiteForAdminView>>

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function ReadOnlySiteSettings({ site }: { site: Site }) {
  const allowedOrigins: string[] = JSON.parse(site.allowedOrigins || "[]")

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">General</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Name" value={site.name} />
          <Field label="Domain" value={site.domain} />
          <Field
            label="Allowed origins"
            value={allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "—"}
          />
          <Field
            label="Auto-approve"
            value={
              <Badge variant={site.autoApprove ? "default" : "outline"}>
                {site.autoApprove ? "On" : "Off"}
              </Badge>
            }
          />
          <Field
            label="Allow anonymous"
            value={
              <Badge variant={site.allowAnonymous ? "default" : "outline"}>
                {site.allowAnonymous ? "On" : "Off"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Theme" value={site.theme} />
          <Field label="Primary color" value={site.primaryColor} />
          <Field label="Radius" value={`${site.radius}px`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Enabled"
            value={
              <Badge
                variant={site.emailNotificationsEnabled ? "default" : "outline"}
              >
                {site.emailNotificationsEnabled ? "On" : "Off"}
              </Badge>
            }
          />
          <Field
            label="Like notification limit"
            value={site.likeNotificationLimit}
          />
          <Field
            label="Subject prefix"
            value={site.emailSubjectPrefix ?? "—"}
          />
          <Field label="From address" value={site.smtpFrom ?? "—"} />
          <Field label="SMTP host" value={site.smtpHost ?? "—"} />
          <Field label="SMTP port" value={site.smtpPort ?? "—"} />
          <Field label="SMTP user" value={site.smtpUser ?? "—"} />
          <Field
            label="SMTP password"
            value={
              site.smtpPass ? <SmtpPasswordReveal value={site.smtpPass} /> : "—"
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

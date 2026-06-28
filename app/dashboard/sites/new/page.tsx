"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCreateSite } from "@/lib/queries/sites"

export default function NewSitePage() {
  const router = useRouter()
  const createSite = useCreateSite()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = new FormData(e.currentTarget)
    const domain = (form.get("domain") as string) ?? ""
    const origin = domain
      ? (domain.match(/^https?:\/\//) ? domain : `https://${domain}`).replace(
          /\/+$/,
          ""
        )
      : ""
    const body = {
      name: form.get("name") as string,
      domain,
      autoApprove: form.get("autoApprove") === "on",
      allowedOrigins: origin ? [origin] : [],
    }

    createSite.mutate(body, {
      onSuccess: (site) => {
        toast.success("Site created!")
        router.push(`/dashboard/sites/${site.id}/install`)
        router.refresh()
      },
    })
  }

  return (
    <div>
      <PageHeader
        title="Add Site"
        description="Register a new site to embed comments"
      />
      <div className="max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>Site details</CardTitle>
            <CardDescription>
              Your site key will be generated automatically after registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Site name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Blog…"
                  required
                  minLength={1}
                  maxLength={100}
                  autoComplete="organization"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="myblog.com or http://localhost:3000"
                  required
                  pattern="[a-zA-Z0-9.:\/\-]+"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. myblog.com or http://localhost:3000
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoApprove"
                  name="autoApprove"
                  className="size-4 rounded border-input"
                />
                <Label htmlFor="autoApprove" className="cursor-pointer">
                  Auto-approve comments (skip moderation queue)
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createSite.isPending}>
                  {createSite.isPending ? "Creating…" : "Create site"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

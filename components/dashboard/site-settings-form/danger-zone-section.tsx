"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDeleteSite } from "@/lib/queries/sites"

type Props = {
  siteId: string
}

export function DangerZoneSection({ siteId }: Props) {
  const router = useRouter()
  const deleteSite = useDeleteSite(siteId)

  function handleDelete() {
    if (
      !confirm("Delete this site and all its comments? This cannot be undone.")
    )
      return
    deleteSite.mutate(undefined, {
      onSuccess: () => {
        toast.success("Site deleted")
        router.push("/dashboard/sites")
        router.refresh()
      },
    })
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete this site and all its comments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteSite.isPending}
        >
          {deleteSite.isPending ? "Deleting…" : "Delete site"}
        </Button>
      </CardContent>
    </Card>
  )
}

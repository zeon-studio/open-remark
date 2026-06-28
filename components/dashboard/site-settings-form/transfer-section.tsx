"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
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
import { ApiClientError } from "@/lib/api-client"
import { useLookupUser, useTransferSite } from "@/lib/queries/sites"

type TransferStep =
  | "idle"
  | "looking"
  | "looked-up"
  | "transferring"
  | "success"
  | "error"

type Props = {
  siteId: string
}

export function TransferSection({ siteId }: Props) {
  const router = useRouter()
  const lookupUser = useLookupUser()
  const transferSite = useTransferSite(siteId)
  const [transferEmail, setTransferEmail] = useState("")
  const [transferStep, setTransferStep] = useState<TransferStep>("idle")
  const [transferRecipient, setTransferRecipient] = useState<{
    name: string | null
    email: string
  } | null>(null)
  const [transferError, setTransferError] = useState("")
  const transferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (transferTimerRef.current) clearTimeout(transferTimerRef.current)
    }
  }, [])

  function handleLookup() {
    setTransferStep("looking")
    setTransferError("")
    lookupUser.mutate(transferEmail, {
      onSuccess: (user) => {
        setTransferRecipient({ name: user.name, email: user.email })
        setTransferStep("looked-up")
      },
      onError: (err) => {
        setTransferError(
          err instanceof ApiClientError
            ? err.message
            : "No user found with that email."
        )
        setTransferStep("error")
      },
    })
  }

  function handleTransfer() {
    setTransferStep("transferring")
    transferSite.mutate(transferEmail, {
      onSuccess: () => {
        setTransferStep("success")
        transferTimerRef.current = setTimeout(() => {
          router.push("/dashboard/sites")
          router.refresh()
        }, 3000)
      },
      onError: (err) => {
        toast.error(
          err instanceof ApiClientError ? err.message : "Transfer failed"
        )
        setTransferStep("looked-up")
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transfer Ownership</CardTitle>
        <CardDescription>
          Transfer this site to another registered user. You will lose access
          immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {transferStep === "success" ? (
          <p className="text-sm text-green-600">
            Site transferred to{" "}
            {transferRecipient?.name ?? transferRecipient?.email}. Redirecting…
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transferEmail">New owner email</Label>
              <Input
                id="transferEmail"
                type="email"
                value={transferEmail}
                onChange={(e) => {
                  setTransferEmail(e.target.value)
                  if (transferStep !== "idle") {
                    setTransferStep("idle")
                    setTransferRecipient(null)
                    setTransferError("")
                  }
                }}
                disabled={
                  transferStep === "looking" || transferStep === "transferring"
                }
                placeholder="user@example.com"
              />
              {transferError && (
                <p className="text-xs text-destructive">{transferError}</p>
              )}
            </div>

            {(transferStep === "idle" ||
              transferStep === "looking" ||
              transferStep === "error") && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={!transferEmail || transferStep === "looking"}
              >
                {transferStep === "looking" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Looking up…
                  </>
                ) : (
                  "Look up user"
                )}
              </Button>
            )}

            {(transferStep === "looked-up" ||
              transferStep === "transferring") &&
              transferRecipient && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">
                      {transferRecipient.name ?? "Unknown"}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {transferRecipient.email}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleTransfer}
                      disabled={transferStep === "transferring"}
                    >
                      {transferStep === "transferring" ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Transferring…
                        </>
                      ) : (
                        "Confirm Transfer"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={transferStep === "transferring"}
                      onClick={() => {
                        setTransferStep("idle")
                        setTransferRecipient(null)
                        setTransferEmail("")
                        setTransferError("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

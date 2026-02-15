"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { AuthApi } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setResetToken(null)

    try {
      const response = await AuthApi.forgotPassword(email)
      setSuccess(response.message || "If the email exists, a reset link has been sent")
      
      // In dev mode, the API might return the reset token
      if (response.reset_token) {
        setResetToken(response.reset_token)
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-md">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Forgot Password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {resetToken && (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <p className="font-semibold">Development Mode - Reset Token:</p>
                    <code className="block p-2 bg-muted rounded text-xs break-all">
                      {resetToken}
                    </code>
                    <Link 
                      href={`/reset-password?token=${resetToken}`}
                      className="text-primary underline text-sm hover:no-underline"
                    >
                      Click here to reset your password
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-sm text-center space-y-2">
              <Link href="/login" className="text-primary underline hover:no-underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

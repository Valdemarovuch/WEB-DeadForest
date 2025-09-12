"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { registerRequest, loginRequest, setToken } from "@/lib/api"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await registerRequest({ name, email, password, age: age === "" ? null : Number(age) })
      const { access_token } = await loginRequest(email, password)
      setToken(access_token)
      router.push("/store")
    } catch (err: any) {
      setError(err.message || "Registration failed")
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
            <h1 className="text-2xl font-bold">Create account</h1>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Age (optional)</label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <div className="text-sm text-red-500">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Register"}
              </Button>
            </form>
            <div className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="underline">Login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

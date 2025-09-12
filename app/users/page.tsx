"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthApi, UsersApi, AdminApi } from "@/lib/api"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function UsersPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, { email?: boolean }>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const m = await AuthApi.me()
        setMe(m)
        if (!m?.is_admin) {
          router.replace("/")
          return
        }
        // Prefer admin full users list (includes password_hash)
        try {
          const full = await AdminApi.usersFull()
          setUsers(full)
        } catch {
          const list = await UsersApi.list()
          setUsers(list)
        }
      } catch (e: any) {
        setError(e.message || "Failed to load users")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const toggleAdmin = async (email: string, makeAdmin: boolean) => {
    setActing(email)
    setError(null)
    try {
      if (makeAdmin) await AdminApi.promote(email)
      else await AdminApi.demote(email)
      setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, is_admin: makeAdmin } : u)))
      if (me?.email === email) {
        // if current user role changed, reflect globally
        const updated = { ...me, is_admin: makeAdmin }
        setMe(updated)
        try { window.dispatchEvent(new CustomEvent("user-updated", { detail: updated })) } catch {}
      }
    } catch (e: any) {
      setError(e.message || "Failed to update role")
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Users</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-zinc-400">Loading...</div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400">
                      <th className="py-2">ID</th>
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Age</th>
                      <th className="py-2">Admin</th>
                      <th className="py-2">Avatar</th>
                      <th className="py-2">Created</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-zinc-800 text-white">
                        <td className="py-2">{u.id}</td>
                        <td className="py-2">{u.name}</td>
                        <td className="py-2">
                          <button
                            className="text-cyan-400 hover:underline"
                            onClick={() => setRevealed((r) => ({ ...r, [u.email]: { ...(r[u.email] || {}), email: !r[u.email]?.email } }))}
                          >
                            {revealed[u.email]?.email ? u.email : maskEmail(u.email)}
                          </button>
                        </td>
                        <td className="py-2">{u.age ?? "—"}</td>
                        <td className="py-2">
                          {u.is_admin ? (
                            <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">User</Badge>
                          )}
                        </td>
                        <td className="py-2">{u.avatar ? "Yes" : "No"}</td>
                        <td className="py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
                        <td className="py-2">
                          {u.is_admin ? (
                            <Button size="sm" variant="outline" disabled={acting === u.email} onClick={() => toggleAdmin(u.email, false)}>
                              {acting === u.email ? "Working..." : "Demote"}
                            </Button>
                          ) : (
                            <Button size="sm" disabled={acting === u.email} onClick={() => toggleAdmin(u.email, true)}>
                              {acting === u.email ? "Working..." : "Promote"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  const maskedName = name.length <= 2 ? name[0] + "*" : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name[name.length - 1]
  const [dmain, tld = ""] = domain.split(".")
  const maskedDomain = (dmain ? dmain[0] + "*".repeat(Math.max(1, dmain.length - 1)) : "*") + (tld ? "." + tld : "")
  return `${maskedName}@${maskedDomain}`
}

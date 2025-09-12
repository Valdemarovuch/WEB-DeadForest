"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AdminApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AdminPromoCodes() {
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ code: string; discount: number | ""; max_uses: string; expires_at: string }>({ code: "", discount: "", max_uses: "", expires_at: "" })

  useEffect(() => {
    ;(async () => {
      try {
        const list = await AdminApi.promoCodesList()
        setCodes(list || [])
      } catch (e: any) {
        setError(e.message || "Failed to load promo codes")
      } finally {
        setLoading(false)
      }
    })()
  }, [])


  if (loading) return <div className="text-muted-foreground">Loading promo codes…</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
    <CardTitle>Promo Codes ({codes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-2 sm:grid-cols-4">
          <Input placeholder="CODE" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <Input type="number" placeholder="Discount %" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value === "" ? "" : Number(e.target.value) }))} />
          <Input type="number" placeholder="Max uses (optional)" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} />
          <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
          <div className="sm:col-span-4">
            <Button disabled={creating} onClick={async () => {
              setError(null)
              if (!form.code.trim()) { setError("Code is required"); return }
              const payload: any = { code: form.code.trim(), discount: Number(form.discount) || 0, is_active: true }
              if (form.max_uses !== "") payload.max_uses = Number(form.max_uses)
              if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString()
              setCreating(true)
              try {
                const created = await AdminApi.promoCodesList().then(() => fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/admin/promo-codes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                  body: JSON.stringify(payload),
                })).then((r) => r.json())
                setCodes((prev) => [created, ...prev])
                setForm({ code: "", discount: "", max_uses: "", expires_at: "" })
              } catch (e: any) {
                setError(e.message || "Failed to create promo code")
              } finally {
                setCreating(false)
              }
            }}>Create Promo</Button>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Max Uses</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.code}</TableCell>
                <TableCell>{p.discount}%</TableCell>
                <TableCell>{p.max_uses ?? "∞"}</TableCell>
                <TableCell>{p.uses ?? 0}</TableCell>
                <TableCell>{p.expires_at ? new Date(p.expires_at).toLocaleString() : "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        await AdminApi.deletePromo(p.id)
                        setCodes((prev) => prev.filter((x) => x.id !== p.id))
                      } catch (e: any) {
                        alert(e.message || "Failed to delete promo code")
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
  </Card>
  )
}

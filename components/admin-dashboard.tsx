"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ShoppingCart, DollarSign, Package, Eye, EyeOff } from "lucide-react"
import { AdminApi } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type Stats = {
  total_revenue: number
  total_orders: number
  active_products: number
  page_views: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Array<{ id: number; customer: string; total: number; status: string; created_at?: string | null }>>([])
  const [top, setTop] = useState<Array<{ id: number; name: string; sales: number; revenue: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prodCounts, setProdCounts] = useState<{ active: number; disabled: number }>({ active: 0, disabled: 0 })

  // Sales chart state
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month")
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "365d">("30d")
  const [tsData, setTsData] = useState<Array<{ bucket: string; revenue: number; orders: number }>>([])
  const [tsLoading, setTsLoading] = useState(true)
  const [tsError, setTsError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
  const [s, ro, tp, pr] = await Promise.all([
          AdminApi.stats(),
          AdminApi.recentOrders(),
          AdminApi.topProducts(),
          AdminApi.products(),
        ])
        setStats(s)
  setRecent(ro)
  setTop(tp || [])
        const active = Array.isArray(pr) ? pr.filter((p: any) => (p.status === "active" || !p.status)).length : 0
        const disabled = Array.isArray(pr) ? pr.filter((p: any) => p.status === "disabled").length : 0
        setProdCounts({ active, disabled })
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Fetch sales timeseries when controls change
  useEffect(() => {
    const now = new Date()
    const end = now.toISOString()
    const startDate = new Date(now)
    if (range === "7d") startDate.setDate(startDate.getDate() - 7)
    else if (range === "30d") startDate.setDate(startDate.getDate() - 30)
    else if (range === "90d") startDate.setDate(startDate.getDate() - 90)
    else startDate.setDate(startDate.getDate() - 365)
    const start = startDate.toISOString()
    ;(async () => {
      try {
        setTsLoading(true)
        setTsError(null)
        const data = await AdminApi.salesTimeseries(period, start, end)
        setTsData(data as any[])
      } catch (e: any) {
        setTsError(e.message || "Failed to load sales chart")
      } finally {
        setTsLoading(false)
      }
    })()
  }, [period, range])

  const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  if (loading) return <div className="text-muted-foreground">Loading dashboard…</div>
  if (error) return <div className="text-destructive">{error}</div>
  if (!stats) return null

  const statCards = [
    { title: "Total Revenue", value: fmtCurrency(stats.total_revenue), icon: DollarSign },
    { title: "Total Orders", value: String(stats.total_orders), icon: ShoppingCart },
    { title: "Active Products", value: String(prodCounts.active), icon: Package },
    { title: "Disabled Products", value: String(prodCounts.disabled), icon: EyeOff },
    { title: "Page Views", value: stats.page_views.toLocaleString(), icon: Eye },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sales Chart */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Sales
          </CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v: any) => setRange(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {tsLoading && <div className="text-muted-foreground">Loading sales…</div>}
          {tsError && <div className="text-destructive mb-3">{tsError}</div>}
          {!tsLoading && !tsError && (
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--primary))" },
                orders: { label: "Orders", color: "hsl(var(--muted-foreground))" },
              }}
              className="w-full"
            >
              <AreaChart data={tsData} margin={{ left: 12, right: 12, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="orders" stroke="var(--color-orders)" fill="var(--color-orders)" fillOpacity={0.15} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.length === 0 && (
                <div className="text-sm text-muted-foreground">No orders yet.</div>
              )}
              {recent.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{order.id.toString().padStart(4, "0")}</span>
                      <Badge
                        variant={
                          order.status === "paid"
                            ? "default"
                            : order.status === "pending"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                    {order.created_at && (
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{fmtCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top.length === 0 && (
                <div className="text-sm text-muted-foreground">No products yet.</div>
              )}
              {top.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{fmtCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

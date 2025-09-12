"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminPromoCodes } from "@/components/admin-promo-codes"
import { AdminUsers } from "@/components/admin-users"
import { AdminLogs } from "@/components/admin-logs"
import { ProductManagement } from "@/components/product-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthApi } from "@/lib/api"

export default function AdminPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const me = await AuthApi.me()
        if (me && me.is_admin) setAllowed(true)
        else {
          setAllowed(false)
          router.replace("/")
        }
      } catch (e: any) {
  setAllowed(false)
  router.replace("/")
      }
    })()
  }, [router])

  if (allowed === null) return <div className="min-h-screen bg-background"><Navigation /><div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">Checking access…</div></div>

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Admin Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-balance">
              Admin <span className="text-primary">Panel</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Admin Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[1000px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="promo">Promo</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="promo" className="space-y-6">
            <AdminPromoCodes />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <AdminLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

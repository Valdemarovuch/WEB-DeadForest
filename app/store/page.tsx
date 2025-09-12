"use client"

import { Navigation } from "@/components/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductGrid } from "@/components/product-grid"
import { StoreFilters } from "@/components/store-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useMemo, useState } from "react"

export default function StorePage() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(params.get("q") || "")
  const onSearch = () => {
    const sp = new URLSearchParams(params.toString())
    if (q) sp.set("q", q)
    else sp.delete("q")
    router.push(`${pathname}?${sp.toString()}`)
  }
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Store Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs />

          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-balance">
              Digital <span className="text-primary">Store</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Explore our collection of premium digital products designed to enhance your creative workflow
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-background/50 backdrop-blur border-border/50"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Store Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <StoreFilters />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">All Products</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Filtered results</span>
                <Button variant="outline" size="sm" onClick={() => {
                  const sp = new URLSearchParams(params.toString())
                  const next = sp.get("sort") === "price_desc" ? "price_asc" : "price_desc"
                  sp.set("sort", next)
                  router.push(`${pathname}?${sp.toString()}`)
                }}>
                  Sort by: {params.get("sort") === "price_desc" ? "Price ↑" : "Price ↓"}
                </Button>
              </div>
            </div>
            <ProductGrid />
          </main>
        </div>
      </div>
    </div>
  )
}

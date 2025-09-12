"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Eye } from "lucide-react"
import { apiFetch, API_URL } from "@/lib/api"
import { useSearchParams } from "next/navigation"

type Product = {
  id: number
  name: string
  price: number
  image?: string | null
  category?: string | null
  rating?: number | null
  sales?: number | null
  status?: string | null
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useSearchParams()

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Starting to load products...")
        const qs = params.toString()
        console.log("Query string:", qs)
        const url = `/products${qs ? `?${qs}` : ""}`
        console.log("Requesting URL:", url)
        const data = await apiFetch<Product[]>(url)
        console.log("Loaded products:", data) // Debug log
        setProducts(data)
      } catch (e: any) {
        console.error("Failed to load products:", e) // Debug log
        setError(e.message || "Failed to load products")
      } finally {
        setLoading(false)
      }
    })()
  }, [params])

  const addToCart = async (productId: number) => {
    try {
      await apiFetch("/cart", { method: "POST", body: JSON.stringify({ product_id: productId, quantity: 1 }) }, true)
      // TODO: show toast
    } catch (e) {
      // TODO: show error toast
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading products…</div>
  if (error) return <div className="text-destructive">{error}</div>
  if (products.length === 0) return <div className="text-muted-foreground">No products found</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="group bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-all duration-300 overflow-hidden"
        >
          <div className="relative overflow-hidden">
            <img
              src={product.image?.startsWith('/') ? `${API_URL}${product.image}` : (product.image || "/placeholder.svg")}
              alt={product.name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Sale badge removed (original_price deprecated) */}
          </div>

          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              {product.category && (
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              )}
              <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">${product.price}</span>
              </div>
              {product.rating && (
                <div className="text-xs text-muted-foreground">★ {product.rating} {product.sales ? `(${product.sales})` : ""}</div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button className="w-full" size="sm" onClick={() => addToCart(product.id)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api"

type CartItem = {
  id: number
  quantity: number
  product: { id: number; name: string; price: number; image?: string | null; category?: string | null }
}

export function CartItems() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCart = async () => {
    try {
      const data = await apiFetch<{ items: CartItem[]; subtotal: number; total: number }>("/cart", {}, true)
      setCartItems(data.items)
    } catch (e: any) {
      setError(e.message || "Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    await apiFetch(`/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity: newQuantity }) }, true)
    loadCart()
  }

  const removeItem = async (id: number) => {
    await apiFetch(`/cart/${id}`, { method: "DELETE" }, true)
    loadCart()
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">Loading cart…</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">Add some products to get started</p>
            <Button asChild>
              <a href="/store">Browse Products</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle>Cart Items ({cartItems.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
            <img
              src={item.product.image || "/placeholder.svg"}
              alt={item.product.name}
              className="w-20 h-20 rounded-lg object-cover bg-muted"
            />

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.product.category || "Product"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">${item.product.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

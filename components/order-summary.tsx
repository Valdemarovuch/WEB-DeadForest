"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Mock order items
const orderItems = [
  {
    id: 1,
    name: "Dark UI Kit Pro",
    price: 49,
    originalPrice: 79,
    quantity: 1,
    image: "/placeholder.svg?height=60&width=60&text=UI+Kit",
  },
  {
    id: 2,
    name: "Holographic Icons",
    price: 29,
    quantity: 2,
    image: "/placeholder.svg?height=60&width=60&text=Icons",
  },
  {
    id: 3,
    name: "Minimal Dashboard Template",
    price: 89,
    quantity: 1,
    image: "/placeholder.svg?height=60&width=60&text=Dashboard",
  },
]

export function OrderSummary() {
  const subtotal = 167
  const discount = 20
  const tax = 14.7
  const total = subtotal - discount + tax

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 sticky top-24">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div className="space-y-4">
          {orderItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover bg-muted"
                />
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {item.quantity}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">${item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">${item.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm space-y-1">
            <div className="font-medium">Digital Delivery</div>
            <div className="text-muted-foreground">
              Download links will be sent to your email immediately after payment
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

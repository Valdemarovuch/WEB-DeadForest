"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Tag } from "lucide-react"
import Link from "next/link"

export function CartSummary() {
  // Mock cart calculations
  const subtotal = 167
  const discount = 20
  const tax = 14.7
  const total = subtotal - discount + tax

  return (
    <div className="space-y-6">
      {/* Promo Code */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo">Enter promo code</Label>
            <div className="flex gap-2">
              <Input id="promo" placeholder="PROMOCODE" />
              <Button variant="outline">Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-3 pt-4">
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Proceed to Checkout
              </Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/store">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">🔒 Secure checkout powered by Stripe</div>
            <div className="text-xs text-muted-foreground">Your payment information is encrypted and secure</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

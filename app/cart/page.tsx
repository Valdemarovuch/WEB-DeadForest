import { Navigation } from "@/components/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CartItems } from "@/components/cart-items"
import { CartSummary } from "@/components/cart-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Cart Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-balance">
                Shopping <span className="text-primary">Cart</span>
              </h1>
              <p className="text-lg text-muted-foreground">Review your selected items before checkout</p>
            </div>

            <Button variant="outline" asChild>
              <Link href="/store">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <CartItems />
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

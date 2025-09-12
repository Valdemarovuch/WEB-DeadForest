import { Navigation } from "@/components/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CheckoutForm } from "@/components/checkout-form"
import { OrderSummary } from "@/components/order-summary"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Checkout Header */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-balance">
              <span className="text-primary">Checkout</span>
            </h1>
            <p className="text-lg text-muted-foreground">Complete your purchase securely</p>
          </div>
        </div>
      </section>

      {/* Checkout Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <CheckoutForm />
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

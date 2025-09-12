"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingCart, User, Menu, X } from "lucide-react"
import { AuthApi, CartApi } from "@/lib/api"

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [user, setUser] = useState<null | { id: number; name: string; email: string; is_admin?: boolean }>(null)

  useEffect(() => {
  ;(async () => {
      try {
        const me = await AuthApi.me()
        setUser(me as any)
        try {
          const cart = await CartApi.get()
          const count = (cart?.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 0), 0)
          setCartItemsCount(count)
        } catch {}
      } catch {
        setUser(null)
      }
    })()
  const handler = (e: any) => setUser((prev) => ({ ...(prev || {}), ...(e?.detail || {}) }))
  window.addEventListener("user-updated", handler as EventListener)
  return () => window.removeEventListener("user-updated", handler as EventListener)
  }, [])

  const navigationLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/store", label: "Store", show: true },
    { href: "/admin", label: "Admin", show: !!(user && user.is_admin) },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-foreground">
              Dead<span className="text-primary">Forest</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationLinks.filter((l) => l.show).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary relative ${
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

                <Button variant="ghost" size="icon" asChild>
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}

            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-6 mt-6">
                    {/* Mobile Logo */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-foreground">
                        Dead<span className="text-primary">Forest</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Mobile Navigation Links */}
                    <div className="flex flex-col space-y-4">
                      {navigationLinks.filter((l) => l.show).map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`text-lg font-medium transition-colors hover:text-primary p-2 rounded-lg ${
                            pathname === link.href
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {/* Mobile Actions */}
                    <div className="border-t border-border pt-6 space-y-4">
                      {user ? (
                        <>
                          <Button className="w-full justify-start" variant="ghost" asChild>
                            <Link href="/cart" onClick={() => setIsOpen(false)}>
                              <ShoppingCart className="h-5 w-5 mr-3" />
                              Cart {cartItemsCount > 0 ? `(${cartItemsCount} items)` : ""}
                            </Link>
                          </Button>
                          <Button className="w-full justify-start" variant="ghost" asChild>
                            <Link href="/profile" onClick={() => setIsOpen(false)}>
                              <User className="h-5 w-5 mr-3" />
                              Profile
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            Sign In
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

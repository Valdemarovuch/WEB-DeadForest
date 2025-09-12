"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Crumb = {
  href: string
  label: string
  icon?: LucideIcon
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs: Crumb[] = [{ href: "/", label: "Home", icon: Home }]

    let currentPath = ""
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
  const label = segment.charAt(0).toUpperCase() + segment.slice(1)
  breadcrumbs.push({ href: currentPath, label })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on home page
  if (pathname === "/") return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground py-4">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        const Icon = crumb.icon

        return (
          <div key={crumb.href} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {isLast ? (
              <span className="text-foreground font-medium flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary transition-colors flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

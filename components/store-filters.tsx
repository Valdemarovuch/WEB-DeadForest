"use client"

import { useMemo, useState } from "react"
import { BadgePercent } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  { id: "UI Kits", label: "UI Kits" },
  { id: "Templates", label: "Templates" },
  { id: "Icon Sets", label: "Icon Sets" },
  { id: "Graphics", label: "Graphics" },
  { id: "Fonts", label: "Fonts" },
  { id: "Mockups", label: "Mockups" },
  { id: "Illustrations", label: "Illustrations" },
  { id: "3D Assets", label: "3D Assets" },
  { id: "Photos", label: "Photos" },
  { id: "Patterns", label: "Patterns" },
  { id: "Brushes", label: "Brushes" },
  { id: "Wireframes", label: "Wireframes" },
  { id: "Design Systems", label: "Design Systems" },
  { id: "UI Animations", label: "UI Animations" },
  { id: "Color Palettes", label: "Color Palettes" },
  { id: "Textures", label: "Textures" },
  { id: "Wallpapers", label: "Wallpapers" },
]

export function StoreFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [price, setPrice] = useState<[number, number]>([Number(params.get("min_price") || 0), Number(params.get("max_price") || 200)])
  const selectedCategories = useMemo(() => new Set((params.getAll("categories") || []).flatMap((v) => v.split(",").filter(Boolean))), [params])
  const selectedTags = useMemo(() => new Set((params.getAll("tags") || []).flatMap((v) => v.split(",").filter(Boolean))), [params])
  const PROGRAMS = [
    { id: "Figma", label: "Figma" },
    { id: "Sketch", label: "Sketch" },
    { id: "Adobe XD", label: "Adobe XD" },
    { id: "Photoshop", label: "Photoshop" },
    { id: "Illustrator", label: "Illustrator" },
    { id: "After Effects", label: "After Effects" },
    { id: "Blender", label: "Blender" },
    { id: "Cinema 4D", label: "Cinema 4D" },
    { id: "Affinity Designer", label: "Affinity Designer" },
  ]
  const selectedPrograms = useMemo(() => new Set((params.getAll("programs") || []).flatMap((v) => v.split(",").filter(Boolean))), [params])
  const [rating, setRating] = useState<[number, number]>([Number(params.get("min_rating") || 0), Number(params.get("max_rating") || 5)])

  const updateParams = (next: Record<string, string | string[] | null>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      sp.delete(k)
      if (Array.isArray(v)) {
        for (const vv of v) sp.append(k, vv)
      } else if (v != null) {
        sp.set(k, v)
      }
    }
    router.push(`${pathname}?${sp.toString()}`)
  }

  const toggleCategory = (cat: string, checked: boolean) => {
    const next = new Set(selectedCategories)
    checked ? next.add(cat) : next.delete(cat)
    updateParams({ categories: Array.from(next) })
  }

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags)
    next.has(tag) ? next.delete(tag) : next.add(tag)
    updateParams({ tags: Array.from(next) })
  }

  const toggleProgram = (prog: string, checked: boolean) => {
    const next = new Set(selectedPrograms)
    checked ? next.add(prog) : next.delete(prog)
    updateParams({ programs: Array.from(next) })
  }

  const onPriceCommit = (range: [number, number]) => {
    setPrice(range)
    updateParams({ min_price: String(range[0]), max_price: String(range[1]) })
  }

  const clearAll = () => {
    router.push(pathname)
  }

  return (
    <div className="space-y-6">
      {/* Sales Tile */}
      <Card className={`bg-card/50 backdrop-blur border-border/50 cursor-pointer ${selectedCategories.has("Sales") ? "ring-2 ring-primary" : ""}`} onClick={() => toggleCategory("Sales", !selectedCategories.has("Sales"))}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Sales</div>
            <div className="text-xs text-muted-foreground">Discounted items and offers</div>
          </div>
          <Button variant={selectedCategories.has("Sales") ? "default" : "outline"} size="sm">
            {selectedCategories.has("Sales") ? "Active" : "Show"}
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORIES.map((c) => (
            <div className="flex items-center space-x-2" key={c.id}>
              <Checkbox id={c.id} checked={selectedCategories.has(c.id)} onCheckedChange={(v) => toggleCategory(c.id, Boolean(v))} />
              <Label htmlFor={c.id} className="text-sm">
                {c.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider value={price} max={200} step={5} className="w-full" onValueChange={(v) => setPrice(v as [number, number])} onValueCommit={(v) => onPriceCommit(v as [number, number])} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${price[0]}</span>
            <span>${price[1]}+</span>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              "Modern",
              "Minimal",
              "Dark",
              "Creative",
              "Professional",
              "Holographic",
              "Dashboard",
              "Clean",
              "Futuristic",
              "Typography",
              "Cyber",
              "Abstract",
              "Digital",
              "Bundle",
              "Landing",
              "Web",
            ].map((t) => (
              <Button
                key={t}
                variant={selectedTags.has(t) ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleTag(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Programs */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PROGRAMS.map((p) => (
            <div className="flex items-center space-x-2" key={p.id}>
              <Checkbox id={`prog-${p.id}`} checked={selectedPrograms.has(p.id)} onCheckedChange={(v) => toggleProgram(p.id, Boolean(v))} />
              <Label htmlFor={`prog-${p.id}`} className="text-sm">
                {p.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rating */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider value={rating} max={5} step={0.1} className="w-full" onValueChange={(v) => setRating(v as [number, number])} onValueCommit={(v) => updateParams({ min_rating: String((v as [number, number])[0]), max_rating: String((v as [number, number])[1]) })} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{rating[0].toFixed(1)}</span>
            <span>{rating[1].toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full bg-transparent" onClick={clearAll}>
        Clear All Filters
      </Button>
    </div>
  )
}

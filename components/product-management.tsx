"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Upload, X } from "lucide-react"
import { AdminApi, ProductsApi, API_URL } from "@/lib/api"

type Product = {
  id: number
  name: string
  price: number
  category?: string | null
  image?: string | null
  file_type?: string | null
  rating?: number | null
  created_at?: string | null
  programs?: string | null
  status?: string | null
  sales?: number | null
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [salesMap, setSalesMap] = useState<Record<number, { sales: number; revenue?: number }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all")

  const refreshProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const [prods, top] = await Promise.all([
        AdminApi.products() as Promise<Product[]>,
        AdminApi.topProducts() as Promise<Array<{ id: number; sales: number; revenue: number }>>,
      ])
      setProducts(prods || [])
      const map: Record<number, { sales: number; revenue?: number }> = {}
      for (const t of top || []) map[t.id] = { sales: t.sales, revenue: t.revenue }
      setSalesMap(map)
    } catch (e: any) {
      setError(e.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return products
      .filter((p) => {
        if (statusFilter === "all") return true
        const productStatus = p.status || "active" // default status is active
        return productStatus === statusFilter
      })
      .filter((product) =>
  product.name.toLowerCase().includes(term)
  || (product.category || "").toLowerCase().includes(term)
  || (product.programs || "").toLowerCase().includes(term)
  || (product.status || "active").toLowerCase().includes(term),
    )
  }, [products, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | "active" | "disabled") => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onClose={() => setIsAddDialogOpen(false)} onSuccess={() => {
                setIsAddDialogOpen(false)
                refreshProducts()
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            onClose={() => {
              setIsEditDialogOpen(false)
              setEditingProduct(null)
            }} 
            onSuccess={() => {
              setIsEditDialogOpen(false)
              setEditingProduct(null)
              refreshProducts()
            }}
            product={editingProduct}
          />
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-muted-foreground">Loading products…</div>}
          {error && <div className="text-destructive mb-3">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? <Badge variant="outline">{product.category}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {product.programs ? (
                      <div className="flex flex-wrap gap-1">
                        {product.programs.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.file_type ? (
                      <Badge variant="outline">{product.file_type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-primary font-semibold">${product.price}</TableCell>
                  <TableCell>{product.sales ?? salesMap[product.id]?.sales ?? 0}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={product.status === "active" ? "default" : "secondary"}
                      className={product.status === "active" ? "bg-green-100 text-green-800" : ""}
                    >
                      {product.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.created_at ? new Date(product.created_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={product.status === "active" ? "outline" : "default"}
                        size="sm"
                        onClick={async () => {
                          try {
                            if (product.status === "active") {
                              await AdminApi.disableProduct(product.id)
                              setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: "disabled" } : p))
                            } else {
                              await AdminApi.enableProduct(product.id)
                              setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: "active" } : p))
                            }
                          } catch (e: any) {
                            alert(e.message || "Failed to update status")
                          }
                        }}
                      >
                        {product.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingProduct(product)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => {
                          setDeletingProduct(product)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm">Are you sure you want to delete <strong>{deletingProduct?.name}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setDeletingProduct(null); }} disabled={deleting}>Cancel</Button>
            <Button className="bg-destructive text-white" onClick={async () => {
              if (!deletingProduct) return
              try {
                setDeleting(true)
                await AdminApi.deleteProduct(deletingProduct.id)
                setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id))
                setIsDeleteDialogOpen(false)
                setDeletingProduct(null)
              } catch (e: any) {
                alert(e.message || 'Failed to delete product')
              } finally {
                setDeleting(false)
              }
            }} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductForm({ onClose, onSuccess, product }: { onClose: () => void; onSuccess: () => void; product?: Product | null }) {
  const PROGRAMS = ["Figma","Sketch","Adobe XD","Photoshop","Illustrator","After Effects","Blender","Cinema 4D","Affinity Designer"]
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const FILE_TYPES = [".psd", ".fig", ".ai", ".xd", ".sketch", ".aep", ".blend", ".c4d", ".afdesign"]
  const [selectedFileType, setSelectedFileType] = useState<string | undefined>(undefined)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Image preview state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    tags: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price?.toString() || "",
        description: "", // We don't have description in the Product type
        tags: "" // We don't have tags in the Product type
      })
      setSelectedPrograms(product.programs ? product.programs.split(",").map(p => p.trim()).filter(Boolean) : [])
      setSelectedFileType(product.file_type || undefined)
      
      // Set existing image as preview if available
      if (product.image) {
        setImagePreview(product.image.startsWith('/') ? `${API_URL}${product.image}` : product.image)
      } else {
        setImagePreview(null)
      }
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        category: "",
        price: "",
        description: "",
        tags: ""
      })
      setSelectedPrograms([])
      setSelectedFileType(undefined)
      setImagePreview(null)
    }
    setFile(null)
    setFileError(null)
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
  }, [product])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      setImageError(null)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file')
      if (imageInputRef.current) imageInputRef.current.value = ""
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5MB')
      if (imageInputRef.current) imageInputRef.current.value = ""
      return
    }

    setImageFile(file)
    setImageError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    
    setSubmitting(true)
    setSubmitError(null)
    
    try {
      let imageUrl = product?.image || null

      // Upload image if a new one is selected
      if (imageFile) {
        const uploadResult = await AdminApi.uploadProductImage(imageFile)
        imageUrl = uploadResult.image_url
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category || null,
        price: parseFloat(formData.price) || 0,
        tags: formData.tags.trim() || null,
        programs: selectedPrograms.length > 0 ? selectedPrograms.join(",") : null,
        file_type: selectedFileType || null,
        image: imageUrl,
        status: "active" // Default status
      }
      
      if (!payload.name) {
        throw new Error("Product name is required")
      }
      
      if (product) {
        // Update existing product
        await AdminApi.updateProduct(product.id, payload)
      } else {
        // Create new product
        await AdminApi.createProduct(payload)
      }
      
      onSuccess()
    } catch (e: any) {
      setSubmitError(e.message || `Failed to ${product ? 'update' : 'create'} product`)
    } finally {
      setSubmitting(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const val = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)
    return `${val} ${sizes[i]}`
  }

  // If file type changes and selected file no longer matches, clear it
  useEffect(() => {
    if (!file) return
    if (!selectedFileType) return
    if (!file.name.toLowerCase().endsWith(selectedFileType.toLowerCase())) {
      setFile(null)
      setFileError(`Selected file must be of type ${selectedFileType}`)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } else {
      setFileError(null)
    }
  }, [selectedFileType])
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {submitError && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
          {submitError}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input 
            id="name" 
            placeholder="Enter product name" 
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UI Kits">UI Kits</SelectItem>
              <SelectItem value="Templates">Templates</SelectItem>
              <SelectItem value="Icon Sets">Icon Sets</SelectItem>
              <SelectItem value="Graphics">Graphics</SelectItem>
              <SelectItem value="Fonts">Fonts</SelectItem>
              <SelectItem value="Mockups">Mockups</SelectItem>
              <SelectItem value="Illustrations">Illustrations</SelectItem>
              <SelectItem value="3D Assets">3D Assets</SelectItem>
              <SelectItem value="Photos">Photos</SelectItem>
              <SelectItem value="Patterns">Patterns</SelectItem>
              <SelectItem value="Brushes">Brushes</SelectItem>
              <SelectItem value="Wireframes">Wireframes</SelectItem>
              <SelectItem value="Design Systems">Design Systems</SelectItem>
              <SelectItem value="UI Animations">UI Animations</SelectItem>
              <SelectItem value="Color Palettes">Color Palettes</SelectItem>
              <SelectItem value="Textures">Textures</SelectItem>
              <SelectItem value="Wallpapers">Wallpapers</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input 
            id="price" 
            type="number" 
            placeholder="0.00" 
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Program</Label>
          <Select
            value={selectedPrograms[0]}
            onValueChange={(v) => setSelectedPrograms(v ? [v] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="file_type">File Type</Label>
          <Select value={selectedFileType} onValueChange={(v) => setSelectedFileType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPES.map((ext) => (
                <SelectItem key={ext} value={ext}>{ext}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedFileType}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              className="hidden"
              accept={selectedFileType}
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                if (!f) {
                  setFile(null)
                  setFileError(null)
                  return
                }
                // Validate by extension against selected type
                if (selectedFileType && !f.name.toLowerCase().endsWith(selectedFileType.toLowerCase())) {
                  setFile(null)
                  setFileError(`Selected file must be of type ${selectedFileType}`)
                  // reset the input value to allow re-selection
                  if (fileInputRef.current) fileInputRef.current.value = ""
                  return
                }
                setFile(f)
                setFileError(null)
              }}
            />
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {file ? (
                <>
                  <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                  <span className="text-xs">({formatBytes(file.size)})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setFile(null)
                      setFileError(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    aria-label="Clear file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <span>{selectedFileType ? `Accepted: ${selectedFileType}` : ""}</span>
              )}
            </div>
          </div>
          {fileError && <p className="text-sm text-destructive mt-1">{fileError}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Enter product description" 
          className="min-h-[100px]"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
        />
      </div>

      {/* Image Preview Upload */}
      <div className="space-y-2">
        <Label>Product Image</Label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <div className="text-sm text-muted-foreground">
              {imageFile ? (
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[200px]" title={imageFile.name}>
                    {imageFile.name}
                  </span>
                  <span className="text-xs">({formatBytes(imageFile.size)})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                      setImageError(null)
                      if (imageInputRef.current) imageInputRef.current.value = ""
                    }}
                    aria-label="Clear image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span>Accepted: JPG, PNG, GIF, WebP (max 5MB)</span>
              )}
            </div>
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <img
                src={imagePreview}
                alt="Product preview"
                className="max-w-full h-32 object-contain rounded"
              />
            </div>
          )}
          
          {imageError && <p className="text-sm text-destructive">{imageError}</p>}
        </div>
      </div>

      

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input 
          id="tags" 
          placeholder="modern, dark, professional"
          value={formData.tags}
          onChange={(e) => handleInputChange("tags", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting 
            ? `${product ? 'Updating' : 'Creating'}...` 
            : `${product ? 'Update' : 'Add'} Product`
          }
        </Button>
      </div>
    </form>
  )
}

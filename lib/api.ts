"use client"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function setToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("token", token)
  localStorage.setItem("lastActivity", Date.now().toString())
}

export function clearToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("lastActivity")
}

function touchActivity() {
  if (typeof window === "undefined") return
  localStorage.setItem("lastActivity", Date.now().toString())
}

async function maybeRefreshToken() {
  if (typeof window === "undefined") return
  const token = getToken()
  if (!token) return
  const last = parseInt(localStorage.getItem("lastActivity") || "0", 10)
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const thirtyDaysMs = 30 * oneDayMs
  if (last && now - last > oneDayMs && now - last < thirtyDaysMs) {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        if (data?.access_token) setToken(data.access_token)
      } else if (res.status === 401) {
        clearToken()
      }
    } catch {}
  }
  touchActivity()
}

export async function apiFetch<T = any>(path: string, opts: RequestInit = {}, auth = false): Promise<T> {
  await maybeRefreshToken()
  const headers = new Headers(opts.headers || {})
  if (!headers.has("Content-Type") && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (auth) {
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers, cache: "no-store" })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = await res.json()
      message = (data && (data.detail || data.message)) || message
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function loginRequest(email: string, password: string) {
  const form = new FormData()
  form.set("username", email)
  form.set("password", password)

  const res = await fetch(`${API_URL}/auth/login`, { method: "POST", body: form })
  if (!res.ok) {
    let msg = `Login failed (${res.status})`
    try {
      const data = await res.json()
      msg = data.detail || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>
}

export async function registerRequest(payload: { name: string; email: string; password: string; age?: number | null }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let msg = `Registration failed (${res.status})`
    try {
      const data = await res.json()
      msg = data.detail || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

// Convenience wrappers
export const ProductsApi = {
  list: () => apiFetch("/products"),
  get: (id: number) => apiFetch(`/products/${id}`),
}

export const CartApi = {
  get: () => apiFetch("/cart", {}, true),
  add: (product_id: number, quantity = 1) => apiFetch("/cart", { method: "POST", body: JSON.stringify({ product_id, quantity }) }, true),
  update: (item_id: number, quantity: number) => apiFetch(`/cart/${item_id}`, { method: "PUT", body: JSON.stringify({ quantity }) }, true),
  remove: (item_id: number) => apiFetch(`/cart/${item_id}`, { method: "DELETE" }, true),
}

export const OrdersApi = {
  list: () => apiFetch("/orders", {}, true),
  create: (payload: { items: { product_id: number; quantity: number }[]; discount?: number; tax?: number }) =>
    apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) }, true),
}

export const AdminApi = {
  stats: () => apiFetch("/admin/stats", {}, true),
  recentOrders: () => apiFetch("/admin/recent-orders", {}, true),
  topProducts: () => apiFetch("/admin/top-products", {}, true),
  products: () => apiFetch("/admin/products", {}, true),
  createProduct: (payload: any) => apiFetch("/products", { method: "POST", body: JSON.stringify(payload) }, true),
  updateProduct: (id: number, payload: any) => apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }, true),
  uploadProductImage: async (file: File) => {
    const form = new FormData()
    form.set("file", file)
    const token = getToken()
    const res = await fetch(`${API_URL}/auth/product-image`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`
      try {
        const data = await res.json()
        msg = data.detail || msg
      } catch {}
      throw new Error(msg)
    }
    return (await res.json()) as { image_url: string }
  },
  enableProduct: (id: number) => apiFetch(`/admin/products/${id}/enable`, { method: "POST" }, true),
  disableProduct: (id: number) => apiFetch(`/admin/products/${id}/disable`, { method: "POST" }, true),
  deleteProduct: (id: number) => apiFetch(`/admin/products/${id}`, { method: "DELETE" }, true),
  promoCodesList: () => apiFetch("/admin/promo-codes", {}, true),
  deletePromo: (id: number) => apiFetch(`/admin/promo-codes/${id}`, { method: "DELETE" }, true),
  salesTimeseries: (period: "day" | "week" | "month" | "year", start?: string, end?: string) => {
    const params = new URLSearchParams({ period })
    if (start) params.set("start", start)
    if (end) params.set("end", end)
    return apiFetch(`/admin/sales-timeseries?${params.toString()}`, {}, true)
  },
  // fetch structured logs; supports optional filters: event, actor_id, target
  logs: (limit = 200, opts?: { event?: string; actor_id?: number; target?: string; extras?: string }) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (opts?.event) params.set("event", opts.event)
    if (opts?.actor_id) params.set("actor_id", String(opts.actor_id))
    if (opts?.target) params.set("target", opts.target)
    if (opts?.extras) params.set("extras", opts.extras)
    return apiFetch(`/admin/logs?${params.toString()}`, {}, true)
  },
  clearLogs: () => apiFetch(`/admin/logs`, { method: "DELETE" }, true),
  usersFull: () => apiFetch("/admin/users-full", {}, true),
  promote: (email: string) => apiFetch(`/admin/promote?email=${encodeURIComponent(email)}`, { method: "POST" }, true),
  demote: (email: string) => apiFetch(`/admin/demote?email=${encodeURIComponent(email)}`, { method: "POST" }, true),
  resetPassword: (email: string, newPassword: string) =>
    apiFetch(`/admin/reset-password?email=${encodeURIComponent(email)}`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }, true),
}

export const AuthApi = {
  me: () => apiFetch("/auth/me", {}, true),
  updateMe: (payload: Partial<{ name: string; email: string; age: number | null; password: string; avatar: string }>) =>
    apiFetch("/auth/me", { method: "PUT", body: JSON.stringify(payload) }, true),
  uploadAvatar: async (file: File) => {
    const form = new FormData()
    form.set("file", file)
    const token = getToken()
    const res = await fetch(`${API_URL}/auth/avatar`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`
      try {
        const data = await res.json()
        msg = data.detail || msg
      } catch {}
      throw new Error(msg)
    }
    return (await res.json()) as { avatar: string }
  },
  forgotPassword: async (email: string) => {
    return apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
  },
  resetPassword: async (token: string, newPassword: string) => {
    return apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password: newPassword }) })
  },
}

export const UsersApi = {
  list: () => apiFetch("/users", {}, true),
}

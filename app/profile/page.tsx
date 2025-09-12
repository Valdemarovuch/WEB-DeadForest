"use client"

import { AuthApi, API_URL } from "@/lib/api"
import { clearToken } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/navigation"
import { Separator } from "@/components/ui/separator"
import { Calendar, Edit, KeyRound, LogOut, Mail, Save, Shield, User, ImagePlus } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [avatarError, setAvatarError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<{ name: string; email: string; age: number | "" }>({ name: "", email: "", age: "" })
    const [pwd, setPwd] = useState("")
    const [saving, setSaving] = useState(false)
    const [pwdSaving, setPwdSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    // Admin promo creation moved to Admin panel

    useEffect(() => {
        ; (async () => {
            try {
                const me = await AuthApi.me()
                setUser(me)
                setForm({ name: me.name || "", email: me.email || "", age: typeof me.age === "number" ? me.age : "" })
            } catch (e: any) {
                router.replace("/login")
            } finally {
                setLoading(false)
            }
        })()
    }, [router])

    const onLogout = () => {
        clearToken()
        router.replace("/login")
    }

    const onSaveProfile = async () => {
        setSaving(true)
        setProfileError(null)
        try {
            const payload: any = { name: form.name, email: form.email }
            payload.age = form.age === "" ? null : Number(form.age)
            // optimistic UI update
            setUser((u: any) => ({ ...u, ...payload }))
            const updated = await AuthApi.updateMe(payload)
            setUser(updated)
            try { window.dispatchEvent(new CustomEvent("user-updated", { detail: updated })) } catch {}
            setEditing(false)
        } catch (e: any) {
            setProfileError(e.message || "Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    const onChangePassword = async () => {
        if (!pwd || pwd.length < 6) {
            setPasswordError("Password must be at least 6 characters")
            return
        }
        setPwdSaving(true)
        setPasswordError(null)
        try {
            const updated = await AuthApi.updateMe({ password: pwd })
            setUser(updated)
            setPwd("")
        } catch (e: any) {
            setPasswordError(e.message || "Failed to change password")
        } finally {
            setPwdSaving(false)
        }
    }

    const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileInput = e.target
        const file = fileInput.files?.[0]
        if (!file) return
        if (!/(png|jpe?g|webp)$/i.test(file.name)) {
            setAvatarError("Unsupported file type. Use JPG, PNG, or WEBP.")
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            setAvatarError("File too large. Max 2MB.")
            return
        }
        setUploading(true)
        setAvatarError(null)
        try {
            const { avatar } = await AuthApi.uploadAvatar(file)
            setUser((u: any) => {
                const updated = { ...u, avatar }
                try { window.dispatchEvent(new CustomEvent("user-updated", { detail: updated })) } catch { }
                return updated
            })
        } catch (e: any) {
            setAvatarError(e.message || "Failed to upload avatar")
        } finally {
            setUploading(false)
            // Clear the input to allow re-selecting the same file if needed
            try { fileInput.value = "" } catch { }
        }
    }

    // —

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <Navigation />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-1 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-24 h-24 bg-zinc-800 rounded-full animate-pulse" />
                                    <div className="w-32 h-4 bg-zinc-800 rounded animate-pulse" />
                                    <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                            <CardContent className="p-6 space-y-4">
                                <div className="w-48 h-6 bg-zinc-800 rounded animate-pulse" />
                                <div className="space-y-3">
                                    <div className="w-full h-4 bg-zinc-800 rounded animate-pulse" />
                                    <div className="w-3/4 h-4 bg-zinc-800 rounded animate-pulse" />
                                    <div className="w-1/2 h-4 bg-zinc-800 rounded animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) return null

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (<>
        <div className="min-h-screen bg-black">
            <Navigation />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Profile Sidebar */}
                    <Card className="md:col-span-1 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center space-y-4">
                                <Avatar className="w-24 h-24 border-2 border-cyan-500/20">
                                    <AvatarImage src={user.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${API_URL}${user.avatar}`) : "/placeholder.svg"} alt={user.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white text-lg font-semibold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <label className="text-sm text-zinc-400 mt-2">Update avatar</label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        <ImagePlus className="w-4 h-4 mr-2" /> {uploading ? "Uploading..." : "Choose image"}
                                    </Button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={onAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                {avatarError && <div className="text-xs text-red-400">{avatarError}</div>}

                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <Badge
                                        variant={user.is_admin ? "default" : "secondary"}
                                        className={
                                            user.is_admin
                                                ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                                                : "bg-zinc-800 text-zinc-300"
                                        }
                                    >
                                        <Shield className="w-3 h-3 mr-1" />
                                        {user.is_admin ? "Administrator" : "User"}
                                    </Badge>
                                </div>

                                <Separator className="bg-zinc-800" />

                                <div className="w-full space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700"
                                        onClick={() => setEditing((v) => !v)}
                                    >
                                        {editing ? (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="w-4 h-4 mr-2" /> Edit Profile
                                            </>
                                        )}
                                    </Button>
                                    {editing && (
                                        <Button
                                            variant="outline"
                                            className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700"
                                            onClick={onSaveProfile}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Apply"}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700"
                                        onClick={onLogout}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                    </Button>
                                    {/* Promo creation is available in Admin → Promo tab */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Profile Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <User className="w-5 h-5 mr-2 text-cyan-400" />
                                    Personal Information
                                </h3>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Full Name</label>
                                        {editing ? (
                                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                                        ) : (
                                            <div className="text-white bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
                                                {user.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400 flex items-center">
                                            <Mail className="w-4 h-4 mr-1" />
                                            Email Address
                                        </label>
                                        {editing ? (
                                            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                                        ) : (
                                            <div className="text-white bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
                                                {user.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400 flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            Age
                                        </label>
                                        {editing ? (
                                            <Input
                                                type="number"
                                                value={form.age}
                                                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value === "" ? "" : Number(e.target.value) }))}
                                            />
                                        ) : (
                                            <div className="text-white bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
                                                {user.age != null ? `${user.age} years old` : "—"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Account Type</label>
                                        <div className="text-white bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
                                            {user.is_admin ? "Administrator Account" : "Standard User Account"}
                                        </div>
                                    </div>
                                </div>
                                {profileError && <div className="text-sm text-red-400">{profileError}</div>}
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <KeyRound className="w-5 h-5 mr-2 text-cyan-400" />
                                    Change Password
                                </h3>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-sm font-medium text-zinc-400">New Password</label>
                                        <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={onChangePassword} disabled={pwdSaving}>
                                        {pwdSaving ? "Updating..." : "Update Password"}
                                    </Button>
                                </div>
                                {passwordError && <div className="text-sm text-red-400">{passwordError}</div>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    {/* Admin-only promo modal removed from Profile per request */}
    </>)
}

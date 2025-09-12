"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminApi } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog"

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState<string>("ALL")
  const [auto, setAuto] = useState<string>("OFF")
  const [q, setQ] = useState<string>("")
  const [eventFilter, setEventFilter] = useState<string>("")
  const [actorFilter, setActorFilter] = useState<string>("")
  const [targetFilter, setTargetFilter] = useState<string>("")
  const [extrasQuery, setExtrasQuery] = useState<string>("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const timerRef = useRef<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const opts: any = {}
      if (eventFilter) opts.event = eventFilter
      if (actorFilter) opts.actor_id = Number(actorFilter) || undefined
      if (targetFilter) opts.target = targetFilter
      if (extrasQuery) opts.extras = extrasQuery
      const data = await AdminApi.logs(200, Object.keys(opts).length ? opts : undefined)
      setLogs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const clear = async () => {
    setLoading(true)
    try {
      await AdminApi.clearLogs()
      setLogs([])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (auto !== "OFF") {
      const ms = auto === "2s" ? 2000 : auto === "5s" ? 5000 : 10000
      timerRef.current = setInterval(load, ms)
    }
  }, [auto])

  const filtered = useMemo(() => {
    return logs.filter((l) => (level === "ALL" ? true : l.level === level))
  }, [logs, level])

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Recent application logs</CardDescription>
        </div>
  <div className="flex flex-wrap gap-2 items-center w-full overflow-x-auto">
          <Input placeholder="Search..." value={q} onChange={(e: any) => setQ(e.target.value)} className="w-60 min-w-0" />
          <Select value={level} onValueChange={setLevel as any}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={auto} onValueChange={setAuto as any}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Auto-refresh" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OFF">Off</SelectItem>
              <SelectItem value="2s">Every 2s</SelectItem>
              <SelectItem value="5s">Every 5s</SelectItem>
              <SelectItem value="10s">Every 10s</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
          <Button variant="ghost" onClick={download}>Download</Button>
          <Button variant="destructive" onClick={clear} disabled={loading}>Clear</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No logs yet.</div>
        ) : (
          <div className="max-h-96 overflow-auto space-y-1 font-mono text-xs min-w-0">
            {filtered
              .filter((l) => (q ? JSON.stringify(l).toLowerCase().includes(q.toLowerCase()) : true))
              .filter((l) => (extrasQuery ? (JSON.stringify(l.extras || {}).toLowerCase().includes(extrasQuery.toLowerCase()) || JSON.stringify(l).toLowerCase().includes(extrasQuery.toLowerCase())) : true))
              .map((l, i) => (
              <div key={i} className="space-y-1 min-w-0">
                <div className="grid grid-cols-12 gap-2 items-center min-w-0">
                  <span className="col-span-2 sm:col-span-2 text-muted-foreground truncate min-w-0">{l.timestamp}</span>
                  <span className="col-span-1">
                    <span className={
                      l.level === "ERROR" ? "text-red-400" : l.level === "WARNING" ? "text-yellow-400" : "text-green-400"
                    }>
                      {l.level}
                    </span>
                  </span>
                  <span className="col-span-1 text-muted-foreground truncate min-w-0 hidden md:inline">{l.logger}</span>
                  <span className="col-span-1 text-muted-foreground truncate min-w-0">{l.actor_id ?? ""}</span>
                  <span className="col-span-1 text-muted-foreground truncate min-w-0 hidden md:inline">{l.request_id}</span>
                  <span className="col-span-1 text-muted-foreground truncate min-w-0 hidden lg:inline">{l.target ?? ""}</span>
                  <span className="col-span-4 flex items-center gap-2 min-w-0">
                    {l.event && <Badge variant="secondary">{l.event}</Badge>}
                    <div className="truncate min-w-0 text-sm text-foreground">{l.message}</div>
                  </span>
                  <div className="col-span-1 text-right flex justify-end items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(l)}>View</Button>
                    {l.extras && Object.keys(l.extras).length ? (
                      <button className="text-xs text-muted-foreground underline" onClick={() => setExpanded((s) => ({ ...s, [l.request_id || String(i)]: !s[l.request_id || String(i)] }))}>
                        {expanded[l.request_id || String(i)] ? "hide" : "extras"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {expanded[l.request_id || String(i)] ? (
                  <div className="pl-4 font-mono text-xs text-muted-foreground overflow-auto max-h-48 bg-muted/5 rounded p-2"> <pre className="whitespace-pre-wrap break-words">{JSON.stringify(l.extras || {}, null, 2)}</pre> </div>
                ) : null}
              </div>
              ))}
          </div>
        )}
      </CardContent>
      {/* Detail dialog for a single log */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        {selectedLog ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log detail</DialogTitle>
              <DialogDescription className="truncate">{selectedLog.event || selectedLog.logger} — {selectedLog.timestamp}</DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className={selectedLog.level === "ERROR" ? "text-red-400" : selectedLog.level === "WARNING" ? "text-yellow-400" : "text-green-400"}>{selectedLog.level}</span>
                {selectedLog.actor_id ? <Badge variant="secondary">actor:{selectedLog.actor_id}</Badge> : null}
                {selectedLog.request_id ? <Badge variant="outline">req:{selectedLog.request_id}</Badge> : null}
              </div>
              <div className="font-mono text-sm bg-muted/5 rounded p-2 overflow-auto max-h-64"><pre className="whitespace-pre-wrap">{selectedLog.message}</pre></div>
              <div>
                <div className="text-sm font-semibold">Extras</div>
                <div className="font-mono text-xs bg-muted/5 rounded p-2 overflow-auto max-h-48"><pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.extras || {}, null, 2)}</pre></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </DialogFooter>
            <DialogClose />
          </DialogContent>
        ) : null}
      </Dialog>
    </Card>
  )
}

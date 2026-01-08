import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    get: "bg-method-get/20 text-method-get border-method-get/30",
    post: "bg-method-post/20 text-method-post border-method-post/30",
    put: "bg-method-put/20 text-method-put border-method-put/30",
    patch: "bg-method-patch/20 text-method-patch border-method-patch/30",
    delete: "bg-method-delete/20 text-method-delete border-method-delete/30",
    options: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    head: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  }
  return colors[method.toLowerCase()] || "bg-gray-500/20 text-gray-400"
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-status-success"
  if (status >= 300 && status < 400) return "text-status-redirect"
  if (status >= 400 && status < 500) return "text-status-client"
  return "text-status-server"
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

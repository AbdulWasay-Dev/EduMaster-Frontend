import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function gradeColor(percentage: number): string {
  if (percentage >= 80) return 'badge-green'
  if (percentage >= 60) return 'badge-amber'
  return 'badge-red'
}

export function gradeLabel(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '...'
}

// Subject card border colors (Solar Flare theme)
const BORDER_COLORS = [
  'border-l-brand-500',
  'border-l-accent-500',
  'border-l-gold-400',
  'border-l-brand-700',
  'border-l-accent-600',
]
export function subjectBorderColor(indexOrName: number | string): string {
  const index = typeof indexOrName === 'number'
    ? indexOrName
    : indexOrName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BORDER_COLORS[index % BORDER_COLORS.length]
}

export function fileIcon(fileType: string): string {
  const map: Record<string, string> = {
    pdf: '📄',
    pptx: '📊',
    docx: '📝',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
  }
  return map[fileType.toLowerCase()] ?? '📁'
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    processing: 'badge-amber',
    ready: 'badge-green',
    error: 'badge-red',
    draft: 'badge-gray',
    published: 'badge-green',
    pending: 'badge-amber',
    graded: 'badge-green',
    review: 'badge-cyan',
    active: 'badge-green',
    archived: 'badge-gray',
    inactive: 'badge-gray',
  }
  return map[status.toLowerCase()] ?? 'badge-gray'
}

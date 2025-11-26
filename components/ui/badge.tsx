"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const variants = {
  default: "bg-muted text-foreground",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-black",
  danger: "bg-red-600 text-white",
  secondary: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  outline: "border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

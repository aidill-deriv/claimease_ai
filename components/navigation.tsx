"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, MessageSquare, FileText, User, LogOut, Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    setMounted(true)
    const email = sessionStorage.getItem("userEmail")
    if (email) {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("userEmail")
    router.push("/")
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "AI Chat", path: "/chat", icon: MessageSquare },
    { name: "Submit Claim", path: "/submit-claim", icon: FileText },
  ]

  const isActive = (path: string) => pathname === path

  if (!mounted) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-1100/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push("/dashboard")}>
            <div className="relative">
              <Sparkles className="h-8 w-8 text-coral-700 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 h-8 w-8 bg-coral-700 opacity-20 blur-lg rounded-full group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ClaimEase</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Deriv AI</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Button
                  key={item.path}
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className={`relative transition-all duration-300 ${
                    active
                      ? "bg-gradient-coral text-white shadow-lg hover:bg-gradient-coral-dark"
                      : "text-slate-700 dark:text-slate-300 hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                  {active && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-coral-700 rounded-full"></div>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-xl hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-all duration-300"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-xl p-0 hover:bg-coral-50 dark:hover:bg-coral-950 transition-all duration-300 group"
                >
                  <Avatar className="h-9 w-9 border-2 border-slate-200 dark:border-slate-700 group-hover:border-coral-300 dark:group-hover:border-coral-700 transition-colors duration-300">
                    <AvatarFallback className="bg-gradient-to-br from-coral-100 to-coral-200 dark:from-coral-900 dark:to-coral-800 text-coral-700 dark:text-coral-300 font-semibold">
                      {userEmail.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-700 border-2 border-white dark:border-slate-1100 rounded-full"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">My Account</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                <DropdownMenuItem 
                  onClick={() => router.push("/dashboard")}
                  className="cursor-pointer hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-colors duration-200"
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/chat")}
                  className="cursor-pointer hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-colors duration-200"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>AI Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/submit-claim")}
                  className="cursor-pointer hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-colors duration-200"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Submit Claim</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex items-center space-x-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Button
                key={item.path}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => router.push(item.path)}
                className={`flex-shrink-0 transition-all duration-300 ${
                  active
                    ? "bg-gradient-coral text-white shadow-lg"
                    : "text-slate-700 dark:text-slate-300 hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

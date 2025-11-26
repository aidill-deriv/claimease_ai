"use client"

import Image from "next/image"
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
import { Home, MessageSquare, FileText, LogOut, Moon, Sun, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "@/hooks/useSession"

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { state, user, logout } = useSession({
    redirectIfUnauthorized: () => router.push("/"),
  })
  const userEmail = user?.email ?? ""
  const userRole = user?.role ?? "viewer"

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navItems = useMemo(() => {
    const items = [
      { name: "Dashboard", path: "/dashboard", icon: Home },
      { name: "AI Chat", path: "/chat", icon: MessageSquare },
      { name: "Submit Claim", path: "/submit-claim", icon: FileText },
    ]
    if (userRole === "admin" || userRole === "superadmin") {
      items.push({ name: "Admin Console", path: "/admin", icon: Shield })
    }
    return items
  }, [userRole])

  const isActive = (path: string) => pathname === path

  if (!mounted || state.status === "loading") {
    return null
  }

  const logo = (
    <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push("/dashboard")}>
      <div className="relative h-10 w-10 rounded-2xl bg-white shadow-md shadow-coral-200/60 ring-1 ring-coral-100 dark:ring-coral-800 overflow-hidden group-hover:scale-105 transition-transform duration-300">
        <Image
          src="/branding/claimease-mark.svg"
          alt="ClaimEase logo"
          fill
          priority
          sizes="40px"
          className="object-cover"
        />
      </div>
      <div>
        <h1 className="text-xl font-bold gradient-text">ClaimEase</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Deriv AI</p>
      </div>
    </div>
  )

  const NavButtons = ({ layout = "horizontal" }: { layout?: "horizontal" | "vertical" }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)
        const isVertical = layout === "vertical"
        return (
          <Button
            key={item.path}
            variant={active ? "default" : "ghost"}
            size="sm"
            onClick={() => router.push(item.path)}
            className={`relative transition-all duration-300 ${
              isVertical ? "w-full justify-start" : ""
            } ${
              active
                ? "bg-gradient-coral text-white shadow-lg hover:bg-gradient-coral-dark"
                : "text-slate-700 dark:text-slate-300 hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400"
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.name}
            {active && !isVertical && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-coral-700 rounded-full"></div>
            )}
          </Button>
        )
      })}
    </>
  )

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-full overflow-hidden rounded-2xl px-3 py-2 hover:bg-coral-50 dark:hover:bg-coral-950 transition-all duration-300 group justify-start"
        >
          <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 group-hover:border-coral-300 dark:group-hover:border-coral-700 transition-colors duration-300">
            <AvatarFallback className="bg-gradient-to-br from-coral-100 to-coral-200 dark:from-coral-900 dark:to-coral-800 text-coral-700 dark:text-coral-300 font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userEmail}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
              <Shield className="h-3 w-3 text-coral-600" />
              {userRole}
            </p>
          </div>
          <div className="absolute top-1/2 right-3 -translate-y-1/2 w-2 h-2 bg-emerald-700 border-2 border-white dark:border-slate-1100 rounded-full"></div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">My Account</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
            <p className="text-[11px] uppercase tracking-wide text-coral-600 dark:text-coral-300 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {userRole}
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
        {userRole !== "viewer" && (
          <DropdownMenuItem
            onClick={() => router.push("/admin")}
            className="cursor-pointer hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-colors duration-200"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Console</span>
          </DropdownMenuItem>
        )}
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
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col justify-between border-r border-slate-200 dark:border-slate-900 bg-white/90 dark:bg-slate-1100/90 backdrop-blur-sm px-5 py-6">
        <div>
          {logo}
          <div className="mt-10 space-y-2">
            <NavButtons layout="vertical" />
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start rounded-2xl hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-all duration-300"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Light mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Dark mode
              </>
            )}
          </Button>
          {userMenu}
        </div>
      </aside>

      {/* Mobile / Tablet Top Nav */}
      <nav className="lg:hidden sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-1100/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {logo}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-xl hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-all duration-300"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                      <p className="text-[11px] uppercase tracking-wide text-coral-600 dark:text-coral-300 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {userRole}
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
                  {userRole !== "viewer" && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer hover:bg-coral-50 dark:hover:bg-coral-950 hover:text-coral-700 dark:hover:text-coral-400 transition-colors duration-200"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Console</span>
                    </DropdownMenuItem>
                  )}
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
          <div className="pb-3 flex items-center space-x-2 overflow-x-auto">
            <NavButtons />
          </div>
        </div>
      </nav>
    </>
  )
}

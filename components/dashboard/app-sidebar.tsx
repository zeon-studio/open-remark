"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  RiDashboardLine,
  RiGlobalLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiExpandUpDownLine,
  RiAddLine,
  RiSunLine,
  RiMoonLine,
  RiUserLine,
  RiMegaphoneLine,
  RiShieldUserLine,
  RiQuestionLine,
} from "@remixicon/react"
import config from "@/config/config.json"
import { platformCan, type PlatformRole } from "@/lib/permissions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import { ProductHuntBadge } from "@/components/product-hunt-badge"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

type NavGroup = {
  label: string
  items: NavItem[]
}

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null }
  siteCount: number
  platformRole: PlatformRole
}

export function AppSidebar({ user, siteCount, platformRole }: Props) {
  const navGroups: NavGroup[] = [
    {
      label: "Application",
      items: [
        { label: "Overview", href: "/dashboard", icon: RiDashboardLine },
        {
          label: "Sites",
          href: "/dashboard/sites",
          icon: RiGlobalLine,
          badge: siteCount,
        },
      ],
    },
    {
      label: "My Account",
      items: [
        { label: "Profile", href: "/dashboard/account", icon: RiUserLine },
        ...(platformCan(platformRole, "MANAGE_PLATFORM_SETTINGS")
          ? [
              {
                label: "Settings",
                href: "/dashboard/settings",
                icon: RiSettingsLine,
              },
            ]
          : []),
      ],
    },
    ...(platformCan(platformRole, "VIEW_ADMINISTRATION")
      ? [
          {
            label: "System",
            items: [
              {
                label: "Notice Board",
                href: "/dashboard/notice-board",
                icon: RiMegaphoneLine,
              },
              {
                label: "Administration",
                href: "/dashboard/administration",
                icon: RiShieldUserLine,
              },
            ],
          },
        ]
      : []),
  ]

  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Sidebar collapsible="icon">
      {/* ── Header ──────────────────────────────────────── */}
      <SidebarHeader className="mb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="flex items-center p-0 hover:bg-transparent"
            >
              <Link href="/dashboard/sites" className="max-h-[42px] pl-0">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ─────────────────────────────────────── */}
      <SidebarContent>
        {/* New site shortcut */}
        <SidebarGroup>
          <SidebarGroupContent className="group-data-[collapsible=icon]:px-0">
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="New site"
                  className="border-2 border-dashed border-primary/40 bg-primary/5 py-5 text-primary/70 transition-colors duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:text-sidebar-foreground hover:bg-primary/10 hover:text-primary group-data-[collapsible=icon]:hover:bg-primary/10 group-data-[collapsible=icon]:hover:text-primary"
                >
                  <Link href="/dashboard/sites/new">
                    <RiAddLine className="size-4 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                      New site
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Nav */}
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="mr-1 ml-auto text-xs font-bold group-data-[collapsible=icon]:hidden">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer / user ───────────────────────────────── */}
      <SidebarFooter>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <ProductHuntBadge className="flex justify-start px-2 py-1 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-[180px]" />
          </SidebarMenuItem>
          {config.need_help.enable && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={config.need_help.label}>
                <Link
                  href={config.need_help.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <RiQuestionLine
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {config.need_help.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={resolvedTheme === "dark" ? "Dark mode" : "Light mode"}
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <RiMoonLine className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <RiSunLine className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span className="group-data-[collapsible=icon]:hidden">
                {resolvedTheme === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name ?? ""}
                    />
                    <AvatarFallback className="bg-sidebar-primary/10 text-xs font-semibold text-sidebar-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-sidebar-foreground/70">
                      {user.email}
                    </p>
                  </div>
                  <RiExpandUpDownLine
                    className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
                    aria-hidden="true"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={4}
                className="w-56"
              >
                <DropdownMenuLabel className="py-2 font-normal">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => signOut({ callbackUrl: "/sign-in" })}
                  className="cursor-pointer"
                >
                  <RiLogoutBoxLine className="size-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

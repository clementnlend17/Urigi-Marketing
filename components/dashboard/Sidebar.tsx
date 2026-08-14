"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, LayoutTemplate, Settings, CreditCard, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campagnes", href: "/campagnes", icon: Megaphone },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Templates", href: "/templates", icon: LayoutTemplate },
];

const settings = [
  { name: "Paramètres", href: "/parametres", icon: Settings },
  { name: "Facturation", href: "/parametres/facturation", icon: CreditCard },
  { name: "Aide & Support", href: "/support", icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function Sidebar({ className, isOpen, setIsOpen }: SidebarProps) {
  const currentPath = usePathname() || "/dashboard"; 

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
        <span className="text-xl font-bold text-primary">Urigi<span className="text-foreground">Marketing</span></span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-6">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 border border-gray-100">
            <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
              G
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">GROSDIGITAL</span>
              <span className="text-xs text-gray-500">Plan Starter</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8">
          <div>
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Général</p>
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = item.href === "/dashboard" 
                  ? currentPath === item.href 
                  : currentPath.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen?.(false)}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium",
                        isActive
                          ? "bg-sidebar-active text-primary"
                          : "text-gray-600 hover:text-primary hover:bg-sidebar-hover"
                      )}
                    >
                      <item.icon
                        className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-gray-400 group-hover:text-primary")}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div>
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Configuration</p>
            <ul className="space-y-1">
              {settings.map((item) => {
                const isActive = item.href === "/dashboard" 
                  ? currentPath === item.href 
                  : currentPath.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen?.(false)}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium",
                        isActive
                          ? "bg-sidebar-active text-primary"
                          : "text-gray-600 hover:text-primary hover:bg-sidebar-hover"
                      )}
                    >
                      <item.icon
                        className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-gray-400 group-hover:text-primary")}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

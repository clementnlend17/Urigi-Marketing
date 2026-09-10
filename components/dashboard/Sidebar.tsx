"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, LayoutTemplate, Settings, CreditCard, HelpCircle, Bot, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getUserPlan } from "@/lib/limits";
import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";

const navigation = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campagnes", href: "/campagnes", icon: Megaphone },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Chatbot (Auto-Reply)", href: "/chatbot", icon: Bot },
  { name: "Agent IA (Avancé)", href: "/ai-agent", icon: BrainCircuit, comingSoon: true },
  { name: "Templates", href: "/templates", icon: LayoutTemplate },
];

const settings = [
  { name: "Abonnement Pro", href: "/abonnement", icon: CreditCard },
  { name: "Paramètres", href: "/parametres", icon: Settings },
  { name: "Aide & Support", href: "/support", icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function Sidebar({ className, isOpen, setIsOpen }: SidebarProps) {
  const currentPath = usePathname() || "/dashboard"; 
  const [userPlan, setUserPlan] = useState<string>("Chargement...");
  const [userName, setUserName] = useState<string>("Utilisateur");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchPlanAndUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (data.user.email === 'freddynlend7@gmail.com') setIsAdmin(true);
        const plan = await getUserPlan(data.user.id);
        setUserPlan(`Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
        const meta = data.user.user_metadata || {};
        if (meta.avatar_url) setAvatarUrl(meta.avatar_url);
        const displayName = meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || data.user.email?.split('@')[0];
        if (displayName) setUserName(displayName);
      } else {
        setUserPlan("Non connecté");
      }
    };
    fetchPlanAndUser();

    const handleProfileUpdate = (e: any) => {
      if (e.detail?.avatar_url) setAvatarUrl(e.detail.avatar_url);
      if (e.detail?.name) setUserName(e.detail.name);
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

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
          <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2 border border-gray-100">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userName[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate">{userName}</span>
              <span className="text-xs text-gray-500">{userPlan}</span>
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
                      <span className="flex-1">{item.name}</span>
                      {item.comingSoon && (
                        <span className="ml-auto inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          À venir
                        </span>
                      )}
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
              
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen?.(false)}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-red-600 hover:text-red-700 hover:bg-red-50",
                      currentPath === "/admin" && "bg-red-50 text-red-700"
                    )}
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
                    Administration
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

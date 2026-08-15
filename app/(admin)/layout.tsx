"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Users, CreditCard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "freddynlend7@gmail.com";

const navigation = [
  { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
  { name: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
  { name: "Paramètres", href: "/admin/parametres", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      if (session.user.email !== ADMIN_EMAIL) {
        router.push("/dashboard"); // Redirige les non-admins vers leur espace classique
        return;
      }

      setUserEmail(session.user.email);
      setIsAuthorized(true);
    };

    checkAdmin();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Admin */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800">
        <div className="flex h-16 shrink-0 items-center px-6 bg-slate-950">
          <span className="text-xl font-bold text-white">Admin<span className="text-primary">Panel</span></span>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto pt-6">
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
              A
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium text-white truncate">{userEmail}</span>
              <span className="text-[10px] text-slate-400">Super Admin</span>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Quitter l'Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

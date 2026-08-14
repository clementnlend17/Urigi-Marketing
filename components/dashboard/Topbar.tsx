"use client";

import { Bell, Menu, Search, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 md:hidden"
        onClick={onOpenSidebar}
      >
        <span className="sr-only">Ouvrir la sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Séparateur sur mobile */}
      <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Rechercher
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent outline-none"
            placeholder="Rechercher une campagne ou un contact..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="relative">
            <button 
              type="button" 
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative rounded-full hover:bg-gray-50 transition-colors"
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
            >
              <span className="sr-only">Voir les notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
            </button>
            
            {/* Menu Notifications */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute -right-16 sm:right-0 z-20 mt-2 w-72 sm:w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="px-4 py-6 text-center">
                    <Bell className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Aucune nouvelle notification pour le moment.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Séparateur desktop */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profil */}
          <div className="relative">
            <button 
              className="flex items-center gap-x-4 p-1 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            >
              <div className="flex items-center gap-x-3 p-1.5 rounded-full bg-gray-50 border border-gray-200 pr-4">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {userEmail || "Utilisateur"}
                </span>
              </div>
            </button>
            
            {/* Menu Profil */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Connecté en tant que</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { router.push("/parametres"); setIsProfileOpen(false); }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Paramètres du compte
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

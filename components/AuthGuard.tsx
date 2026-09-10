"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer: NodeJS.Timeout;
    let slowTimer: NodeJS.Timeout;

    // Alerte visuelle si le chargement prend plus de 2.5 secondes
    slowTimer = setTimeout(() => {
      if (isMounted && loading) {
        setShowSlowWarning(true);
      }
    }, 2500);

    const checkUser = async () => {
      try {
        // Course avec un timeout de 2.5 secondes pour éviter tout blocage réseau Supabase
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: any } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2500)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = result?.data?.session;

        if (!isMounted) return;

        if (session) {
          setLoading(false);
          return;
        }

        // Si getSession est lent ou retourne null, vérifier directement dans localStorage
        if (typeof window !== "undefined") {
          const hasLocalSession = Object.keys(localStorage).some(
            (key) => key.startsWith("sb-") && key.endsWith("-auth-token") && Boolean(localStorage.getItem(key))
          );
          if (hasLocalSession) {
            // Un token existe en local, débloquer immédiatement l'interface
            setLoading(false);
            return;
          }
        }

        // Aucune session trouvée, rediriger vers login
        setLoading(false);
        router.push("/login");
      } catch (err) {
        console.warn("[AuthGuard] Erreur lors de la vérification de session:", err);
        if (isMounted) {
          // En cas d'erreur de connexion, vérifier s'il y a un token local avant de déconnecter
          if (typeof window !== "undefined") {
            const hasLocalSession = Object.keys(localStorage).some(
              (key) => key.startsWith("sb-") && key.endsWith("-auth-token") && Boolean(localStorage.getItem(key))
            );
            if (hasLocalSession) {
              setLoading(false);
              return;
            }
          }
          setLoading(false);
          router.push("/login");
        }
      }
    };

    checkUser();

    // S'abonner aux changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session) {
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
        router.push("/login");
      }
    });

    // Garde-fou ultime : forcer l'arrêt du loader après 3.5 secondes max
    fallbackTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[AuthGuard] Déblocage forcé par timeout de sécurité (3.5s).");
        setLoading(false);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      clearTimeout(slowTimer);
      subscription.unsubscribe();
    };
  }, [router]);

  // Écran de chargement pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-700 mt-4">Chargement de votre session...</p>
          
          {showSlowWarning && (
            <div className="mt-4 animate-in fade-in duration-300">
              <p className="text-xs text-gray-500 mb-2">
                La connexion avec le serveur prend plus de temps que prévu.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setLoading(false)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Accéder à l'application
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => router.push("/login")}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Se reconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

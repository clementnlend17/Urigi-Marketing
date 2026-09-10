"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Timer, ArrowRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const OFFER_DURATION_DAYS = 10;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function WelcomeOfferBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a fermé la bannière durant cette session
    if (typeof window !== "undefined" && sessionStorage.getItem("welcome_banner_dismissed") === "true") {
      setIsDismissed(true);
      return;
    }

    const checkEligibility = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user || !user.created_at) return;

        // Vérifier si l'utilisateur a déjà un abonnement payant
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan_tier, status")
          .eq("user_id", user.id)
          .single();

        if (sub && sub.status === "active" && sub.plan_tier !== "free") {
          // Déjà abonné, pas besoin de la bannière
          setIsVisible(false);
          return;
        }

        const createdAt = new Date(user.created_at).getTime();
        const expirationTime = createdAt + OFFER_DURATION_DAYS * 24 * 60 * 60 * 1000;

        const updateTimer = () => {
          const now = Date.now();
          const difference = expirationTime - now;

          if (difference <= 0) {
            setTimeLeft(null);
            setIsVisible(false);
            return false;
          }

          const totalSeconds = Math.floor(difference / 1000);
          const days = Math.floor(totalSeconds / (3600 * 24));
          const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          setTimeLeft({ days, hours, minutes, seconds, totalSeconds });
          setIsVisible(true);
          return true;
        };

        if (updateTimer()) {
          const interval = setInterval(() => {
            if (!updateTimer()) {
              clearInterval(interval);
            }
          }, 1000);

          return () => clearInterval(interval);
        }
      } catch (err) {
        console.warn("[WelcomeOfferBanner] Erreur:", err);
      }
    };

    checkEligibility();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("welcome_banner_dismissed", "true");
    }
  };

  if (!isVisible || !timeLeft || isDismissed) {
    return null;
  }

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#FF6600] via-[#FF3700] to-[#E60000] text-white border-b border-orange-400/30 px-4 py-2.5 sm:px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Titre & Message Promotionnel */}
        <div className="flex items-center gap-2.5 text-center md:text-left flex-wrap justify-center md:justify-start">
          <span className="inline-flex items-center gap-1 bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border border-white/30 text-xs uppercase tracking-wider backdrop-blur-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Offre de Bienvenue -50%
          </span>
          <span className="text-white font-medium drop-shadow-sm">
            Profitez de <strong className="text-white font-black underline decoration-white/60 underline-offset-2">-50% sur tous les forfaits</strong> pour automatiser votre WhatsApp !
          </span>
        </div>

        {/* Compteur à rebours & Bouton CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-white font-medium">
            <Timer className="w-4 h-4 text-amber-200 mr-1 shrink-0" />
            <span className="text-xs text-orange-100 hidden sm:inline mr-1">Expire dans :</span>
            <div className="flex items-center gap-1 font-mono font-bold text-white bg-black/35 px-2.5 py-1 rounded-lg border border-white/25 shadow-inner backdrop-blur-sm">
              <span>{formatNumber(timeLeft.days)}j</span>
              <span className="text-amber-200">:</span>
              <span>{formatNumber(timeLeft.hours)}h</span>
              <span className="text-amber-200">:</span>
              <span>{formatNumber(timeLeft.minutes)}m</span>
              <span className="text-amber-200">:</span>
              <span className="text-amber-300 w-5 inline-block">{formatNumber(timeLeft.seconds)}s</span>
            </div>
          </div>

          <Link
            href="/abonnement"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-orange-50 text-[#E60000] font-black px-4 py-1.5 rounded-full shadow-md hover:shadow-orange-950/30 transition-all hover:scale-[1.03] active:scale-[0.98] text-xs uppercase tracking-wider border border-white/60"
          >
            <span>Appliquer ma réduction</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#E60000]" />
          </Link>

          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            title="Masquer la bannière"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

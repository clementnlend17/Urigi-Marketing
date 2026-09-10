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
        const { data: { user } } = await supabase.auth.getUser();
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
    <div className="relative z-50 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border-b border-red-700/50 px-4 py-2.5 sm:px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Titre & Message Promotionnel */}
        <div className="flex items-center gap-2.5 text-center md:text-left flex-wrap justify-center md:justify-start">
          <span className="inline-flex items-center gap-1 bg-red-500/30 text-red-200 font-bold px-2.5 py-0.5 rounded-full border border-red-400/40 text-xs uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            Offre de Bienvenue -50%
          </span>
          <span className="text-rose-100">
            Profitez de <strong className="text-white font-bold">-50% sur tous les forfaits</strong> pour automatiser votre WhatsApp !
          </span>
        </div>

        {/* Compteur à rebours & Bouton CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-rose-200 font-medium">
            <Timer className="w-4 h-4 text-rose-300 mr-1 shrink-0" />
            <span className="text-xs text-rose-200 hidden sm:inline mr-1">Expire dans :</span>
            <div className="flex items-center gap-1 font-mono font-bold text-white bg-black/40 px-2.5 py-1 rounded-lg border border-red-500/40 shadow-inner">
              <span>{formatNumber(timeLeft.days)}j</span>
              <span className="text-red-400">:</span>
              <span>{formatNumber(timeLeft.hours)}h</span>
              <span className="text-red-400">:</span>
              <span>{formatNumber(timeLeft.minutes)}m</span>
              <span className="text-red-400">:</span>
              <span className="text-rose-300 w-5 inline-block">{formatNumber(timeLeft.seconds)}s</span>
            </div>
          </div>

          <Link
            href="/abonnement"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-red-900 font-black px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs uppercase tracking-wider"
          >
            <span>Profiter de l'offre (-50%)</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-700" />
          </Link>

          <button
            onClick={handleDismiss}
            className="text-rose-200 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            title="Masquer la bannière"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

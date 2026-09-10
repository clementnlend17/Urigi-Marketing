"use client";

import { toast } from 'react-hot-toast';
import { CheckCircle2, Sparkles, Timer } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AbonnementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'elite'>('free');
  const [isWelcomeOfferActive, setIsWelcomeOfferActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.email === 'freddynlend7@gmail.com') {
        setIsAdmin(true);
      }

      // Vérifier l'abonnement actuel
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_tier, status')
        .eq('user_id', user.id)
        .single();

      const activePlan = (sub && sub.status === 'active' ? sub.plan_tier : 'free') as 'free' | 'pro' | 'elite';
      setCurrentPlan(activePlan);

      // Calcul de l'offre de bienvenue (-50% durant les 10 premiers jours)
      if (user.created_at && activePlan === 'free') {
        const createdAt = new Date(user.created_at).getTime();
        const expirationTime = createdAt + 10 * 24 * 60 * 60 * 1000;

        const updateTimer = () => {
          const now = Date.now();
          const diff = expirationTime - now;

          if (diff <= 0) {
            setIsWelcomeOfferActive(false);
            setTimeLeft(null);
            return false;
          }

          const totalSeconds = Math.floor(diff / 1000);
          const days = Math.floor(totalSeconds / (3600 * 24));
          const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          setTimeLeft({ days, hours, minutes, seconds });
          setIsWelcomeOfferActive(true);
          return true;
        };

        if (updateTimer()) {
          timerId = setInterval(() => {
            if (!updateTimer() && timerId) {
              clearInterval(timerId);
            }
          }, 1000);
        }
      }
    };

    loadUserData();

    // Vérifier si retour après paiement réussi
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        toast.success("🎉 Paiement validé avec succès ! Votre abonnement est désormais actif.", { duration: 6000 });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, []);
  
  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Veuillez vous connecter pour souscrire à un abonnement.");
        setIsLoading(false);
        setLoadingPlan(null);
        return;
      }

      toast.loading("Initialisation du paiement sécurisé...", { id: "saspay-checkout" });

      const res = await fetch('/api/saspay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await res.json();
      toast.dismiss("saspay-checkout");

      if (res.ok && data.checkoutUrl) {
        toast.success("Redirection vers la page de paiement...");
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Impossible d'initialiser le paiement.");
        setIsLoading(false);
        setLoadingPlan(null);
      }
    } catch (err: any) {
      toast.dismiss("saspay-checkout");
      toast.error("Erreur réseau : " + (err.message || "veuillez réessayer"));
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Passez à la vitesse supérieure
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Débloquez toutes les fonctionnalités de Urigi Marketing Pro et transformez votre WhatsApp en machine de vente automatisée.
          </p>
        </div>

        {/* Bannière Décompte Offre de Bienvenue */}
        {isWelcomeOfferActive && timeLeft && (
          <div className="mb-12 max-w-4xl mx-auto bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-2 border-emerald-500/50 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400 shrink-0 hidden sm:block">
                  <Sparkles className="w-8 h-8 animate-pulse text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="bg-emerald-500 text-gray-950 text-xs font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      Offre de Bienvenue -50%
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold tracking-wide">
                      10 premiers jours
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5">
                    Profitez de -50% de réduction immédiate sur tous les forfaits !
                  </h2>
                  <p className="text-sm text-emerald-100/80 mt-1">
                    Tarif préférentiel appliqué automatiquement sur votre premier mois.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end shrink-0 bg-black/30 px-4 py-3 rounded-xl border border-emerald-500/30">
                <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5 mb-1">
                  <Timer className="w-4 h-4 text-emerald-400" /> Offre expire dans :
                </span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-white text-lg">
                  <div className="text-center px-1">
                    <span>{String(timeLeft.days).padStart(2, "0")}</span>
                    <span className="text-[10px] text-gray-400 block -mt-1 font-sans">jours</span>
                  </div>
                  <span className="text-emerald-400 font-bold">:</span>
                  <div className="text-center px-1">
                    <span>{String(timeLeft.hours).padStart(2, "0")}</span>
                    <span className="text-[10px] text-gray-400 block -mt-1 font-sans">heures</span>
                  </div>
                  <span className="text-emerald-400 font-bold">:</span>
                  <div className="text-center px-1">
                    <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
                    <span className="text-[10px] text-gray-400 block -mt-1 font-sans">min</span>
                  </div>
                  <span className="text-emerald-400 font-bold">:</span>
                  <div className="text-center px-1">
                    <span className="text-emerald-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
                    <span className="text-[10px] text-gray-400 block -mt-1 font-sans">sec</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Plan Gratuit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-gray-900">Plan Starter</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold">
              0 FCFA
              <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
            </div>
            <p className="mt-4 text-gray-500">Pour découvrir la plateforme.</p>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                <span className="text-gray-600">Connexion à WhatsApp</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                <span className="text-gray-600">Envoi manuel de messages</span>
              </li>
              <li className="flex items-center text-gray-400 line-through">
                <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 shrink-0" />
                <span>Chatbot (Réponses automatiques)</span>
              </li>
              <li className="flex items-center text-gray-400 line-through">
                <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 shrink-0" />
                <span>Campagnes programmées</span>
              </li>
            </ul>
            {currentPlan === 'free' ? (
              <button className="mt-8 w-full bg-gray-100 text-gray-600 rounded-xl py-3 px-4 font-semibold cursor-default">
                Plan Actuel
              </button>
            ) : (
              <button disabled className="mt-8 w-full bg-gray-50 text-gray-400 rounded-xl py-3 px-4 font-medium cursor-not-allowed">
                Inclus
              </button>
            )}
          </div>

          {/* Plan Pro */}
          <div className="bg-primary/5 rounded-2xl shadow-md border-2 border-primary p-8 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 flex items-center gap-1.5">
              {isWelcomeOfferActive && (
                <span className="bg-red-500 text-white px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-full shadow-sm animate-pulse">
                  -50% BIENVENUE
                </span>
              )}
              <span className="bg-primary text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                Populaire
              </span>
            </div>
            <h3 className="text-xl font-semibold text-primary">Plan Pro</h3>
            
            {isWelcomeOfferActive ? (
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-base text-gray-400 line-through font-medium">4 999 FCFA</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    -50% APPLIQUÉ
                  </span>
                </div>
                <div className="flex items-baseline text-4xl font-extrabold text-emerald-600">
                  2 499 FCFA
                  <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                4 999 FCFA
                <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
              </div>
            )}

            <p className="mt-4 text-gray-600">Pour automatiser vos ventes.</p>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" />
                <span className="text-gray-700 font-medium">Chatbot intelligent 24/7</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" />
                <span className="text-gray-700 font-medium">Campagnes de masse (Bulk)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" />
                <span className="text-gray-700 font-medium">Messages interactifs</span>
              </li>
              <li className="flex items-center text-gray-400 line-through">
                <CheckCircle2 className="h-5 w-5 text-gray-300 mr-3 shrink-0" />
                <span>Gestion multi-comptes</span>
              </li>
            </ul>
            {currentPlan === 'pro' ? (
              <button className="mt-8 w-full bg-emerald-100 text-emerald-800 rounded-xl py-3 px-4 font-bold text-lg cursor-default">
                ✓ Votre Plan Actuel
              </button>
            ) : (
              <button 
                onClick={() => handleSubscribe('pro')}
                disabled={isLoading}
                className="mt-8 w-full bg-primary text-white hover:bg-primary/90 rounded-xl py-3 px-4 font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan === 'pro' ? (
                  'Initialisation...'
                ) : isWelcomeOfferActive ? (
                  <>
                    <span>Profiter du Plan Pro</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">2 499 FCFA</span>
                  </>
                ) : (
                  'Passer au Plan Pro'
                )}
              </button>
            )}
          </div>

          {/* Plan Elite */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col relative">
            {isWelcomeOfferActive && (
              <div className="absolute top-0 right-6 transform -translate-y-1/2">
                <span className="bg-red-500 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full shadow-sm animate-pulse">
                  -50% BIENVENUE
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900">Plan Elite</h3>
            
            {isWelcomeOfferActive ? (
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-base text-gray-400 line-through font-medium">14 999 FCFA</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    -50% APPLIQUÉ
                  </span>
                </div>
                <div className="flex items-baseline text-4xl font-extrabold text-gray-900">
                  7 499 FCFA
                  <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                14 999 FCFA
                <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
              </div>
            )}

            <p className="mt-4 text-gray-500">Pour les agences et grandes équipes.</p>
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                <span className="text-gray-600">Tout du Plan Pro</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                <span className="text-gray-600 font-medium">Gestion multi-numéros WhatsApp</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                <span className="text-gray-600 font-medium">Accès API complet</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                <span className="text-gray-600 font-medium">Support VIP 24/7</span>
              </li>
            </ul>
            {currentPlan === 'elite' ? (
              <button className="mt-8 w-full bg-gray-900 text-white rounded-xl py-3 px-4 font-bold text-lg cursor-default">
                ✓ Votre Plan Actuel
              </button>
            ) : (
              <button 
                onClick={() => handleSubscribe('elite')}
                disabled={isLoading}
                className="mt-8 w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl py-3 px-4 font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPlan === 'elite' ? (
                  'Initialisation...'
                ) : isWelcomeOfferActive ? (
                  <>
                    <span>Profiter du Plan Elite</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">7 499 FCFA</span>
                  </>
                ) : (
                  'Passer au Plan Elite'
                )}
              </button>
            )}
          </div>
        </div>

        {/* SECTION DEBUG / TEST UNIQUEMENT */}
        {isAdmin && (
          <div className="mt-20 border-t border-gray-200 pt-10 text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">🔧 Mode Développeur (Test Uniquement)</p>
            <p className="text-sm text-gray-600 mb-6">Utilisez ces boutons pour simuler instantanément un changement de plan pour les tests :</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={async () => {
                  const { supabase } = await import('@/lib/supabase');
                  const { data } = await supabase.auth.getUser();
                  if (data.user) {
                    const { error } = await supabase.from('subscriptions').upsert({
                      user_id: data.user.id,
                      plan_tier: 'pro',
                      status: 'active',
                      current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
                    }, { onConflict: 'user_id' });
                    if (!error) toast.success("Compte mis à niveau vers PRO avec succès ! Rechargez la page.");
                  }
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-bold transition-colors border border-indigo-200"
              >
                Forcer le Plan PRO
              </button>
              <button 
                onClick={async () => {
                  const { supabase } = await import('@/lib/supabase');
                  const { data } = await supabase.auth.getUser();
                  if (data.user) {
                    const { error } = await supabase.from('subscriptions').upsert({
                      user_id: data.user.id,
                      plan_tier: 'elite',
                      status: 'active',
                      current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
                    }, { onConflict: 'user_id' });
                    if (!error) toast.success("Compte mis à niveau vers ELITE avec succès ! Rechargez la page.");
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg text-sm font-bold transition-colors border border-gray-300"
              >
                Forcer le Plan ELITE
              </button>
              <button 
                onClick={async () => {
                  const { supabase } = await import('@/lib/supabase');
                  const { data } = await supabase.auth.getUser();
                  if (data.user) {
                    const { error } = await supabase.from('subscriptions').delete().eq('user_id', data.user.id);
                    if (!error) toast.success("Abonnement annulé (Retour au Plan Starter). Rechargez la page.");
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors border border-red-200"
              >
                Forcer le Plan STARTER (Gratuit)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

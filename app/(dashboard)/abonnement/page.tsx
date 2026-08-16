"use client";

import { toast } from 'react-hot-toast';
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AbonnementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email === 'freddynlend7@gmail.com') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);
  
  // Liens de paiement Chariow
  const chariowLinks: Record<string, string> = {
    pro: "https://jkqiujbo.mychariow.shop/prd_aq47y1ec",
    elite: "https://jkqiujbo.mychariow.shop/prd_jmc3wfol"
  };

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);

    if (isAdmin) {
      // Simulation pour l'administrateur
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { error } = await supabase.from('subscriptions').upsert({
          user_id: data.user.id,
          plan_tier: planId,
          status: 'active',
          current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
        }, { onConflict: 'user_id' });
        if (!error) {
          toast.success(`[Mode Dev] Compte passé en ${planId.toUpperCase()} ! Rechargez la page.`);
        } else {
          toast.error("Erreur de simulation : " + error.message);
        }
      }
      setIsLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || "";

    const link = chariowLinks[planId];
    if (link) {
      // Append tracking parameters so Chariow can pass it back to our Webhook
      const trackingParams = `client_reference_id=${userId}&custom=${userId}&custom_id=${userId}`;
      const finalLink = link.includes('?') ? `${link}&${trackingParams}` : `${link}?${trackingParams}`;
      window.location.href = finalLink;
    } else {
      toast.error("Ce plan n'est pas encore disponible.");
      setIsLoading(false);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.error("Veuillez entrer une clé de licence valide.");
      return;
    }

    setIsActivating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Vous devez être connecté.");
        setIsActivating(false);
        return;
      }

      const res = await fetch("/api/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: licenseKey.trim(), userId: userData.user.id })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(`Succès ! Votre abonnement ${data.planTier.toUpperCase()} est activé. Rechargez la page.`);
        setLicenseKey("");
      } else {
        if (data.debugInfo) {
          console.error("Debug Chariow:", data.debugInfo);
          toast.error(`Erreur: ${JSON.stringify(data.debugInfo).substring(0, 50)}... Regardez la console F12.`);
        } else {
          toast.error(data.error || "Clé de licence invalide.");
        }
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la validation.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="py-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Passez à la vitesse supérieure
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Débloquez toutes les fonctionnalités de Urigi Marketing Pro et transformez votre WhatsApp en machine de vente automatisée.
          </p>
        </div>

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
            <button className="mt-8 w-full bg-gray-100 text-gray-600 rounded-xl py-3 px-4 font-semibold cursor-default">
              Plan Actuel
            </button>
          </div>

          {/* Plan Pro */}
          <div className="bg-primary/5 rounded-2xl shadow-md border-2 border-primary p-8 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 right-6 transform -translate-y-1/2">
              <span className="bg-primary text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
                Populaire
              </span>
            </div>
            <h3 className="text-xl font-semibold text-primary">Plan Pro</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
              4 999 FCFA
              <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
            </div>
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
            <button 
              onClick={() => handleSubscribe('pro')}
              disabled={isLoading}
              className="mt-8 w-full bg-primary text-white hover:bg-primary/90 rounded-xl py-3 px-4 font-bold text-lg shadow-sm transition-all"
            >
              Passer au Plan Pro
            </button>
          </div>

          {/* Plan Elite */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-gray-900">Plan Elite</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold">
              14 999 FCFA
              <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
            </div>
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
            <button 
              onClick={() => handleSubscribe('elite')}
              disabled={isLoading}
              className="mt-8 w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl py-3 px-4 font-bold text-lg transition-colors"
            >
              Passer au Plan Elite
            </button>
          </div>
        </div>

        {/* Section Activation de Licence */}
        <div className="mt-16 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vous avez déjà payé ?</h2>
          <p className="text-gray-500 mb-6">
            Si vous avez reçu une clé de licence par email après votre achat, collez-la ci-dessous pour activer votre abonnement instantanément.
          </p>
          <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-3 justify-center">
            <input 
              type="text" 
              placeholder="Ex: XXXX-XXXX-XXXX-XXXX" 
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="flex-1 max-w-md px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center sm:text-left text-gray-900"
            />
            <button 
              type="submit" 
              disabled={isActivating || !licenseKey.trim()}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isActivating ? "Activation..." : "Activer ma licence"}
            </button>
          </form>
        </div>

        {/* SECTION DEBUG / TEST UNIQUEMENT */}
        {isAdmin && (
          <div className="mt-20 border-t border-gray-200 pt-10 text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">🔧 Mode Développeur (Test Uniquement)</p>
            <p className="text-sm text-gray-600 mb-6">Utilisez ces boutons pour simuler un paiement réussi sans passer par Chariow :</p>
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

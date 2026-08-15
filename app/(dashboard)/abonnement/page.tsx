"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AbonnementPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Liens de paiement Chariow
  const chariowLinks: Record<string, string> = {
    pro: "https://jkqiujbo.mychariow.shop/prd_aq47y1ec",
    elite: "https://jkqiujbo.mychariow.shop/prd_jmc3wfol"
  };

  const handleSubscribe = (planId: string) => {
    setIsLoading(true);
    const link = chariowLinks[planId];
    
    if (link) {
      window.location.href = link;
    } else {
      alert("Ce plan n'est pas encore disponible.");
      setIsLoading(false);
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
              30 000 FCFA
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
      </div>
    </div>
  );
}

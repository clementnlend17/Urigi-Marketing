"use client";

import { Shield, CreditCard, Server, Database, CheckCircle2 } from "lucide-react";

export default function AdminParametres() {
  const admins = [
    "freddynlend7@gmail.com",
    "clementnlend17@gmail.com"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Plateforme</h1>
        <p className="text-gray-500 text-sm">Vue d'ensemble de la sécurité, passerelles de paiement et services connectés.</p>
      </div>

      {/* Sécurité et Administrateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Accès Super-Administrateur</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Les comptes suivants bénéficient des privilèges super-administrateur complets pour visualiser les revenus, les mouvements et modifier les forfaits utilisateurs.
            </p>
            
            <div className="space-y-2 max-w-md">
              {admins.map((email) => (
                <div key={email} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-800">{email}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Super Admin
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Passerelle SasPay */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Passerelle de Paiement SasPay</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Gestion automatisée des abonnements Pro (4 999 FCFA) et Elite (14 999 FCFA) via Mobile Money (Orange Money, MTN MoMo, Wave, Moov) et Carte Bancaire.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider mb-1">
                  URL Webhook
                </span>
                <code className="text-xs text-gray-800 font-mono bg-white px-2 py-1 rounded border border-gray-200 block truncate">
                  https://urigi-marketing.vercel.app/api/webhooks/saspay
                </code>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider mb-1">
                  Signature Sécurité
                </span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Validation HMAC-SHA256 active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Connectés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Database className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Base de Données Supabase</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Tables connectées : <code>subscriptions</code>, <code>payment_intents</code>, <code>campaigns</code>, <code>contacts</code>, <code>webhook_logs</code>.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Opérationnel
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Server className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Moteur WhatsApp (Baileys)</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Serveur WebSocket local / distant pour l'envoi direct de messages et la diffusion de statuts.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            <span>Port 3001 configuré</span>
          </div>
        </div>
      </div>
    </div>
  );
}


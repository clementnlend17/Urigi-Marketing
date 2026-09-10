"use client";

import { CreditCard, ArrowUpRight } from "lucide-react";

export default function AdminAbonnements() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnements & Paiements</h1>
        <p className="text-gray-500">Gérez les revenus et suivez les souscriptions de vos clients.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Dernières Transactions</h2>
        </div>
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des transactions</h3>
          <p className="text-gray-500 max-w-md text-sm mb-6">
            L'historique des souscriptions et paiements sera synchronisé ici dès la configuration de votre nouvelle solution de paiement.
          </p>
        </div>
      </div>
    </div>
  );
}

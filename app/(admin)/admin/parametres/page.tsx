"use client";

import { Settings, Shield } from "lucide-react";

export default function AdminParametres() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres Administrateur</h1>
        <p className="text-gray-500">Configuration générale de la plateforme.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Sécurité et Accès</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Cet espace est strictement réservé à <strong>freddynlend7@gmail.com</strong>.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                Pour modifier l'adresse email de l'administrateur, vous devez modifier la variable d'environnement <code>ADMIN_EMAIL</code> dans le code source de l'application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

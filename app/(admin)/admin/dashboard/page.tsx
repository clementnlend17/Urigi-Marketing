import { Users, CreditCard, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h1>
        <p className="text-gray-500">Bienvenue, voici un aperçu de l'activité de votre plateforme.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Utilisateurs</p>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 mr-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Abonnés Pro</p>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Revenu mensuel estimé</p>
            <p className="text-2xl font-bold text-gray-900">-- FCFA</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Passerelle de Paiement</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Prêt pour l'intégration de la nouvelle solution de paiement des abonnements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

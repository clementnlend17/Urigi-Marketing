"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  UserPlus, 
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  planTier: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Manual grant modal / input
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualUserId, setManualUserId] = useState("");
  const [manualPlan, setManualPlan] = useState<"pro" | "elite">("pro");
  const [manualDuration, setManualDuration] = useState(30);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdatePlan = async (userId: string, planTier: string, durationDays: number = 30) => {
    try {
      setActionLoading(userId);
      setMessage(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/manage-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, planTier, durationDays })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || `Plan mis à jour vers ${planTier.toUpperCase()} !` });
        await fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || "Échec de la modification." });
      }
    } catch {
      setMessage({ type: 'error', text: "Erreur réseau lors de la mise à jour." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId.trim()) return;
    await handleUpdatePlan(manualUserId.trim(), manualPlan, manualDuration);
    setShowManualModal(false);
    setManualUserId("");
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
      user.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filterPlan === 'all' ? true :
      filterPlan === 'paid' ? (user.planTier === 'pro' || user.planTier === 'elite') :
      user.planTier === filterPlan;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Gestion des Utilisateurs & Abonnements
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les comptes clients, activez manuellement des forfaits Pro ou Elite en 1 clic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Activer un Utilisateur
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages de retour */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-auto text-xs font-semibold underline opacity-75 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par Email ou UUID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterPlan('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterPlan === 'all' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            onClick={() => setFilterPlan('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterPlan === 'paid' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Payants ({users.filter(u => u.planTier === 'pro' || u.planTier === 'elite').length})
          </button>
          <button
            onClick={() => setFilterPlan('elite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterPlan === 'elite' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Elite ({users.filter(u => u.planTier === 'elite').length})
          </button>
          <button
            onClick={() => setFilterPlan('pro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterPlan === 'pro' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pro ({users.filter(u => u.planTier === 'pro').length})
          </button>
          <button
            onClick={() => setFilterPlan('free')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterPlan === 'free' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Gratuits ({users.filter(u => u.planTier === 'free').length})
          </button>
        </div>
      </div>

      {/* Modal d'activation manuelle */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Attribuer un Forfait
              </h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ID Utilisateur (UUID Supabase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: c1d9472e-3f74-46c5-9276-..."
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Forfait à Accorder
                </label>
                <select
                  value={manualPlan}
                  onChange={(e) => setManualPlan(e.target.value as "pro" | "elite")}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="pro">Pro (4 999 FCFA / 30j)</option>
                  <option value="elite">Elite VIP (14 999 FCFA / 30j)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Durée (en jours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Valider l'Abonnement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur / ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forfait
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut & Expiration
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Rapide
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement des membres...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouvé correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPro = user.planTier === 'pro';
                  const isElite = user.planTier === 'elite';
                  const isPendingThisUser = actionLoading === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isElite 
                              ? 'bg-purple-100 text-purple-700' 
                              : isPro 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {user.email || 'Email non renseigné'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-0.5">
                              <span>{user.id}</span>
                              <button
                                onClick={() => handleCopy(user.id, user.id)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copier l'UUID"
                              >
                                {copiedId === user.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isElite ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Crown className="h-3.5 w-3.5 text-purple-600" />
                            ELITE VIP
                          </span>
                        ) : isPro ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                            PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            GRATUIT
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {user.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Inactif / Gratuit
                            </span>
                          )}

                          {user.currentPeriodEnd && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Clock className="h-3 w-3" />
                              Expire le {new Date(user.currentPeriodEnd).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isElite && (
                            <button
                              onClick={() => handleUpdatePlan(user.id, 'elite')}
                              disabled={isPendingThisUser}
                              className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
                            >
                              Passer Elite
                            </button>
                          )}
                          {!isPro && (
                            <button
                              onClick={() => handleUpdatePlan(user.id, 'pro')}
                              disabled={isPendingThisUser}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                            >
                              Passer Pro
                            </button>
                          )}
                          {(isPro || isElite) && (
                            <button
                              onClick={() => handleUpdatePlan(user.id, 'free')}
                              disabled={isPendingThisUser}
                              className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Rétrograder au forfait gratuit"
                            >
                              Rétrograder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


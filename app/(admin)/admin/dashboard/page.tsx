"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, Activity, ArrowUpRight, Megaphone, RefreshCw, CheckCircle2, Clock, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface OverviewMetrics {
  totalUsers: number;
  activePro: number;
  activeElite: number;
  totalActivePaid: number;
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactionsCount: number;
  totalCampaigns: number;
  totalDeliveredMessages: number;
  totalContacts: number;
}

interface Transaction {
  id: string;
  paymentRef: string;
  userId: string;
  planTier: string;
  amount: number;
  status: string;
  createdAt: string;
  gateway: string;
}

interface RecentCampaign {
  id: string | number;
  name: string;
  type: string;
  status: string;
  sentMessages: number;
  totalMessages: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchOverview = async () => {
    try {
      setIsRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch("/api/admin/overview", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setTransactions(data.transactions || []);
        setRecentCampaigns(data.recentCampaigns || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("[Admin Dashboard] Erreur chargement:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En direct
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Suivi en temps réel des transactions SasPay, des abonnements et de l'activité globale d'Urigi Marketing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              Dernière mise à jour : {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchOverview}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenus Totaux */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Revenus Encaissés (SasPay)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              FCFA
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : formatCFA(metrics?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {metrics?.successfulTransactionsCount || 0} transaction(s) réussie(s)
            </p>
          </div>
        </div>

        {/* Abonnés Payants */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Abonnés Payants Actifs</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : metrics?.totalActivePaid || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.activeElite || 0} Elite &bull; {metrics?.activePro || 0} Pro
            </p>
          </div>
        </div>

        {/* Total Utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Utilisateurs</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : metrics?.totalUsers || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.totalContacts || 0} contacts gérés
            </p>
          </div>
        </div>

        {/* Messages WhatsApp */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Messages WhatsApp Livrés</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : (metrics?.totalDeliveredMessages || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              sur {metrics?.totalCampaigns || 0} campagne(s)
            </p>
          </div>
        </div>
      </div>

      {/* Sections Mouvements & Activités Récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dernières Transactions SasPay */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Mouvements & Paiements SasPay</h2>
            </div>
            <Link
              href="/admin/abonnements"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Voir tout ({transactions.length})
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Chargement des transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Aucune transaction enregistrée pour l'instant.
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {tx.planTier ? `Abonnement ${tx.planTier.toUpperCase()}` : "Souscription"}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      Réf: {tx.paymentRef || tx.id.slice(0, 8)} &bull; {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">
                      {formatCFA(Number(tx.amount) || 0)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      tx.status === "success" || tx.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {tx.status === "success" || tx.status === "completed" ? "Payé" : "En attente"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dernières Campagnes Lancées */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Activité des Campagnes</h2>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {metrics?.totalCampaigns || 0} campagne(s) au total
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Chargement des campagnes...</div>
            ) : recentCampaigns.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Aucune campagne diffusée pour le moment.
              </div>
            ) : (
              recentCampaigns.slice(0, 5).map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.type === "status" ? "Statut WhatsApp" : "Message direct"} &bull; {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-gray-900 block">
                      {c.sentMessages} / {c.totalMessages} envoyés
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      c.status === "Terminée" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Passerelle & Statut SasPay */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
            SP
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Passerelle de Paiement SasPay</h3>
            <p className="text-xs text-gray-500">
              Webhooks automatisés actifs &bull; Orange Money, MTN MoMo, Wave, Moov, Cartes Bancaires.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Opérationnel (Webhook Actif)
          </span>
        </div>
      </div>
    </div>
  );
}

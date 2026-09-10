"use client";

import { useEffect, useState } from "react";
import { CreditCard, Search, Filter, RefreshCw, CheckCircle2, Clock, AlertCircle, ArrowDownToLine } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

export default function AdminAbonnements() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [successfulCount, setSuccessfulCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTransactions = async () => {
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
        setTransactions(data.transactions || []);
        setTotalRevenue(data.metrics?.totalRevenue || 0);
        setSuccessfulCount(data.metrics?.successfulTransactionsCount || 0);
      }
    } catch (err) {
      console.error("[Admin Abonnements] Erreur:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  // Filtrage
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      (tx.paymentRef && tx.paymentRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.userId && tx.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.planTier && tx.planTier.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" && (tx.status === "success" || tx.status === "completed")) ||
      (statusFilter === "pending" && (tx.status === "pending" || !tx.status));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnements & Transactions SasPay</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez tous les mouvements financiers, les montants perçus et les règlements des clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Interroger directement l'API SasPay et synchroniser tous les paiements Mobile Money / CB"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Synchronisation..." : "Synchroniser SasPay"}
          </button>
        </div>
      </div>

      {/* Cartes Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <span className="text-sm font-medium text-gray-500">Volume Total Encaissé</span>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {isLoading ? "..." : formatCFA(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validé automatiquement via SasPay
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <span className="text-sm font-medium text-gray-500">Paiements Réussis</span>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {isLoading ? "..." : successfulCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            sur {transactions.length} transaction(s) initiée(s)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <span className="text-sm font-medium text-gray-500">Moyen de Paiement Principal</span>
          <p className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            SasPay Checkout
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Orange Money, MTN MoMo, Wave, CB
          </p>
        </div>
      </div>

      {/* Tableau des Mouvements & Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Barre d'outils / Filtres */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, client ou plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tous ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter("success")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "success" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Payés ({transactions.filter(t => t.status === "success" || t.status === "completed").length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              En attente ({transactions.filter(t => t.status === "pending" || !t.status).length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Date & Heure</th>
                <th className="px-6 py-3.5">Référence Transaction</th>
                <th className="px-6 py-3.5">Identifiant Client</th>
                <th className="px-6 py-3.5">Forfait</th>
                <th className="px-6 py-3.5">Montant</th>
                <th className="px-6 py-3.5">Passerelle</th>
                <th className="px-6 py-3.5 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Chargement des transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune transaction trouvée correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs">
                      {new Date(tx.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900 font-semibold">
                      {tx.paymentRef || tx.id.slice(0, 12)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500 max-w-[180px] truncate" title={tx.userId}>
                      {tx.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        tx.planTier === "elite"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        {tx.planTier || "Pro"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900">
                      {formatCFA(Number(tx.amount) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {tx.gateway}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        tx.status === "success" || tx.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {tx.status === "success" || tx.status === "completed" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Validé
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            En attente
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

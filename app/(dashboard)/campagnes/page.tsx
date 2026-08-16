"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, Calendar, X, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Campaign {
  id: number | string;
  name: string;
  status: string;
  sent_messages: number;
  total_messages: number;
  read?: number;
  created_at: string;
  type?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Terminée": return "bg-green-50 text-green-700 ring-green-600/20";
    case "En cours": return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "Planifiée": return "bg-yellow-50 text-yellow-800 ring-yellow-600/20";
    default: return "bg-gray-50 text-gray-600 ring-gray-500/10";
  }
}

export default function CampagnesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tous");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.log("Erreur ou table inexistante:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignToDelete);

    if (error) {
      toast.error("Erreur lors de la suppression de la campagne : " + error.message);
      setIsDeleting(false);
      return;
    }

    setCampaigns(campaigns.filter(c => c.id !== campaignToDelete));
    setCampaignToDelete(null);
    setIsDeleting(false);
  };

  // Filtrage
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Tous" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos envois WhatsApp, créez de nouvelles campagnes et suivez leurs performances.
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <Link 
            href="/campagnes/nouvelle"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            Créer une campagne
          </Link>
        </div>
      </div>

      {/* Filters and Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Rechercher une campagne..."
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 text-gray-400" />
              Filtrer {statusFilter !== "Tous" && `(${statusFilter})`}
            </button>

            {/* Menu Filtre */}
            {isFilterOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {["Tous", "Terminée", "En cours", "Planifiée", "Brouillon"].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === status ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nom de la campagne</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performance</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Date
                  </div>
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                    Aucune campagne trouvée.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr 
                    key={campaign.id} 
                    onClick={() => setSelectedCampaign(campaign)}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <div className="flex flex-col gap-1.5">
                        <span>{campaign.name}</span>
                        {campaign.type === 'status' ? (
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 w-fit">
                            Statut WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 w-fit">
                            Message Classique
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {campaign.status === "Brouillon" || campaign.status === "Planifiée" ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase">Envoyés</span>
                            <span className="font-medium text-gray-900">{campaign.sent_messages}</span>
                          </div>
                          {campaign.total_messages > campaign.sent_messages && (
                            <>
                              <div className="w-px h-6 bg-gray-200"></div>
                              <div className="flex flex-col">
                                <span className="text-xs text-red-400 uppercase">Échecs</span>
                                <span className="font-medium text-red-600">{campaign.total_messages - campaign.sent_messages}</span>
                              </div>
                            </>
                          )}
                          <div className="w-px h-6 bg-gray-200"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase">Cibles</span>
                            <span className="font-medium text-primary">{campaign.total_messages}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {campaign.status === 'Brouillon' && (
                          <Link 
                            href={`/campagnes/nouvelle?id=${campaign.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                            title="Modifier le brouillon"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCampaignToDelete(campaign.id); setSelectedCampaign(null); }}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail de la Campagne */}
      {selectedCampaign && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCampaign(null)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform transition-transform ease-in-out duration-500 sm:duration-700 bg-white shadow-xl h-full flex flex-col">
              <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedCampaign.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Détails et statistiques</p>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => setSelectedCampaign(null)}
                >
                  <span className="sr-only">Fermer le panneau</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Informations</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Statut</span>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(selectedCampaign.status)}`}>
                          {selectedCampaign.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date</span>
                        <span className="text-sm font-medium text-gray-900">{new Date(selectedCampaign.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Audience</span>
                        <span className="text-sm font-medium text-gray-900">Groupe "Clients VIP"</span>
                      </div>
                    </div>
                  </div>

                  {selectedCampaign.status !== "Brouillon" && selectedCampaign.status !== "Planifiée" && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Performances</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Envoyés</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedCampaign.sent_messages}</p>
                        </div>
                        <div className={`bg-white border ${selectedCampaign.total_messages > selectedCampaign.sent_messages ? 'border-red-200 bg-red-50' : 'border-gray-200'} rounded-lg p-4`}>
                          <p className={`text-xs ${selectedCampaign.total_messages > selectedCampaign.sent_messages ? 'text-red-600' : 'text-gray-500'} mb-1`}>Échecs</p>
                          <p className={`text-2xl font-bold ${selectedCampaign.total_messages > selectedCampaign.sent_messages ? 'text-red-700' : 'text-gray-900'}`}>{selectedCampaign.total_messages - selectedCampaign.sent_messages}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Ciblés</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedCampaign.total_messages}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 col-span-3">
                          <p className="text-xs text-emerald-600 mb-1">Taux de délivrabilité estimé</p>
                          <p className="text-2xl font-bold text-emerald-700">
                            {selectedCampaign.total_messages > 0 ? Math.round((selectedCampaign.sent_messages / selectedCampaign.total_messages) * 100) : 0}%
                          </p>
                          <div className="mt-2 w-full bg-emerald-200 rounded-full h-1.5">
                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: selectedCampaign.total_messages > 0 ? `${(selectedCampaign.sent_messages / selectedCampaign.total_messages) * 100}%` : '0%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    setCampaignToDelete(selectedCampaign.id);
                    setSelectedCampaign(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setCampaignToDelete(null)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Supprimer l'historique</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer cette campagne de l'historique ? Cela n'annulera pas les messages déjà envoyés, mais effacera les statistiques.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50"
                  onClick={handleDeleteCampaign}
                >
                  {isDeleting ? "Suppression..." : "Oui, supprimer"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50"
                  onClick={() => setCampaignToDelete(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

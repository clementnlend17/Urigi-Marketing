"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Users, Megaphone, MessageSquare, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    contactsCount: 0,
    campaignsCount: 0,
    messagesDelivered: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch Contacts Count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch Campaigns (for count and messages delivered)
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let delivered = 0;
      let sentCampaigns = 0;
      
      if (campaigns) {
        campaigns.forEach(c => {
          if (c.status !== 'Brouillon') {
            sentCampaigns++;
            delivered += (c.sent_messages || 0);
          }
        });
        setRecentCampaigns(campaigns.slice(0, 5));
      }

      setStats({
        contactsCount: contactsCount || 0,
        campaignsCount: sentCampaigns,
        messagesDelivered: delivered
      });

    } catch (e) {
      console.error("[Dashboard] Erreur fetchDashboardData:", e);
    } finally {
      setIsLoading(false);
    }
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "Terminée": return "bg-green-50 text-green-700 ring-green-600/20";
      case "En cours": return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "Planifiée": return "bg-yellow-50 text-yellow-800 ring-yellow-600/20";
      default: return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivez vos performances et l'état de votre compte WhatsApp.
          </p>
        </div>
        <div>
          <Link 
            href="/campagnes/nouvelle"
            className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
          >
            <Megaphone className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            Nouvelle campagne
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Contacts Total"
          value={isLoading ? "..." : stats.contactsCount.toLocaleString()}
          icon={Users}
          trend="Total base"
          trendValue=""
          trendUp={true}
        />
        <StatCard
          title="Campagnes Envoyées"
          value={isLoading ? "..." : stats.campaignsCount.toLocaleString()}
          icon={Megaphone}
          trend="Total historique"
          trendValue=""
          trendUp={true}
        />
        <StatCard
          title="Messages Livrés"
          value={isLoading ? "..." : stats.messagesDelivered.toLocaleString()}
          icon={MessageSquare}
          trend="Total historique"
          trendValue=""
          trendUp={true}
        />
        <StatCard
          title="Taux de Délivrabilité"
          value={stats.messagesDelivered > 0 ? "~98%" : "0%"}
          icon={ArrowUpRight}
          trend="Estimation globale"
          trendValue=""
          trendUp={true}
        />
      </div>

      {/* Placeholder pour les graphiques et campagnes récentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[400px] flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Activité des campagnes</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">Le graphique d'activité apparaîtra ici une fois que les données dynamiques seront connectées.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[400px]">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex justify-between items-center">
            Campagnes Récentes
            <Link href="/campagnes" className="text-sm text-primary font-medium hover:underline">Voir tout</Link>
          </h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">
              Aucune campagne pour le moment.
            </div>
          ) : (
            <ul className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between gap-x-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{campaign.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {campaign.status === 'Brouillon' ? 'Brouillon' : `Envoyé à ${campaign.total_messages} contacts`}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

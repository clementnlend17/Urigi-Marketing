"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface ActivationRequest {
  id: string;
  user_id: string;
  user_email: string;
  license_key: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === 'freddynlend7@gmail.com') {
      setIsAdmin(true);
      fetchRequests();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('activation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur de chargement des requêtes.");
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  };

  const handleApprove = async (requestId: string, userId: string, planTier: string) => {
    const res = await fetch('/api/admin/approve-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, userId, planTier, action: 'approve' })
    });
    
    if (res.ok) {
      toast.success(`Utilisateur passé en ${planTier.toUpperCase()} !`);
      fetchRequests();
    } else {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (requestId: string) => {
    const res = await fetch('/api/admin/approve-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action: 'reject' })
    });
    
    if (res.ok) {
      toast.success("Demande rejetée.");
      fetchRequests();
    } else {
      toast.error("Erreur lors du rejet.");
    }
  };

  if (isAdmin === null || isLoading) return <div className="p-10 text-center">Chargement...</div>;
  if (isAdmin === false) return <div className="p-10 text-center text-red-500 font-bold">Accès refusé.</div>;

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Espace Administrateur</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Demandes d'activation de licence ({requests.filter(r => r.status === 'pending').length} en attente)
            </h3>
            <button onClick={fetchRequests} className="text-sm text-primary hover:underline">Rafraîchir</button>
          </div>
          
          {requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Aucune demande d'activation pour le moment.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {requests.map((req) => (
                <li key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary truncate">{req.user_email}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Clé: {req.license_key}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Date: {new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApprove(req.id, req.user_id, 'pro')}
                              className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                            >
                              Approuver (PRO)
                            </button>
                            <button 
                              onClick={() => handleApprove(req.id, req.user_id, 'elite')}
                              className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700"
                            >
                              Approuver (ELITE)
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200"
                            >
                              Rejeter
                            </button>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            En attente
                          </span>
                        </>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {req.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

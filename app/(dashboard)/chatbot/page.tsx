"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Bot, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, RefreshCw, Smartphone, CreditCard, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUserPlan } from "@/lib/limits";
import Link from "next/link";

interface ChatbotRule {
  id: string;
  keyword: string;
  match_type: "exact" | "contains";
  reply_text: string;
  is_active: boolean;
}

export default function ChatbotPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rules, setRules] = useState<ChatbotRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Formulaire d'ajout/modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "contains">("contains");
  const [replyText, setReplyText] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    checkAccessAndFetchRules();
  }, []);

  const checkAccessAndFetchRules = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
      const plan = await getUserPlan(data.user.id);
      
      if (plan === "free") {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      setHasAccess(true);
      
      // Récupérer les règles
      const { data: rulesData, error } = await supabase
        .from("chatbot_rules")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (rulesData && !error) {
        setRules(rulesData);
      }
    }
    setIsLoading(false);
  };

  const openAddModal = () => {
    setEditingRuleId(null);
    setKeyword("");
    setMatchType("contains");
    setReplyText("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: ChatbotRule) => {
    setEditingRuleId(rule.id);
    setKeyword(rule.keyword);
    setMatchType(rule.match_type);
    setReplyText(rule.reply_text);
    setIsActive(rule.is_active);
    setIsModalOpen(true);
  };

  const saveRule = async () => {
    if (!keyword.trim() || !replyText.trim() || !userId) {
      toast.error("Veuillez remplir le mot-clé et le message de réponse.");
      return;
    }

    setIsSaving(true);
    
    const payload = {
      user_id: userId,
      keyword: keyword.trim().toLowerCase(),
      match_type: matchType,
      reply_text: replyText,
      is_active: isActive
    };

    if (editingRuleId) {
      // Modification
      const { data, error } = await supabase
        .from("chatbot_rules")
        .update(payload)
        .eq("id", editingRuleId)
        .select();
        
      if (!error && data) {
        setRules(rules.map(r => r.id === editingRuleId ? data[0] : r));
      } else if (error) {
        toast.error("Erreur (Update) : " + error.message);
      }
    } else {
      // Ajout
      const { data, error } = await supabase
        .from("chatbot_rules")
        .insert([payload])
        .select();
        
      if (!error && data) {
        setRules([...rules, data[0]]);
      } else if (error) {
        toast.error("Erreur (Insert) : " + error.message);
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
    
    // Synchro avec le backend
    syncRulesWithBackend();
  };

  const toggleRuleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("chatbot_rules")
      .update({ is_active: !currentStatus })
      .eq("id", id);
      
    if (!error) {
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
      syncRulesWithBackend();
    }
  };

  const deleteRule = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette règle ?")) {
      const { error } = await supabase
        .from("chatbot_rules")
        .delete()
        .eq("id", id);
        
      if (!error) {
        setRules(rules.filter(r => r.id !== id));
        syncRulesWithBackend();
      }
    }
  };

  const syncRulesWithBackend = async () => {
    setIsSyncing(true);
    try {
      // On récupère toutes les règles mises à jour
      const { data: updatedRules } = await supabase
        .from("chatbot_rules")
        .select("*")
        .eq("is_active", true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/chatbot-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          rules: updatedRules || []
        })
      });
      console.log("Règles synchronisées avec le moteur WhatsApp.");
    } catch (e) {
      console.error("Impossible de synchroniser avec le moteur local:", e);
    }
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ÉCRAN VERROUILLÉ POUR STARTER
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Chatbot Auto-Répondeur</h2>
            <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
              Automatisez votre service client sur WhatsApp. Configurez des mots-clés et laissez Urigi répondre instantanément à vos prospects 24h/24 et 7j/7.
            </p>
          </div>
          
          <div className="px-8 py-10 bg-gray-50 flex flex-col items-center justify-center text-center">
            <div className="bg-amber-100 text-amber-800 p-4 rounded-xl flex items-start gap-3 max-w-lg mb-8 shadow-sm">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="font-bold text-sm">Fonctionnalité Premium</h4>
                <p className="text-sm mt-1">Le Chatbot est réservé aux abonnements Pro et Elite. Votre plan Starter actuel ne permet pas d'accéder à cette fonctionnalité.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-10">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                <h5 className="font-bold text-gray-900 mb-1">Support 24/7</h5>
                <p className="text-sm text-gray-500">Répondez aux questions fréquentes même quand vous dormez.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                <h5 className="font-bold text-gray-900 mb-1">Mots-clés intelligents</h5>
                <p className="text-sm text-gray-500">Déclenchez des réponses selon ce que le client écrit (ex: "prix").</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                <h5 className="font-bold text-gray-900 mb-1">Gain de temps</h5>
                <p className="text-sm text-gray-500">Divisez par 10 le temps passé à répondre aux mêmes questions.</p>
              </div>
            </div>
            
            <Link 
              href="/abonnement"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <CreditCard className="w-5 h-5" />
              Mettre à niveau mon abonnement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN CHATBOT (PRO/ELITE)
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            Chatbot Auto-Répondeur
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez des règles pour que WhatsApp réponde automatiquement à vos clients en privé.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncRulesWithBackend}
            disabled={isSyncing}
            className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            <Plus className="-ml-0.5 h-4 w-4" />
            Nouvelle Règle
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            Règles de réponses configurées ({rules.length})
          </h3>
          <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Actif en temps réel
          </span>
        </div>
        
        {rules.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucune règle définie</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Créez votre première règle. Par exemple : Si le client dit "Bonjour", répondez "Bienvenue chez nous ! Comment puis-je vous aider ?".
            </p>
            <button 
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 text-primary font-medium hover:text-primary-hover"
            >
              <Plus className="w-4 h-4" /> Ajouter ma première règle
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div key={rule.id} className={`p-5 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 transition-colors ${!rule.is_active ? 'opacity-60' : ''}`}>
                <div className="flex-shrink-0 pt-1">
                  <div className="relative inline-flex items-center cursor-pointer" onClick={() => toggleRuleActive(rule.id, rule.is_active)}>
                    <div className={`w-11 h-6 rounded-full transition-colors ${rule.is_active ? 'bg-primary' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${rule.is_active ? 'translate-x-5' : ''}`}></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <span className="text-sm text-gray-500">Si le message</span>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {rule.match_type === 'exact' ? 'est exactement' : 'contient le mot'}
                    </span>
                    <span className="font-bold text-gray-900">"{rule.keyword}"</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 relative mt-3 border border-gray-200">
                    <div className="absolute -top-2.5 left-4 text-xs font-bold text-gray-500 bg-gray-100 px-1">Le Bot répond :</div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{rule.reply_text}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 sm:ml-4 flex-shrink-0">
                  <button onClick={() => openEditModal(rule)} className="p-2 text-gray-400 hover:text-primary bg-white border border-gray-200 rounded-md shadow-sm transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-md shadow-sm transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout/Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                {editingRuleId ? 'Modifier la règle' : 'Nouvelle règle'}
              </h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition (Mot-clé)</label>
                <div className="flex gap-3">
                  <select 
                    value={matchType} 
                    onChange={(e) => setMatchType(e.target.value as "exact" | "contains")}
                    className="w-1/3 rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="contains">Contient</option>
                    <option value="exact">Est exactement</option>
                  </select>
                  <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="ex: prix, info, adresse"
                    className="flex-1 rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Astuce : Utilisez des mots simples en minuscules.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Réponse automatique</label>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Tapez le message que le bot enverra..."
                  className="w-full rounded-lg border border-gray-300 py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                ></textarea>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input 
                  type="checkbox" 
                  id="active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="active-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Activer cette règle immédiatement
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={saveRule}
                disabled={isSaving}
                className="px-4 py-2 bg-primary rounded-lg text-sm font-semibold text-white hover:bg-primary-hover flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

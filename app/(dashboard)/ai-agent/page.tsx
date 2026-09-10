"use client";

import { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  Save, 
  KeyRound, 
  Sparkles, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Send, 
  Eye, 
  EyeOff, 
  Crown, 
  Clock, 
  ShieldCheck, 
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUserPlan } from "@/lib/limits";
import toast from "react-hot-toast";
import Link from "next/link";

interface AiConfig {
  id?: string;
  is_active: boolean;
  api_key: string;
  system_prompt: string;
  model_name: string;
}

const PROMPT_PRESETS = [
  {
    name: "🛒 Closer Commercial",
    description: "Négocie poliment et pousse le prospect vers la commande ou le paiement.",
    prompt: `Tu es Sarah, conseillère commerciale experte et bienveillante pour notre entreprise sur WhatsApp.
Ton objectif est d'écouter le besoin du client, répondre avec précision à ses questions sur nos produits/services, mettre en valeur les avantages, dissiper ses doutes et l'orienter vers une commande ou un paiement direct.
Reste naturelle, chaleureuse, persuasive et concise (2 à 3 phrases maximum par message comme un vrai humain sur WhatsApp).`
  },
  {
    name: "🎧 Support & SAV",
    description: "Rassurant et orienté vers la résolution rapide des problèmes clients.",
    prompt: `Tu es l'assistant du support client officiel de notre entreprise sur WhatsApp.
Ton rôle est de répondre chaleureusement aux clients, de diagnostiquer leur problème avec courtoisie, de leur donner les étapes pour le résoudre ou de collecter leur numéro de commande pour la transmettre à notre équipe technique.
Sois toujours poli, empathique et rassurant.`
  },
  {
    name: "📅 Prise de Rendez-vous",
    description: "Qualifie le prospect et propose des créneaux pour un échange téléphonique.",
    prompt: `Tu es l'assistant de planification de rendez-vous pour notre agence sur WhatsApp.
Ton objectif est de poser 2 ou 3 questions simples au prospect pour comprendre son activité et son budget, puis lui proposer de convenir d'un rendez-vous téléphonique ou WhatsApp avec notre responsable. Demande-lui quel jour et quelle heure lui conviennent le mieux.`
  },
  {
    name: "🏪 Boutique E-commerce",
    description: "Présente les articles disponibles, les tarifs et les modalités de livraison.",
    prompt: `Tu es l'assistant de vente de notre boutique en ligne sur WhatsApp.
Présente nos articles phares, informe les clients sur nos tarifs en FCFA, les frais et délais de livraison rapide (Douala, Yaoundé et tout le Cameroun / Afrique), et guide-les pour valider leur commande via Mobile Money (Orange Money, MTN MoMo).`
  }
];

export default function AiAgentPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [config, setConfig] = useState<AiConfig>({
    is_active: false,
    api_key: "",
    system_prompt: PROMPT_PRESETS[0].prompt,
    model_name: "gpt-4o-mini"
  });

  // Simulateur de chat en direct
  const [simulatorMessages, setSimulatorMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant virtuel IA. Posez-moi une question pour tester comment je répondrai à vos prospects sur WhatsApp." }
  ]);
  const [testInput, setTestInput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    checkAccessAndFetchConfig();
  }, []);

  const checkAccessAndFetchConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
        const plan = await getUserPlan(user.id);
        
        const isSuperAdmin = user.email === 'freddynlend7@gmail.com' || user.email === 'clementnlend17@gmail.com';
        if (plan === "elite" || isSuperAdmin) {
          setHasAccess(true);
          await fetchConfig(user.id);
        } else {
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
    } catch (err) {
      console.error("[AiAgent] Erreur vérification accès:", err);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async (uid: string) => {
    try {
      const { data } = await supabase
        .from("ai_agent_config")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          is_active: data.is_active ?? false,
          api_key: data.api_key || "",
          system_prompt: data.system_prompt || PROMPT_PRESETS[0].prompt,
          model_name: data.model_name || "gpt-4o-mini"
        });
      }
    } catch (err) {
      console.error("[AiAgent] Erreur fetch config:", err);
    }
  };

  const saveConfig = async () => {
    if (!userId) return;
    setIsSaving(true);

    const payload = {
      user_id: userId,
      is_active: config.is_active,
      api_key: config.api_key.trim(),
      system_prompt: config.system_prompt.trim(),
      model_name: config.model_name
    };

    try {
      let error;
      if (config.id) {
        const { error: updateError } = await supabase
          .from("ai_agent_config")
          .update(payload)
          .eq("id", config.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("ai_agent_config")
          .insert([payload])
          .select()
          .single();
        error = insertError;
        if (data) setConfig({ ...config, id: data.id });
      }

      if (error) {
        toast.error("Erreur de sauvegarde : " + error.message);
      } else {
        toast.success("Configuration de l'Agent IA enregistrée !");
        await syncAiWithBackend();
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const syncAiWithBackend = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          is_active: config.is_active,
          api_key: config.api_key.trim(),
          system_prompt: config.system_prompt,
          model_name: config.model_name
        })
      });
      toast.success("Synchronisé avec le moteur WhatsApp !", { icon: "⚡" });
    } catch (e) {
      console.warn("Moteur WhatsApp local non joignable (sera synchronisé au démarrage):", e);
    }
  };

  const handleTestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = testInput.trim();
    if (!message || isSimulating) return;

    setSimulatorMessages(prev => [...prev, { role: 'user', content: message }]);
    setTestInput("");
    setIsSimulating(true);

    try {
      const res = await fetch('/api/ai/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.api_key,
          systemPrompt: config.system_prompt,
          model: config.model_name,
          message: message
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setSimulatorMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setSimulatorMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.error || "Erreur de connexion à l'IA. Vérifiez votre clé API." 
        }]);
      }
    } catch {
      setSimulatorMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Erreur réseau lors de la simulation." 
      }]);
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Écran de verrouillage si l'utilisateur n'a pas le Plan Elite
  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-800 mb-6">
          <Crown className="w-3.5 h-3.5 text-purple-600" />
          Exclusivité Forfait Elite VIP
        </div>
        <BrainCircuit className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
          L'Agent IA Conversationnel WhatsApp
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Transformez votre numéro WhatsApp en un commercial virtuel autonome disponible 24h/24 et 7j/7. 
          Il comprend le contexte de vos clients, répond avec votre argumentaire et simule la frappe humaine.
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-emerald-50 rounded-2xl p-8 border border-purple-200 max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Passez au Plan Elite</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Débloquez immédiatement l'Agent IA illimité, le Group Grabber avancé et les campagnes sans aucune restriction.
          </p>
          <Link
            href="/abonnement"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-md"
          >
            Activer l'Accès Elite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BrainCircuit className="w-7 h-7 text-emerald-600" />
              Agent IA Conversationnel
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 border border-purple-200">
              <Crown className="w-3 h-3 text-purple-600" />
              Elite VIP
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Votre commercial intelligent sur WhatsApp. Il analyse les demandes complexes, négocie et conclut les ventes en simulant une frappe humaine.
          </p>
        </div>

        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer & Activer"}
        </button>
      </div>

      {/* Bannière de Statut & Activation */}
      <div className={`p-5 rounded-2xl border transition-all ${
        config.is_active 
          ? 'bg-emerald-50/70 border-emerald-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              config.is_active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {config.is_active ? "L'Agent IA est ACTIF" : "L'Agent IA est EN PAUSE"}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  config.is_active 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    config.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  {config.is_active ? "En ligne sur WhatsApp" : "Inactif"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {config.is_active 
                  ? "L'IA répond automatiquement aux messages entrants qui ne correspondent à aucune règle de mot-clé."
                  : "Activez l'interrupteur ci-contre pour confier vos conversations à l'IA."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Grille principale : Paramètres (Gauche) & Simulateur (Droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Carte Clé API & Modèle */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Moteur & Clé d'API
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Modèle de Langage IA
              </label>
              <select
                value={config.model_name}
                onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Recommandé - Ultra rapide & économique)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Puissance de vente et argumentation maximale)</option>
                <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo (Standard)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">
                  Clé API OpenAI (sk-...)
                </label>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Obtenir une clé API →
                </a>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-proj-..."
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Votre clé est stockée de manière sécurisée et sert exclusivement à répondre à vos prospects sur WhatsApp.
              </p>
            </div>
          </div>

          {/* Carte Prompt Système & Modèles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-emerald-600" />
                Personnalité & Instructions de Vente (Prompt)
              </h3>
              <p className="text-xs text-gray-500">
                Définissez qui est votre agent, comment il doit s'exprimer, et quelles informations donner à vos clients.
              </p>
            </div>

            {/* Presets en 1 clic */}
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-2">
                Modèles prédéfinis prêts à l'emploi :
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, system_prompt: preset.prompt });
                      toast.success(`Modèle "${preset.name}" appliqué !`);
                    }}
                    className="p-2.5 text-left border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs"
                  >
                    <span className="font-bold text-gray-900 block">{preset.name}</span>
                    <span className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Instructions Détaillées pour l'IA
              </label>
              <textarea
                rows={8}
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                placeholder="Indiquez le nom de l'agent, le catalogue, les prix, les modes de paiement..."
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Astuce : Donnez des règles concrètes comme "Réponds en 2 phrases courtes" ou "Termine toujours par une question engageante".
              </p>
            </div>
          </div>

          {/* Protections Anti-Blocage intégrées */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protections Humaines & Anti-Blocage Intégrées
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-semibold text-gray-900 block">Délai de réflexion</span>
                <span>Pause aléatoire de 1 à 3s avant de commencer à taper.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-semibold text-gray-900 block">Frappe simulée</span>
                <span>Indicateur "écrit..." calculé sur la longueur du texte.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <BrainCircuit className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-semibold text-gray-900 block">Mémoire continue</span>
                <span>Retient jusqu'à 20 échanges pour un dialogue fluide.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Simulateur de conversation en direct (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col h-full flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  IA
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Simulateur WhatsApp</h4>
                  <p className="text-[11px] text-gray-400">Testez vos instructions en direct</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorMessages([
                  { role: 'assistant', content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" }
                ])}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
              >
                Réinitialiser
              </button>
            </div>

            {/* Zone d'affichage des messages WhatsApp */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-xl min-h-[360px] max-h-[480px] border border-gray-100">
              {simulatorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isSimulating && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-3 py-2 text-xs text-gray-400 shadow-sm border border-gray-200 rounded-bl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] ml-1">L'agent est en train d'écrire...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire d'envoi du message de test */}
            <form onSubmit={handleTestChat} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Posez une question (ex: Combien coûte votre service ?)"
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!testInput.trim() || isSimulating}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                title="Envoyer le message de test"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


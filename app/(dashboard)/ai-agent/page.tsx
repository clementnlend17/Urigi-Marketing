"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, Save, KeyRound, MessageSquareText, Power, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUserPlan, PlanTier } from "@/lib/limits";
import toast from "react-hot-toast";

interface AiConfig {
  id?: string;
  is_active: boolean;
  api_key: string;
  system_prompt: string;
  model_name: string;
}

export default function AiAgentPage() {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [config, setConfig] = useState<AiConfig>({
    is_active: false,
    api_key: "",
    system_prompt: "Tu es un assistant virtuel serviable pour mon entreprise. Ton objectif est de répondre poliment aux clients et de les guider vers un achat.",
    model_name: "gpt-4o-mini"
  });

  useEffect(() => {
    checkAccessAndFetchConfig();
  }, []);

  const checkAccessAndFetchConfig = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
      const plan = await getUserPlan(data.user.id);
      // L'Agent IA est disponible pour le plan Elite uniquement (ou Pro si on veut, disons Elite)
      if (plan === "elite" || data.user.email === 'freddynlend7@gmail.com') {
        setHasAccess(true);
        fetchConfig(data.user.id);
      } else {
        setHasAccess(false);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const fetchConfig = async (uid: string) => {
    const { data, error } = await supabase
      .from("ai_agent_config")
      .select("*")
      .eq("user_id", uid)
      .single();

    if (data) {
      setConfig({
        id: data.id,
        is_active: data.is_active,
        api_key: data.api_key || "",
        system_prompt: data.system_prompt,
        model_name: data.model_name
      });
    }
    setIsLoading(false);
  };

  const saveConfig = async () => {
    if (!userId) return;
    setIsSaving(true);

    const payload = {
      user_id: userId,
      is_active: config.is_active,
      api_key: config.api_key,
      system_prompt: config.system_prompt,
      model_name: config.model_name
    };

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
      toast.success("Configuration IA sauvegardée avec succès !");
      syncAiWithBackend();
    }
    setIsSaving(false);
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
          api_key: config.api_key,
          system_prompt: config.system_prompt,
          model_name: config.model_name
        })
      });
    } catch (e) {
      console.error("Erreur synchro IA", e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center mt-10">
      <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 mb-6">
        🚀 Bientôt Disponible
      </div>
      <BrainCircuit className="w-20 h-20 text-primary mx-auto mb-6" />
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
        L'Agent IA Conversationnel
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Transformez votre numéro WhatsApp en un commercial autonome fonctionnant 24h/24 et 7j/7. 
        L'Agent IA sera capable de comprendre le contexte, négocier et convertir vos prospects avec une fluidité humaine impressionnante.
      </p>
      
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 max-w-lg mx-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Exclusivité Plan Elite</h3>
        <p className="text-gray-600 mb-6">
          Cette fonctionnalité révolutionnaire sera réservée exclusivement à nos abonnés Elite en raison de sa puissance de conversion.
        </p>
        <button disabled className="w-full rounded-xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed">
          Déploiement en cours...
        </button>
      </div>
    </div>
  );
}

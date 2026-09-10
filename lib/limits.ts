import { supabase } from './supabase';

export type PlanTier = 'free' | 'pro' | 'elite';

export interface UsageTracking {
  daily_manual_messages: number;
  last_manual_message_date: string;
  extractions_count: number;
}

// Limites définies selon l'abonnement
export const PLAN_LIMITS = {
  free: {
    maxManualMessagesPerDay: 15,
    maxCampaignContacts: 0, // Bloqué
    maxExtractions: 1,
    canUseChatbot: false
  },
  pro: {
    maxManualMessagesPerDay: Infinity,
    maxCampaignContacts: 500,
    maxExtractions: Infinity,
    canUseChatbot: true
  },
  elite: {
    maxManualMessagesPerDay: Infinity,
    maxCampaignContacts: Infinity,
    maxExtractions: Infinity,
    canUseChatbot: true
  }
};

/**
 * Récupère le plan de l'utilisateur courant
 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email?.toLowerCase();
    
    // Les super-administrateurs ont un accès Elite illimité
    if (userEmail === 'freddynlend7@gmail.com' || userEmail === 'clementnlend17@gmail.com') {
      return 'elite';
    }

    // 1. Vérifier dans la table subscriptions
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_tier, status')
      .eq('user_id', userId)
      .single();

    if (subData && subData.status === 'active' && subData.plan_tier) {
      return subData.plan_tier as PlanTier;
    }

    // 2. Vérification de secours dans payment_intents (transactions SasPay validées)
    const { data: piData } = await supabase
      .from('payment_intents')
      .select('plan_tier')
      .eq('user_id', userId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (piData && piData.plan_tier) {
      return piData.plan_tier as PlanTier;
    }

    return 'free';
  } catch (e) {
    console.error("Erreur getUserPlan:", e);
    return 'free';
  }
}

/**
 * Récupère ou crée le suivi d'usage de l'utilisateur
 */
export async function getOrCreateUsage(userId: string): Promise<UsageTracking> {
  const today = new Date().toISOString().split('T')[0];

  // Essayer de récupérer
  let { data: usage, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Si ça n'existe pas, on le crée
  if (error && error.code === 'PGRST116') { // Pas trouvé
    const { data: newUsage, error: insertError } = await supabase
      .from('usage_tracking')
      .insert([{ user_id: userId }])
      .select()
      .single();
      
    if (insertError) throw insertError;
    usage = newUsage;
  } else if (error) {
    throw error;
  }

  if (!usage) {
    throw new Error("Usage could not be retrieved or created");
  }

  // Vérifier s'il faut réinitialiser le compteur journalier
  if (usage.last_manual_message_date !== today) {
    const { data: updatedUsage } = await supabase
      .from('usage_tracking')
      .update({ 
        daily_manual_messages: 0, 
        last_manual_message_date: today 
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updatedUsage) usage = updatedUsage;
  }

  return usage as UsageTracking;
}

/**
 * Vérifie et incrémente l'envoi d'un message manuel
 * Retourne true si autorisé, false si limite atteinte
 */
export async function consumeManualMessage(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].maxManualMessagesPerDay;
  
  if (limit === Infinity) return true;

  const usage = await getOrCreateUsage(userId);
  
  if (usage.daily_manual_messages >= limit) {
    return false; // Limite atteinte
  }

  // Incrémenter
  const { error: updateError } = await supabase
    .from('usage_tracking')
    .update({ daily_manual_messages: usage.daily_manual_messages + 1 })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return true;
}

/**
 * Vérifie et incrémente l'extraction de groupe
 * Retourne true si autorisé, false si limite atteinte
 */
export async function consumeExtraction(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].maxExtractions;
  
  if (limit === Infinity) return true;

  const usage = await getOrCreateUsage(userId);
  
  if (usage.extractions_count >= limit) {
    return false; // Limite atteinte
  }

  // Incrémenter
  const { error: updateError } = await supabase
    .from('usage_tracking')
    .update({ extractions_count: usage.extractions_count + 1 })
    .eq('user_id', userId);

  if (updateError) {
    throw updateError;
  }

  return true;
}

/**
 * Vérifie si on peut lancer une campagne avec ce nombre de contacts
 */
export async function canLaunchCampaign(userId: string, contactsCount: number): Promise<{ allowed: boolean, maxAllowed: number }> {
  const plan = await getUserPlan(userId);
  const maxAllowed = PLAN_LIMITS[plan].maxCampaignContacts;
  
  if (maxAllowed === 0) return { allowed: false, maxAllowed: 0 };
  
  return { 
    allowed: contactsCount <= maxAllowed, 
    maxAllowed 
  };
}

/**
 * Vérifie l'accès au Chatbot
 */
export async function canAccessChatbot(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan].canUseChatbot;
}

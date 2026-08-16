import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Utilisation de la clé admin si dispo, sinon la clé anonyme
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("Payload non-JSON reçu:", rawBody);
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    // 1. Log le webhook dans la base de données (si la table existe)
    await supabase.from('webhook_logs').insert({
      source: 'chariow',
      payload: payload,
      status: 'received'
    });

    // 2. Extraire le User ID du payload
    const payloadStr = JSON.stringify(payload);
    let userId = null;
    
    if (payload.client_reference_id) userId = payload.client_reference_id;
    else if (payload.custom_id) userId = payload.custom_id;
    else if (payload.custom?.user_id) userId = payload.custom.user_id;
    else if (payload.data?.client_reference_id) userId = payload.data.client_reference_id;
    else if (payload.data?.custom_id) userId = payload.data.custom_id;
    else if (payload.meta?.custom_data?.client_reference_id) userId = payload.meta.custom_data.client_reference_id;
    
    if (!userId) {
      // Regex pour trouver l'UUID que nous avons passé
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = payloadStr.match(uuidRegex);
      if (match) {
        userId = match[0];
      }
    }

    if (!userId) {
      await supabase.from('webhook_logs').insert({
        source: 'chariow',
        payload: payload,
        status: 'error',
        error_message: 'User ID non trouvé dans le payload'
      });
      return NextResponse.json({ error: 'User ID manquant' }, { status: 400 });
    }

    // 3. Déterminer le plan (Pro ou Elite)
    let planTier = 'pro'; // Défaut
    if (payloadStr.includes('prd_jmc3wfol') || payloadStr.toLowerCase().includes('elite')) {
      planTier = 'elite';
    } else if (payloadStr.includes('prd_aq47y1ec') || payloadStr.toLowerCase().includes('pro')) {
      planTier = 'pro';
    }

    // 4. Mettre à jour l'abonnement
    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_tier: planTier,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error("Erreur mise à jour:", updateError);
      await supabase.from('webhook_logs').insert({
        source: 'chariow',
        payload: payload,
        status: 'error',
        error_message: updateError.message
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. Marquer le log comme traité avec succès
    await supabase.from('webhook_logs').insert({
      source: 'chariow',
      payload: payload,
      status: 'success',
      error_message: `Abonnement ${planTier} activé pour l'utilisateur ${userId}`
    });

    return NextResponse.json({ success: true, userId, planTier });

  } catch (error: any) {
    console.error("Erreur Webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

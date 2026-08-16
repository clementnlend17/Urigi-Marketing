import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CHARIOW_SECRET_KEY = process.env.CHARIOW_SECRET_KEY || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { license_key, userId } = await req.json();

    if (!license_key || !userId) {
      return NextResponse.json({ error: "Clé de licence ou ID utilisateur manquant." }, { status: 400 });
    }

    if (!CHARIOW_SECRET_KEY) {
      console.error("CHARIOW_SECRET_KEY non configurée.");
      return NextResponse.json({ error: "Configuration serveur incomplète. Contactez le support." }, { status: 500 });
    }

    // Appel à l'API Chariow pour valider la clé
    const chariowRes = await fetch("https://api.chariow.com/v1/licenses/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHARIOW_SECRET_KEY}`
      },
      body: JSON.stringify({ license_key })
    });

    const data = await chariowRes.json();
    console.log("Réponse validation Chariow:", JSON.stringify(data));

    // Vérification de la validité
    // On s'adapte aux formats communs (data.valid, valid, data.meta.valid...)
    const isValid = data.valid || data.data?.valid || data.meta?.valid || (chariowRes.ok && data.license_key);

    if (!isValid) {
      console.error("Clé invalide, voici ce que Chariow a répondu:", JSON.stringify(data));
      return NextResponse.json({ 
        error: "Clé de licence invalide.",
        debugInfo: data 
      }, { status: 400 });
    }

    // Tenter de déduire le plan
    let planTier = 'pro'; // Défaut
    const payloadStr = JSON.stringify(data);
    if (payloadStr.includes('prd_jmc3wfol') || payloadStr.toLowerCase().includes('elite')) {
      planTier = 'elite';
    } else if (payloadStr.includes('prd_aq47y1ec') || payloadStr.toLowerCase().includes('pro')) {
      planTier = 'pro';
    }

    // Mettre à jour l'abonnement
    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_tier: planTier,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error("Erreur mise à jour:", updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour du compte." }, { status: 500 });
    }

    return NextResponse.json({ success: true, planTier });

  } catch (error: any) {
    console.error("Erreur API activation:", error);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}

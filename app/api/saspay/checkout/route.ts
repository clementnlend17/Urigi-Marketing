import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PLAN_PRICING: Record<string, { standardAmount: string; discountAmount: string; name: string }> = {
  pro: {
    standardAmount: "4999.00",
    discountAmount: "2499.00",
    name: "Plan Pro"
  },
  elite: {
    standardAmount: "14999.00",
    discountAmount: "7499.00",
    name: "Plan Elite"
  }
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    const { planId, promoCode } = await req.json();

    if (!planId || !PLAN_PRICING[planId]) {
      return NextResponse.json({ error: "Plan d'abonnement invalide." }, { status: 400 });
    }

    const plan = PLAN_PRICING[planId];
    const secretKey = process.env.SASPAY_SECRET_KEY;

    if (!secretKey) {
      console.error("SASPAY_SECRET_KEY non configurée.");
      return NextResponse.json({ error: "Configuration serveur incomplète (SasPay)." }, { status: 500 });
    }

    // Vérification sécurisée du code de réduction spécial (FREDDY17)
    const secretPromoCode = process.env.SPECIAL_PROMO_CODE || "FREDDY17";
    const isPromoCodeValid = typeof promoCode === 'string' && promoCode.trim().toUpperCase() === secretPromoCode.toUpperCase();

    // Calcul de l'offre de bienvenue (-50% si inscrit depuis moins de 10 jours)
    const userCreatedAt = new Date(user.created_at).getTime();
    const isWelcomeOfferActive = (Date.now() - userCreatedAt) < (10 * 24 * 60 * 60 * 1000);

    let finalAmount: string;
    let finalDescription: string;
    let discountApplied: string;

    if (isPromoCodeValid) {
      finalAmount = "100.00";
      finalDescription = `Abonnement ${plan.name} (Tarif Spécial - 100 FCFA) - Urigi Marketing`;
      discountApplied = "promo_100fcfa";
    } else if (isWelcomeOfferActive) {
      finalAmount = plan.discountAmount;
      finalDescription = `Abonnement ${plan.name} (Offre Bienvenue -50%) - Urigi Marketing`;
      discountApplied = "50%";
    } else {
      finalAmount = plan.standardAmount;
      finalDescription = `Abonnement ${plan.name} (1 mois) - Urigi Marketing`;
      discountApplied = "none";
    }

    const host = req.headers.get('host') || 'urigi-marketing.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;
    const returnUrl = `${origin}/abonnement?payment=success`;

    const customerName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Client";

    const payload = {
      amount: finalAmount,
      currency: "XAF",
      description: finalDescription,
      customer_email: user.email,
      customer_name: customerName,
      return_url: returnUrl,
      metadata: {
        user_id: user.id,
        plan_tier: planId,
        user_email: user.email,
        discount_applied: discountApplied,
        promo_code: isPromoCodeValid ? "FREDDY17" : undefined
      }
    };

    console.log("[SasPay] Création de session checkout:", { 
      user: user.id, 
      plan: planId, 
      amount: finalAmount, 
      promoCode: isPromoCodeValid ? "FREDDY17" : null,
      discount: discountApplied 
    });

    const saspayResponse = await fetch("https://api.saspay.me/api/v1/checkout-sessions/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const saspayData = await saspayResponse.json();
    const sessionResult = saspayData.data || saspayData;
    const checkoutUrl = sessionResult.checkout_url;
    const sessionId = sessionResult.id || sessionResult.slug;

    if (!saspayResponse.ok || !checkoutUrl) {
      console.error("[SasPay] Erreur lors de la création de la session:", saspayData);
      return NextResponse.json({
        error: saspayData.message || saspayData.detail || "Impossible d'initialiser le paiement avec SasPay.",
        details: saspayData
      }, { status: saspayResponse.status || 500 });
    }

    // Enregistrer l'intention de paiement dans Supabase
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
      const adminSupabase = createClient(supabaseUrl, serviceKey);
      await adminSupabase.from('payment_intents').insert({
        user_id: user.id,
        payment_ref: sessionId,
        plan_tier: planId,
        amount: Math.round(parseFloat(finalAmount)),
        status: 'pending'
      });
    } catch (dbErr) {
      console.warn("[SasPay] Avertissement log payment_intents:", dbErr);
    }

    return NextResponse.json({
      checkoutUrl: checkoutUrl,
      sessionId: sessionId
    });

  } catch (err: any) {
    console.error("[SasPay] Exception serveur checkout:", err);
    return NextResponse.json({ error: "Erreur interne lors de la création du paiement." }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MONETBIL_SERVICE_KEY = process.env.MONETBIL_SERVICE_KEY || '1rvrpFVaD5LBUQK07pg7V5tloSO3xdYk';

const PLAN_PRICES = {
  pro: 10000,
  elite: 25000
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { planTier } = await req.json();
    if (!planTier || !PLAN_PRICES[planTier as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const amount = PLAN_PRICES[planTier as keyof typeof PLAN_PRICES];
    const paymentRef = `sub_${user.id}_${Date.now()}`;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await adminSupabase
      .from('payment_intents')
      .insert({
        user_id: user.id,
        payment_ref: paymentRef,
        plan_tier: planTier,
        amount: amount,
        status: 'pending'
      });

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json({ error: 'Erreur BD' }, { status: 500 });
    }

    const notifyUrl = `https://${req.headers.get('host')}/api/webhooks/monetbil`;
    const returnUrl = `https://${req.headers.get('host')}/abonnement?success=true`;

    const monetbilPayload = {
      amount: amount.toString(),
      payment_ref: paymentRef,
      notify_url: notifyUrl,
      return_url: returnUrl,
      currency: "XAF",
      item_ref: planTier,
      description: `Abonnement ${planTier.toUpperCase()} - Urigi Marketing Pro`
    };

    const monetbilResponse = await fetch(`https://api.monetbil.com/widget/v2.1/${MONETBIL_SERVICE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(monetbilPayload).toString()
    });

    const monetbilData = await monetbilResponse.json();

    if (monetbilData.success && monetbilData.payment_url) {
      return NextResponse.json({ paymentUrl: monetbilData.payment_url });
    } else {
      console.error('Erreur Monetbil API:', monetbilData);
      return NextResponse.json({ error: 'Erreur Monetbil' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Exception in monetbil init:", error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

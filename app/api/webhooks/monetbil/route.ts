import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Monetbil envoie les données via x-www-form-urlencoded ou JSON, mais généralement JSON
export async function POST(req: Request) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData);
    } else {
      body = await req.json();
    }

    const { payment_ref, status, transaction_id } = body;

    console.log("Monetbil Webhook reçu:", body);

    if (!payment_ref || !status) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Trouver l'intention de paiement
    const { data: intent, error: intentError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('payment_ref', payment_ref)
      .single();

    if (intentError || !intent) {
      console.error("Payment intent non trouvé:", payment_ref);
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    // 2. Mettre à jour le statut de l'intention
    await supabase
      .from('payment_intents')
      .update({ status: status === 'success' ? 'success' : 'failed' })
      .eq('payment_ref', payment_ref);

    // 3. Si succès, on met à jour l'abonnement du user
    if (status === 'success') {
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: intent.user_id,
          plan_tier: intent.plan_tier,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });
        
      if (subError) {
        console.error("Erreur mise à jour abonnement:", subError);
      } else {
        console.log(`Utilisateur ${intent.user_id} upgradé vers ${intent.plan_tier}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur Webhook Monetbil:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

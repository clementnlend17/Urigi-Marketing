import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const saspaySecretKey = process.env.SASPAY_SECRET_KEY;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData } = await adminSupabase.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    if (!saspaySecretKey) {
      return NextResponse.json({ error: 'Clé SasPay non configurée' }, { status: 500 });
    }

    // Récupérer les transactions depuis SasPay
    const sasRes = await fetch('https://api.saspay.me/api/v1/transactions/', {
      headers: { 'Authorization': `Bearer ${saspaySecretKey}` }
    });

    if (!sasRes.ok) {
      return NextResponse.json({ error: 'Échec de communication avec SasPay' }, { status: 502 });
    }

    const sasData = await sasRes.json();
    const transactions = sasData.data?.results || [];
    const successful = transactions.filter((t: any) => t.status === 'SUCCESS');

    let updatedCount = 0;
    let currentUserPlan: string | null = null;

    for (const t of successful) {
      const targetUserId = t.metadata?.user_id;
      const email = t.metadata?.user_email || t.customer_email;
      const planTier = t.metadata?.plan_tier || 'elite';
      const amount = Number(t.requested_amount || t.amounts?.requested || 200);

      const isTarget = targetUserId === user.id || (email && email.toLowerCase() === user.email?.toLowerCase());

      if (targetUserId || isTarget) {
        const uid = targetUserId || user.id;

        // Activer via RPC Supabase
        await adminSupabase.rpc('activate_user_subscription', {
          p_user_id: uid,
          p_plan_tier: planTier,
          p_duration_days: 30
        });

        // Mettre à jour l'intention de paiement
        await adminSupabase.from('payment_intents').upsert({
          user_id: uid,
          payment_ref: t.reference || t.id,
          plan_tier: planTier,
          amount: amount,
          status: 'success'
        }, { onConflict: 'payment_ref' });

        updatedCount++;

        if (uid === user.id) {
          currentUserPlan = planTier;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: currentUserPlan 
        ? `Votre abonnement ${currentUserPlan.toUpperCase()} a été synchronisé et activé !` 
        : 'Synchronisation SasPay effectuée avec succès.',
      plan: currentUserPlan,
      syncedTransactions: updatedCount
    });

  } catch (error: any) {
    console.error('[SasPay Sync] Erreur:', error);
    return NextResponse.json({ error: 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}

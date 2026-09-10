import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAILS = [
  'freddynlend7@gmail.com',
  'clementnlend17@gmail.com'
];

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérification de l'administrateur
    let userEmail: string | null = null;
    if (token) {
      const { data: userData } = await adminSupabase.auth.getUser(token);
      userEmail = userData?.user?.email || null;
    }

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      return NextResponse.json({ error: "Accès refusé. Privilèges administrateur requis." }, { status: 403 });
    }

    const { userId, planTier, durationDays = 30 } = await req.json();

    if (!userId || !planTier) {
      return NextResponse.json({ error: "Paramètres manquants (userId, planTier)." }, { status: 400 });
    }

    if (planTier === 'free') {
      // Rétrograder en Free
      const { error } = await adminSupabase
        .from('subscriptions')
        .update({ plan_tier: 'free', status: 'inactive' })
        .eq('user_id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Utilisateur remis au forfait gratuit." });
    }

    // Activer via RPC ou upsert
    const { error: rpcError } = await adminSupabase.rpc('activate_user_subscription', {
      p_user_id: userId,
      p_plan_tier: planTier,
      p_duration_days: durationDays
    });

    if (rpcError) {
      // Fallback upsert
      const { error: upsertError } = await adminSupabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_tier: planTier,
          status: 'active',
          current_period_end: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ success: true, message: `Utilisateur passé en ${planTier.toUpperCase()} avec succès !` });

  } catch (error: any) {
    console.error("[Admin Manage Plan] Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la modification de l'abonnement." }, { status: 500 });
  }
}

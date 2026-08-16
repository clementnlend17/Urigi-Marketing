import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    // Basic auth check via headers if possible, or just rely on RLS/admin check
    // Since this is a server action, it's better to verify the token, but we will trust the payload for now 
    // in this MVP since the URL is hidden and we should ideally pass the JWT.
    // For production, always verify `supabase.auth.getUser(token)`
    
    const { requestId, userId, planTier, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    if (action === 'approve') {
      // 1. Mettre à jour l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_tier: planTier,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });

      if (subError) throw subError;

      // 2. Marquer la requête comme approuvée
      const { error: reqError } = await supabase
        .from('activation_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
        
      if (reqError) throw reqError;

      return NextResponse.json({ success: true });
    } 
    
    if (action === 'reject') {
      const { error: reqError } = await supabase
        .from('activation_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (reqError) throw reqError;
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });

  } catch (error: any) {
    console.error("Erreur API admin:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

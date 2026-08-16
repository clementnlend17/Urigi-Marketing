import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { license_key, userId, userEmail } = await req.json();

    if (!license_key || !userId) {
      return NextResponse.json({ error: "Clé de licence ou ID utilisateur manquant." }, { status: 400 });
    }

    // 1. Vérifier si la clé a déjà été soumise et est en attente
    const { data: existing } = await supabase
      .from('activation_requests')
      .select('id, status')
      .eq('license_key', license_key)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: "Vous avez déjà soumis cette clé. Elle est en attente de validation." }, { status: 400 });
      }
      if (existing.status === 'approved') {
        return NextResponse.json({ error: "Cette clé a déjà été validée." }, { status: 400 });
      }
    }

    // 2. Insérer la demande
    const { error: insertError } = await supabase
      .from('activation_requests')
      .insert({
        user_id: userId,
        user_email: userEmail || "Inconnu",
        license_key: license_key,
        status: 'pending'
      });

    if (insertError) {
      console.error("Erreur insertion demande:", insertError);
      return NextResponse.json({ error: "Erreur lors de l'envoi de la demande." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Demande envoyée avec succès." });

  } catch (error: any) {
    console.error("Erreur API submit:", error);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}

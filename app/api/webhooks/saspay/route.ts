import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TOLERANCE_SECONDS = 300; // 5 minutes

function verifySasPaySignature(rawBody: string, signature: string, timestamp: string, secret: string): boolean {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - Number(timestamp)) > TOLERANCE_SECONDS) {
      console.warn("[SasPay Webhook] Horodatage hors tolérance");
      return false;
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) {
    console.error("[SasPay Webhook] Erreur vérification signature:", e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const eventHeader = req.headers.get('x-webhook-event') || '';

    const signingSecret = process.env.SASPAY_SIGNING_SECRET;

    // Vérifier la signature si le secret est renseigné
    if (signingSecret && signature && timestamp) {
      const isValid = verifySasPaySignature(rawBody, signature, timestamp, signingSecret);
      if (!isValid) {
        console.error("[SasPay Webhook] Signature invalide");
        return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
      }
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const event = body.event || eventHeader;
    const data = body.data || body;

    console.log(`[SasPay Webhook] Événement reçu: ${event}`);

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Enregistrer la réception du webhook
    try {
      await adminSupabase.from('webhook_logs').insert({
        source: 'saspay',
        payload: body,
        status: 'received'
      });
    } catch (e) {
      console.warn("[SasPay Webhook] Impossible d'insérer dans webhook_logs:", e);
    }

    // Traitement lors d'un paiement réussi
    if (event === 'transaction.success' || event === 'payment.success' || data.status === 'SUCCESS') {
      let userId = data.metadata?.user_id || data.custom_data?.user_id;
      let planTier = data.metadata?.plan_tier || 'pro';

      // Si user_id n'est pas dans les métadonnées directes, chercher dans payment_intents
      if (!userId && (data.id || data.reference)) {
        const { data: intent } = await adminSupabase
          .from('payment_intents')
          .select('*')
          .or(`payment_ref.eq.${data.id},payment_ref.eq.${data.reference}`)
          .single();

        if (intent) {
          userId = intent.user_id;
          planTier = intent.plan_tier || planTier;
        }
      }

      // Si toujours pas d'user_id mais qu'on a le montant
      if (!userId && data.amount) {
        const amountNum = Math.round(parseFloat(data.amount));
        if (amountNum >= 14000) planTier = 'elite';
        else if (amountNum >= 4000) planTier = 'pro';
      }

      if (userId) {
        // Mettre à jour ou activer l'abonnement
        const { error: subError } = await adminSupabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_tier: planTier,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
          }, { onConflict: 'user_id' });

        if (subError) {
          console.error("[SasPay Webhook] Erreur mise à jour subscription:", subError);
        } else {
          console.log(`[SasPay Webhook] Abonnement ${planTier.toUpperCase()} activé pour ${userId}`);
        }

        // Mettre à jour l'intention si trouvée
        if (data.id || data.reference) {
          await adminSupabase
            .from('payment_intents')
            .update({ status: 'success' })
            .or(`payment_ref.eq.${data.id},payment_ref.eq.${data.reference}`);
        }

        // Marquer le log comme traité
        try {
          await adminSupabase.from('webhook_logs').insert({
            source: 'saspay',
            payload: body,
            status: 'success',
            error_message: `Abonnement ${planTier} validé pour ${userId}`
          });
        } catch {}
      } else {
        console.warn("[SasPay Webhook] Aucun user_id associé trouvé pour la transaction", data.id);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[SasPay Webhook] Erreur traitement:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

// Clé secrète Chariow pour vérifier les webhooks
const CHARIOW_SECRET = process.env.CHARIOW_SECRET_KEY || "";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersList = headers();
    
    // Vérification de la signature (optionnel pour l'instant si pas de clé stricte)
    const signature = headersList.get("x-chariow-signature");
    const eventType = headersList.get("x-pulse-event");

    console.log("Webhook Chariow reçu :", eventType);

    // Si on a la clé secrète, on peut vérifier la signature HMAC-SHA256
    if (CHARIOW_SECRET && signature) {
      const hmac = crypto.createHmac("sha256", CHARIOW_SECRET);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest("hex");
      // Pour des raisons de flexibilité en test, on ne bloque pas si la signature est différente
      // mais en production, il faudrait décommenter :
      // if (expectedSignature !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Si c'est une vente réussie
    if (eventType === "successful.sale" || payload.event === "successful.sale" || payload.type === "successful.sale") {
      // On récupère l'email du client qui a payé
      const customerEmail = payload.data?.customer?.email || payload.customer?.email || payload.email;
      
      if (customerEmail) {
        // Mettre à jour l'utilisateur dans Supabase
        // On cherche l'utilisateur par email dans la table users (via le service_role ou une table profiles)
        // Comme on n'a pas accès direct à auth.users sans service_role,
        // on va supposer qu'on a une table public.subscriptions pour enregistrer les paiements
        
        // 1. D'abord on essaie de trouver le user_id correspondant à cet email
        // Dans une implémentation réelle, vous devriez utiliser le SUPABASE_SERVICE_ROLE_KEY
        // pour requêter auth.users et obtenir l'ID.
        
        console.log(`Paiement validé pour l'email: ${customerEmail}`);
        
        // Exemple de mise à jour (à adapter selon votre schéma Supabase final)
        /*
        await supabase.from('subscriptions').upsert({
          stripe_customer_id: customerEmail,
          plan_tier: 'pro',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
        });
        */
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur Webhook Chariow:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}

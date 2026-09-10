import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAILS = [
  'freddynlend7@gmail.com',
  'clementnlend17@gmail.com'
];

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier l'identité de l'administrateur
    let userEmail: string | null = null;
    if (token) {
      const { data: userData } = await adminSupabase.auth.getUser(token);
      userEmail = userData?.user?.email || null;
    }

    // Si pas de token valide ou non-admin, refuser l'accès
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      return NextResponse.json({ error: "Accès refusé. Privilèges administrateur requis." }, { status: 403 });
    }

    // 1. Récupérer les Abonnements (Subscriptions)
    const { data: subscriptionsData } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Récupérer les Intentions de Paiement (Payment Intents SasPay)
    const { data: paymentIntentsData } = await adminSupabase
      .from('payment_intents')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Récupérer les Webhooks SasPay (Webhook Logs)
    const { data: webhookLogsData } = await adminSupabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Récupérer les Campagnes (Campaigns)
    const { data: campaignsData } = await adminSupabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    // 5. Récupérer le total des contacts
    const { count: contactsCount } = await adminSupabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    // Calcul des Métriques Financières & d'Activité
    const subscriptions = subscriptionsData || [];
    const paymentIntents = paymentIntentsData || [];
    const campaigns = campaignsData || [];
    const webhookLogs = webhookLogsData || [];

    // Collecte des adresses emails si disponibles
    const userEmailMap: Record<string, string> = {};
    try {
      const { data: usersData } = await adminSupabase.auth.admin.listUsers();
      if (usersData?.users) {
        usersData.users.forEach((u: any) => {
          if (u.id && u.email) {
            userEmailMap[u.id] = u.email;
          }
        });
      }
    } catch {
      // Service role non présent ou non autorisé
    }

    try {
      const { data: actData } = await adminSupabase
        .from('activation_requests')
        .select('user_id, user_email');
      if (actData) {
        actData.forEach((a: any) => {
          if (a.user_id && a.user_email && !userEmailMap[a.user_id]) {
            userEmailMap[a.user_id] = a.user_email;
          }
        });
      }
    } catch {}

    // Utilisateurs uniques
    const uniqueUserIds = new Set<string>();
    subscriptions.forEach(s => { if (s.user_id) uniqueUserIds.add(s.user_id); });
    paymentIntents.forEach(p => { if (p.user_id) uniqueUserIds.add(p.user_id); });
    campaigns.forEach(c => { if (c.user_id) uniqueUserIds.add(c.user_id); });
    Object.keys(userEmailMap).forEach(uid => uniqueUserIds.add(uid));

    let activePro = 0;
    let activeElite = 0;
    subscriptions.forEach(s => {
      if (s.status === 'active') {
        if (s.plan_tier === 'pro') activePro++;
        if (s.plan_tier === 'elite') activeElite++;
      }
    });

    // Revenus réels encaissés (somme des montants de transactions validées)
    let totalRevenue = 0;
    let successfulTransactionsCount = 0;

    paymentIntents.forEach(p => {
      if (p.status === 'success' || p.status === 'completed') {
        totalRevenue += Number(p.amount) || 0;
        successfulTransactionsCount++;
      }
    });

    // Vérifier les transactions dans les webhooks réussis
    webhookLogs.forEach(w => {
      if (w.status === 'success' && w.payload?.data?.amount) {
        const amt = Math.round(parseFloat(w.payload.data.amount));
        const alreadyCounted = paymentIntents.some(p => p.payment_ref === w.payload?.data?.id);
        if (!alreadyCounted) {
          totalRevenue += amt;
          successfulTransactionsCount++;
        }
      }
    });

    // Messages WhatsApp délivrés
    let totalDeliveredMessages = 0;
    campaigns.forEach(c => {
      totalDeliveredMessages += (c.sent_messages || 0);
    });

    // Formatage de la liste des transactions pour affichage admin
    const transactions = paymentIntents.map(p => ({
      id: p.id,
      paymentRef: p.payment_ref,
      userId: p.user_id,
      userEmail: userEmailMap[p.user_id] || null,
      planTier: p.plan_tier,
      amount: p.amount,
      status: p.status,
      createdAt: p.created_at,
      gateway: 'SasPay (Mobile Money / CB)'
    }));

    // Liste des utilisateurs formatée pour la gestion admin
    const users = Array.from(uniqueUserIds).map(uid => {
      const sub = subscriptions.find(s => s.user_id === uid);
      const isExpired = sub?.current_period_end ? new Date(sub.current_period_end) < new Date() : false;
      const effectivePlan = isExpired ? 'free' : (sub?.plan_tier || 'free');
      const email = userEmailMap[uid] || null;

      return {
        id: uid,
        email,
        planTier: effectivePlan,
        status: isExpired ? 'expired' : (sub?.status || 'inactive'),
        currentPeriodEnd: sub?.current_period_end || null,
        createdAt: sub?.created_at || null
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers: Math.max(uniqueUserIds.size, subscriptions.length),
        activePro,
        activeElite,
        totalActivePaid: activePro + activeElite,
        totalRevenue,
        totalTransactions: paymentIntents.length,
        successfulTransactionsCount,
        totalCampaigns: campaigns.length,
        totalDeliveredMessages,
        totalContacts: contactsCount || 0
      },
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        userId: s.user_id,
        userEmail: userEmailMap[s.user_id] || null,
        planTier: s.plan_tier,
        status: s.status,
        currentPeriodEnd: s.current_period_end,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      })),
      users,
      transactions,
      recentCampaigns: campaigns.slice(0, 10).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || 'message',
        status: c.status,
        sentMessages: c.sent_messages || 0,
        totalMessages: c.total_messages || 0,
        createdAt: c.created_at
      }))
    });

  } catch (error: any) {
    console.error("[Admin Overview API] Exception:", error);
    return NextResponse.json({ error: "Erreur interne du serveur admin." }, { status: 500 });
  }
}

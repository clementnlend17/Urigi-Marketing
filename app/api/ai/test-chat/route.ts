import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { apiKey, systemPrompt, message, model = 'gpt-4o-mini' } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    if (!apiKey || !apiKey.trim()) {
      // Réponse de démonstration si pas de clé
      return NextResponse.json({
        reply: `[Simulation Démo - Clé API non fournie] : Bonjour ! J'ai bien reçu votre message : "${message}". Vos prospects recevront une réponse commerciale personnalisée basée sur vos instructions dès que vous aurez connecté votre clé OpenAI.`
      });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt || 'Tu es un assistant commercial poli et persuasif pour mon entreprise WhatsApp.' },
          { role: 'user', content: message.trim() }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Erreur OpenAI' }, { status: res.status });
    }

    const reply = data.choices?.[0]?.message?.content || 'Aucune réponse générée.';
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('[AI Test Chat] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement par le modèle IA' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const secretCode = process.env.SPECIAL_PROMO_CODE || "FREDDY17";

    if (typeof code === 'string' && code.trim().toUpperCase() === secretCode.toUpperCase()) {
      return NextResponse.json({ 
        valid: true, 
        code: code.trim().toUpperCase() 
      });
    }

    return NextResponse.json({ 
      valid: false, 
      error: "Code de réduction invalide ou expiré." 
    }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ 
      valid: false, 
      error: "Erreur lors de la vérification du code." 
    }, { status: 500 });
  }
}

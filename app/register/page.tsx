"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MessageCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white flex-row-reverse">
      {/* Right Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-gray-900 via-primary/20 to-gray-900 opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.4\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between h-full">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-end gap-2">
              <span className="text-white font-bold text-xl tracking-tight">Urigi Marketing Pro</span>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="max-w-md ml-auto text-right">
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
              Démarrez votre essai <span className="text-primary">gratuit.</span>
            </h1>
            <div className="space-y-4 flex flex-col items-end">
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <p className="text-gray-300 font-medium">Connectez votre WhatsApp instantanément</p>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                <p className="text-gray-300 font-medium">Importez et gérez vos contacts</p>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                <p className="text-gray-300 font-medium">Programmez vos campagnes de masse</p>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="text-right animate-in fade-in duration-1000 delay-1000">
            <p className="text-gray-400 text-sm">© 2026 Urigi Marketing Pro. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">Urigi Marketing Pro</span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Créer un compte ✨</h2>
          <p className="text-gray-500 mb-8">Rejoignez-nous et lancez votre première campagne marketing dès aujourd'hui.</p>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                <span>{success}</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="vous@exemple.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  placeholder="•••••••• (6 caractères min)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Création en cours...
                </span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Connectez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

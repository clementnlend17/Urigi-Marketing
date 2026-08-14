"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MessageCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary/20 to-gray-900 opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.4\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <div className="relative z-10 w-full p-12 flex flex-col justify-between h-full">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">Urigi Marketing Pro</span>
            </div>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-150">
              Transformez votre audience WhatsApp en <span className="text-primary">clients fidèles.</span>
            </h1>
            <div className="space-y-4">
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-gray-300 font-medium">Campagnes de masse personnalisées</p>
              </div>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-gray-300 font-medium">Système anti-blocage intelligent</p>
              </div>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-gray-300 font-medium">Extracteur de groupes intégré</p>
              </div>
            </div>
          </div>
          
          <div className="animate-in fade-in duration-1000 delay-1000">
            <p className="text-gray-400 text-sm">© 2026 Urigi Marketing Pro. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {view === "login" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="lg:hidden flex items-center gap-2 mb-10">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <span className="text-gray-900 font-bold text-xl tracking-tight">Urigi Marketing Pro</span>
              </div>
              
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Bon retour 👋</h2>
              <p className="text-gray-500 mb-8">Connectez-vous pour continuer vers votre espace de travail.</p>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                  </div>
                )}
                
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                    <button 
                      type="button"
                      onClick={() => { setView("forgot_password"); setError(null); setSuccess(null); }}
                      className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                      placeholder="••••••••"
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
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-semibold bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Vous n'avez pas encore de compte ?{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                  Créez-en un gratuitement
                </Link>
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => { setView("login"); setError(null); setSuccess(null); }}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
              
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Mot de passe oublié</h2>
              <p className="text-gray-500 mb-8">Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>

              <form onSubmit={handleResetPassword} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-semibold bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

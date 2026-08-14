"use client";

import { useEffect, useState } from "react";
import { User, Shield, Bell, Smartphone, Key, Save, CheckCircle2, QrCode, X, WifiOff, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profil");
  const [isSaved, setIsSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // States pour WhatsApp
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  // Pairing Code States
  const [connectionMethod, setConnectionMethod] = useState<"qr" | "phone">("qr");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  const [showCopyToast, setShowCopyToast] = useState(false);

  const checkWhatsAppStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/status', { cache: 'no-store' });
      const data = await res.json();
      setIsWhatsAppConnected(data.connected);
      if (data.connected) {
        setIsWhatsAppModalOpen(false);
      }
    } catch (e) {
      console.log("Moteur WhatsApp injoignable.");
      setIsWhatsAppConnected(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/qr', { cache: 'no-store' });
      const data = await res.json();
      if (data.qr) {
        setQrCodeData(data.qr);
      }
      if (data.connected) {
        setIsWhatsAppConnected(true);
        setIsWhatsAppModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let qrInterval: any;
    if (isWhatsAppModalOpen && !isWhatsAppConnected && connectionMethod === "qr") {
      fetchQRCode();
      qrInterval = setInterval(fetchQRCode, 3000);
    }
    return () => clearInterval(qrInterval);
  }, [isWhatsAppModalOpen, isWhatsAppConnected, connectionMethod]);

  const requestPairingCode = async () => {
    if (!phoneNumber) return alert("Veuillez entrer un numéro de téléphone");
    setIsRequestingCode(true);
    try {
      const res = await fetch('http://localhost:3001/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      const data = await res.json();
      if (data.code) {
        setPairingCode(data.code);
      } else {
        alert(data.error || "Une erreur est survenue.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion au serveur WhatsApp.");
    }
    setIsRequestingCode(false);
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch('http://localhost:3001/api/logout', { method: 'POST' });
      setIsWhatsAppConnected(false);
      setQrCodeData(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_urigi_9876543210qwertyuiop");
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("L'image est trop volumineuse (maximum 1MB).");
        return;
      }
      setIsUploadingAvatar(true);
      
      // Simulation d'un petit délai de chargement (upload)
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatar(event.target?.result as string);
          setIsUploadingAvatar(false);
        };
        reader.readAsDataURL(file);
      }, 800);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du compte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos préférences, la sécurité de votre compte et vos intégrations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("profil")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "profil" ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <User className="w-4 h-4" />
            Profil public
          </button>
          <button 
            onClick={() => setActiveTab("securite")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "securite" ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Shield className="w-4 h-4" />
            Sécurité
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "notifications" ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab("integrations")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "integrations" ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Smartphone className="w-4 h-4" />
            Intégrations (WhatsApp)
          </button>
          <button 
            onClick={() => setActiveTab("api")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "api" ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Key className="w-4 h-4" />
            Clés API
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8">
          
          {/* TAB: PROFIL */}
          {activeTab === "profil" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil public</h2>
                <p className="text-sm text-gray-500">Ces informations seront visibles sur vos factures et communications.</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-sm overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    "FM"
                  )}
                </div>
                <div>
                  <label className={`px-4 py-2 border rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 ${isUploadingAvatar ? 'bg-primary/10 text-primary border-primary/20 pointer-events-none' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      "Changer l'avatar"
                    )}
                    <input type="file" accept="image/jpeg, image/png, image/gif" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">JPG, GIF ou PNG. 1MB max.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise</label>
                  <input type="text" defaultValue="Urigi Marketing Pro" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input type="text" defaultValue="Freddy" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                  <input type="text" defaultValue="Mboa" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse Email</label>
                  <input type="email" defaultValue="freddy@urigi.com" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-500 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm bg-gray-50 cursor-not-allowed" readOnly />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITE */}
          {activeTab === "securite" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Protégez l'accès à votre compte.</p>
              </div>

              <div className="space-y-5 max-w-md bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nouveau mot de passe</label>
                  <input type="password" placeholder="Entrez un nouveau mot de passe" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                  <input type="password" placeholder="Retapez le nouveau mot de passe" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm shadow-sm" />
                </div>
                <button className="w-full mt-2 px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                  Mettre à jour le mot de passe
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 max-w-2xl">
                  <h3 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Authentification à deux facteurs (2FA)
                  </h3>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    Ajoutez une couche de sécurité supplémentaire à votre compte en exigeant plus qu'un simple mot de passe pour vous connecter. Cela protègera vos listes de contacts.
                  </p>
                  <button className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                    Activer la 2FA par SMS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">Gérez comment et quand vous recevez des alertes.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">Rapport de campagne</h3>
                    <p className="text-sm text-gray-500">Recevoir un email récapitulatif quand une campagne est terminée.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">Déconnexion WhatsApp</h3>
                    <p className="text-sm text-gray-500">Être alerté si votre téléphone n'est plus synchronisé avec le serveur.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">Nouveautés produit</h3>
                    <p className="text-sm text-gray-500">Recevoir des emails concernant les mises à jour de Urigi Marketing Pro.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Intégrations</h2>
                <p className="text-sm text-gray-500">Connectez vos services tiers.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">WhatsApp Business API / Web</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                      Connectez votre numéro WhatsApp pour envoyer des campagnes directement depuis notre plateforme.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {isWhatsAppConnected ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Connecté (+237 6XX XX XX XX)</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Non connecté</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isWhatsAppConnected ? (
                  <button 
                    onClick={handleDisconnectWhatsApp}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-colors whitespace-nowrap"
                  >
                    Déconnecter
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setConnectionMethod("qr");
                      setPairingCode(null);
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shadow-sm transition-colors whitespace-nowrap"
                  >
                    Connecter mon compte
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: API */}
          {activeTab === "api" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Clés API</h2>
                <p className="text-sm text-gray-500">Gérez vos clés API pour connecter Urigi à d'autres applications.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Clé API Principale</h3>
                  <button className="text-sm text-primary font-medium hover:text-primary-hover">Régénérer la clé</button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value="sk_live_urigi_9876543210qwertyuiop" 
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white" 
                    readOnly 
                  />
                  <button 
                    onClick={handleCopyApiKey}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Copier
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Ne partagez jamais cette clé. Elle donne accès à l'ensemble de votre compte.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Global Action Bar */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg shadow-sm hover:bg-primary-hover hover:-translate-y-0.5 transition-all"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Sauvegardé
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>

      {/* Modal de Connexion WhatsApp */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWhatsAppModalOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Lier un appareil
              </h2>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 text-center bg-white">
              
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-full max-w-[300px] mx-auto">
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${connectionMethod === "qr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setConnectionMethod("qr")}
                >
                  Scanner le QR
                </button>
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${connectionMethod === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setConnectionMethod("phone")}
                >
                  Code de liaison
                </button>
              </div>

              {connectionMethod === "qr" ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Scannez le QR Code</h3>
                  <p className="text-gray-500 text-sm">
                    1. Ouvrez WhatsApp sur votre téléphone<br/>
                    2. Allez dans <strong>Appareils connectés</strong><br/>
                    3. Pointez votre téléphone vers cet écran
                  </p>
                  <div className="bg-white p-4 inline-block border-2 border-gray-200 rounded-xl mx-auto shadow-sm relative min-w-[200px] min-h-[200px] flex items-center justify-center">
                    {qrCodeData ? (
                      <img src={qrCodeData} alt="QR Code WhatsApp" className="w-48 h-48" />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 mt-4">Génération du QR Code...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  <h3 className="text-xl font-bold text-gray-900 text-center">Lier avec un numéro</h3>
                  <p className="text-gray-500 text-sm text-center">
                    Entrez votre numéro WhatsApp (avec l'indicatif) pour recevoir un code à taper dans l'application.
                  </p>
                  
                  {!pairingCode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro WhatsApp</label>
                        <input
                          type="text"
                          placeholder="Ex: 237600000000"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                        />
                      </div>
                      <button
                        onClick={requestPairingCode}
                        disabled={isRequestingCode || !phoneNumber}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                      >
                        {isRequestingCode && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Obtenir le code de liaison
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <p className="text-sm text-gray-700">
                        Ouvrez WhatsApp &gt; Appareils connectés &gt; Lier avec le numéro de téléphone, et entrez le code suivant :
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg py-4 px-6 inline-block mx-auto">
                        <span className="text-3xl font-mono font-bold tracking-widest text-gray-900">
                          {pairingCode}
                        </span>
                      </div>
                      <button
                        onClick={() => setPairingCode(null)}
                        className="text-sm text-primary hover:underline mt-2 block mx-auto"
                      >
                        Recommencer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Copy */}
      {showCopyToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          <div className="bg-green-500/20 text-green-400 rounded-full p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium">Clé API copiée dans le presse-papier !</p>
        </div>
      )}

    </div>
  );
}

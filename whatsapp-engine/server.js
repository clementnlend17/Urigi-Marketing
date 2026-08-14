process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cache local pour stocker les noms des contacts
const contactCache = {};

let sock = null;
let currentQR = null;
let isConnected = false;
let user = null;
let isConnecting = false;

async function connectToWhatsApp() {
    if (isConnecting) return;
    isConnecting = true;
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'warn' }),
            printQRInTerminal: false,
            browser: ["Urigi Marketing Pro", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('contacts.upsert', (contacts) => {
            for (const contact of contacts) {
                if (contact.id) {
                    contactCache[contact.id] = contact;
                }
            }
        });
        
        sock.ev.on('contacts.update', (contacts) => {
            for (const contact of contacts) {
                if (contact.id) {
                    contactCache[contact.id] = { ...contactCache[contact.id], ...contact };
                }
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('Nouveau QR Code reçu.');
                try {
                    currentQR = await QRCode.toDataURL(qr);
                } catch (err) {
                    console.error("Erreur de génération du QR:", err);
                }
            }

            if (connection === 'close') {
                const errorObj = lastDisconnect.error;
                const statusCode = errorObj?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log('Connexion fermée. Code status:', statusCode, 'Reconnexion requise :', shouldReconnect);
                console.log('Détails erreur:', errorObj?.message || errorObj);
                
                isConnected = false;
                user = null;
                isConnecting = false;
                
                if (shouldReconnect) {
                    setTimeout(connectToWhatsApp, 3000);
                } else {
                    console.log('Déconnecté manuellement.');
                    try {
                        fs.rmSync(path.join(__dirname, 'auth_info_baileys'), { recursive: true, force: true });
                    } catch(e) {}
                    currentQR = null;
                    setTimeout(connectToWhatsApp, 3000);
                }
            } else if (connection === 'open') {
                console.log('Connecté à WhatsApp !');
                isConnected = true;
                currentQR = null;
                user = sock.user;
                isConnecting = false;
            }
        });
    } catch (error) {
        console.error("Erreur critique d'initialisation:", error);
        isConnecting = false;
        setTimeout(connectToWhatsApp, 5000);
    }
}

connectToWhatsApp();

app.get('/api/status', (req, res) => {
    res.json({ connected: isConnected, user: user });
});

app.get('/api/qr', (req, res) => {
    if (isConnected) {
        return res.json({ connected: true, qr: null });
    }
    res.json({ connected: false, qr: currentQR });
});

app.post('/api/pair', async (req, res) => {
    if (isConnected) return res.json({ error: "Déjà connecté" });
    if (!sock) return res.status(500).json({ error: "Socket non initialisé" });

    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Numéro de téléphone requis" });

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        // Baileys attend que la connexion soit établie (en attente de scan) pour demander le code
        await sock.waitForConnectionUpdate((update) => !!update.qr);
        const code = await sock.requestPairingCode(cleanPhone);
        res.json({ code });
    } catch (err) {
        console.error("Erreur lors de la demande du code de jumelage:", err);
        res.status(500).json({ error: "Impossible de générer le code. Assurez-vous d'utiliser un format valide avec l'indicatif (ex: 237...)." });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
        }
    } catch (e) {
        console.error("Erreur lors de la déconnexion (ignorée):", e.message || e);
    }
    res.json({ success: true, message: "Déconnecté" });
});

app.get('/api/groups', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(401).json({ error: "Non connecté à WhatsApp" });
    }
    
    try {
        const groups = await sock.groupFetchAllParticipating();
        const formattedGroups = Object.values(groups).map(g => ({
            id: g.id,
            name: g.subject,
            size: g.participants.length,
            participants: g.participants.map(p => {
                const contact = contactCache[p.id];
                return {
                    id: p.id,
                    name: contact?.name || contact?.notify || contact?.verifiedName || null
                };
            })
        }));
        res.json({ groups: formattedGroups });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Impossible de récupérer les groupes" });
    }
});

app.post('/api/send', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(401).json({ error: "Non connecté à WhatsApp" });
    }
    
    const { phone, message, imageBase64 } = req.body;
    if (!phone || (!message && !imageBase64)) {
        return res.status(400).json({ error: "Téléphone et message (ou image) requis" });
    }

    try {
        let jid = phone;
        if (jid.includes('@lid')) {
            // Identifiant masqué (WhatsApp Privacy), on le garde tel quel
        } else {
            jid = jid.replace(/\D/g, ''); 
            // Formatage automatique pour les numéros du Cameroun (9 chiffres commençant par 6)
            if (jid.length === 9 && jid.startsWith('6')) {
                jid = '237' + jid;
            }
            if (!jid.endsWith('@s.whatsapp.net')) {
                jid = `${jid}@s.whatsapp.net`;
            }
        }

        if (!jid.includes('@lid')) {
            const [result] = await sock.onWhatsApp(jid);
            if (!result || !result.exists) {
                console.warn(`Le numéro ${jid} n'est pas reconnu par WhatsApp.`);
                return res.status(404).json({ error: "Numéro non trouvé sur WhatsApp" });
            }
        }
        
        console.log(`Tentative d'envoi à ${jid}...`);
        let sendResult;
        
        if (imageBase64) {
            // L'image doit être envoyée en buffer
            const buffer = Buffer.from(imageBase64, 'base64');
            sendResult = await sock.sendMessage(jid, { image: buffer, caption: message || "" });
        } else {
            sendResult = await sock.sendMessage(jid, { text: message });
        }
        
        console.log(`Résultat de l'envoi à ${jid}:`, sendResult);
        res.json({ success: true, sendResult });
    } catch (err) {
        console.error("Erreur d'envoi:", err);
        res.status(500).json({ error: "Échec de l'envoi du message" });
    }
});

app.post('/api/send-status', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(401).json({ error: "Non connecté à WhatsApp" });
    }
    
    const { contacts, message, imageBase64, mediaBase64, mediaType } = req.body;
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: "Liste de contacts invalide ou vide" });
    }
    const finalMediaBase64 = mediaBase64 || imageBase64;
    if (!message && !finalMediaBase64) {
        return res.status(400).json({ error: "Message, image ou vidéo requis pour le statut" });
    }

    try {
        // Préparer la liste des JIDs autorisés à voir le statut
        const statusJidList = contacts.map(phone => {
            let jid = phone;
            if (jid.includes('@lid')) return jid;
            jid = jid.replace(/\D/g, ''); 
            if (jid.length === 9 && jid.startsWith('6')) {
                jid = '237' + jid;
            }
            if (!jid.endsWith('@s.whatsapp.net')) {
                jid = `${jid}@s.whatsapp.net`;
            }
            return jid;
        });

        console.log(`Tentative d'envoi d'un statut visible par ${statusJidList.length} contacts...`);
        let sendResult;
        
        if (finalMediaBase64) {
            const buffer = Buffer.from(finalMediaBase64, 'base64');
            if (mediaType === 'video') {
                sendResult = await sock.sendMessage('status@broadcast', { video: buffer, caption: message || "" }, { statusJidList });
            } else {
                // Par défaut, image
                sendResult = await sock.sendMessage('status@broadcast', { image: buffer, caption: message || "" }, { statusJidList });
            }
        } else {
            sendResult = await sock.sendMessage('status@broadcast', { text: message, backgroundColor: '#10B981' }, { statusJidList });
        }
        
        console.log(`Résultat de l'envoi du statut:`, sendResult);
        res.json({ success: true, sendResult, total_recipients: statusJidList.length });
    } catch (err) {
        console.error("Erreur d'envoi du statut:", err);
        res.status(500).json({ error: "Échec de la publication du statut" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Le moteur WhatsApp tourne sur le port ${PORT}`));

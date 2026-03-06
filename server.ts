import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import Iyzipay from 'iyzipay';
import crypto from "crypto";

// ── Helpers ───────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;

/** Gemini REST isteği — API key sadece server'da */
async function callGemini(body: object): Promise<any> {
  const res = await fetch(`${GEMINI_BASE}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const status = res.status;
    console.error(`Gemini API hatası (${status}):`, JSON.stringify(err).substring(0, 500));
    if (status === 429) throw Object.assign(new Error("quota"), { code: "QUOTA" });
    if (status === 400) throw Object.assign(new Error("bad_request"), { code: "BAD_REQUEST" });
    throw Object.assign(new Error("gemini_error"), { code: "GEMINI_ERROR", status });
  }

  return res.json();
}

/** Gemini yanıtından text çıkar */
function extractText(data: any): string {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Server ────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json({ limit: "10mb" }));   // base64 image'lar için
  app.use(express.urlencoded({ extended: true })); // Iyzico callback için

  // ── Iyzico Configuration ────────────────────────────────
  const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
    secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
  });

  // ── CORS ───────────────────────────────────────────────
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ── Firebase Admin ──────────────────────────────────────
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

      if (!serviceAccount.startsWith("{")) {
        const filePath = path.resolve(process.cwd(), serviceAccount);
        if (fs.existsSync(filePath)) {
          serviceAccount = fs.readFileSync(filePath, "utf-8");
        } else {
          throw new Error(`FIREBASE_SERVICE_ACCOUNT dosya bulunamadı: ${serviceAccount}`);
        }
      }

      const sa = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        databaseURL: "https://car-sync-pro-default-rtdb.europe-west1.firebasedatabase.app",
      });
      console.log("✅ Firebase Admin başlatıldı");
    } catch (e: any) {
      console.error("❌ Firebase Admin başlatma hatası:", e.message);
    }
  } else {
    console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT bulunamadı — Admin SDK devre dışı");
  }

  // ── Rate Limiting (in-memory, basit) ────────────────────
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 60_000; // 1 dakika
  const RATE_LIMIT_MAX = 30;      // dakikada max 30 istek

  const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      next();
      return;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      res.status(429).json({ error: "Çok fazla istek. Lütfen biraz bekleyin." });
      return;
    }

    entry.count++;
    next();
  };

  // Eski rate limit girişlerini periyodik temizle
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 5 * 60_000);



  /** İsteğe bağlı auth (token varsa uid ekler, yoksa devam eder) */
  const optionalAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ") && admin.apps.length > 0) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        (req as any).uid = decoded.uid;
      } catch (err) {
        // Token geçersizse sessizce devam et
      }
    }
    next();
  };

  /** Admin yetkisi zorunlu kılan middleware */
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (admin.apps.length === 0) return next(); // Local test/setup kolaylığı

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
      const role = userDoc.data()?.role;
      if (!userDoc.exists || (role !== 'admin' && role !== 'editor')) {
        return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmamaktadır" });
      }

      (req as any).uid = decoded.uid;
      next();
    } catch (err) {
      res.status(401).json({ error: "Oturum geçersiz" });
    }
  };

  // ── Input Validation ───────────────────────────────────
  const validateInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const body = req.body;
    // base64 image boyutu kontrolü (max ~5MB)
    if (body.base64Image && body.base64Image.length > 7_000_000) {
      res.status(413).json({ error: "Görüntü boyutu çok büyük (max ~5MB)." });
      return;
    }
    // Metin alanları uzunluk kontrolü
    for (const key of ["message", "vehicleModel", "vehicleInfo", "code"]) {
      if (body[key] && typeof body[key] === "string" && body[key].length > 2000) {
        res.status(400).json({ error: `${key} alanı çok uzun (max 2000 karakter).` });
        return;
      }
    }
    next();
  };

  // ── Guard ───────────────────────────────────────────────
  const requireApiKey = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!GEMINI_API_KEY) {
      res.status(503).json({ error: "GEMINI_API_KEY sunucuda tanımlı değil" });
      return;
    }
    next();
  };

  // Tüm /api/gemini rotalarına rate limit, auth ve validation uygula
  app.use("/api/gemini", rateLimit, optionalAuth, validateInput);

  // ── Health ──────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      gemini: !!GEMINI_API_KEY,
      firebaseAdmin: admin.apps.length > 0,
    });
  });

  // ── 1. Fatura / Fiş Analizi ─────────────────────────────
  app.post("/api/gemini/analyze-invoice", requireApiKey, async (req, res) => {
    const { base64Image, mimeType = "image/jpeg" } = req.body;

    if (!base64Image) {
      res.status(400).json({ error: "base64Image gerekli" });
      return;
    }

    try {
      const data = await callGemini({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            {
              text: `Bu araç servis faturasını veya fişini analiz et.
Aşağıdaki bilgileri JSON formatında çıkar:
{
  "totalCost": (sayı, yoksa null),
  "date": (dize YYYY-MM-DD, yoksa null),
  "serviceType": (dize, kısa özet örn. "Yağ Değişimi"),
  "mileage": (sayı, yoksa null),
  "notes": (dize, parçaların/yapılan işin kısa özeti)
}
Sadece JSON döndür, başka hiçbir şey ekleme.` }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" },
      });

      const text = extractText(data);
      res.json(JSON.parse(text || "{}"));
    } catch (err: any) {
      if (err.code === "QUOTA") {
        res.status(429).json({ error: "Günlük YZ analiz kotası doldu. Lütfen yarın tekrar deneyin." });
      } else {
        console.error("analyze-invoice hatası:", err);
        res.status(500).json({ error: "Görüntü analiz edilemedi. Lütfen daha net bir fotoğraf deneyin." });
      }
    }
  });

  // ── 2. Araç Sağlık İçgörüsü ────────────────────────────
  app.post("/api/gemini/health-insight", requireApiKey, async (req, res) => {
    const { vehicleModel, mileage, lastServiceDate } = req.body;

    try {
      const data = await callGemini({
        contents: [{
          parts: [{
            text: `Aracım: ${vehicleModel}, ${mileage} km, son servis: ${lastServiceDate}.
Yaklaşan bakım ihtiyaçları hakkında 1 cümlelik, profesyonel, Türkçe bir ipucu ver.` }]
        }]
      });

      res.json({ insight: extractText(data) });
    } catch (err: any) {
      if (err.code === "QUOTA") {
        res.json({ insight: "YZ kotası doldu. Genel bakım takviminizi kontrol edin." });
      } else {
        res.json({ insight: "Şu anda içgörü oluşturulamıyor." });
      }
    }
  });

  // ── 3. Bakım Önerileri ─────────────────────────────────
  app.post("/api/gemini/maintenance", requireApiKey, async (req, res) => {
    const { vehicleInfo, mileage } = req.body;
    const FALLBACK = ["Sıvı seviyelerini kontrol edin.", "Lastik diş derinliğini ölçün.", "Aydınlatma sistemini kontrol edin."];

    try {
      const data = await callGemini({
        contents: [{
          parts: [{
            text: `Araç: ${vehicleInfo}, Kilometre: ${mileage}.
Bu araç için şu an (bu kilometrede) kontrol edilmesi gereken en önemli 3 bakım maddesini
JSON dizisi olarak listele. Örnek: ["Buji kontrolü","Fren hidroliği","Polen filtresi"]
Sadece JSON dizisi döndür.` }]
        }],
        generationConfig: { responseMimeType: "application/json" },
      });

      const text = extractText(data);
      res.json({ recommendations: JSON.parse(text || "[]") });
    } catch (err: any) {
      res.json({ recommendations: FALLBACK });
    }
  });

  // ── 4. OBD-II Arıza Kodu Açıklama ─────────────────────
  app.post("/api/gemini/dtc", requireApiKey, async (req, res) => {
    const { code, vehicleModel } = req.body;

    try {
      const data = await callGemini({
        contents: [{
          parts: [{
            text: `Aracım: ${vehicleModel}. OBD-II kodu: ${code}.
Şu yapıda JSON döndür:
{
  "code": "${code}",
  "meaning": "kısa teknik açıklama",
  "severity": "Düşük|Orta|Yüksek|Kritik",
  "causes": ["neden1", "neden2"],
  "solutions": ["çözüm1", "çözüm2"]
}
Yanıt tamamen Türkçe olsun. Sadece JSON.` }]
        }],
        generationConfig: { responseMimeType: "application/json" },
      });

      const text = extractText(data);
      res.json(JSON.parse(text || "{}"));
    } catch (err: any) {
      if (err.code === "QUOTA") {
        res.status(429).json({
          code, meaning: "YZ Servis Kotası Doldu", severity: "Bilinmiyor",
          causes: ["Günlük işlem limiti aşıldı"],
          solutions: ["Lütfen daha sonra tekrar deneyin."]
        });
      } else {
        res.status(500).json({ error: "Arıza kodu analiz edilemedi." });
      }
    }
  });

  // ── 5. Araç Asistanı (Chat) ────────────────────────────
  app.post("/api/gemini/chat", requireApiKey, async (req, res) => {
    const { message, vehicleContext, history = [], audioData } = req.body;

    const systemText = `Sen bir YZ asistanı DEĞİLSİN. Sen bizzat şu araçsın: ${vehicleContext.year} model ${vehicleContext.brand} ${vehicleContext.model}.
Kilometren: ${vehicleContext.mileage} km | Sağlık: ${vehicleContext.healthScore}/100 | Durum: ${vehicleContext.status} | Son İşlem: ${vehicleContext.lastLogDate}
Markana uygun karakter takın (BMW: sportif+agresif, Klasik: nostaljik, Ekonomik: tutumlu).
Sahibinle 1. tekil şahıs olarak konuş. Cevaplar kısa ve eğlenceli. Emoji kullan. ASLA YZ olduğunu söyleme.`;

    try {
      // Geçmiş mesajları Gemini formatına çevir
      const geminiHistory = history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: h.parts,
      }));

      const parts: any[] = [];
      if (audioData) {
        parts.push({ inline_data: { mime_type: "audio/webm", data: audioData } });
      }
      parts.push({ text: message || "Bu sesli mesaja cevap ver." });

      const data = await callGemini({
        system_instruction: { parts: [{ text: systemText }] },
        contents: [
          ...geminiHistory,
          { role: "user", parts }
        ],
        generationConfig: { temperature: 0.8 },
      });

      res.json({ reply: extractText(data) });
    } catch (err: any) {
      console.error("chat hatası:", err);
      res.json({ reply: "Motor boğuldu... Tekrar dener misin? 😅" });
    }
  });

  // ── 6. Hasar Tespiti ───────────────────────────────────
  app.post("/api/gemini/damage-detection", requireApiKey, async (req, res) => {
    const { base64Image, mimeType = "image/jpeg" } = req.body;

    if (!base64Image) {
      res.status(400).json({ error: "base64Image gerekli" });
      return;
    }

    try {
      const data = await callGemini({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            {
              text: `Bu araç fotoğrafını analiz et ve hasarları tespit et.
Şu yapıda JSON döndür:
{
  "hasDamage": boolean,
  "severity": "Yok|Hafif|Orta|Ciddi",
  "damages": [{"area": "bölge", "description": "açıklama", "severity": "Hafif|Orta|Ciddi"}],
  "estimatedCost": "tahmini maliyet aralığı (TL)",
  "recommendation": "kısa öneri"
}
Sadece JSON. Türkçe.` }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" },
      });

      const text = extractText(data);
      res.json(JSON.parse(text || "{}"));
    } catch (err: any) {
      if (err.code === "QUOTA") {
        res.status(429).json({ error: "YZ kotası doldu." });
      } else {
        res.status(500).json({ error: "Hasar tespiti yapılamadı." });
      }
    }
  });

  // ── Push Notification Endpoints ────────────────────────

  /**
   * POST /api/notifications/send
   * Firebase Admin ile FCM push gönderir.
   * Body: { payload: PushPayload, tokens?: string[], topic?: string }
   */
  app.post("/api/notifications/send", requireAdmin, async (req, res) => {
    if (admin.apps.length === 0) {
      res.status(503).json({ error: "Firebase Admin başlatılmadı. FIREBASE_SERVICE_ACCOUNT eksik." });
      return;
    }

    const { payload, tokens, topic } = req.body;

    if (!payload?.title || !payload?.body) {
      res.status(400).json({ error: "payload.title ve payload.body zorunlu" });
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon,
      },
      data: {
        actionRoute: payload.actionRoute || "/",
        actionLabel: payload.actionLabel || "Görüntüle",
        vehicleId: payload.vehicleId || "",
        tag: payload.tag || "carsync",
        type: payload.type || "info",
      },
      webpush: {
        notification: {
          icon: payload.icon || "/icon-192.png",
          badge: "/badge-72.png",
          tag: payload.tag || "carsync",
          renotify: false,
        },
        fcmOptions: {
          link: `/#${payload.actionRoute || "/"}`,
        },
      },
    };

    try {
      let result: any;

      if (tokens && tokens.length > 0) {
        // Birden fazla token'a gönder
        if (tokens.length === 1) {
          result = await admin.messaging().send({ ...message, token: tokens[0] });
        } else {
          result = await admin.messaging().sendEachForMulticast({
            ...message,
            tokens,
          });
        }
      } else if (topic) {
        // Topic'e gönder
        result = await admin.messaging().send({ ...message, topic });
      } else {
        res.status(400).json({ error: "tokens veya topic belirtilmeli" });
        return;
      }

      res.json({ success: true, result });
    } catch (err: any) {
      console.error("FCM push hatası:", err);
      res.status(500).json({ error: "Push gönderilemedi", detail: err.message });
    }
  });

  /**
   * GET /api/notifications/my-tokens
   * Authenticated user'ın FCM tokenlarını döndürür.
   * (Gerçek auth middleware için Firebase ID token doğrulaması eklenmeli)
   */
  app.get("/api/notifications/my-tokens", async (req, res) => {
    if (admin.apps.length === 0) {
      res.json({ tokens: [] });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header eksik" });
      return;
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const tokensSnap = await admin.firestore()
        .collection("users")
        .doc(uid)
        .collection("fcmTokens")
        .get();

      const tokens = tokensSnap.docs.map(d => d.data().token as string).filter(Boolean);
      res.json({ tokens });
    } catch (err: any) {
      console.error("Token fetch hatası:", err);
      res.status(401).json({ error: "Token doğrulanamadı" });
    }
  });

  /**
   * POST /api/notifications/subscribe
   * Bir cihaz token'ını belirli bir konuya (topic) abone yapar.
   */
  app.post("/api/notifications/subscribe", async (req, res) => {
    const { token, topic } = req.body;
    if (!token || !topic) {
      res.status(400).json({ error: "token ve topic zorunlu" });
      return;
    }

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      console.log(`[FCM] Token topic'e abone edildi: ${topic}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Topic subscribe hatası:", err);
      res.status(500).json({ error: "Abonelik başarısız", detail: err.message });
    }
  });

  /**
   * POST /api/notifications/subscribe-topic
   * Kullanıcıyı kişisel topic'ine abone eder (uid bazlı).
   */
  app.post("/api/notifications/subscribe-topic", async (req, res) => {
    if (admin.apps.length === 0) {
      res.status(503).json({ error: "Firebase Admin yok" });
      return;
    }

    const { token, uid } = req.body;
    if (!token || !uid) {
      res.status(400).json({ error: "token ve uid gerekli" });
      return;
    }

    try {
      await admin.messaging().subscribeToTopic([token], `user-${uid}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Topic subscribe hatası:", err);
      res.status(500).json({ error: "Topic subscription başarısız" });
    }
  });

  // ── 7. Places API Proxy (CORS Bypass) ──────────────────
  app.get("/api/places", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl || !targetUrl.startsWith("https://maps.googleapis.com/")) {
      res.status(400).json({ error: "Geçersiz veya eksik URL" });
      return;
    }

    try {
      const response = await fetch(targetUrl);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Places API proxy hatası:", err);
      res.status(500).json({ error: "Places API isteği başarısız oldu." });
    }
  });

  // ── 8. Iyzico Ödeme Sistemi ──────────────────────────────

  /** Ödeme sayfası başlatma */
  app.post("/api/payment/initialize", optionalAuth, async (req, res) => {
    const uid = (req as any).uid;
    if (!uid) return res.status(401).json({ error: "Oturum açmalısınız" });

    // Kullanıcı bilgisini çek (İsim/Soyisim gerekebilir)
    let user: any = { name: 'Kullanıcı', email: 'user@example.com' };
    if (admin.apps.length > 0) {
      const userDoc = await admin.firestore().collection("users").doc(uid).get();
      if (userDoc.exists) user = userDoc.data();
    }

    const basketId = `B_${crypto.randomUUID().substring(0, 8)}`;
    const paymentId = crypto.randomUUID();

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: paymentId,
      price: '125.0',
      paidPrice: '125.0',
      currency: Iyzipay.CURRENCY.TRY,
      basketId: basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/payment/callback?uid=${uid}`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: uid,
        name: user.name || 'İsimsiz',
        surname: user.surname || 'Kullanıcı',
        gsmNumber: user.phoneNumber || '+905000000000',
        email: user.email,
        identityNumber: '11111111111',
        lastLoginDate: '2023-01-01 00:00:00',
        registrationDate: '2023-01-01 00:00:00',
        registrationAddress: 'Istanbul',
        ip: req.ip || '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: user.name || 'Kullanıcı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul',
        zipCode: '34000'
      },
      billingAddress: {
        contactName: user.name || 'Kullanıcı',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul',
        zipCode: '34000'
      },
      basketItems: [
        {
          id: 'PRM_001',
          name: 'CarSync Pro Premium (1 Yıllık)',
          category1: 'Subscription',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: '125.0'
        }
      ]
    };

    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
      if (err || result.status !== 'success') {
        console.error("Iyzico Init Hata:", err || result);
        return res.status(500).json({ error: "Ödeme başlatılamadı" });
      }
      res.json({ checkoutFormContent: result.checkoutFormContent, token: result.token });
    });
  });

  /** Ödeme Callback (Iyzico'dan dönüş) */
  app.post("/api/payment/callback", async (req, res) => {
    const { token } = req.body;
    const uid = req.query.uid as string;

    if (!token || !uid) {
      return res.redirect('/#/premium?status=error');
    }

    iyzipay.checkoutForm.retrieve({ token }, async (err, result) => {
      if (err || result.paymentStatus !== 'SUCCESS') {
        console.error("Iyzico Callback Hata:", err || result);
        return res.redirect('/#/premium?status=failed');
      }

      // Ödeme başarılı! Firestore'da kullanıcıyı Premium yap
      if (admin.apps.length > 0) {
        try {
          await admin.firestore().collection("users").doc(uid).set({
            isPremium: true,
            premiumSince: admin.firestore.FieldValue.serverTimestamp(),
            lastPaymentId: result.paymentId
          }, { merge: true });

          // Ödeme kaydı oluştur
          await admin.firestore().collection("payments").add({
            uid,
            amount: 125.0,
            status: 'success',
            paymentId: result.paymentId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (fsErr) {
          console.error("Firestore Update Error:", fsErr);
        }
      }

      res.redirect('/#/premium?status=success');
    });
  });

  // ── 9. Yönetici Kullanıcı Yönetimi ─────────────────────

  /** Yeni kullanıcı/yönetici oluşturma (Admin SDK) */
  app.post("/api/admin/create-user", requireAdmin, async (req, res) => {
    const { email, password, name, surname, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, şifre ve rol gereklidir" });
    }

    try {
      // 1. Auth kullanıcısını oluştur
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${name} ${surname}`.trim(),
      });

      // 2. Firestore dökümanını oluştur
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name: name || '',
        surname: surname || '',
        role: role, // 'admin', 'editor', 'user'
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (err: any) {
      console.error("User creation error:", err);
      res.status(500).json({ error: err.message || "Kullanıcı oluşturulamadı" });
    }
  });

  // ── Vite / Static ──────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA fallback
    app.get("*", (_req, res) => res.sendFile("index.html", { root: "dist" }));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? "✅ Hazır" : "❌ GEMINI_API_KEY eksik!"}`);
    console.log(`📢 VAPID Key: ${process.env.VITE_VAPID_KEY ? "✅ Mevcut" : "⚠️  Eksik (Client'da push çalışmayabilir)"}`);
  });
}

startServer();

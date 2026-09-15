import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/auth-utils";
import crypto from "crypto";
import { getUserOrdersForBot, forwardCustomerSupportMessage } from "@/lib/telegram";

const BOT_TOKEN = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN || "8947811419:AAE8Z2LX6hR925mIs_mVYkIZ5f8GIojvK3c";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://eltron-web.vercel.app";

// Bosh menyu (Reply Keyboard with Telegram Mini App web_app button)
const getMainKeyboard = (siteUrl: string = SITE_URL) => ({
    keyboard: [
        [{ text: "🛍 Do'konni ochish (Mini App)", web_app: { url: siteUrl } }],
        [{ text: "📱 Ro'yxatdan o'tish / Saytga kirish" }, { text: "📦 Mening buyurtmalarim" }],
        [{ text: "💬 Operatorga yozish" }, { text: "❓ Savol-javob (FAQ)" }]
    ],
    resize_keyboard: true
});

// Jarayonlarni bekor qilish tugmasi
const CANCEL_KEYBOARD = {
    keyboard: [
        [{ text: "❌ Bekor qilish / Orqaga" }]
    ],
    resize_keyboard: true
};

// FAQ Inline Keyboard
const FAQ_INLINE_KEYBOARD = {
    inline_keyboard: [
        [{ text: "🚚 Yetkazib berish", callback_data: "faq_delivery" }, { text: "💳 To'lov usullari", callback_data: "faq_payment" }],
        [{ text: "🔄 Kafolat va qaytarish", callback_data: "faq_return" }, { text: "🎁 Promokod", callback_data: "faq_promo" }],
        [{ text: "💬 Operatorga yozish", callback_data: "start_support" }]
    ]
};

async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || SITE_URL;
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: replyMarkup !== undefined ? replyMarkup : getMainKeyboard(siteUrl),
            parse_mode: "HTML"
        }),
    });
}

async function sendTelegramPhoto(chatId: number | string, photoUrl: string, caption: string, replyMarkup?: any) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || SITE_URL;
    try {
        const res = await fetch(`${TELEGRAM_API}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption,
                reply_markup: replyMarkup !== undefined ? replyMarkup : getMainKeyboard(siteUrl),
                parse_mode: "HTML"
            }),
        });
        const data = await res.json();
        if (!data.ok) {
            await sendTelegramMessage(chatId, caption, replyMarkup);
        }
    } catch {
        await sendTelegramMessage(chatId, caption, replyMarkup);
    }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: text || ""
        }),
    });
}

async function animateAndDeletePasswordMessage(chatId: number | string, messageId?: number | null) {
    if (!messageId) return;
    try {
        await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: "🔒 <i>Parol shifrlanmoqda va xavfsiz o'chirilmoqda... ✨</i>",
                parse_mode: "HTML"
            }),
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        await fetch(`${TELEGRAM_API}/deleteMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
        });
    } catch { /* ignore error */ }
}

function decodeNextPath(payload?: string): string | null {
    if (!payload || payload === "register") return null;
    try {
        const dec = Buffer.from(payload, "base64url").toString("utf8");
        if (dec.startsWith("/") && !dec.startsWith("//")) return dec;
    } catch { /* invalid payload */ }
    return null;
}

/**
 * GET: Webhook va Telegram Mini App (Menu Button) avtomatik sozlash endpointi
 * Sayt Vercel'ga deploy bo'lgach, https://sayt-nomi.vercel.app/api/bot ga kirilganda
 * webhook va do'kon tugmasini bir marta avtomatik sozlaydi.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
        const proto = req.headers.get("x-forwarded-proto") || "https";
        const currentOrigin = `${proto}://${host}`;
        const siteUrl = searchParams.get("url") || process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || currentOrigin;

        const webhookUrl = `${siteUrl}/api/bot`;

        // 1. Telegram Webhook o'rnatish
        const hookRes = await fetch(`${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
        const hookData = await hookRes.json();

        // 2. Telegram Mini App (Do'kon ochish menyu tugmasi)
        const menuRes = await fetch(`${TELEGRAM_API}/setChatMenuButton`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                menu_button: {
                    type: "web_app",
                    text: "🛍 Do'kon",
                    web_app: { url: siteUrl }
                }
            })
        });
        const menuData = await menuRes.json();

        return NextResponse.json({
            ok: true,
            siteUrl,
            webhookUrl,
            setWebhookResult: hookData,
            setChatMenuButtonResult: menuData
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || SITE_URL;

        // 1. Callback Query handling (Inline tugmalar uchun)
        if (body.callback_query) {
            const cb = body.callback_query;
            const chatId = cb.message.chat.id;
            const data = cb.data;

            await answerCallbackQuery(cb.id);

            if (data === "faq_delivery") {
                await sendTelegramMessage(chatId,
                    "🚚 <b>Yetkazib berish shartlari:</b>\n\n" +
                    "• <b>Toshkent shahri:</b> 1 kunda (standart yoki kuryerlik orqali)\n" +
                    "• <b>Viloyatlar bo'yicha:</b> Pochta yoki kuryerlik xizmati orqali 1-3 ish kunida yetkaziladi.\n\n" +
                    "<i>Yetkazib berish narxi va vaqti rasmiylashtirishda ko'rsatiladi.</i>",
                    FAQ_INLINE_KEYBOARD
                );
            } else if (data === "faq_payment") {
                await sendTelegramMessage(chatId,
                    "💳 <b>To'lov usullari:</b>\n\n" +
                    "• <b>Naqd to'lov:</b> Mahsulot eshigingizga yetib borganda tekshirib olingandan so'ng to'lanadi.\n" +
                    "• <b>Karta orqali:</b> Mahsulotni qabul qilib olganda to'lash mumkin.",
                    FAQ_INLINE_KEYBOARD
                );
            } else if (data === "faq_return") {
                await sendTelegramMessage(chatId,
                    "🔄 <b>Kafolat va qaytarish:</b>\n\n" +
                    "• Barcha mahsulotlarimizga rasmiy kafolat beriladi.\n" +
                    "• Nuqsonli yoki noto'g'ri kelgan mahsulotlar 14 kun ichida bepul almashtiriladi yoki pulingiz qaytariladi.",
                    FAQ_INLINE_KEYBOARD
                );
            } else if (data === "faq_promo") {
                await sendTelegramMessage(chatId,
                    `🎁 <b>Promokodlar va Chegirmalar:</b>\n\n` +
                    `Hozirda faol ommaviy promokodlar mavjud emas. Yangi chegirma va aksiya promokodlarini ijtimoiy tarmoqlarimiz hamda botimiz orqali kuzatib boring!`,
                    FAQ_INLINE_KEYBOARD
                );
            } else if (data === "start_support") {
                await supabaseAdmin.from("bot_sessions").upsert({
                    chat_id: chatId.toString(),
                    step: "support_chat",
                    updated_at: new Date().toISOString()
                });
                await sendTelegramMessage(chatId,
                    "✍️ <b>Operatorga murojaat qilish:</b>\n\n" +
                    "Savolingiz yoki murojaatingizni yozib yuboring. Operatorlarimiz tez orada sizga javob qaytarishadi.",
                    CANCEL_KEYBOARD
                );
            } else if (data === "start_register") {
                await supabaseAdmin.from("bot_sessions").upsert({
                    chat_id: chatId.toString(),
                    step: "await_contact",
                    updated_at: new Date().toISOString(),
                });

                await sendTelegramMessage(chatId,
                    "Ro'yxatdan o'tish yoki parolni tiklash uchun quyidagi tugmani bosib telefon raqamingizni yuboring:",
                    {
                        keyboard: [
                            [{ text: "📱 Kontaktni yuborish", request_contact: true }],
                            [{ text: "❌ Bekor qilish / Orqaga" }]
                        ],
                        resize_keyboard: true
                    }
                );
            }
            return NextResponse.json({ ok: true });
        }

        if (!body.message) return NextResponse.json({ ok: true });

        const { chat, text, contact, message_id } = body.message;
        const chatId = chat.id;

        // 2. Bekor qilish / Orqaga tugmasi bosilganda
        if (text === "❌ Bekor qilish / Orqaga" || text === "/cancel") {
            await supabaseAdmin.from("bot_sessions").delete().eq("chat_id", chatId.toString());
            await sendTelegramMessage(chatId,
                "❌ Jarayon bekor qilindi. Bosh menyuga qaytildi:",
                getMainKeyboard(siteUrl)
            );
            return NextResponse.json({ ok: true });
        }

        // Bot sessiyasini Supabase orqali olish
        const { data: session } = await supabaseAdmin
            .from("bot_sessions")
            .select("*")
            .eq("chat_id", chatId.toString())
            .single();

        // 3. /start buyrug'i
        if (text?.startsWith("/start")) {
            const payload = text.split(" ")[1];
            const nextPath = decodeNextPath(payload);

            await supabaseAdmin.from("bot_sessions").delete().eq("chat_id", chatId.toString());

            const bannerUrl = `${siteUrl}/banners/eltron-hero.png`;

            // Agar saytdagi ro'yxatdan o'tish tugmasi orqali kelgan bo'lsa
            if (payload === "register" || nextPath) {
                await supabaseAdmin.from("bot_sessions").upsert({
                    chat_id: chatId.toString(),
                    step: "await_contact",
                    next_path: nextPath || null,
                    updated_at: new Date().toISOString(),
                });

                await sendTelegramPhoto(chatId,
                    bannerUrl,
                    `Assalomu alaykum, <b>${chat.first_name || 'Mijoz'}</b>!\n\n` +
                    `<b>Eltron</b> do'koniga xush kelibsiz! ✨\n\n` +
                    `Saytga kirish yoki yangi akkaunt ochish uchun quyidagi <b>"📱 Kontaktni yuborish"</b> tugmasini bosing:`,
                    {
                        keyboard: [
                            [{ text: "📱 Kontaktni yuborish", request_contact: true }],
                            [{ text: "❌ Bekor qilish / Orqaga" }]
                        ],
                        resize_keyboard: true
                    }
                );
                return NextResponse.json({ ok: true });
            }

            await sendTelegramPhoto(chatId,
                bannerUrl,
                `Assalomu alaykum, <b>${chat.first_name || 'Mijoz'}</b>!\n\n` +
                `<b>Eltron</b> rasmiy do'koni va yordamchi botiga xush kelibsiz! ✨\n\n` +
                `Saytimizdan qulay xarid qilish uchun quyidagi <b>"🛍 Do'konni ochish"</b> tugmasini bosing yoki menyudan foydalaning:`,
                getMainKeyboard(siteUrl)
            );
            return NextResponse.json({ ok: true });
        }

        // 4. Menyu tugmalari
        if (text === "📱 Ro'yxatdan o'tish / Saytga kirish" || text === "📱 Ro'yxatdan o'tish") {
            await supabaseAdmin.from("bot_sessions").upsert({
                chat_id: chatId.toString(),
                step: "await_contact",
                updated_at: new Date().toISOString(),
            });

            await sendTelegramMessage(chatId,
                "Ro'yxatdan o'tish yoki parolni tiklash uchun quyidagi tugmani bosib telefon raqamingizni yuboring:",
                {
                    keyboard: [
                        [{ text: "📱 Kontaktni yuborish", request_contact: true }],
                        [{ text: "❌ Bekor qilish / Orqaga" }]
                    ],
                    resize_keyboard: true
                }
            );
            return NextResponse.json({ ok: true });
        }

        if (text === "📦 Mening buyurtmalarim" || text === "🛍 Mening buyurtmalarim") {
            const ordersInfo = await getUserOrdersForBot(chatId.toString());
            await sendTelegramMessage(chatId, ordersInfo.text, getMainKeyboard(siteUrl));
            return NextResponse.json({ ok: true });
        }

        if (text === "❓ Savol-javob (FAQ)") {
            await sendTelegramMessage(chatId,
                "❓ <b>Ko'p beriladigan savollar:</b>\n\nQuyidagi bo'limlardan birini tanlang:",
                FAQ_INLINE_KEYBOARD
            );
            return NextResponse.json({ ok: true });
        }

        if (text === "💬 Operatorga yozish") {
            await supabaseAdmin.from("bot_sessions").upsert({
                chat_id: chatId.toString(),
                step: "support_chat",
                updated_at: new Date().toISOString()
            });

            await sendTelegramMessage(chatId,
                "✍️ <b>Operatorga murojaat qilish:</b>\n\nSavolingiz yoki murojaatingizni shu yerga yozib yuboring. Operatorlarimiz tez orada javob berishadi.\n\n<i>(Chiqish uchun '❌ Bekor qilish / Orqaga' tugmasini bosing)</i>",
                CANCEL_KEYBOARD
            );
            return NextResponse.json({ ok: true });
        }

        // 5. Kontakt yuborilganda (Ro'yxatdan o'tish bosqichi)
        if (contact) {
            if (contact.user_id !== chatId) {
                await sendTelegramMessage(chatId, "Xatolik! ❌ Iltimos, o'z raqamingizni '📱 Kontaktni yuborish' tugmasi orqali yuboring.");
                return NextResponse.json({ ok: true });
            }

            let phone = contact.phone_number;
            if (!phone.startsWith("+")) phone = "+" + phone;

            await supabaseAdmin.from("bot_sessions").upsert({
                chat_id: chatId.toString(),
                phone,
                step: "password",
                updated_at: new Date().toISOString()
            });

            await sendTelegramMessage(chatId, "Yaxshi! Endi saytga kirish uchun yangi parol o'rnating (kamida 6 ta belgi):", CANCEL_KEYBOARD);
            return NextResponse.json({ ok: true });
        }

        // 6. Parol va Tasdiqlash bosqichlari
        if (session) {
            if (session.step === "password") {
                if (!text || text.length < 6) {
                    await sendTelegramMessage(chatId, "Parol juda qisqa. Kamida 6 ta belgidan iborat parol kiriting:", CANCEL_KEYBOARD);
                    return NextResponse.json({ ok: true });
                }

                await supabaseAdmin.from("bot_sessions").update({
                    temp_password_hash: hashPassword(text),
                    pwd_msg_id: message_id,
                    step: "confirm_password"
                }).eq("chat_id", chatId.toString());

                await sendTelegramMessage(chatId, "Parolni tasdiqlash uchun qayta kiriting:", CANCEL_KEYBOARD);
                return NextResponse.json({ ok: true });
            }

            if (session.step === "confirm_password") {
                if (!text || hashPassword(text) !== session.temp_password_hash) {
                    await sendTelegramMessage(chatId, "Xatolik! Parollar mos kelmadi. Qaytadan parol kiriting:", CANCEL_KEYBOARD);
                    await supabaseAdmin.from("bot_sessions").update({ step: "password", pwd_msg_id: null }).eq("chat_id", chatId.toString());
                    return NextResponse.json({ ok: true });
                }

                // If another user had this telegram_id, detach it first to satisfy unique constraint
                await supabaseAdmin
                    .from("users")
                    .update({ telegram_id: null })
                    .eq("telegram_id", chatId.toString())
                    .neq("phone", session.phone);

                const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("phone", session.phone).maybeSingle();
                const userId = existingUser?.id || crypto.randomUUID();

                const { error: userUpsertError } = await supabaseAdmin.from("users").upsert({
                    id: userId,
                    phone: session.phone,
                    password: hashPassword(text),
                    telegram_id: chatId.toString(),
                }, { onConflict: 'phone' });

                if (userUpsertError) {
                    console.error("User upsert error:", userUpsertError);
                    await sendTelegramMessage(chatId, "Kechirasiz, ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring:", CANCEL_KEYBOARD);
                    return NextResponse.json({ ok: true });
                }

                await animateAndDeletePasswordMessage(chatId, session.pwd_msg_id);
                await animateAndDeletePasswordMessage(chatId, message_id);

                const loginToken = crypto.randomBytes(24).toString("hex");
                const { error: tokenErr } = await supabaseAdmin.from("login_tokens").insert({
                    token: loginToken,
                    phone: session.phone,
                    next_path: session.next_path || null,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                });

                if (tokenErr) {
                    console.error("Login token insert error:", tokenErr);
                    await sendTelegramMessage(chatId, "Kechirasiz, kirish tokeni yaratishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring:", CANCEL_KEYBOARD);
                    return NextResponse.json({ ok: true });
                }

                const returnUrl = `${siteUrl}/uz/auth?lt=${loginToken}`;

                await sendTelegramMessage(chatId,
                    `✅ <b>Parolingiz muvaffaqiyatli saqlandi!</b>\n\n` +
                    `Telefon: <code>${session.phone}</code>\n\n` +
                    `Quyidagi tugma orqali saytga <b>avtomatik kirgan holda</b> o'tishingiz mumkin:`,
                    {
                        inline_keyboard: [
                            [{ text: "🛍 Saytga kirish (Mini App)", web_app: { url: returnUrl } }],
                            [{ text: "🌐 Brauzerda ochish", url: returnUrl }]
                        ]
                    }
                );

                await supabaseAdmin.from("bot_sessions").delete().eq("chat_id", chatId.toString());
                return NextResponse.json({ ok: true });
            }
        }

        // 7. Odatiy matnli xabarlar (Support/Operatorga uzatish)
        if (text) {
            const { data: user } = await supabaseAdmin.from("users").select("phone, name").eq("telegram_id", chatId.toString()).single();

            const sent = await forwardCustomerSupportMessage(
                chatId.toString(),
                user?.phone || session?.phone || null,
                user?.name || chat.first_name || null,
                text
            );

            if (sent) {
                await sendTelegramMessage(chatId,
                    "📩 <b>Xabaringiz operatorga yetkazildi!</b>\n\nTez orada operatorimiz sizga ushbu bot orqali javob beradi.",
                    CANCEL_KEYBOARD
                );
            } else {
                await sendTelegramMessage(chatId,
                    "Tizimda kichik xatolik yuz berdi. Iltimos, qaytadan yozib ko'ring yoki birozdan so'ng urinib ko'ring.",
                    getMainKeyboard(siteUrl)
                );
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Bot API Error:", error);
        return NextResponse.json({ ok: true });
    }
}

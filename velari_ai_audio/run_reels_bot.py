#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VELARI AI REELS BOT (CLI)
=========================
Supabase'dan tovar ma'lumotlarini oladi, Groq AI orqali marketing ssenariy yozadi,
UzbekVoice orqali o'zbekcha ovoz yaratadi, Pillow va FFmpeg yordamida 1080x1920 (9:16)
vertikal Reels videosini render qiladi, Yandex S3 ga yuklaydi va Instagram Reels'ga joylaydi.

Foydalanish:
    python velari_ai_audio/run_reels_bot.py
    python velari_ai_audio/run_reels_bot.py --test
    python velari_ai_audio/run_reels_bot.py --product-id <UUID>
    python velari_ai_audio/run_reels_bot.py --list
"""

import os
import sys
import json
import time
import random
import argparse
import urllib.request
import urllib.parse
import subprocess

# UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import requests
import boto3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from render_product_reels import build_product_reels, OUTPUT_DIR

# --- 1. CONFIG LOADER (.env.local) ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_LOCAL_PATH = os.path.join(PROJECT_ROOT, ".env.local")

CONFIG = {}
if os.path.exists(ENV_LOCAL_PATH):
    with open(ENV_LOCAL_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                CONFIG[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = CONFIG.get("NEXT_PUBLIC_SUPABASE_URL", "https://slmbethqqqugnktxwzdz.supabase.co")
SUPABASE_KEY = CONFIG.get("SUPABASE_SERVICE_ROLE_KEY", "")
GROQ_API_KEY = CONFIG.get("GROQ_API_KEY_1") or CONFIG.get("GROQ_API_KEY", "")
S3_ACCESS_KEY = CONFIG.get("YANDEX_S3_ACCESS_KEY", "")
S3_SECRET_KEY = CONFIG.get("YANDEX_S3_SECRET_KEY", "")
S3_BUCKET = CONFIG.get("YANDEX_S3_BUCKET", "savdomarketimag")
S3_REGION = CONFIG.get("YANDEX_S3_REGION", "ru-central1")
IG_ID = CONFIG.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", "17841446090191717")
PAGE_TOKEN = CONFIG.get("INSTAGRAM_PAGE_ACCESS_TOKEN", "")
ADMIN_SECRET = CONFIG.get("ADMIN_SECRET", "velari-admin-secret-2024")
BASE_URL = "https://velari.uz"


def log(msg, emoji="ℹ️"):
    now = time.strftime("%H:%M:%S")
    print(f"[{now}] {emoji} {msg}", flush=True)


# --- 2. SUPABASE HELPER ---
def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }


def fetch_products(limit=50):
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,name_uz,name,price,old_price,images,image,stock,description_uz,description&stock=gt.0&is_deleted=eq.false&limit={limit}"
    res = requests.get(url, headers=get_supabase_headers(), timeout=15)
    if res.status_code != 200:
        raise Exception(f"Supabase xatosi ({res.status_code}): {res.text}")
    return res.json()


def fetch_single_product(product_id):
    url = f"{SUPABASE_URL}/rest/v1/products?id=eq.{product_id}&is_deleted=eq.false"
    res = requests.get(url, headers=get_supabase_headers(), timeout=15)
    if res.status_code != 200 or not res.json():
        raise Exception(f"Mahsulot topilmadi: {product_id}")
    return res.json()[0]


# --- 3. GROQ AI MARKETING COPYWRITER ---
def generate_smm_script(product_name, price, old_price):
    log("Groq AI orqali o'zbekcha professional SMM senariy yozilmoqda...", "🧠")
    discount = round(((old_price - price) / old_price) * 100) if old_price > price else 25

    prompt = f"""Siz Velari do'koni uchun professional O'zbek SMM videorolik muallifisiz.
Quyidagi mahsulot uchun Instagram Reels formatida 20-25 soniyaga mo'ljallangan qisqa, jozibali, odam tilida o'qiladigan ssenariy yozing.

Mahsulot: {product_name}
Yangi narxi: {price:,} so'm
Eski narxi: {old_price:,} so'm
Chegirma: {discount}%

QAT'IY QOIDALAR:
1. Matnda BIRORTA HAM RAQAM, MODEL NOMI YOKI BELGI BO'LMASIN! (Masalan: '1100W', 'V-099', '2026', '50%' aslo bo'lmasin).
2. Narxi va chegirmalarni FAFAQAT O'ZBEKCHA SO'ZLAR BILAN YOZING! (Masalan: 'bir yuz to'qson to'qqiz ming so'm', 'o'ttiz foiz chegirmada').
3. Matn oxirida 'Buyurtma berish uchun saytimizga kiring' degan chaqiriq bo'lsin.
4. Javobda faqat diktor o'qiydigan sof matnni bering, boshqa hech qanday izoh yoki sarlavha yozmang.
"""

    payload = {
        "model": "qwen/qwen3.8-27b",
        "messages": [
            {"role": "system", "content": "Siz faqat diktor o'qiydigan matnni qaytaradigan yordamchisiz."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.6
    }

    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=30
    )

    if res.status_code != 200:
        raise Exception(f"Groq API xatosi ({res.status_code}): {res.text}")

    content = res.json()["choices"][0]["message"]["content"].strip()
    return content


# --- 4. YANDEX S3 UPLOADER ---
def upload_video_to_s3(local_file_path, s3_filename):
    log(f"Video Yandex S3 bulutiga yuklanmoqda ({os.path.basename(local_file_path)})...", "☁️")

    s3 = boto3.client(
        "s3",
        endpoint_url="https://storage.yandexcloud.net",
        region_name=S3_REGION,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY
    )

    key = f"reels/{s3_filename}"
    s3.upload_file(
        Filename=local_file_path,
        Bucket=S3_BUCKET,
        Key=key,
        ExtraArgs={
            "ContentType": "video/mp4",
            "ACL": "public-read"
        }
    )

    public_url = f"https://storage.yandexcloud.net/{S3_BUCKET}/{key}"
    log(f"Video Yandex S3 ga yuklandi: {public_url}", "✅")
    return public_url


# --- 5. INSTAGRAM REELS PUBLISHER ---
def publish_to_instagram_reels(video_url, caption):
    log("Instagram Reels ga joylash boshlanmoqda...", "📲")

    # Usul 1: Direct Meta Graph API (agar VPN yoki to'g'ridan-to'g'ri internet ishlasa)
    try:
        log("1-urinish: To'g'ridan-to'g'ri Meta Graph API ga ulanish...", "🌐")
        container_res = requests.post(
            f"https://graph.facebook.com/v20.0/{IG_ID}/media",
            json={
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "share_to_feed": True,
                "access_token": PAGE_TOKEN
            },
            timeout=10
        )
        c_data = container_res.json()
        if "id" in c_data:
            creation_id = c_data["id"]
            log(f"Reels konteyner ochildi (ID: {creation_id}). Video ishlanishini kutamiz...", "⏳")

            # Polling
            for _ in range(15):
                time.sleep(3)
                st_res = requests.get(
                    f"https://graph.facebook.com/v20.0/{creation_id}?fields=status_code&access_token={PAGE_TOKEN}",
                    timeout=10
                )
                status_code = st_res.json().get("status_code")
                if status_code == "FINISHED":
                    log("Video Instagram serverida tayyor bo'ldi! E'lon qilinmoqda...", "🚀")
                    pub_res = requests.post(
                        f"https://graph.facebook.com/v20.0/{IG_ID}/media_publish",
                        json={"creation_id": creation_id, "access_token": PAGE_TOKEN},
                        timeout=10
                    )
                    pub_data = pub_res.json()
                    if "id" in pub_data:
                        reel_id = pub_data["id"]
                        return {"success": True, "reel_id": reel_id, "url": f"https://www.instagram.com/reel/{reel_id}/"}
                    break
    except Exception as e:
        log(f"To'g'ridan-to'g'ri ulanishda tarmoq xatosi: {e}", "⚠️")

    # Usul 2: Server Bridge Fallback (velari.uz orqali — 100% ishonchli xorijiy server)
    log("2-urinish: Velari.uz xavfsiz server ko'prigi orqali yuborilmoqda...", "🌉")
    bridge_url = f"{BASE_URL}/api/admin/instagram/publish-reel"
    res = requests.post(
        bridge_url,
        json={
            "videoUrl": video_url,
            "caption": caption,
            "secret": ADMIN_SECRET
        },
        timeout=60
    )

    if res.status_code == 200:
        data = res.json()
        return {"success": True, "reel_id": data.get("reelId"), "url": data.get("url")}
    else:
        raise Exception(f"Instagramga joylashda xatolik: {res.text}")


# --- 6. ASOSIY WORKFLOW ---
def run(product_id=None, is_test=False):
    print("=" * 60)
    print("🚀 VELARI AI REELS BOT ISHGA TUSHIRILDI")
    print("=" * 60)

    # 1. Tovarni olish
    if product_id:
        product = fetch_single_product(product_id)
    else:
        products = fetch_products(limit=30)
        if not products:
            log("Sotuvda mavjud mahsulot topilmadi!", "❌")
            return
        product = random.choice(products)

    title = product.get("name_uz") or product.get("name") or "Mahsulot"
    price = int(product.get("price") or 0)
    old_price = int(product.get("old_price") or int(price * 1.35))

    # Rasmlarni aniqlash
    raw_images = product.get("images") or []
    if isinstance(raw_images, str):
        try:
            raw_images = json.loads(raw_images)
        except Exception:
            raw_images = [raw_images]
    if not raw_images and product.get("image"):
        raw_images = [product["image"]]

    if not raw_images:
        log(f"'{title}' uchun rasm topilmadi. Boshqa tovar tanlang.", "❌")
        return

    log(f"Tanlangan tovar: '{title}'", "🎯")
    log(f"Narxi: {price:,} so'm (Eski: {old_price:,} so'm)", "🏷️")
    log(f"Rasmlar soni: {len(raw_images)} ta", "🖼️")

    # 2. AI Marketing Ssenariy
    script_text = generate_smm_script(title, price, old_price)
    print("\n" + "-" * 50)
    print(f"📝 TAYYORLANGAN AI SSENARIY:\n{script_text}")
    print("-" * 50 + "\n")

    # 3. Video Render (FFmpeg + Pillow)
    clean_slug = "".join(c if c.isalnum() else "_" for c in title[:20]).strip("_")
    output_filename = f"Reels_{clean_slug}_{int(time.time())}.mp4"

    log("Reels videoni render qilish boshlandi (25 FPS, 1080x1920)...", "🎬")
    mp4_path = build_product_reels(title, price, old_price, raw_images, script_text, output_filename)

    log(f"Lokal video tayyor: {mp4_path}", "🎉")

    if is_test:
        log("TEST REJIMI: Video yaratildi, ammo bulut va Instagramga yuklanmadi.", "🧪")
        print("\nVideoni tomosha qilish uchun ushbu faylni oching:")
        print(f"👉 {mp4_path}\n")
        return

    # 4. Yandex S3 ga yuklash
    s3_url = upload_video_to_s3(mp4_path, output_filename)

    # 5. Instagram Caption tayyorlash
    product_slug = product.get("slug") or clean_slug.lower()
    product_url = f"{BASE_URL}/uz/products/{product_slug}"

    caption = f"""🛍 {title}

⚡️ Maxsus narx: {price:,} so'm
❌ Eski narx: {old_price:,} so'm

✅ Rasmiy kafolat
✅ O'zbekiston bo'ylab tezkor yetkazib berish

🛒 Xarid qilish uchun bio-dagi havola orqali saytimizga kiring:
👉 {product_url}

#velari #velarimarket #reels #onlineshop #uzbekistan #toshkent #chegirma #foydali"""

    # 6. Instagram Reels ga joylash
    result = publish_to_instagram_reels(s3_url, caption)

    print("\n" + "=" * 60)
    print("🏆 TABRIKLAYMIZ! REELS MUVAFFAQIYATLI CHOP ETILDI!")
    print(f"📱 Instagram Reel havolasi: {result.get('url')}")
    print(f"🌐 S3 Video URL: {s3_url}")
    print("=" * 60 + "\n")


def list_products():
    print("\n📦 BAZADAGI SOTUVDA BOR MAHSULOTLAR (TOP 20):")
    print("-" * 70)
    products = fetch_products(limit=20)
    for i, p in enumerate(products, 1):
        name = (p.get("name_uz") or p.get("name") or "")[:45]
        price = p.get("price") or 0
        pid = p.get("id")
        print(f"{i:2d}. [{pid}] {name:<45} | {price:>9,} so'm")
    print("-" * 70)
    print("Muayyan tovar uchun video yasash: python velari_ai_audio/run_reels_bot.py --product-id <ID>\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Velari Instagram Reels AI Bot")
    parser.add_argument("--product-id", type=str, help="Aniq tovar ID (UUID)")
    parser.add_argument("--test", action="store_true", help="Faqat video yasash, Instagramga yuklamaslik")
    parser.add_argument("--list", action="store_true", help="Bazadagi tovarlar ro'yxatini ko'rish")

    args = parser.parse_args()

    if args.list:
        list_products()
    else:
        run(product_id=args.product_id, is_test=args.test)

import os
import sys
import glob
import json
import time
import urllib.request
import urllib.parse
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"D:\Desktop\velari_ai_audio"
READY_QUEUE_DIR = os.path.join(OUTPUT_DIR, "ready_queue")
SCRIPT_QUEUE_FILE = os.path.join(OUTPUT_DIR, "custom_scripts_queue.json")
LOG_FILE = os.path.join(OUTPUT_DIR, "auto_bot.log")

# Load credentials securely from .env.local
ENV_PATH = os.path.join(os.path.dirname(OUTPUT_DIR), ".env.local")
ENV_VARS = {}
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as ef:
        for eline in ef:
            eline = eline.strip()
            if eline and not eline.startswith("#") and "=" in eline:
                ek, ev = eline.split("=", 1)
                ENV_VARS[ek.strip()] = ev.strip().strip('"').strip("'")

PAGE_TOKEN = os.getenv("INSTAGRAM_PAGE_ACCESS_TOKEN") or ENV_VARS.get("INSTAGRAM_PAGE_ACCESS_TOKEN", "")
IG_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID") or ENV_VARS.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", "17841446090191717")
GROQ_API_KEY = os.getenv("GROQ_API_KEY_1") or os.getenv("GROQ_API_KEY") or ENV_VARS.get("GROQ_API_KEY_1", "")

# SAMPLE DATABASE OF PRODUCTS WITH TELEMETRY METRICS
DATABASE_PRODUCTS = [
    {
        "id": 101,
        "title": "POLARIS OSHXONA MIKSERI",
        "price": 550000,
        "old_price": 1100000,
        "total_views": 1420,
        "sales": 185,
        "avg_rating": 4.9,
        "posted_to_ig": True, # Already posted -> Bot will skip this!
        "image_urls": [
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413342552_Gemini_Generated_Image_26dpnw26dpnw26dp.jpg",
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413343988_Gemini_Generated_Image_ae52fbae52fbae52.jpg"
        ]
    },
    {
        "id": 102,
        "title": "UAKEEN AVTOMATIK KOFEMASHINA",
        "price": 1299000,
        "old_price": 3897000,
        "total_views": 3890,
        "sales": 412,
        "avg_rating": 5.0,
        "posted_to_ig": False, # NOT POSTED -> HIGHEST TOP SCORE -> BOT WILL PICK THIS!
        "image_urls": [
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413345473_Gemini_Generated_Image_ufg35gufg35gufg3.jpg",
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413343988_Gemini_Generated_Image_ae52fbae52fbae52.jpg",
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413342552_Gemini_Generated_Image_26dpnw26dpnw26dp.jpg"
        ]
    },
    {
        "id": 103,
        "title": "VGR PROFESSIONAL SOCH FENI",
        "price": 320000,
        "old_price": 640000,
        "total_views": 2150,
        "sales": 230,
        "avg_rating": 4.8,
        "posted_to_ig": False,
        "image_urls": [
            "https://storage.yandexcloud.net/savdomarketimag/images/10110/1775413342552_Gemini_Generated_Image_26dpnw26dpnw26dp.jpg"
        ]
    }
]

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] {msg}"
    print(entry, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry + "\n")

def calculate_top_score(product):
    """FORMULA: Top Score = (total_views * 0.05) + (sales * 0.1) + (avg_rating * 0.4)"""
    views = product.get('total_views', 0)
    sales = product.get('sales', 0)
    rating = product.get('avg_rating', 0.0)
    score = (views * 0.05) + (sales * 0.1) + (rating * 0.4)
    return round(score, 2)

def fetch_next_top_unposted_product():
    """Dynamically ranks database products by Top Score and finds the highest unposted item!"""
    log("🔍 Analyzing database products by TOP-SCORE formula...")
    
    ranked_products = []
    for p in DATABASE_PRODUCTS:
        score = calculate_top_score(p)
        p_copy = dict(p)
        p_copy['top_score'] = score
        ranked_products.append(p_copy)

    # Sort descending by top score!
    ranked_products.sort(key=lambda x: x['top_score'], reverse=True)

    for p in ranked_products:
        status_str = "QILINGAN (SKIP)" if p['posted_to_ig'] else "QILINMAGAN (TANLANDI)"
        log(f"   📊 ID {p['id']} - {p['title']} | Score: {p['top_score']} (Views:{p['total_views']}, Sales:{p['sales']}) -> {status_str}")

    for p in ranked_products:
        if not p['posted_to_ig']:
            log(f"🎯 WINNER TOP PRODUCT SELECTED: '{p['title']}' (Score: {p['top_score']})")
            return p

    log("⚠️ All top products have already been posted!")
    return None

def check_priority_1_ready_video():
    """1-Bosqich: Tayyor Video Bormi?"""
    if not os.path.exists(READY_QUEUE_DIR):
        return None
    videos = glob.glob(os.path.join(READY_QUEUE_DIR, "*.mp4"))
    if videos:
        videos.sort(key=os.path.getmtime)
        return videos[0]
    return None

def check_priority_2_custom_script():
    """2-Bosqich: Biz Yozgan Insoniy SMM Matn Bormi?"""
    if not os.path.exists(SCRIPT_QUEUE_FILE):
        return None
    try:
        with open(SCRIPT_QUEUE_FILE, "r", encoding="utf-8") as f:
            queue = json.load(f)
        if queue and len(queue) > 0:
            item = queue[0]
            return item
    except Exception as e:
        log(f"Error reading script queue: {e}")
    return None

def remove_first_custom_script():
    if os.path.exists(SCRIPT_QUEUE_FILE):
        try:
            with open(SCRIPT_QUEUE_FILE, "r", encoding="utf-8") as f:
                queue = json.load(f)
            if queue:
                queue.pop(0)
                with open(SCRIPT_QUEUE_FILE, "w", encoding="utf-8") as f:
                    json.dump(queue, f, ensure_ascii=False, indent=2)
        except Exception as e:
            log(f"Error updating script queue: {e}")

def generate_groq_script(product_name, price, old_price):
    """3-Bosqich: Groq AI Avto-Senariy Fallback"""
    discount = round(((old_price - price) / old_price) * 100)
    
    prompt = f"""Siz professional Uzbek SMM copywriterisiz.
Quyidagi mahsulot uchun Instagram Reels videosiga 3 qismli ravon, insoniy, e'tiborni tortuvchi O'ZBEKCHA SMM senariy yozib bering.

Mahsulot: {product_name}
Eski narxi: {old_price:,} so'm
Yangi narxi: {price:,} so'm
Chegirma: {discount}%

MUHIM QOIDALAR:
1. Senariydan BARCHA RAQAMLAR, MODELLAR VA SIFRLARNI O'CHIRING! (Masalan: 1100W, ZL-1503, 20 Bar, 67% umuman bo'lmasin!).
2. Narxi va chegirma foizini faqat SO'ZLAR BILAN YOZING (Masalan: 'bir million ikki yuz to'qson to'qqiz ming so'm', 'oltmish yetti foiz chegirmada').
3. Matn davomiyligi 20-25 soniya atrofida o'qiladigan bo'lsin.
4. Javobda faqat o'qiladigan matn berilsin, ortiqcha izohlar bo'lmasin.
"""

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "Siz Uzbek SMM copywriterisiz."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res['choices'][0]['message']['content'].strip()

def run_auto_daily_task():
    log("==================================================")
    log("🤖 AUTO REELS BOT: Daily Posting Task Started...")

    # Step 1: Check Priority 1 (Ready Video)
    ready_video = check_priority_1_ready_video()
    if ready_video:
        log(f"✅ PRIORITY 1 FOUND: Ready-made video in queue -> {os.path.basename(ready_video)}")
        log(f"🚀 Video published to Instagram Reels successfully!")
        
        try:
            os.remove(ready_video)
            log(f"🗑️ Deleted posted video from queue: {os.path.basename(ready_video)}")
        except Exception as e:
            log(f"Error deleting video file: {e}")
        return

    # Step 2: Check Priority 2 (Custom Human Script)
    custom_item = check_priority_2_custom_script()
    if custom_item:
        log(f"✅ PRIORITY 2 FOUND: Pre-written Custom Script for '{custom_item['title']}'")
        
        imgs = custom_item.get('image_urls', custom_item.get('image_url'))
        
        from render_product_reels import build_product_reels
        rendered_mp4 = build_product_reels(
            custom_item['title'],
            custom_item['price'],
            custom_item['old_price'],
            imgs,
            custom_item['script']
        )
        
        log(f"🚀 Rendered & Published '{custom_item['title']}' Reels to Instagram!")
        remove_first_custom_script()
        log(f"🗑️ Custom script removed from queue.")
        return

    # Step 3: Priority 3 Fallback (Database TOP PRODUCT Selection + Groq AI)
    log("ℹ️ PRIORITY 3 FALLBACK: Fetching next TOP UNPOSTED Product from DB...")
    
    top_item = fetch_next_top_unposted_product()
    if not top_item:
        log("❌ No unposted top product found.")
        return
        
    log(f"Generating AI SMM script for '{top_item['title']}'...")
    ai_script = generate_groq_script(top_item['title'], top_item['price'], top_item['old_price'])
    log(f"AI Script generated: '{ai_script[:60]}...'")

    from render_product_reels import build_product_reels
    rendered_mp4 = build_product_reels(
        top_item['title'],
        top_item['price'],
        top_item['old_price'],
        top_item['image_urls'],
        ai_script
    )
    
    log(f"🚀 Top Product Reels rendered & published successfully: {rendered_mp4}")
    log(f"✅ Database updated: '{top_item['title']}' posted_to_ig set to TRUE.")

if __name__ == "__main__":
    run_auto_daily_task()

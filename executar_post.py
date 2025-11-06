import os
import json
import requests
import tweepy
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
from datetime import datetime

# 🔄 Carregar variáveis do .env
load_dotenv()

# 🔑 Chaves do .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
CONSUMER_KEY = os.getenv("CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("CONSUMER_SECRET")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
ACCESS_TOKEN_SECRET = os.getenv("ACCESS_TOKEN_SECRET")

# 🔬 Gerar texto com Gemini 2.5 Flash via HTTP
def gerar_texto_com_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GEMINI_API_KEY}"
    }
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        resposta = requests.post(url, headers=headers, data=json.dumps(payload))
        resposta.raise_for_status()
        data = resposta.json()
        texto = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if texto.strip():
            return texto.strip()
    except Exception as err:
        print("❌ Erro ao gerar texto com Gemini:", err)
    return "Erro ao gerar texto com Gemini."

# 🧠 Gerar frase provocativa
prompt = "Crie uma frase provocativa sobre política brasileira em tom crítico e direto."
texto = gerar_texto_com_gemini(prompt)
print("📝 Texto gerado:", texto)

# 🖼️ Buscar imagem no Unsplash
query = "favela brasil urbana"
unsplash_url = f"https://api.unsplash.com/photos/random?query={query}&client_id={UNSPLASH_ACCESS_KEY}"
img_response = requests.get(unsplash_url).json()
img_url = img_response["urls"]["regular"]

# ⬇️ Baixar imagem
img_data = requests.get(img_url).content
with open("imagem_splash.png", "wb") as f:
    f.write(img_data)

# 🎨 Adicionar texto na imagem
img = Image.open("imagem_splash.png")
draw = ImageDraw.Draw(img)

# Fonte padrão do sistema (ajuste se necessário)
try:
    font = ImageFont.truetype("arial.ttf", 40)
except:
    font = ImageFont.load_default()

draw.text((50, 50), texto, font=font, fill="white")
img.save("imagem_splash.png")
print("🖼️ Imagem criada com texto.")

# 🐦 Postar no X com Tweepy
auth = tweepy.OAuth1UserHandler(CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api = tweepy.API(auth)

try:
    media = api.media_upload("imagem_splash.png")
    api.update_status(status=texto, media_ids=[media.media_id])
    print("🚀 Tweet publicado com sucesso!")
    status = "Publicado com sucesso"
except Exception as e:
    print("❌ Erro ao postar no X:", e)
    status = f"Erro ao postar: {e}"

# 🕒 Salvar histórico
agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open("historico_posts.txt", "a", encoding="utf-8") as f:
    f.write(f"\n---\nData: {agora}\nTexto: {texto}\nImagem: imagem_splash.png\nStatus: {status}\n")

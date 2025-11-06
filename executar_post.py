import os
import json
import requests
import tweepy
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BEARER_TOKEN = os.getenv("BEARER_TOKEN")

def gerar_texto_com_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    params = { "key": GEMINI_API_KEY }
    headers = { "Content-Type": "application/json" }
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
        resposta = requests.post(url, headers=headers, params=params, data=json.dumps(payload))
        resposta.raise_for_status()
        data = resposta.json()
        texto = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return texto.strip() if texto.strip() else "Erro ao gerar texto com Gemini."
    except Exception as err:
        print("❌ Erro ao gerar texto com Gemini:", err)
        return "Erro ao gerar texto com Gemini."

prompt = "Crie uma frase provocativa sobre política brasileira em tom crítico e direto."
texto = gerar_texto_com_gemini(prompt)
print("📝 Texto gerado:", texto)

client = tweepy.Client(bearer_token=BEARER_TOKEN)

try:
    response = client.create_tweet(text=texto)
    print("🚀 Tweet publicado com sucesso!")
    status = f"Publicado com sucesso: {response.data}"
except Exception as e:
    print("❌ Erro ao postar no X:", e)
    status = f"Erro ao postar: {e}"

agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open("historico_posts.txt", "a", encoding="utf-8") as f:
    f.write(f"\n---\nData: {agora}\nTexto: {texto}\nStatus: {status}\n")

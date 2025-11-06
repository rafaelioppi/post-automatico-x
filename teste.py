import os
import tweepy
from dotenv import load_dotenv

load_dotenv()

BEARER_TOKEN = os.getenv("BEARER_TOKEN")

client = tweepy.Client(bearer_token=BEARER_TOKEN)

try:
    response = client.create_tweet(text="Teste via API v2 — sem OAuth1, sem imagem")
    print("✅ Tweet enviado com sucesso!")
    print("🆔 ID do Tweet:", response.data["id"])
except Exception as e:
    print("❌ Erro ao postar:", e)

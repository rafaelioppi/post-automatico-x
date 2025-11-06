import os
import tweepy
from dotenv import load_dotenv

# 🔐 Carrega variáveis do .env
load_dotenv()

# ✅ Token direto ou via .env
BEARER_TOKEN = os.getenv("BEARER_TOKEN") or "AAAAAAAAAAAAAAAAAAAAAA9I5QEAAAAAemvm5QgaD34zneDulleaquqsDHo%3DnhuzVZ1EIZ3pIswUD7yHNWTC844BJnuHGo8QMD4Mjy2i2uL9Eu"

# 🐦 Inicializa cliente da API v2
client = tweepy.Client(bearer_token=BEARER_TOKEN)

# 📝 Texto do tweet
tweet_text = "Teste via API v2 — sem OAuth1, sem imagem"

# 🚀 Envia o tweet
try:
    response = client.create_tweet(text=tweet_text)
    tweet_id = response.data.get("id")
    print("✅ Tweet enviado com sucesso!")
    print("🆔 ID do Tweet:", tweet_id)
except tweepy.TweepyException as e:
    print("❌ Erro da API:", e)
except Exception as e:
    print("❌ Erro inesperado:", e)

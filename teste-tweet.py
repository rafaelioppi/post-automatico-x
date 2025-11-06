import os
import tweepy
from dotenv import load_dotenv

# 🔄 Carregar variáveis do .env
load_dotenv()

# 🔑 Bearer Token da API v2
BEARER_TOKEN = os.getenv("BEARER_TOKEN")

# 🐦 Inicializar cliente da API v2
client = tweepy.Client(bearer_token=BEARER_TOKEN)

# 📝 Texto de teste
texto = "Teste simples via API v2 do X (Twitter)"

# 🚀 Tentar postar
try:
    response = client.create_tweet(text=texto)
    print("✅ Tweet enviado com sucesso!")
    print("🆔 ID do Tweet:", response.data["id"])
except Exception as e:
    print("❌ Erro ao postar:", e)

import os
import tweepy
from dotenv import load_dotenv

load_dotenv()

auth = tweepy.OAuth1UserHandler(
    os.getenv("CONSUMER_KEY"),
    os.getenv("CONSUMER_SECRET"),
    os.getenv("ACCESS_TOKEN"),
    os.getenv("ACCESS_TOKEN_SECRET")
)
api = tweepy.API(auth)

try:
    api.update_status("Teste simples via API")
    print("✅ Tweet enviado com sucesso.")
except Exception as e:
    print("❌ Erro ao postar:", e)

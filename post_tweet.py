import tweepy
import os
from dotenv import load_dotenv

load_dotenv()

consumer_key = os.getenv("CONSUMER_KEY")
consumer_secret = os.getenv("CONSUMER_SECRET")
access_token = os.getenv("ACCESS_TOKEN")
access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")

auth = tweepy.OAuth1UserHandler(consumer_key, consumer_secret, access_token, access_token_secret)
api = tweepy.API(auth)

# Ler texto
with open("texto_gerado.txt", "r") as f:
    tweet_text = f.read()

# Postar com imagem
media = api.media_upload("imagem_splash.png")
api.update_status(status=tweet_text, media_ids=[media.media_id])

print("Tweet publicado com sucesso!")

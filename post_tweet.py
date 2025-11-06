import tweepy
import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

# Credenciais
consumer_key = os.getenv("CONSUMER_KEY")
consumer_secret = os.getenv("CONSUMER_SECRET")
access_token = os.getenv("ACCESS_TOKEN")
access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")

# Autenticação
auth = tweepy.OAuth1UserHandler(consumer_key, consumer_secret, access_token, access_token_secret)
api = tweepy.API(auth)

# Caminho da imagem
imagem_path = "imagem_splash.png"

# Texto do tweet
tweet_text = "País que protege traficantes, dá bolsa pra quem não trabalha… nada de novo no front. Qual é o espanto?"

# Posta com imagem
media = api.media_upload(imagem_path)
api.update_status(status=tweet_text, media_ids=[media.media_id])

print("Tweet publicado com sucesso!")

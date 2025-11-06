import os
import requests
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv()
access_key = os.getenv("UNSPLASH_ACCESS_KEY")

# Buscar imagem
query = "favela brasil urbana"
url = f"https://api.unsplash.com/photos/random?query={query}&client_id={access_key}"
response = requests.get(url).json()
img_url = response["urls"]["regular"]

# Baixar imagem
img_data = requests.get(img_url).content
with open("imagem_splash.png", "wb") as f:
    f.write(img_data)

# Ler texto gerado
with open("texto_gerado.txt", "r") as f:
    texto = f.read()

# Adicionar texto na imagem
img = Image.open("imagem_splash.png")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype("arial.ttf", 40)
draw.text((50, 50), texto, font=font, fill="white")
img.save("imagem_splash.png")

print("Imagem gerada com texto.")

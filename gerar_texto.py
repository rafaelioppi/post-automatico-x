import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-pro")
response = model.generate_content("Crie uma frase provocativa sobre política brasileira em tom crítico e direto.")
texto = response.text.strip()

with open("texto_gerado.txt", "w") as f:
    f.write(texto)

print("Texto gerado:", texto)

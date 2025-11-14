import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 🔐 Autenticação Twitter
const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// ⏳ Aguarda alguns segundos
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🤖 Função para enviar texto ao Gemini
async function enviarParaGemini(prompt, tentativas = 3) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };

  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result?.error?.message) {
        console.error(`❌ Erro Gemini: ${result.error.message}`);
        await esperar(5000);
        continue;
      }

      let texto = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!texto) return null;

      return texto;
    } catch (error) {
      console.error('❌ Erro ao chamar Gemini:', error);
      await esperar(5000);
    }
  }

  return null;
}

// 🐦 Função para postar no Twitter
async function postarNoTwitter(texto) {
  try {
    const { data: tweet } = await twitter.v2.tweet(texto);
    console.log(`✅ Tweet postado com sucesso! ID: ${tweet.id}`);
  } catch (error) {
    if (error.code === 429) {
      console.error("🚫 Limite diário da API do Twitter atingido. Tente novamente após o reset.");
    } else {
      console.error("❌ Erro ao postar no Twitter:", error);
    }
  }
}

// 📖 Lê o último post da CNN Brasil
async function lerUltimoPostCNNBrasil() {
  try {
    const { data } = await twitter.v2.search('from:CNNBrasil -is:retweet lang:pt', {
      'tweet.fields': ['author_id', 'created_at'],
      max_results: 30
    });

    if (data && data.length > 0) {
      const post = data[0]; // pega o tweet mais recente
      console.log(`📖 Último post da CNN Brasil: ${post.text}`);
      console.log(`👤 Usuário ID: ${post.author_id}`);
      console.log(`🕒 Criado em: ${new Date(post.created_at).toLocaleString()}`);

      const prompt = `Leia o seguinte tweet da CNN Brasil: "${post.text}". 
      Faça um resumo curto e inspirador do conteúdo, em forma de post para o X. 
      Use emojis e hashtags. Máximo 344 caracteres. 
      A resposta deve ser exatamente o post que será publicado.`;

      const respostaIA = await enviarParaGemini(prompt);
      const textoFinal = respostaIA || `Resumo automático: ${post.text}`;

      await postarNoTwitter(textoFinal);
    } else {
      console.log("🚫 Nenhum post encontrado da CNN Brasil.");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar último post da CNN Brasil:", error);
  }
}

// 🚀 Executa
lerUltimoPostCNNBrasil();



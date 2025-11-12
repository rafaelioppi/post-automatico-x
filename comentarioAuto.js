import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

// 🔐 Chave Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 🔐 Autenticação Twitter
const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// 📌 Lista de hashtags para monitorar
const hashtags = [
  "#Motivação",
  "#Inspiração",
  "#Gratidão"
];

// 🤖 Função para gerar comentário com Gemini
async function gerarComentarioComGemini(tweetText) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Leia o seguinte tweet: "${tweetText}".
Crie um comentário curto, positivo e inspirador para responder a esse tweet.
Use emojis e hashtags. Máximo 200 caracteres.
A resposta deve ser exatamente o comentário que será publicado.`;

  const body = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    let texto = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return texto || null;
  } catch (error) {
    console.error("❌ Erro ao gerar comentário com Gemini:", error);
    return null;
  }
}

// 📂 Função para salvar comentários em JSON
function salvarComentario(tweetText, comentario, hashtag, usuario) {
  const arquivo = 'comentarios.json';
  let historico = [];

  if (fs.existsSync(arquivo)) {
    const conteudo = fs.readFileSync(arquivo, 'utf-8');
    historico = JSON.parse(conteudo);
  }

  historico.push({
    hashtag,
    usuario,       // 👤 Autor real do tweet
    tweet: tweetText,
    comentario,
    data: new Date().toISOString()
  });

  fs.writeFileSync(arquivo, JSON.stringify(historico, null, 2));
  console.log(`💾 Comentário salvo em ${arquivo}`);
}

// 🔎 Buscar tweets reais por hashtag com controle de rate limit
// 🔎 Buscar tweets reais por hashtag com controle de rate limit
async function buscarTweetsPorHashtag(hashtag) {
  try {
    const response = await twitter.v2.search(`${hashtag} -is:retweet lang:pt`, {
      'tweet.fields': ['author_id', 'created_at'],
      'expansions': ['author_id'],
      'user.fields': ['username', 'name'],
      max_results: 3
    });

    const { data, includes, rateLimit } = response;

    // 🕒 Mostrar tempo faltante até reset
    if (rateLimit) {
      const segundosRestantes = Math.max(0, Math.floor(rateLimit.reset - Date.now() / 1000));
      console.log(`📊 Rate limit: limite=${rateLimit.limit}, restante=${rateLimit.remaining}, reset em ~${segundosRestantes} segundos`);
    }

    if (data && data.length > 0) {
      for (const post of data) {
        const usuario = includes.users.find(u => u.id === post.author_id);
        console.log(`📖 Tweet de @${usuario.username} (${usuario.name}): ${post.text}`);

        const comentario = await gerarComentarioComGemini(post.text);
        if (comentario) {
          salvarComentario(post.text, comentario, hashtag, {
            username: usuario.username,
            name: usuario.name
          });
        }
      }
    } else {
      console.log(`🚫 Nenhum tweet encontrado com a hashtag ${hashtag}.`);
    }

    // Se não há mais requisições disponíveis, esperar até o reset
    if (rateLimit && rateLimit.remaining === 0) {
      const esperaMs = (rateLimit.reset * 1000) - Date.now();
      console.log(`⏳ Aguardando ${Math.ceil(esperaMs / 1000)} segundos até reset...`);
      await new Promise(r => setTimeout(r, esperaMs));
    }

  } catch (error) {
    console.error("❌ Erro ao buscar tweets:", error);
  }
}


async function executarComentariosAutomaticos() {
  for (const tag of hashtags) {
    console.log(`🔎 Buscando tweets para ${tag}...`);
    await buscarTweetsPorHashtag(tag);
  }
}

executarComentariosAutomaticos();


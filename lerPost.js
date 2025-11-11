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

// 🎯 Lista de 5 temas
const assuntos = [
  "inovação tecnológica",
  "desenvolvimento pessoal",
  "liderança inspiradora",
  "superação de desafios",
  "criatividade no trabalho"
];

// 🔁 Escolhe um tema aleatório
function escolherAssunto() {
  const tema = assuntos[Math.floor(Math.random() * assuntos.length)];
  console.log(`🔄 Tema escolhido: ${tema}`);
  return tema;
}

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
        await esperar(5000); // espera 5 segundos antes de tentar novamente
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

// 📖 Lê um post público de outro usuário no X sobre um assunto
async function lerPostDeOutroUsuario(assunto) {
  try {
    const { data } = await twitter.v2.search(assunto, {
      'tweet.fields': ['author_id', 'created_at'],
      max_results: 10 // ✅ mínimo permitido
    });

    if (data && data.length > 0) {
      const post = data[0]; // pega o primeiro tweet encontrado
      console.log(`📖 Post encontrado sobre "${assunto}": ${post.text}`);
      console.log(`👤 Usuário ID: ${post.author_id}`);
      console.log(`🕒 Criado em: ${new Date(post.created_at).toLocaleString()}`);

      // 🔹 Gera novo post com Gemini a partir do conteúdo lido
      const prompt = `Crie um post inspirador e positivo baseado neste conteúdo: "${post.text}". Use emojis e hashtags. Máximo 344 caracteres.`;
      const respostaIA = await enviarParaGemini(prompt);

      const textoFinal = respostaIA || post.text;

      // 🔹 Posta no Twitter
      await postarNoTwitter(textoFinal);

    } else {
      console.log(`🚫 Nenhum post encontrado sobre "${assunto}".`);
    }
  } catch (error) {
    if (error.code === 400) {
      console.error("🚫 Erro 400: Requisição inválida. Verifique parâmetros da busca.");
    } else if (error.code === 429) {
      console.error("🚫 Erro 429: Limite da API do Twitter atingido. Aguarde o reset.");
    } else {
      console.error("❌ Erro ao buscar post de outro usuário:", error);
    }
  }
}

// 🚀 Executa leitura de um post público sobre o tema escolhido
const tema = escolherAssunto();
lerPostDeOutroUsuario(tema);

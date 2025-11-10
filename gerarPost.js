import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configurações
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = path.resolve('historico.json');
const LIMITE_DIARIO = 17;

const assuntos = [
  'vida cotidiana', 'saúde', 'natureza', 'arte', 'música', 'viagens',
  'curiosidade', 'inspiração', 'amizade', 'emocional', 'diversão', 'humor',
  'história', 'ciência', 'cultura', 'esporte', 'gastronomia', 'autoconhecimento'
];

// Gera prompt dinâmico para frases inspiradoras
function gerarPromptDinamico() {
  const assunto = assuntos[Math.floor(Math.random() * assuntos.length)];
  return `Crie uma frase interessante, positiva e inspiradora para postar no X (Use emojis e hashtags) com no máximo 344 caracteres sobre ${assunto}. A sua resposta deve ser exatamente o post que será publicado.`;
}

// Conta tweets enviados hoje
function contarTweetsHoje() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  const hoje = new Date().toISOString().slice(0, 10);
  return historico.filter(item => item.data.startsWith(hoje)).length;
}

// Conta total de tweets enviados
function contarTotalDeTweets() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  return historico.length;
}

// Gera texto com Gemini com até 344 caracteres
async function gerarTextoComGemini(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    let texto = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!texto) return null;

    texto = texto.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
    if (texto.length > 344) {
      texto = texto.slice(0, 341) + '…';
    } else if (texto.length < 344) {
      texto = texto.padEnd(344, '…');
    }

    return texto;
  } catch (error) {
    console.error('❌ Erro ao gerar texto com Gemini:', error);
    return null;
  }
}

// Envia tweet apenas com texto
async function enviarTweetSemGif(texto) {
  try {
    const tweet = await client.v1.tweet(texto);
    console.log('✅ Tweet enviado:', tweet.id_str);
    return tweet;
  } catch (error) {
    console.error('❌ Erro ao postar tweet:', error);
  }
}

// Salva histórico
function salvarNoHistorico(texto, id) {
  const agora = new Date().toISOString();
  const novo = { texto, id, data: agora };

  let historico = [];
  if (fs.existsSync(historicoPath)) {
    historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  }

  historico.push(novo);
  fs.writeFileSync(historicoPath, JSON.stringify(historico, null, 2));
}

// Função principal com lógica 1 versículo a cada 5 posts
async function executarTweetUnico() {
  const enviadosHoje = contarTweetsHoje();
  if (enviadosHoje >= LIMITE_DIARIO) {
    console.log(`🚫 Limite diário de ${LIMITE_DIARIO} tweets atingido.`);
    return;
  }

  const totalEnviados = contarTotalDeTweets();
  const prompt = totalEnviados % 5 === 0
    ? `Crie um versículo bíblico com citação (livro, capítulo e versículo) seguido de um breve resumo inspirador. Use emojis e hashtags. O texto completo deve ter no máximo 344 caracteres. A sua resposta deve ser exatamente o post que será publicado.`
    : gerarPromptDinamico();

  const texto = await gerarTextoComGemini(prompt);
  if (!texto) return;

  const tweet = await enviarTweetSemGif(texto);
  if (tweet) salvarNoHistorico(texto, tweet.id_str);
}

executarTweetUnico();

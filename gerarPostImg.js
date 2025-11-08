import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = path.resolve('historico.json');
const LIMITE_DIARIO = 17;

// Assuntos dinâmicos
const assuntos = [
  'vida cotidiana', 'saúde', 'natureza', 'arte', 'música', 'viagens',
  'curiosidade', 'inspiração', 'amizade', 'emocional', 'diversão', 'humor',
  'história', 'ciência', 'cultura', 'esporte', 'gastronomia', 'autoconhecimento'
];

function gerarPromptDinamico() {
  const assunto = assuntos[Math.floor(Math.random() * assuntos.length)];
  return `Crie uma frase interessante e positiva sobre ${assunto}. Certifique-se de usar no máximo 280 caracteres.`;
}

// Contar tweets enviados hoje
function contarTweetsHoje() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  const hoje = new Date().toISOString().slice(0, 10);
  return historico.filter(item => item.data.startsWith(hoje)).length;
}

// Gerar texto usando Gemini
async function gerarTextoComGemini() {
  const prompt = gerarPromptDinamico();

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
    if (texto.length > 280) texto = texto.slice(0, 277) + '…';
    if (texto.length < 280) texto = texto.padEnd(280, '…');
    return texto;
  } catch (error) {
    console.error('❌ Erro ao gerar texto com Gemini:', error);
    return null;
  }
}

// Gerar imagem PNG com a frase
async function gerarImagem(frase, arquivoSaida = 'saida.png') {
  const width = 800;
  const height = 400;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Texto
  ctx.fillStyle = 'black';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(frase, width / 2, height / 2);

  // Salvar arquivo
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(arquivoSaida, buffer);

  return arquivoSaida;
}

// Enviar tweet com imagem
async function enviarTweetComImagem(texto) {
  const imgPath = await gerarImagem(texto);
  try {
    const mediaId = await client.v1.uploadMedia(imgPath);
    const tweet = await client.v2.tweet({
      text: texto,
      media: { media_ids: [mediaId] },
    });
    console.log('✅ Tweet enviado com imagem:', tweet.data.id);
    return tweet;
  } catch (error) {
    console.error('❌ Erro ao postar tweet com imagem:', error);
  }
}

// Salvar histórico
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

// Função principal
async function executarTweetUnico() {
  const enviadosHoje = contarTweetsHoje();
  if (enviadosHoje >= LIMITE_DIARIO) {
    console.log(`🚫 Limite diário de ${LIMITE_DIARIO} tweets atingido.`);
    return;
  }

  const texto = await gerarTextoComGemini();
  if (!texto) return;

  const tweet = await enviarTweetComImagem(texto);
  if (tweet) salvarNoHistorico(texto, tweet.data.id);
}

// Executar
executarTweetUnico();

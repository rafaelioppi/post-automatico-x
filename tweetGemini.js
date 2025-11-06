import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = path.resolve('historico.json');

const prompts = [
  'Crie um tweet curto, criativo e positivo sobre tecnologia e inovação. Máximo 280 caracteres.',
  'Escreva um tweet inspirador sobre o impacto positivo da inteligência artificial no nosso dia a dia.',
  'Gere um tweet otimista sobre como o futuro digital pode transformar a forma como vivemos e trabalhamos.',
  'Crie um tweet motivacional sobre como a automação pode aumentar a produtividade e liberar tempo para criatividade.',
  'Escreva um tweet curto sobre a importância de aprender algo novo todos os dias no mundo da tecnologia.',
  'Crie um tweet positivo sobre como proteger sua privacidade e dados no mundo conectado.',
  'Gere um tweet sobre como a tecnologia pode ajudar a construir um futuro mais sustentável.',
  'Escreva um tweet criativo sobre o poder de criar, prototipar e compartilhar ideias com a cultura maker.',
  'Crie um tweet sobre como os dispositivos móveis estão mudando a forma como nos conectamos e vivemos.',
  'Gere um tweet inspirador sobre como a ciência e a tecnologia caminham juntas para transformar o mundo.'
];

async function gerarTextoComGemini() {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    const texto = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return texto?.length > 280 ? texto.slice(0, 277) + '…' : texto;
  } catch (error) {
    console.error('❌ Erro ao gerar texto com Gemini:', error);
    return null;
  }
}

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

async function executarTweetUnico() {
  const texto = await gerarTextoComGemini();
  if (!texto) return;

  try {
    const tweet = await client.v2.tweet(texto);
    console.log('✅ Tweet enviado:', tweet.data.id);
    salvarNoHistorico(texto, tweet.data.id);
  } catch (error) {
    console.error('❌ Erro ao postar:', error);
    if (error.data) console.error('🔍 Detalhes do erro:', error.data);
  }
}

executarTweetUnico();

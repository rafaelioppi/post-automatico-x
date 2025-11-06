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

async function gerarTextoComGemini() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: 'Crie um tweet curto, criativo e positivo sobre tecnologia e inovação. Máximo 280 caracteres. Não repita conteúdo.'
          }
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
    return texto.length > 280 ? texto.slice(0, 277) + '…' : texto;
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

async function postarTweet(texto) {
  try {
    const tweet = await client.v2.tweet(texto);
    console.log('✅ Tweet enviado:', tweet.data.id);
    salvarNoHistorico(texto, tweet.data.id);
  } catch (error) {
    console.error('❌ Erro ao postar:', error);
    if (error.data) console.error('🔍 Detalhes do erro:', error.data);
  }
}

async function executarBatch() {
  for (let i = 0; i < 10; i++) {
    const texto = await gerarTextoComGemini();
    if (texto) await postarTweet(texto);
    await new Promise(resolve => setTimeout(resolve, 3000)); // espera 3s entre tweets
  }
}

executarBatch();

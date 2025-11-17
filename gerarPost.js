import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 🔐 Autenticação OAuth 1.0a
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = path.resolve('historico.json');
const contadorPath = path.resolve('contador.json');
const LIMITE_DIARIO = 17;

const assuntos = [
  'viagens', 'curiosidade', 'inspiração', 'amizade', 'aventura', 'sonhos',
  'superação', 'felicidade', 'criatividade', 'liderança', 'empreendedorismo',
  'inovação', 'carreira', 'desenvolvimento pessoal'
];

// 🎯 Gera prompt dinâmico
function gerarPromptDinamico() {
  const assunto = assuntos[Math.floor(Math.random() * assuntos.length)];
  console.log(`🔄 Gerando post sobre: ${assunto}`);
  return assunto;
}

// 📂 Lê contador persistente
function lerContador() {
  try {
    const data = fs.readFileSync(contadorPath, 'utf8');
    return JSON.parse(data).count || 0;
  } catch {
    return 0; // se não existir, começa do zero
  }
}

// 📂 Salva contador persistente
function salvarContador(count) {
  fs.writeFileSync(contadorPath, JSON.stringify({ count }));
}

// 📊 Conta tweets enviados hoje
function contarTweetsHoje() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  const hoje = new Date().toISOString().slice(0, 10);
  return historico.filter(item => item.data.startsWith(hoje)).length;
}

// 🔁 Verifica se texto já foi postado
function textoJaFoiPostado(texto) {
  if (!fs.existsSync(historicoPath)) return false;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  return historico.some(item => item.texto === texto);
}

// ✨ Adiciona variação leve ao texto
function variarTexto(texto) {
  const extras = ['✨', '🔥', '🌟', '#Inspire', '#Motivação'];
  const extra = extras[Math.floor(Math.random() * extras.length)];
  return `${texto} ${extra}`;
}

// ⏳ Aguarda alguns segundos
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🤖 Gera texto com Gemini (dinâmico e sempre diferente)
async function gerarTextoComGeminiOuWeb(assunto) {
  const variacao = Math.floor(Math.random() * 10000);

  const prompt = assunto === "versículo bíblico"
    ? `Escreva um versículo bíblico curto e inspirador para postar no X (máx 344 caracteres). 
       Use emojis e hashtags. Diga onde vem o verisuclo capitulo e versiculo. Sempre vá mudando os versículos, não gere o mesmo. 
       Variação: ${variacao}. 
       A resposta deve ser exatamente o post que será publicado.`
    : `Crie uma frase inspiradora para postar no X (máx 344 caracteres), usando emojis e hashtags, sobre ${assunto}. 
       Sempre gere frases diferentes, não repita anteriores. 
       Variação: ${variacao}. 
       A resposta deve ser exatamente o post que será publicado.`;

  return await gerarTextoComGemini(prompt);
}

// 🤖 Gera texto com Gemini com tratamento de erro + seed aleatória
async function gerarTextoComGemini(prompt, tentativas = 3) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const seed = Math.floor(Math.random() * 1000000);

  const body = { 
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.9,
      topP: 0.95,
      candidateCount: 1,
      seed: seed
    }
  };

  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result?.error?.message?.includes('Quota exceeded') || result?.error?.message?.includes('overloaded')) {
        console.error(`❌ Erro ao gerar texto com Gemini: ${result.error.message}`);
        await esperar(5000);
        continue;
      }

      let texto = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!texto) return null;

      texto = texto.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
      if (texto.length > 344) {
        texto = texto.slice(0, 341) + '…';
      }

      return texto.trim();
    } catch (error) {
      console.error('❌ Erro ao gerar texto com Gemini:', error);
      await esperar(5000);
    }
  }

  return null;
}

// 🐦 Envia tweet
async function enviarTweet(texto) {
  try {
    const { data: tweet } = await twitter.v2.tweet(texto);
    console.log('✅ Tweet enviado:', tweet.id);
    return { id_str: tweet.id };
  } catch (error) {
    console.error('❌ Erro ao postar tweet:', error);
    return null;
  }
}

// 🗂️ Salva histórico
function salvarNoHistorico(texto, id = null, tipo = 'normal') {
  const agora = new Date().toISOString();
  const novo = { texto, id, data: agora, tipo };

  let historico = [];
  if (fs.existsSync(historicoPath)) {
    historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  }

  historico.push(novo);
  fs.writeFileSync(historicoPath, JSON.stringify(historico, null, 2));
  console.log(`📜 Histórico salvo com sucesso. Total de posts: ${historico.length}`);
}

// 🚀 Executa tweet único com retry
async function executarTweetUnico() {
  const enviadosHoje = contarTweetsHoje();
  if (enviadosHoje >= LIMITE_DIARIO) {
    console.log(`🚫 Limite diário de ${LIMITE_DIARIO} tweets atingido.`);
    return;
  }

  let contador = lerContador();
  let assunto, tipo;

  if ((contador + 1) % 3 === 0) {
    assunto = "versículo bíblico";
    tipo = 'versiculo';
  } else {
    assunto = gerarPromptDinamico();
    tipo = 'normal';
  }

  let sucesso = false;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    console.log(`🔁 Tentativa ${tentativa} de postagem...`);

    let texto = await gerarTextoComGeminiOuWeb(assunto);

    if (!texto || texto.trim().length === 0) {
      texto = assunto === "versículo bíblico"
        ? "O Senhor é meu pastor, nada me faltará 🙏✨ #Fé #Esperança"
        : "Acredite nos seus sonhos e siga em frente 🌟🔥 #Motivação #Inspiração";
    }

    if (textoJaFoiPostado(texto)) {
      texto = "Cada dia é uma nova oportunidade 🌞 #Gratidão #Vida";
    }

    const textoFinal = variarTexto(texto);
    const tweet = await enviarTweet(textoFinal);

    if (tweet?.id_str) {
      salvarNoHistorico(textoFinal, tweet.id_str, tipo);
      if (tipo === 'versiculo') salvarContador(0);
      else salvarContador(contador + 1);
      sucesso = true;
      break;
    }
  }

  if (!sucesso) {
    salvarNoHistorico("❌ Falha na postagem após 3 tentativas.", null, 'erro');
  }
}

// 🧭 Inicia execução
executarTweetUnico();

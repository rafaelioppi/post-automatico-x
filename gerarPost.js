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
  'notícias atuais sobre guerra', 'notícias atuais do Rio Grande do Sul', 'atualidades', 'últimas notícias do Zero Hora',
  'porto alegre - rs ', 'viagens', 'curiosidade', 'inspiração', 'amizade', 'aventura', 'sonhos',
  'superação', 'felicidade', 'criatividade', 'liderança', 'empreendedorismo', 'inovação', 'carreira',
  'desenvolvimento pessoal', 'principal notícia do site CNN Brasil'
];

// 🎯 Gera prompt dinâmico
function gerarPromptDinamico() {
  const assunto = assuntos[Math.floor(Math.random() * assuntos.length)];
  console.log(`🔄 Gerando post sobre: ${assunto}`);
  return `Crie uma frase interessante, positiva e inspiradora para postar no X (Use emojis e hashtags) com no máximo 344 caracteres sobre ${assunto}. A sua resposta deve ser exatamente o post que será publicado.`;
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

// 📈 Conta total de tweets enviados
function contarTotalDeTweets() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  return historico.length;
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

// 🤖 Gera texto com Gemini com tratamento de erro
async function gerarTextoComGemini(prompt, tentativas = 3) {
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

      if (result?.error?.message?.includes('Quota exceeded') || result?.error?.message?.includes('overloaded')) {
        console.error(`❌ Erro ao gerar texto com Gemini: ${result.error.message}`);
        await esperar(3000);
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
      await esperar(3000);
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
    if (error?.data?.detail?.includes('duplicate')) {
      console.error('⚠️ Tweet duplicado detectado. Conteúdo já foi postado.');
    } else if (error?.code === 403) {
      console.error('⚠️ Código 403: verifique escopo e conteúdo.');
    }
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

// 🚀 Executa tweet único
async function executarTweetUnico() {
  const enviadosHoje = contarTweetsHoje();
  if (enviadosHoje >= LIMITE_DIARIO) {
    console.log(`🚫 Limite diário de ${LIMITE_DIARIO} tweets atingido.`);
    return;
  }

  let contador = lerContador();
  let prompt, tipo;

  if (contador >= 4) { // se já houver 4 posts normais, o próximo é versículo
    prompt = `Crie um versículo bíblico com citação (livro, capítulo e versículo) seguido de um breve resumo inspirador. Use emojis e hashtags. Máximo 344 caracteres.`;
    tipo = 'versiculo';
  } else {
    prompt = gerarPromptDinamico();
    tipo = 'normal';
  }

  const texto = await gerarTextoComGemini(prompt);
  if (!texto || texto.trim().length === 0) {
    console.log('🚫 Texto inválido ou não gerado. Salvando tentativa no histórico.');
    salvarNoHistorico('❌ Falha na geração de conteúdo.', null, 'erro');
    return;
  }

  if (textoJaFoiPostado(texto)) {
    console.log('🚫 Texto já foi postado anteriormente. Abortando envio.');
    salvarNoHistorico(texto, null, tipo);
    return;
  }

  const textoFinal = variarTexto(texto);
  console.log('📝 Conteúdo final:', textoFinal);

  try {
    const tweet = await enviarTweet(textoFinal);
    if (tweet?.id_str) {
      salvarNoHistorico(textoFinal, tweet.id_str, tipo);

      // ✅ Só atualiza contador se realmente publicou
      if (tipo === 'versiculo') {
        salvarContador(0); // reseta após versículo
      } else {
        salvarContador(contador + 1); // incrementa apenas se post normal foi publicado
      }
    } else {
      console.log("🚫 Tweet não enviado, contador não será atualizado.");
    }
  } catch (error) {
    console.error("❌ Erro ao postar tweet:", error);

    // 🔎 Se erro for 429, mostrar horário de reset
    if (error?.code === 429 && error?.rateLimit?.day?.reset) {
      const resetDate = new Date(error.rateLimit.day.reset * 1000);
      console.log(`⏳ Limite diário será resetado em: ${resetDate.toLocaleString()}`);
    }
  }
}



// 🧭 Inicia execução
executarTweetUnico();

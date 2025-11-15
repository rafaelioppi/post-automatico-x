import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';

dotenv.config();

const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = 'historico_mencoes.json';

// Lista de respostas motivacionais curtas
const respostas = [
  "Continue firme, você está no caminho certo! 💪✨",
  "Acredite em si mesmo, grandes coisas virão 🌟",
  "Cada passo conta, não desista 🚀",
  "Você é mais forte do que imagina 🔥",
  "A jornada é difícil, mas a vitória é doce 🌈"
];

// 📂 Lê histórico de menções já respondidas
function lerHistorico() {
  if (!fs.existsSync(historicoPath)) return [];
  return JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
}

// 📂 Salva histórico atualizado
function salvarHistorico(historico) {
  fs.writeFileSync(historicoPath, JSON.stringify(historico, null, 2));
}

async function responderMenções() {
  try {
    // Obter usuário autenticado
    const { data: me } = await twitter.v2.me();

    // Buscar últimas menções (limite baixo para pacote free)
    const mentionsResponse = await twitter.v2.userMentionTimeline(me.id, { max_results: 2 });
    const mentions = mentionsResponse.data;

    if (!mentions || mentions.length === 0) {
      console.log("🚫 Nenhuma menção encontrada.");
      return;
    }

    // Carregar histórico
    const historico = lerHistorico();

    for (const mention of mentions) {
      // Pular se já respondida
      if (historico.includes(mention.id)) {
        console.log(`⚠️ Menção ${mention.id} já respondida, pulando.`);
        continue;
      }

      // Escolher resposta aleatória
      const resposta = respostas[Math.floor(Math.random() * respostas.length)];
      await twitter.v2.reply(resposta, mention.id);
      console.log(`✅ Respondido a menção ${mention.id}: ${resposta}`);

      // Atualizar histórico
      historico.push(mention.id);
      salvarHistorico(historico);
    }
  } catch (error) {
    // Tratamento específico para rate limit
    if (error.code === 429 && error.rateLimit?.reset) {
      const resetDate = new Date(error.rateLimit.reset * 1000);
      console.log(`⏳ Limite de requisições atingido. Tente novamente após: ${resetDate.toLocaleString()}`);
    } else {
      console.error("❌ Erro ao responder menções:", error);
    }
  }
}

// 🚀 Executa e termina
responderMenções();

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

async function repostarUltimoValido() {
  try {
    // Lê o histórico
    const historico = JSON.parse(fs.readFileSync('historico.json', 'utf-8'));
    if (!historico || historico.length === 0) {
      console.log("🚫 Nenhum tweet no histórico.");
      return;
    }

    // Procura o último tweet com ID válido
    const ultimoValido = [...historico].reverse().find(item => item.id && item.id !== null);

    if (!ultimoValido) {
      console.log("🚫 Nenhum tweet válido encontrado para repostar.");
      return;
    }

    console.log("📌 Último tweet válido no histórico:", ultimoValido.id, ultimoValido.texto);

    // Obter usuário autenticado
    const { data: me } = await twitter.v2.me();

    // Faz o repost
    const { data } = await twitter.v2.retweet(me.id, ultimoValido.id);
    console.log(`✅ Retweet feito: ${data.retweeted}`);
  } catch (error) {
    console.error("❌ Erro ao repostar:", error);
    if (error?.rateLimit?.reset) {
      const resetDate = new Date(error.rateLimit.reset * 1000);
      console.log(`⏳ Limite será resetado em: ${resetDate.toLocaleString()}`);
    }
  }
}

repostarUltimoValido();

import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';

dotenv.config();

const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const historicoPath = path.resolve('historico.json');

// 📝 Modelo fixo de tweet curto
const tweetTexto = 'A tecnologia não para — e a inovação também não. O futuro é agora. 🚀 #Inovação #Tech';

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

async function postarTweet() {
  try {
    const tweet = await twitter.v1.tweet(tweetTexto);
    console.log('✅ Tweet enviado:', tweet.id_str);
    salvarNoHistorico(tweetTexto, tweet.id_str);
  } catch (error) {
    console.error('❌ Erro ao postar tweet:', error);
  }
}

postarTweet();

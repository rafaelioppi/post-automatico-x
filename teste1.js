import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function postarTweet() {
  try {
    const tweet = await client.v2.tweet('🚀 NOVO TESTE!');
    console.log('✅ Tweet enviado com sucesso! ID:', tweet.data.id);
  } catch (error) {
    console.error('❌ Erro ao postar:', error);
    if (error.data) console.error('🔍 Detalhes do erro:', error.data);
  }
}

postarTweet();

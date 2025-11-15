import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const twitter = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function resumoUltimosPosts() {
  try {
    // Obter usuário autenticado
    const { data: me } = await twitter.v2.me();

    // Buscar últimos tweets (máx. 5)
    const timelineResponse = await twitter.v2.userTimeline(me.id, { max_results: 5 });
    const tweets = timelineResponse.data || [];

    if (tweets.length === 0) {
      console.log("🚫 Nenhum tweet encontrado.");
      return;
    }

    // Extrair palavras-chave simples (últimas 3 palavras de cada tweet)
    const palavras = tweets.map(t => t.text.split(" ").slice(-3).join(" "));
    const resumo = palavras.join(" | ");

    const textoFinal = `Nos últimos dias falamos sobre: ${resumo} 🌟💪🚀 Qual tema mais te inspira?`;

    console.log("📝 Resumo gerado:", textoFinal);

    // Postar resumo
    await twitter.v2.tweet(textoFinal);
    console.log("✅ Resumo postado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao gerar resumo:", error);
  }
}

// 🚀 Executa e termina
resumoUltimosPosts();

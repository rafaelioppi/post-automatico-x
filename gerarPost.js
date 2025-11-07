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
const LIMITE_DIARIO = 17;

const prompts = [
  'Escreva uma frase positiva sobre tecnologia.',
  'Crie uma frase inspiradora sobre inteligência artificial.',
  'Gere uma frase otimista sobre o futuro digital.',
  'Escreva uma frase motivacional sobre automação.',
  'Crie uma frase sobre a importância do aprendizado contínuo.',
  'Escreva uma frase sobre segurança e privacidade online.',
  'Gere uma frase sobre tecnologia e sustentabilidade.',
  'Crie uma frase sobre criatividade e cultura maker.',
  'Escreva uma frase sobre dispositivos móveis e conectividade.',
  'Gere uma frase sobre ciência e inovação.',
  'Escreva uma frase sobre como a tecnologia transforma o cotidiano.',
  'Crie uma frase sobre o impacto da IA em diferentes áreas.',
  'Gere uma frase sobre o papel da automação no trabalho moderno.',
  'Escreva uma frase sobre o valor de aprender algo novo todos os dias.',
  'Crie uma frase sobre boas práticas digitais.',
  'Gere uma frase sobre o uso consciente da tecnologia.',
  'Escreva uma frase sobre inovação e progresso.',
  'Crie uma frase sobre como a tecnologia conecta pessoas.',
  'Gere uma frase sobre criatividade impulsionada por ferramentas digitais.',
  'Escreva uma frase sobre o papel da ciência na sociedade.',
  'Crie uma frase sobre o futuro da educação com tecnologia.',
  'Gere uma frase sobre inclusão digital.',
  'Escreva uma frase sobre o impacto da tecnologia na saúde.',
  'Crie uma frase sobre sustentabilidade e inovação.',
  'Gere uma frase sobre o poder da colaboração online.',
  'Escreva uma frase sobre o uso ético da inteligência artificial.',
  'Crie uma frase sobre como a tecnologia pode melhorar a qualidade de vida.',
  'Gere uma frase sobre o papel da automação na indústria.',
  'Escreva uma frase sobre a importância da proteção de dados.',
  'Crie uma frase sobre o potencial criativo da cultura maker.',
  'Gere uma frase sobre o impacto da tecnologia na comunicação.',
  'Escreva uma frase sobre o papel da ciência na resolução de problemas.',
  'Crie uma frase sobre o futuro do trabalho com ferramentas digitais.',
  'Gere uma frase sobre o uso responsável da tecnologia.',
  'Escreva uma frase sobre inovação acessível.',
  'Crie uma frase sobre como a tecnologia pode apoiar a educação.',
  'Gere uma frase sobre o papel da IA na transformação social.',
  'Escreva uma frase sobre o valor da curiosidade na era digital.',
  'Crie uma frase sobre como a tecnologia pode ajudar o meio ambiente.',
  'Gere uma frase sobre criatividade e prototipagem.',
  'Escreva uma frase sobre o impacto da tecnologia na mobilidade.',
  'Crie uma frase sobre ciência e descobertas.',
  'Gere uma frase sobre o papel da tecnologia na inclusão social.',
  'Escreva uma frase sobre inovação e acessibilidade.',
  'Crie uma frase sobre o uso inteligente de dados.',
  'Gere uma frase sobre o futuro das cidades com tecnologia.',
  'Escreva uma frase sobre o papel da tecnologia na cultura.',
  'Crie uma frase sobre como a automação pode facilitar o dia a dia.',
  'Gere uma frase sobre o impacto da tecnologia na criatividade.',
  'Escreva uma frase sobre o valor da ciência e da tecnologia juntas.',
  'Crie uma frase sobre como a tecnologia pode inspirar novas ideias.',
  'Escreva uma frase sobre arte contemporânea.',
  'Crie uma frase sobre música clássica.',
  'Gere uma frase sobre cinema independente.',
  'Escreva uma frase sobre literatura brasileira.',
  'Crie uma frase sobre filosofia existencialista.',
  'Gere uma frase sobre história da humanidade.',
  'Escreva uma frase sobre diversidade cultural.',
  'Crie uma frase sobre inclusão social.',
  'Gere uma frase sobre sustentabilidade ambiental.',
  'Escreva uma frase sobre saúde mental.',
  'Crie uma frase sobre bem-estar emocional.',
  'Gere uma frase sobre espiritualidade e equilíbrio.',
  'Escreva uma frase sobre educação inclusiva.',
  'Crie uma frase sobre liderança empática.',
  'Gere uma frase sobre comunicação assertiva.',
  'Escreva uma frase sobre criatividade na infância.',
  'Crie uma frase sobre o poder da imaginação.',
  'Gere uma frase sobre empatia nas relações humanas.',
  'Escreva uma frase sobre o valor da amizade.',
  'Crie uma frase sobre amor e respeito.',
  'Gere uma frase sobre colaboração e trabalho em equipe.',
  'Escreva uma frase sobre ética no cotidiano.',
  'Crie uma frase sobre cidadania ativa.',
  'Gere uma frase sobre justiça social.',
  'Escreva uma frase sobre direitos humanos.',
  'Crie uma frase sobre liberdade de expressão.',
  'Gere uma frase sobre responsabilidade coletiva.',
  'Escreva uma frase sobre o papel da arte na sociedade.',
  'Crie uma frase sobre o impacto da cultura popular.',
  'Gere uma frase sobre o valor da tradição.',
  'Escreva uma frase sobre inovação na educação.',
  'Crie uma frase sobre o futuro da ciência.',
  'Gere uma frase sobre descobertas científicas.',
  'Escreva uma frase sobre astronomia e o universo.',
  'Crie uma frase sobre biologia e vida.',
  'Gere uma frase sobre física e energia.',
  'Escreva uma frase sobre química e transformação.',
  'Crie uma frase sobre matemática e lógica.',
  'Gere uma frase sobre geografia e espaço.',
  'Escreva uma frase sobre história e memória.',
  'Crie uma frase sobre antropologia e cultura.',
  'Gere uma frase sobre sociologia e sociedade.',
  'Escreva uma frase sobre psicologia e comportamento.',
  'Crie uma frase sobre neurociência e mente.',
  'Gere uma frase sobre genética e evolução.',
  'Escreva uma frase sobre medicina e cuidado.',
  'Crie uma frase sobre enfermagem e empatia.',
  'Gere uma frase sobre nutrição e saúde.',
  'Escreva uma frase sobre esportes e superação.',
  'Crie uma frase sobre dança e expressão corporal.',
  'Gere uma frase sobre teatro e emoção.',
  'Escreva uma frase sobre cinema e narrativa.',
  'Crie uma frase sobre fotografia e memória.',
  'Gere uma frase sobre pintura e cor.',
  'Escreva uma frase sobre escultura e forma.',
  'Crie uma frase sobre design e funcionalidade.',
  'Gere uma frase sobre moda e identidade.',
  'Escreva uma frase sobre gastronomia e sabor.',
  'Crie uma frase sobre viagens e descobertas.',
  'Gere uma frase sobre natureza e contemplação.',
  'Escreva uma frase sobre oceanos e mistério.',
  'Crie uma frase sobre florestas e biodiversidade.',
  'Gere uma frase sobre animais e convivência.',
  'Escreva uma frase sobre plantas e crescimento.',
  'Crie uma frase sobre clima e mudanças.',
  'Gere uma frase sobre reciclagem e consciência.',
  'Escreva uma frase sobre energia limpa.',
  'Crie uma frase sobre arquitetura sustentável.',
  'Gere uma frase sobre urbanismo inteligente.',
  'Escreva uma frase sobre mobilidade urbana.',
  'Crie uma frase sobre transporte coletivo.',
  'Gere uma frase sobre acessibilidade urbana.',
  'Escreva uma frase sobre políticas públicas.',
  'Crie uma frase sobre economia solidária.',
  'Gere uma frase sobre empreendedorismo social.',
  'Escreva uma frase sobre inovação comunitária.',
  'Crie uma frase sobre redes de apoio.',
  'Gere uma frase sobre voluntariado e impacto.',
  'Escreva uma frase sobre educação ambiental.',
  'Crie uma frase sobre consumo consciente.',
  'Gere uma frase sobre hábitos sustentáveis.',
  'Escreva uma frase sobre equilíbrio entre trabalho e vida.',
  'Crie uma frase sobre propósito pessoal.',
  'Gere uma frase sobre autoconhecimento e evolução.',
  'Escreva uma frase sobre resiliência e força interior.',
  'Crie uma frase sobre esperança e renovação.',
  'Gere uma frase sobre coragem e transformação.',
  'Escreva uma frase sobre gratidão e presença.',
  'Crie uma frase sobre paz e harmonia.',
  'Gere uma frase sobre fé e confiança.',
  'Escreva uma frase sobre tempo e sabedoria.',
  'Crie uma frase sobre silêncio e escuta.',
  'Gere uma frase sobre conexão e pertencimento.',
  'Escreva uma frase sobre legado e impacto positivo.'
];


function contarTweetsHoje() {
  if (!fs.existsSync(historicoPath)) return 0;
  const historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
  const hoje = new Date().toISOString().slice(0, 10);
  return historico.filter(item => item.data.startsWith(hoje)).length;
}

async function gerarTextoComGemini() {
  const basePrompt = prompts[Math.floor(Math.random() * prompts.length)];
  const prompt = `${basePrompt} Certifique-se de que a frase tenha no máximo 362 caracteres.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

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

async function executarTweetUnico() {
  const enviadosHoje = contarTweetsHoje();
  if (enviadosHoje >= LIMITE_DIARIO) {
    console.log(`🚫 Limite diário de ${LIMITE_DIARIO} tweets atingido. Tente novamente amanhã.`);
    return;
  }

  const texto = await gerarTextoComGemini();
  if (!texto) return;

 try {
    const tweet = await client.v2.tweet(texto);
    console.log('✅ Tweet enviado:', tweet.data.id);
    salvarNoHistorico(texto, tweet.data.id);
  } catch (error) {
    console.error('❌ Erro ao postar:', error);

    // ✅ Verificação extra para erro de limite excedido
    if (error.code === 429 || error?.data?.status === 429) {
      console.log('🚫 Limite de requisições atingido pela API. Aguarde o reset antes de tentar novamente.');
      return;
    }

    if (error.data) console.error('🔍 Detalhes do erro:', error.data);
  }
}

executarTweetUnico();

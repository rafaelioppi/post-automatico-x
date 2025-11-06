# 🐦 Postagem Automática de Tweets com Gemini

Este projeto automatiza a geração e publicação de tweets usando a API do Gemini (Google) e a API do X (Twitter), com agendamento diário via GitHub Actions. Ideal para perfis que desejam manter uma presença ativa com conteúdo criativo e positivo sobre tecnologia e inovação.

---

## 🚀 Funcionalidades

- Geração automática de tweets com o Gemini
- Publicação direta no X (Twitter)
- Controle de limite diário (até 10 tweets por dia)
- Histórico de tweets salvos localmente
- Agendamento automático com GitHub Actions

---

## 🧱 Estrutura do Projeto

post-automatico-x/

├── .env # Variáveis de ambiente (não subir para o GitHub)

├── contador.json # Contador de tweets por dia 

├── historico.json # Histórico de tweets postados 

├── package.json # Configuração do projeto Node.js

├── tweetGemini.js # Script principal

└── .github/  └── workflows/ 
└── post-diario.yml # Agendamento automático via GitHub Actions

⚙️ Configuração
1. Clone o repositório
bash
git clone https://github.com/seu-usuario/post-automatico-x.git
cd post-automatico-x
2. Instale as dependências
bash
npm install
3. Crie o arquivo .env com suas chaves:

GEMINI_API_KEY=...

CONSUMER_KEY=...

CONSUMER_SECRET=...

ACCESS_TOKEN=...

ACCESS_TOKEN_SECRET=...

4. Configure os Secrets no GitHub
   
Vá em Settings > Secrets and variables > Actions > Secrets e adicione:

GEMINI_API_KEY

CONSUMER_KEY

CONSUMER_SECRET

ACCESS_TOKEN

ACCESS_TOKEN_SECRET

🕒 Agendamento automático

O workflow post-diario.yml está configurado para rodar 10 vezes por dia, postando 1 tweet por execução:

yaml
cron:
  - '0 13 * * *'  # 10:00
  - '0 14 * * *'  # 11:00
  ...
  - '0 22 * * *'  # 19:00
  - 
Você também pode executar manualmente via GitHub Actions.

📜 Histórico e Limite Diário
O arquivo contador.json controla o número de tweets por dia.

O script impede que mais de 10 tweets sejam postados no mesmo dia.

Todos os tweets enviados são registrados em historico.json.

🧪 Teste local
bash
node tweetGemini.js

📄 Licença
Este projeto é de uso pessoal. Sinta-se livre para adaptar e expandir conforme necessário.

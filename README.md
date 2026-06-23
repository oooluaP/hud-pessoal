# 🎮 HUD Pessoal — Life Dashboard estilo GTA

> Um painel pessoal inspirado na HUD do GTA V, exibindo saldo bancário, tarefas do dia e agenda em tempo real.

![HUD Preview](https://i.imgur.com/placeholder.png)

---

## ✨ Funcionalidades

- 💰 **Saldo bancário** — lê extrato PDF do Santander e exibe saldo e últimos gastos
- ✅ **Missões do dia** — integração com Todoist (projeto compartilhado entre duas pessoas)
- 📅 **Agenda** — integração com Google Calendar (calendário compartilhado)
- 🚨 **Alertas automáticos** — saldo negativo, tarefas urgentes, eventos próximos
- 📱 **Acessível por qualquer dispositivo** na rede local (celular, tablet, TV)
- 🖥️ **Servidor local Node.js** — sem dependência de cloud, roda na sua própria rede

---

## 🛠️ Tecnologias

- **Frontend:** HTML, CSS, JavaScript puro
- **Backend:** Node.js (sem frameworks)
- **APIs:** Todoist API v1, Google Calendar API
- **Extrato:** Python + pdfplumber para parsing de PDF
- **Fonte:** Share Tech Mono + Orbitron (Google Fonts)

---

## 📁 Estrutura do projeto

```
hud-pessoal/
├── index.html          # Interface da HUD
├── style.css           # Estilos (tema GTA)
├── app.js              # Lógica do frontend
├── config.js           # Configurações (token, IPs, etc)
├── server.js           # Servidor local Node.js
├── iniciar-hud.vbs     # Inicia o servidor silenciosamente no Windows
├── parar-hud.bat       # Para o servidor
└── extrato/
    ├── parse_extrato.py # Parser do extrato PDF Santander
    └── saldo.json       # JSON gerado pelo parser (gitignore)
```

---

## 🚀 Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- Python 3 com `pdfplumber` (`pip install pdfplumber`)
- Conta no [Todoist](https://todoist.com)
- Conta no [Google](https://calendar.google.com)

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/hud-pessoal.git
cd hud-pessoal
```

### 2. Configure o `config.js`

```javascript
const CONFIG = {
  serverIP: "SEU_IP_LOCAL",   // ex: 192.168.1.150
  todoist: {
    token:   "SEU_TOKEN_TODOIST",
    projeto: "NOME_DO_PROJETO",
  },
  // ...
};
```

### 3. Configure o `server.js`

```javascript
const TOKEN    = "SEU_TOKEN_TODOIST";
const PROJETO  = "NOME_DO_PROJETO";
const GCAL_KEY = "SUA_API_KEY_GOOGLE";
const GCAL_ID  = "SEU_CALENDAR_ID@group.calendar.google.com";
```

### 4. Inicie o servidor

```bash
node server.js
```

Acesse em `http://localhost:3000`

### 5. (Opcional) Atualizar saldo bancário

Coloque o extrato PDF do Santander em `extrato/` e rode:

```bash
python extrato/parse_extrato.py
```

---

## 📱 Acesso pela rede local

Com o servidor rodando, qualquer dispositivo na mesma rede Wi-Fi pode acessar a HUD:

```
http://SEU_IP_LOCAL:3000
```

Para IP fixo, configure a reserva DHCP no seu roteador com o MAC address do PC.

---

## 🔧 Configurações avançadas

### Iniciar automaticamente com o Windows

Coloque o `iniciar-hud.vbs` na pasta de inicialização do Windows:

1. Pressione `Win + R` → digite `shell:startup`
2. Cole o arquivo `iniciar-hud.vbs` na pasta que abrir

### Intervalo de atualização

No `config.js`, ajuste o intervalo de atualização dos widgets:

```javascript
intervaloAtualizacao: 15 * 1000, // 15 segundos
```

---

## 🔌 Integrações

### Todoist
1. Crie um projeto no Todoist
2. Acesse [Todoist > Configurações > Integrações](https://todoist.com/prefs/integrations)
3. Copie o **Token da API**
4. Cole no `server.js`

### Google Calendar
1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto e ative a **Google Calendar API**
3. Gere uma **API Key**
4. No Google Calendar, crie um calendário compartilhado e copie o **Calendar ID**
5. Cole ambos no `server.js`

---

## 🔒 Segurança

> ⚠️ Este projeto roda localmente na sua rede. Não exponha o servidor para a internet sem adicionar autenticação.

Não commite seus tokens e API keys! Adicione ao `.gitignore`:

```
config.js
server.js
extrato/saldo.json
extrato/*.pdf
```

---

## 💡 Próximos passos

- [ ] Integração com Open Finance (Pluggy) para saldo em tempo real
- [ ] Suporte a múltiplas contas bancárias
- [ ] Widget de clima
- [ ] Modo escuro/claro
- [ ] App mobile nativo

---

## 🤝 Contribuições

Contribuições são bem-vindas! Abra uma issue ou PR.

---

## 📄 Licença

MIT License — faça bom uso!

---

Feito com ☕ e muita vontade de ter uma HUD do GTA na vida real.

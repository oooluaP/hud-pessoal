# HUD Pessoal

Painel doméstico inspirado na HUD do GTA V. Exibe saldo bancário, tarefas do dia e agenda em tempo real, acessível por qualquer dispositivo na rede local.

## O que faz

- Lê extrato PDF do Santander e exibe saldo e últimos gastos
- Integração com Todoist para tarefas compartilhadas entre duas pessoas
- Integração com Google Calendar para agenda compartilhada
- Alertas automáticos: saldo negativo, tarefas urgentes, eventos próximos
- Acessível por celular, tablet ou TV na mesma rede Wi-Fi
- Servidor Node.js local, sem dependência de cloud

## Tecnologias

- HTML, CSS e JavaScript puro no frontend
- Node.js no backend (sem frameworks)
- Todoist API v1 e Google Calendar API
- Python + pdfplumber para leitura do extrato bancário

## Estrutura

```
hud-pessoal/
├── index.html
├── style.css
├── app.js
├── config.js           # suas configurações (não vai pro git)
├── server.js           # servidor local (não vai pro git)
├── config.example.js   # modelo de configuração
├── server.example.js   # modelo do servidor
├── iniciar-hud.vbs     # inicia o servidor silenciosamente no Windows
├── parar-hud.bat       # para o servidor
└── extrato/
    └── parse_extrato.py
```

## Como rodar

Pré-requisitos: Node.js e Python 3 com pdfplumber instalado.

```bash
git clone https://github.com/oooluaP/hud-pessoal.git
cd hud-pessoal
cp config.example.js config.js
cp server.example.js server.js
```

Preencha suas credenciais no `config.js` e `server.js`, depois:

```bash
node server.js
```

Acesse em `http://localhost:3000`.

## Configuração

**Todoist**

Acesse Todoist > Configurações > Integrações e copie o token da API.

**Google Calendar**

Crie um projeto no Google Cloud Console, ative a Google Calendar API, gere uma API Key e copie o Calendar ID do calendário que deseja usar.

**Extrato bancário**

Coloque o PDF do extrato Santander em `extrato/` e rode:

```bash
python extrato/parse_extrato.py
```

## Acesso pela rede local

Com o servidor rodando, qualquer dispositivo na mesma rede pode acessar:

```
http://SEU_IP_LOCAL:3000
```

Para garantir que o IP não mude, configure reserva DHCP no roteador com o MAC address do PC.

## Iniciar com o Windows

Coloque o `iniciar-hud.vbs` na pasta de inicialização do Windows (`shell:startup`). O servidor vai subir em segundo plano sem abrir janelas.

## Segurança

Os arquivos `config.js` e `server.js` estão no `.gitignore` pois contêm tokens e credenciais. Use os arquivos `.example.js` como referência e nunca os commite com dados reais.

## Licença

MIT

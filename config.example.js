// ============================================
//  config.example.js
//  Copie este arquivo para config.js e
//  preencha com seus dados reais.
// ============================================

const CONFIG = {

  // IP do PC na rede local
  serverIP: "192.168.1.100",

  // Todoist
  todoist: {
    token:   "SEU_TOKEN_TODOIST",
    projeto: "NOME_DO_PROJETO",
  },

  // Saldo mockado (usado como fallback se o extrato não existir)
  saldo: {
    metaPoupanca: 8000,
    contas: [
      { nome: "Banco 1", valor: 0 },
      { nome: "Banco 2", valor: 0 },
    ]
  },

  // Agenda mockada (fallback se Google Calendar não estiver configurado)
  agenda: [],

  // Missões mockadas (fallback se Todoist não estiver configurado)
  missoes: [],

  // Alertas mockados (fallback)
  alertas: [],

  // Intervalo de atualização em ms
  intervaloAtualizacao: 15 * 1000,
};

// ============================================
//  APP.JS — Lógica principal da HUD
//  Lê os dados de CONFIG (config.js) e
//  preenche os widgets na tela.
// ============================================

// ---- RELÓGIO E DATA ----

function atualizarRelogio() {
  const agora = new Date();

  document.getElementById("clock").textContent =
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  document.getElementById("date-display").textContent =
    agora.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
         .toUpperCase();
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();


// ---- WIDGET: SALDO (lê extrato/saldo.json gerado pelo parse_extrato.py) ----

async function renderSaldo() {
  const container = document.getElementById("saldo-bars");
  const elTotal   = document.getElementById("saldo-total");
  const elMeta    = document.getElementById("meta-poupanca");

  let extrato = null;

  try {
    const res = await fetch("extrato/saldo.json?t=" + Date.now());
    if (!res.ok) throw new Error("JSON não encontrado");
    extrato = await res.json();
  } catch (e) {
    // Fallback: usa dados do config.js se o JSON não existir ainda
    console.warn("extrato/saldo.json não encontrado, usando mock do config.js");
    renderSaldoMock();
    return;
  }

  const saldo       = extrato.saldo.atual ?? 0;
  const limite      = extrato.saldo.limite ?? 0;
  const disponivel  = extrato.saldo.disponivel_com_limite ?? 0;
  const { total_debitos, total_creditos, qtd_transacoes } = extrato.resumo_periodo;

  // saldo principal (cor vermelha se negativo)
  elTotal.textContent = saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  elTotal.style.color = saldo < 0 ? "var(--red)" : "#d4ffb0";

  // detalhes
  const periodo = extrato.periodo
    ? `${extrato.periodo.inicio} → ${extrato.periodo.fim}`
    : "";

  container.innerHTML = `
    <div class="saldo-item">
      <span class="saldo-item-nome">Santander (${extrato.agencia_conta ?? ""})</span>
      <span class="saldo-item-valor" style="color:${saldo < 0 ? 'var(--red)' : 'var(--green)'}">
        ${saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </span>
    </div>
    <div class="saldo-item">
      <span class="saldo-item-nome">Limite disponível</span>
      <span class="saldo-item-valor">${disponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
    </div>
    <div class="saldo-item">
      <span class="saldo-item-nome">Total gasto no período</span>
      <span class="saldo-item-valor" style="color:var(--red)">
        -${total_debitos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </span>
    </div>
    <div style="margin-top:6px; font-size:10px; color:var(--green-dim); letter-spacing:1px">
      ${qtd_transacoes} transações • ${periodo}
    </div>

    <div style="margin-top:10px; font-size:10px; color:var(--green-dim); letter-spacing:2px; border-top:1px solid var(--green-border); padding-top:8px;">
      ▸ ÚLTIMOS GASTOS
    </div>
    ${(extrato.ultimos_gastos || []).slice(0, 6).map(g => `
      <div class="saldo-item" style="font-size:11px">
        <span class="saldo-item-nome" style="max-width:65%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
          ${g.descricao}
        </span>
        <span style="color:var(--red); font-size:11px">
          ${g.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>
    `).join("")}
  `;

  elMeta.textContent = `Atualizado: ${extrato.gerado_em ?? "—"}`;
}

// Fallback quando o JSON ainda não foi gerado
function renderSaldoMock() {
  const { contas, metaPoupanca } = CONFIG.saldo;
  const total = contas.reduce((soma, c) => soma + c.valor, 0);
  document.getElementById("saldo-total").textContent =
    total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const container = document.getElementById("saldo-bars");
  container.innerHTML = contas.map(c => `
    <div class="saldo-item">
      <span class="saldo-item-nome">${c.nome}</span>
      <span class="saldo-item-valor">${c.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
    </div>
  `).join("") + `<div style="font-size:10px;color:var(--yellow);margin-top:6px">⚡ MODO MOCK — rode parse_extrato.py</div>`;
  const pct = Math.min(100, Math.round((total / metaPoupanca) * 100));
  document.getElementById("meta-poupanca").textContent =
    `${pct}% da meta mensal (R$ ${metaPoupanca.toLocaleString("pt-BR")})`;
}


// ---- WIDGET: MISSÕES (Todoist) ----
// Projeto: "Sara Paulo"
// Token configurado em config.js → CONFIG.todoist.token

async function renderMissoes() {
  const lista = document.getElementById("missoes-list");

  let tarefas = [];
  let erroApi = false;

  try {
    // Chama o servidor local (server.js) que repassa para o Todoist
    const res  = await fetch(`http://${CONFIG.serverIP}:3000/api/missoes`);
    if (!res.ok) throw new Error("Servidor local não respondeu");
    const data = await res.json();
    if (data.erro) throw new Error(data.erro);
    tarefas = data.missoes;

  } catch (e) {
    console.warn("Todoist:", e.message, "— usando mock");
    erroApi = true;
    tarefas = CONFIG.missoes; // fallback para mock
  }

  lista.innerHTML = tarefas.map(m => {
    let classe = m.feita ? "done" : m.urgente ? "warn" : "";
    let icone  = m.feita ? "✓" : m.urgente ? "⚡" : "◻";
    let due    = m.due ? `<span style="font-size:10px;color:var(--yellow);margin-left:4px">${m.due}</span>` : "";
    return `
      <li class="missao-item ${classe}">
        <span>${icone}</span>
        <span>${m.texto}${due}</span>
        <span class="missao-autor">${m.autor}</span>
      </li>
    `;
  }).join("") + (erroApi ? `
    <li style="font-size:10px;color:var(--yellow);padding:4px 8px">
      ⚡ MODO MOCK — verifique o token no config.js
    </li>` : "");

  const feitas = tarefas.filter(m => m.feita).length;
  const total  = tarefas.length;
  const pct    = total > 0 ? Math.round((feitas / total) * 100) : 0;

  document.getElementById("missoes-progresso").textContent = `${total} tarefas abertas`;
  document.getElementById("missoes-bar").style.width = `${pct}%`;
}


// ---- WIDGET: AGENDA (Google Calendar via server.js) ----

async function renderAgenda() {
  const lista = document.getElementById("agenda-list");
  let eventos = [];
  let erroApi = false;

  try {
    const res  = await fetch(`http://${CONFIG.serverIP}:3000/api/agenda`);
    if (!res.ok) throw new Error("Servidor não respondeu");
    const data = await res.json();
    if (data.erro) throw new Error(data.erro);
    eventos = data.eventos;
  } catch (e) {
    console.warn("Google Calendar:", e.message, "— usando mock");
    erroApi = true;
    eventos = CONFIG.agenda;
  }

  lista.innerHTML = eventos.map(ev => {
    const diff = ev.diasOffset ?? 0;
    let labelData, classeData;

    if (diff === 0) {
      labelData  = ev.hora ? `HOJE ${ev.hora}` : "HOJE";
      classeData = "hoje";
    } else if (diff === 1) {
      labelData  = ev.hora ? `AMANHÃ ${ev.hora}` : "AMANHÃ";
      classeData = "amanha";
    } else {
      labelData  = ev.data ?? "";
      if (ev.hora) labelData += ` ${ev.hora}`;
      classeData = diff <= 3 ? "urgente" : "";
    }

    return `
      <li class="agenda-item">
        <span class="agenda-nome">${ev.nome}</span>
        <span class="agenda-data ${classeData}">${labelData}</span>
      </li>
    `;
  }).join("") + (erroApi ? `
    <li style="font-size:10px;color:var(--yellow);padding:4px 8px">
      ⚡ MODO MOCK — verifique a API Key no server.js
    </li>` : "");
}


// ---- WIDGET: ALERTAS (gerado automaticamente) ----

function renderAlertas() {
  const lista   = document.getElementById("alertas-list");
  const alertas = [];

  // -- Saldo negativo --
  const elSaldo = document.getElementById("saldo-total").textContent;
  if (elSaldo.includes("-")) {
    alertas.push({ tipo: "danger", icone: "!", texto: `Saldo negativo: ${elSaldo}` });
  }

  // -- Tarefas urgentes do Todoist --
  const missoes = document.querySelectorAll(".missao-item.warn");
  if (missoes.length > 0) {
    alertas.push({ tipo: "warn", icone: "⚡", texto: `${missoes.length} tarefa(s) urgente(s) pendente(s)` });
  }

  // -- Eventos de hoje, amanhã e essa semana --
  const itensAgenda = document.querySelectorAll(".agenda-item");
  let hoje = 0, amanha = 0, semana = 0;

  itensAgenda.forEach(item => {
    const data = item.querySelector(".agenda-data");
    if (!data) return;
    if (data.classList.contains("hoje"))   hoje++;
    if (data.classList.contains("amanha")) amanha++;
    if (data.classList.contains("urgente") || (!data.classList.contains("hoje") && !data.classList.contains("amanha"))) semana++;
  });

  if (hoje > 0)   alertas.push({ tipo: "warn",  icone: "📅", texto: `${hoje} evento(s) hoje` });
  if (amanha > 0) alertas.push({ tipo: "info",  icone: "📅", texto: `${amanha} evento(s) amanhã` });
  if (semana > 0) alertas.push({ tipo: "info",  icone: "📆", texto: `${semana} evento(s) essa semana` });

  // -- Nenhum alerta --
  if (alertas.length === 0) {
    alertas.push({ tipo: "info", icone: "✓", texto: "Tudo tranquilo por enquanto" });
  }

  lista.innerHTML = alertas.map(a => `
    <li class="alerta-item ${a.tipo}">
      <span class="alerta-icon">${a.icone}</span>
      <span>${a.texto}</span>
    </li>
  `).join("");
}


// ---- ATUALIZAÇÃO GERAL ----

async function atualizarTudo() {
  await renderSaldo();
  renderMissoes();
  await renderAgenda();
  renderAlertas();

  const agora = new Date();
  document.getElementById("last-update").textContent =
    `última atualização: ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// Renderiza ao carregar
atualizarTudo();

// Re-renderiza no intervalo configurado
// (quando tiver APIs reais, buscará dados novos aqui)
setInterval(atualizarTudo, CONFIG.intervaloAtualizacao);


// ============================================
//  PRÓXIMOS PASSOS — como evoluir este arquivo
// ============================================
//
//  1. SALDO REAL (Pluggy API)
//     Crie um backend simples (Node/Express) que
//     chama a Pluggy e retorna o saldo em JSON.
//     Substitua renderSaldo() por um fetch():
//
//     const res  = await fetch("http://localhost:3001/saldo");
//     const data = await res.json();
//     // use data.total, data.contas etc.
//
//  2. AGENDA REAL (Google Calendar API)
//     Autentique com OAuth2, busque eventos dos
//     próximos 30 dias e normalize para o formato
//     { nome, diasOffset, hora } acima.
//
//  3. MISSÕES (Supabase)
//     Crie uma tabela `missoes` no Supabase.
//     Qualquer pessoa com a URL do formulário
//     pode adicionar missões.
//     Busque com:
//     const { data } = await supabase.from("missoes").select("*")
//
// ============================================

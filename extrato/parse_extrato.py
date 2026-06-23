#!/usr/bin/env python3
# ============================================
#  parse_extrato.py
#  Lê o PDF do extrato Santander na pasta
#  extrato/ e gera extrato/saldo.json
#
#  Como usar:
#    pip install pdfplumber
#    python extrato/parse_extrato.py
#
#  O arquivo saldo.json é lido pelo app.js
#  da HUD automaticamente.
# ============================================

import json
import re
import os
import glob
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    print("Instale pdfplumber: pip install pdfplumber")
    exit(1)


# ---- Localiza o PDF mais recente na pasta extrato/ ----

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(SCRIPT_DIR, "saldo.json")

pdfs = sorted(glob.glob(os.path.join(SCRIPT_DIR, "*.pdf")))
if not pdfs:
    print("Nenhum PDF encontrado na pasta extrato/")
    exit(1)

PDF_PATH = pdfs[-1]  # pega o mais recente (ordem alfabética)
print(f"Lendo: {PDF_PATH}")


# ---- Helpers ----

def parse_valor(texto):
    """Converte '1.933,73' ou '-1.933,73' para float."""
    if not texto:
        return None
    texto = texto.strip().replace(".", "").replace(",", ".")
    try:
        return float(texto)
    except ValueError:
        return None


def limpar_descricao(desc):
    """Remove prefixos técnicos e deixa nome legível."""
    desc = re.sub(r"DEBITO VISA ELECTRON BRASIL \d{2}/\d{2} ", "", desc)
    desc = re.sub(r"IFD\.", "", desc)
    desc = desc.strip()
    # capitaliza
    return desc.title()


# ---- Regex para linhas de transação ----
# Formato: DATA  DESCRIÇÃO  DOCTO  [SITUAÇÃO]  [CRÉDITO]  [DÉBITO]  SALDO
LINHA_RE = re.compile(
    r"^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+(\d{6})\s*"
    r"(?:\S+\s+)?"                          # situação (opcional)
    r"(-?[\d.]+,\d{2})?\s+"                # crédito (opcional)
    r"(-?[\d.]+,\d{2})?\s+"                # débito (opcional)
    r"(-?[\d.]+,\d{2})\s*$"               # saldo
)

SALDO_ATUAL_RE  = re.compile(r"R\$\s*([-\d.,]+)\s*\nSaldo de conta corrente")
LIMITE_RE       = re.compile(r"R\$\s*([\d.,]+)\s*\nLimite da conta")
SALDO_LIMITE_RE = re.compile(r"R\$\s*([\d.,]+)\s*\nSaldo em conta \+ Limite")
PERIODO_RE     = re.compile(r"Período:\s*(\d{2}/\d{2}/\d{4})\s*a\s*(\d{2}/\d{2}/\d{4})")
TITULAR_RE     = re.compile(r"^([A-Z][A-Z ]{5,})\s+Agência")
AGENCIA_RE     = re.compile(r"Agência e Conta:\s*([\d]+\s*/\s*[\d\-]+)")


# ---- Extração ----

transacoes = []
saldo_atual = None
limite = None
saldo_com_limite = None
periodo_inicio = None
periodo_fim = None
titular = None
agencia = None

with pdfplumber.open(PDF_PATH) as pdf:
    full_text = ""
    for page in pdf.pages:
        full_text += (page.extract_text() or "") + "\n"

# Metadados
m = SALDO_ATUAL_RE.search(full_text)
if m:
    saldo_atual = parse_valor(m.group(1))

m = LIMITE_RE.search(full_text)
if m:
    limite = parse_valor(m.group(1))

m = SALDO_LIMITE_RE.search(full_text)
if m:
    saldo_com_limite = parse_valor(m.group(1))

m = PERIODO_RE.search(full_text)
if m:
    periodo_inicio = m.group(1)
    periodo_fim    = m.group(2)

for line in full_text.splitlines():
    m = TITULAR_RE.match(line)
    if m and not titular:
        titular = m.group(1).strip().title()
    m = AGENCIA_RE.search(line)
    if m and not agencia:
        agencia = m.group(1).strip()

# Transações
for line in full_text.splitlines():
    line = line.strip()
    m = LINHA_RE.match(line)
    if not m:
        continue

    data_str, desc, docto, credito_str, debito_str, saldo_str = (
        m.group(1), m.group(2), m.group(3),
        m.group(4), m.group(5), m.group(6)
    )

    credito = parse_valor(credito_str)
    debito  = parse_valor(debito_str)
    saldo   = parse_valor(saldo_str)

    # determina valor e tipo
    if credito and credito > 0:
        valor = credito
        tipo  = "credito"
    elif debito and debito < 0:
        valor = debito
        tipo  = "debito"
    else:
        valor = 0
        tipo  = "neutro"

    transacoes.append({
        "data":      data_str,
        "descricao": limpar_descricao(desc),
        "descricao_original": desc,
        "valor":     valor,
        "tipo":      tipo,
        "saldo":     saldo,
    })

# Últimos 10 gastos (débitos)
debitos = [t for t in transacoes if t["tipo"] == "debito"]
ultimos_gastos = debitos[:10]

# Total gasto no período
total_debitos = sum(abs(t["valor"]) for t in transacoes if t["tipo"] == "debito")
total_creditos = sum(t["valor"] for t in transacoes if t["tipo"] == "credito")


# ---- Monta JSON de saída ----

output = {
    "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
    "arquivo": os.path.basename(PDF_PATH),
    "titular": titular,
    "agencia_conta": agencia,
    "periodo": {
        "inicio": periodo_inicio,
        "fim": periodo_fim,
    },
    "saldo": {
        "atual": saldo_atual,
        "limite": limite,
        "disponivel_com_limite": saldo_com_limite,
    },
    "resumo_periodo": {
        "total_debitos": round(total_debitos, 2),
        "total_creditos": round(total_creditos, 2),
        "saldo_liquido": round(total_creditos - total_debitos, 2),
        "qtd_transacoes": len(transacoes),
    },
    "ultimos_gastos": ultimos_gastos,
    "todas_transacoes": transacoes,
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✓ JSON gerado: {OUTPUT_JSON}")
print(f"  Titular:     {titular}")
print(f"  Período:     {periodo_inicio} → {periodo_fim}")
print(f"  Saldo atual: R$ {saldo_atual:,.2f}" if saldo_atual else "  Saldo: não encontrado")
print(f"  Transações:  {len(transacoes)}")
print(f"  Últimos gastos: {len(ultimos_gastos)}")

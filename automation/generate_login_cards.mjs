// Gera os PDFs de cartões de acesso por turma, um card 94x135mm por aluno,
// 4 cards por página (2x2). Equivalente Node do generate_login_cards.py.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import ExcelJS from "exceljs";
import unidecode from "unidecode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const currentDir = import.meta.dirname;
loadEnv({ path: join(currentDir, ".env") });

// Dimensão do card (mm): card compacto, sem fundo vazio embaixo
const CARD_H = 78;
const CARD_W = 94;

const PASS_FIXED = process.env.PASS_FIXED || "";
const URL_LOGIN = process.env.URL_LOGIN || "";
const DIRETORIO_DADOS = process.env.DIRETORIO_DADOS || currentDir;
const filePath = join(DIRETORIO_DADOS, process.env.FILE_XLSX || "dados.xlsx");

// Conversão milímetro -> ponto do PDF (1mm = 72/25.4 pt)
const MM = 72 / 25.4;
const A4_H = 841.89; // 297mm em pontos

function C(r, g, b) {
  return rgb(r / 255, g / 255, b / 255);
}

function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object" && value && typeof value.text === "string") {
    return value.text.trim();
  }
  return String(value).trim();
}

function raText(value) {
  let s = cellText(value);
  if (s.endsWith(".0")) s = s.slice(0, -2);
  return s;
}

function isOk(value) {
  return cellText(value).toUpperCase() === "OK";
}

// Quebra o texto em linhas que cabem na largura (pontos).
// Palavras longas (URLs, nomes extensos) são quebradas no meio quando necessário.
function wrap(text, font, size, maxWidthPt) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  const width = (t) => font.widthOfTextAtSize(t, size);

  // Divide uma palavra em pedaços que cabem na largura
  const sliceWord = (word) => {
    let piece = "";
    for (const ch of word) {
      if (piece && width(piece + ch) > maxWidthPt) break;
      piece += ch;
    }
    return piece || word[0];
  };

  for (const rawWord of words) {
    let word = rawWord;
    // Palavra maior que a largura -> parte em pedaços que cabem
    while (word && width(word) > maxWidthPt) {
      const head = sliceWord(word);
      const t = cur ? `${cur}${head}` : head;
      if (width(t) <= maxWidthPt) cur = t;
      else {
        if (cur) lines.push(cur);
        cur = head;
      }
      word = word.slice(head.length);
    }
    const t = cur ? `${cur} ${word}` : word;
    if (width(t) <= maxWidthPt || !cur) cur = t;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Desenha linhas de texto dentro de um bloco (topo em yTop mm, altura de linha hLine mm)
function drawLines(page, { font, size, color, x, yTop, w, hLine, lines, align = "center" }) {
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    if (!text) continue;
    const widthPt = font.widthOfTextAtSize(text, size);
    const tx = align === "left" ? MM * x : MM * x + (MM * w - widthPt) / 2;
    const baseline = MM * yTop + MM * hLine * (i + 0.5) + size * 0.35;
    page.drawText(text, { x: tx, y: A4_H - baseline, size, font, color });
  }
}

// Destaca (negrito, azul escuro) um campo com rótulo + valor dentro do card
function desenharCampo(page, fontRegular, fontBold, x, yTop, label, valor, vSize) {
  drawLines(page, {
    font: fontBold,
    size: 7,
    color: C(130, 138, 152),
    x,
    yTop,
    w: 80,
    hLine: 4.5,
    lines: [label],
    align: "left",
  });
  drawLines(page, {
    font: fontBold,
    size: vSize,
    color: C(20, 24, 34),
    x,
    yTop: yTop + 6,
    w: 80,
    hLine: 7,
    lines: [String(valor)],
    align: "left",
  });
}

async function desenharCard(page, fontRegular, fontBold, x, y, row) {
  const nome = unidecode(cellText(row.NOME)).toUpperCase();
  const ra = raText(row.RA);
  const turma = cellText(row.TURMA).toUpperCase();

  // Fundo branco + borda cinza
  page.drawRectangle({
    x: MM * x,
    y: A4_H - MM * (y + CARD_H),
    width: MM * CARD_W,
    height: MM * CARD_H,
    color: C(255, 255, 255),
    borderColor: C(150, 158, 172),
    borderWidth: 0.85,
  });

  // Título centralizado, colado no topo
  drawLines(page, {
    font: fontBold,
    size: 12,
    color: C(34, 66, 132),
    x,
    yTop: y + 2.5,
    w: CARD_W,
    hLine: 7.5,
    lines: ["ACESSO MUNDO Z"],
    align: "center",
  });

  // Linha divisória azul, full width da borda
  page.drawRectangle({
    x: MM * x,
    y: A4_H - MM * (y + 12),
    width: MM * CARD_W,
    height: 0.6,
    color: C(34, 66, 132),
  });

  // Nome (negrito 12, escuro), até 2 linhas
  const nomeLines = wrap(nome, fontBold, 12, MM * 86);
  drawLines(page, {
    font: fontBold,
    size: 12,
    color: C(20, 24, 34),
    x: x + 4,
    yTop: y + 15,
    w: 86,
    hLine: 6,
    lines: nomeLines,
    align: "left",
  });

  // Turma (bem próxima do nome)
  const yTurma = y + 15 + nomeLines.length * 6 + 1;
  drawLines(page, {
    font: fontRegular,
    size: 9.5,
    color: C(110, 118, 132),
    x: x + 4,
    yTop: yTurma,
    w: 86,
    hLine: 4.5,
    lines: wrap(`Turma: ${turma}`, fontRegular, 9.5, MM * 86),
    align: "left",
  });

  // USUÁRIO, logo abaixo da turma
  const yUsuario = yTurma + 4.5 + 3;
  desenharCampo(page, fontRegular, fontBold, x + 4, yUsuario, "USUÁRIO", ra, 12);

  // SENHA, com respiro para não colar no usuário
  desenharCampo(page, fontRegular, fontBold, x + 4, yUsuario + 15, "SENHA", PASS_FIXED, 12);

  // Link de acesso, colado no fim do card
  const yLink = yUsuario + 15 + 13 + 4;
  drawLines(page, {
    font: fontBold,
    size: 7,
    color: C(130, 138, 152),
    x: x + 4,
    yTop: yLink,
    w: 86,
    hLine: 4.5,
    lines: ["LINK DE ACESSO"],
    align: "left",
  });
  drawLines(page, {
    font: fontRegular,
    size: 8,
    color: C(34, 66, 132),
    x: x + 4,
    yTop: yLink + 4.5,
    w: 86,
    hLine: 4,
    lines: wrap(URL_LOGIN, fontRegular, 8, MM * 86),
    align: "left",
  });
}

async function main() {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(filePath);
  } catch {
    console.log("Arquivo não encontrado!");
    return;
  }
  const ws = wb.worksheets[0];

  // Lê as linhas do Excel (cabeçalho na linha 1)
  const cols = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const name = cellText(cell.value);
    if (name) cols[name] = colNumber;
  });
  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const s = {};
    for (const [name, col] of Object.entries(cols)) s[name] = row.getCell(col).value;
    s.RA = raText(s.RA);
    rows.push(s);
  }

  // Gera cards apenas para alunos registrados E inseridos (OK) na plataforma
  let ignorados = 0;
  const grupos = new Map();
  for (const row of rows) {
    const turma = cellText(row.TURMA);
    if (!turma) continue;
    if (!isOk(row.REGISTRADO) || !isOk(row.INSERIDO)) {
      ignorados++;
      continue;
    }
    if (!grupos.has(turma)) grupos.set(turma, []);
    grupos.get(turma).push(row);
  }
  if (ignorados > 0) {
    console.log(`Ignorados ${ignorados} aluno(s) sem cadastro/inserção OK.`);
  }

  const pdfDir = join(DIRETORIO_DADOS, "pdf");
  await mkdir(pdfDir, { recursive: true });

  let total = 0;
  for (const [turma, grupo] of grupos) {
    const nomeTurma = unidecode(turma.replace(/[°ºª]/g, ""))
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const nomeArquivo = join(pdfDir, `${nomeTurma || "turma"}.pdf`);

    const pdfDoc = await PDFDocument.create();
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = null;
    let pos = 0;
    for (const row of grupo) {
      if (pos % 6 === 0) page = pdfDoc.addPage([595.28, A4_H]);
      const col = pos % 2;
      const linha = Math.floor(pos / 2) % 3;
      await desenharCard(page, regular, bold, 8 + col * 98, 8 + linha * (CARD_H + 8), row);
      pos++;
    }

    const bytes = await pdfDoc.save();
    await writeFile(nomeArquivo, bytes);
    total += pos;
    console.log(`Gerado: pdf/${nomeTurma || "turma"}.pdf (${pos} cards)`);
  }
  if (total === 0) {
    console.log("Nenhum aluno com cadastro/inserção OK — nenhum card gerado.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
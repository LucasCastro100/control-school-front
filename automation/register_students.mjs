// Automação: cadastro + inserção de código de turma na plataforma Mundo Z (Mundo Zoom)
// Equivalente Node/Playwright do student_registration.py (Python + Selenium + pandas)

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config as loadEnv } from "dotenv";
import ExcelJS from "exceljs";
import { chromium } from "playwright";

// Diretório onde o script está, para montar o caminho do Excel sempre do jeito certo
const currentDir = import.meta.dirname;

// Carrega as variáveis do arquivo .env (que fica nesta mesma pasta)
loadEnv({ path: join(currentDir, ".env") });

// Diretório onde ficam o Excel e os arquivos gerados (configurável no .env)
const DIRETORIO_DADOS = process.env.DIRETORIO_DADOS || currentDir;
const FILE_XLSX = process.env.FILE_XLSX || "dados.xlsx";
const filePath = join(DIRETORIO_DADOS, FILE_XLSX);

// ADICIONE OS LINKS E A SENHA NO ARQUIVO .env (nunca suba o .env para o Git!)
const URL_CADASTRAR = process.env.URL_CADASTRAR;
const URL_LOGIN = process.env.URL_LOGIN;
const PASS_FIXED = process.env.PASS_FIXED;
const HEADLESS = (process.env.HEADLESS || "false").toLowerCase() === "true";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Valor da célula do Excel como string simples (suporta rich text do exceljs)
function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object" && value && typeof value.text === "string") {
    return value.text.trim();
  }
  return String(value).trim();
}

// RA vira texto sem ".0" (ex.: 9024611.0 vira "9024611") para digitar corretamente
function raText(value) {
  let s = cellText(value);
  if (s.endsWith(".0")) s = s.slice(0, -2);
  return s;
}

function isOk(value) {
  return cellText(value).toUpperCase() === "OK";
}

// ---------------------------------------------------------------------------
// Leitura do Excel
// ---------------------------------------------------------------------------
const wb = new ExcelJS.Workbook();
let ws = null;
let cols = {}; // nome do cabeçalho -> número da coluna
let students = [];

async function loadExcel() {
  if (!existsSync(filePath)) {
    console.log("Arquivo não encontrado!");
    return false;
  }
  await wb.xlsx.readFile(filePath);
  ws = wb.worksheets[0];

  // Mapeia os cabeçalhos (linha 1) para o número da coluna
  ws.getRow(1).eachCell((cell, colNumber) => {
    const name = cellText(cell.value);
    if (name) cols[name] = colNumber;
  });

  // Cada linha do Excel vira um objeto, guardando o número da linha para salvar de volta
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const s = { __row: r };
    for (const [name, col] of Object.entries(cols)) s[name] = row.getCell(col).value;
    // Linha totalmente vazia da planilha não é aluno — ignora silenciosamente
    if (!cellText(s.NOME) && !cellText(s.RA)) continue;
    s.RA = raText(s.RA);
    students.push(s);
  }
  return true;
}

// ---------------------------------------------------------------------------
// "Lock" do Excel: serializa as gravações entre os navegadores (Node é
// single-thread, mas as gravações assíncronas do arquivo precisam de fila)
// ---------------------------------------------------------------------------
let saveChain = Promise.resolve();

// Grava um valor na planilha, salva o arquivo e atualiza o objeto em memória
async function save(student, column, value) {
  const run = saveChain.then(async () => {
    ws.getCell(student.__row, cols[column]).value = value;
    await wb.xlsx.writeFile(filePath);
  });
  saveChain = run.catch(() => {}); // erro de gravação não derruba a fila
  await run;
  student[column] = value;
}

// ---------------------------------------------------------------------------
// Função executada por cada navegador: processa uma fatia de alunos
// ---------------------------------------------------------------------------
async function processarFatia(browser, fatia) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    for (const s of fatia) {
      // Aluno já inserido na turma -> pula
      if (isOk(s.INSERIDO)) continue;
      let registradoOk = isOk(s.REGISTRADO);
      const nome = cellText(s.NOME).toUpperCase();
      const ra = raText(s.RA).toUpperCase();
      const email = cellText(s.EMAIL);
      const codTurma = cellText(s["COD. TURMA"]);

      // Nunca processa dados vazios/incompletos
      if (!nome || !ra || !email) {
        const faltam = [!nome && "NOME", !ra && "RA", !email && "EMAIL"].filter(Boolean).join(", ");
        console.log(`DADOS INCOMPLETOS - ${nome || ra || "linha vazia"} (faltam: ${faltam}) — pulado`);
        await save(s, "REGISTRADO", "FALHA");
        await save(s, "INSERIDO", "FALHA");
        continue;
      }

      // Flag: false = precisamos navegar até a tela de login;
      // true  = acabamos de cadastrar e a página já voltou para o login
      let jaNoLogin = false;

      // ETAPA 1: CADASTRO NA PLATAFORMA (só se ainda não está registrado)
      if (!registradoOk) {
        try {
          await page.goto(URL_CADASTRAR);
          await sleep(7000); // espera a página carregar

          // Preenche o formulário de cadastro
          await page.locator('xpath=//input[@placeholder="Nome"]').fill(nome);
          await page.locator('xpath=//input[@placeholder="Nickname"]').fill(ra);
          await page.locator('xpath=//input[@placeholder="Email de contato"]').fill(email);
          await page.locator('xpath=//input[@placeholder="Senha"]').fill(PASS_FIXED);
          await sleep(2000);

          // Clica fora (no corpo da página) para tirar o foco dos campos
          await page.locator("body").click();
          await sleep(2000);

          // Marca o checkbox de aceite
          await page.locator('xpath=//input[@type="checkbox"]').click();

          // Clica no botão "Cadastrar-se"
          const botaoCadastrar = page.locator(
            'xpath=//div[contains(@class, "flex-row-reverse")]//p[text()="Cadastrar-se"]/ancestor::button'
          );
          await botaoCadastrar.click();
          await sleep(5000); // espera o cadastro concluir e voltar para o login

          // Cadastro deu certo: grava "OK" em REGISTRADO e salva o Excel
          await save(s, "REGISTRADO", "OK");
          console.log(`CADASTRO OK - ${nome} (RA ${ra})`);
          registradoOk = true; // libera a etapa de inserção
          jaNoLogin = true; // já estamos na tela de login (redirect)
        } catch (e) {
          // Cadastro falhou: grava "FALHA" e salva, depois segue para o próximo
          await save(s, "REGISTRADO", "FALHA");
          console.log(`CADASTRO FALHA - ${nome} (RA ${ra}): ${e.message}`);
        }
      }

      // ETAPA 2: LOGIN + INSERIR CÓDIGO DA TURMA (só se o cadastro deu certo)
      if (registradoOk) {
        try {
          // Se não veio direto do cadastro, navega até a tela de login
          if (!jaNoLogin) await page.goto(URL_LOGIN);

          // Espera o campo "Usuário" aparecer (máximo 30s)
          const inputUsuario = page.locator('xpath=//input[@placeholder="Usuário"]');
          await inputUsuario.waitFor({ state: "visible", timeout: 30000 });

          // Faz login com RA + senha padrão
          await inputUsuario.fill(ra);
          await page.locator('xpath=//input[@placeholder="Senha"]').fill(PASS_FIXED);

          // Clica no botão "Entrar"
          const botaoEntrar = page.locator(
            'xpath=//div[contains(@class, "flex-row-reverse")]//p[text()="Entrar"]/ancestor::button'
          );
          await botaoEntrar.click();
          await sleep(20000); // espera o painel carregar

          // Se aparecer o tutorial, clica em "Dispensar Tutorial"
          const dispensarTutorial = page.locator(
            'xpath=//button[p[text()="Dispensar Tutorial"]]'
          );
          if ((await dispensarTutorial.count()) > 0) {
            await dispensarTutorial.first().click();
            await sleep(5000);
          }

          // Clica em "Inserir Código"
          await page.locator('xpath=//button[p[text()="Inserir Código"]]').click();
          await sleep(5000);

          // Digita o código da turma e clica em "Continuar"
          await page.locator('xpath=//input[@placeholder="Digite o código"]').fill(codTurma);
          await page.locator('xpath=//button[p[text()="Continuar"]]').click();
          await sleep(5000);

          // Confirma o código da turma
          await page.locator('xpath=//button[p[text()="Continuar"]]').click();
          await sleep(15000); // espera a turma ser adicionada

          // Clica no avatar (menu do usuário)
          await page.locator('xpath=//img[@src="/assets/images/avatar_1.png"]').click();
          await sleep(5000);

          // Clica em "Sair" para encerrar a sessão
          await page.locator('xpath=//button[p[text()="Sair"]]').click();
          await sleep(5000);

          // Inserção deu certo: grava "OK" em INSERIDO e salva o Excel
          await save(s, "INSERIDO", "OK");
          console.log(`INSERIDO OK - ${nome} (RA ${ra})`);
        } catch (e) {
          // Inserção falhou: grava "FALHA" e salva, depois segue para o próximo
          await save(s, "INSERIDO", "FALHA");
          console.log(`INSERIDO FALHA - ${nome} (RA ${ra}): ${e.message}`);
        }
      }
    }
  } finally {
    await context.close(); // fecha o navegador quando a fatia termina
  }
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
async function main() {
  // Se o usuário rodou "node register_students.js 4", usa 4 navegadores.
  // Se não passou nada, pergunta e o padrão é 1 (um de cada vez).
  let NUM_NAVEGADORES;
  if (process.argv.length > 2) {
    NUM_NAVEGADORES = Math.max(1, parseInt(process.argv[2], 10) || 1);
  } else {
    const rl = createInterface({ input: stdin, output: stdout });
    const resposta = await rl.question(
      "Quantos navegadores em paralelo? (padrão 1): "
    );
    rl.close();
    NUM_NAVEGADORES = Math.max(1, parseInt(resposta, 10) || 1);
  }

  // Carrega o Excel
  if (!(await loadExcel())) return;

  // Lista dos alunos que ainda não foram inseridos (INSERIDO diferente de "OK")
  const pendencias = students.filter((s) => !isOk(s.INSERIDO));

  // Divide os pendentes entre os navegadores (intercalando: 1º, 2º, 3º, 4º, 1º, 2º...)
  const fatias = pendencias.reduce(
    (acc, s, pos) => {
      acc[pos % acc.length].push(s);
      return acc;
    },
    Array.from({ length: NUM_NAVEGADORES }, () => [])
  ).filter((f) => f.length > 0); // remove fatias vazias

  console.log(`Total pendentes: ${pendencias.length}`);
  console.log(`Navegadores: ${fatias.length}`);

  if (pendencias.length === 0) {
    console.log("Nada pendente. Encerrando.");
    return;
  }

  // Abre um navegador Chromium e roda cada fatia em um context paralelo
  const browser = await chromium.launch({ headless: HEADLESS });
  try {
    await Promise.all(fatias.map((fatia) => processarFatia(browser, fatia)));
  } finally {
    await browser.close();
  }
  console.log("Concluído!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
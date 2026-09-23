// Automação: registra os monitoramentos da Agenda do sistema no MundoZ (Mundo Zoom)
// Fluxo: login do orientador (email + senha) → tela /monitoramento → cadastra cada item.
//
// Fonte dos dados: um JSON (gerado pela página de Agenda) com este formato:
// {
//   "itens": [
//     { "id": 1, "escola": "Nome da escola", "ano": "2026", "tipo": "Presencial",
//       "confirmadoPor": "Nome de quem confirmou",
//       "data": "2026-09-22", "inicio": "08:00", "fim": "09:00",
//       "atividade": "Visita à escola", "status": "" }
//   ]
// }
// As credenciais do orientador vêm do AMBIENTE (nunca gravadas no arquivo):
//   MUNDOZ_USUARIO, MUNDOZ_SENHA, MUNDOZ_NOME
// (com fallback para dados.orientador quando rodar manual)
// O script lê o JSON, cadastra cada item pendente e grava o status de volta no arquivo.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { chromium } from "playwright";

// Diretório onde o script está, para montar os caminhos sempre do jeito certo
const currentDir = import.meta.dirname;

// Carrega as variáveis do arquivo .env (que fica nesta mesma pasta)
loadEnv({ path: join(currentDir, ".env") });

// Diretório onde ficam os arquivos de dados (configurável no .env)
const DIRETORIO_DADOS = process.env.DIRETORIO_DADOS || currentDir;

// Caminho do JSON com os monitoramentos (pode vir como argumento)
const ARQ_DADOS = process.argv[2] || join(DIRETORIO_DADOS, "monitoramentos.json");

// URLs e credenciais da plataforma (vêm do .env)
const URL_LOGIN = process.env.URL_LOGIN;
const URL_MONITORAMENTO = process.env.URL_MONITORAMENTO || "https://mundoz.zoom.education/monitoramento";
const HEADLESS = (process.env.HEADLESS || "false").toLowerCase() === "true";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Valores padrão do monitoramento (podem ser sobrescritos no JSON por item)
const CONFIG = {
  ano: String(new Date().getFullYear()), // ex.: "2026"
  tipo: "Presencial", // Presencial | Remoto | Híbrido
};

// Texto de uma célula/valor como string simples
function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object" && value && typeof value.text === "string") {
    return value.text.trim();
  }
  return String(value).trim();
}

function isOk(value) {
  return cellText(value).toUpperCase() === "OK";
}

// ---------------------------------------------------------------------------
// Leitura do JSON de monitoramentos
// ---------------------------------------------------------------------------
let dados = null;

function loadDados() {
  if (!existsSync(ARQ_DADOS)) {
    console.log(`Arquivo não encontrado: ${ARQ_DADOS}`);
    return null;
  }
  try {
    dados = JSON.parse(readFileSync(ARQ_DADOS, "utf8"));
    return dados;
  } catch (e) {
    console.log(`Erro ao ler o JSON: ${e.message}`);
    return null;
  }
}

// Grava o status num item e atualiza o arquivo
function salvar(item, status) {
  item.status = status;
  writeFileSync(ARQ_DADOS, JSON.stringify(dados, null, 2));
}

// ---------------------------------------------------------------------------
// Login do orientador na plataforma (email + senha)
// ---------------------------------------------------------------------------
async function fazerLogin(page, orientador) {
  await page.goto(URL_LOGIN);
  await sleep(7000);

  // Campo "Usuário" aceita o email do orientador
  const inputUsuario = page.locator('xpath=//input[@placeholder="Usuário"]');
  await inputUsuario.waitFor({ state: "visible", timeout: 30000 });
  await inputUsuario.fill(orientador.usuario);

  await page.locator('xpath=//input[@placeholder="Senha"]').fill(orientador.senha);

  // Clica no botão "Entrar"
  const botaoEntrar = page.locator(
    'xpath=//div[contains(@class, "flex-row-reverse")]//p[text()="Entrar"]/ancestor::button'
  );
  await botaoEntrar.click();
  await sleep(20000); // espera o painel carregar

  // Se aparecer o tutorial, clica em "Dispensar Tutorial"
  const dispensarTutorial = page.locator('xpath=//button[p[text()="Dispensar Tutorial"]]');
  if ((await dispensarTutorial.count()) > 0) {
    await dispensarTutorial.first().click();
    await sleep(5000);
  }
}

// ---------------------------------------------------------------------------
// Helpers de interação com selects e listas da plataforma
// ---------------------------------------------------------------------------
async function clicarOpcao(page, texto) {
  await sleep(1000);
  // Procura primeiro por role="option" (selects custom), senão por <li>/<div> com o texto exato
  const opcao = page
    .getByRole("option", { name: texto, exact: true })
    .or(page.locator(`xpath=//li[normalize-space(.)="${texto}"]`))
    .or(page.locator(`xpath=//div[normalize-space(.)="${texto}"]`).first());
  await opcao.first().click();
  await sleep(1000);
}

async function escolherSelect(page, textoTrigger, textoOpcao) {
  // Clica no combobox que exibe o texto (ex.: "Escolha o ano") e escolhe a opção
  const trigger = page
    .getByRole("combobox", { name: new RegExp(textoTrigger, "i") })
    .or(page.locator(`xpath=//*[contains(normalize-space(.), "${textoTrigger}")]`).first());
  await trigger.first().click();
  await sleep(1000);
  await clicarOpcao(page, textoOpcao);
}

// ---------------------------------------------------------------------------
// Registra um item de monitoramento na plataforma
// ---------------------------------------------------------------------------
async function processarItem(page, orientador, item) {
  const escola = item.escola;
  const ano = item.ano || CONFIG.ano;
  const tipo = item.tipo || CONFIG.tipo;
  const confirmadoPor = item.confirmadoPor || orientador.nome;
  const data = item.data;           // ex.: "2026-09-22"
  const atividade = item.atividade; // ex.: "Visita à escola"

  await page.goto(URL_MONITORAMENTO);
  await sleep(10000); // espera a tela de monitoramento carregar

  // 1. Abre o formulário: botão "Adicionar +"
  const botaoAdicionar = page
    .getByRole("button", { name: /adicionar/i })
    .or(page.locator('xpath=//button[contains(normalize-space(.), "Adicionar")]'));
  await botaoAdicionar.first().click();
  await sleep(3000);

  // 2. Digita o nome da escola no campo de busca
  const buscaEscola = page.locator('xpath=//input[@placeholder="Digite o nome ou o cnpj da escola"]');
  await buscaEscola.fill(escola);
  await sleep(1500);

  // 3. Clica na lupa no fim do campo de busca
  // TODO: seletor da lupa pode variar (button com svg / img junto do input)
  const lupa = page
    .locator('xpath=//input[@placeholder="Digite o nome ou o cnpj da escola"]/following::button[1]')
    .or(page.locator('xpath=//button[.//*[local-name()="svg"]][1]'));
  await lupa.first().click();
  await sleep(2500);

  // 4. Seleciona a escola na caixa que abrir
  await clicarOpcao(page, escola);

  // 5. Ano (select com rolagem)
  await escolherSelect(page, "Escolha o ano", ano);

  // 6. Tipo: Presencial / Remoto / Híbrido
  await escolherSelect(page, "Tipo", tipo);

  // 7. Confirmado por (quem confirmou a visita)
  await escolherSelect(page, "Confirmado por", confirmadoPor);

  // 8. Datas: "Data" (date), "Data entrada" (time) e "Data fim" (time)
  //    Mapeadas da agenda: data → data, data entrada → inicio, data fim → fim
  await page.locator('xpath=//input[@type="date" and contains(@placeholder, "Data")]').first().fill(data);
  await page.locator('xpath=//input[@type="time" and contains(@placeholder, "entrada")]').first().fill(item.inicio);
  await page.locator('xpath=//input[@type="time" and contains(@placeholder, "fim")]').first().fill(item.fim);

  // TODO: ainda existem mais campos no formulário — vamos preencher à medida
  // que você for descrevendo a tela (atividade/observação pode estar aqui).

  await sleep(2000);

  // Botão de salvar (texto/posição a confirmar)
  const botaoSalvar = page
    .getByRole("button", { name: /salvar|cadastrar/i })
    .or(page.locator('xpath=//div[contains(@class, "flex-row-reverse")]//p[contains(text(), "Salvar")]/ancestor::button'));
  await botaoSalvar.first().click();
  await sleep(5000);
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
async function main() {
  const dados = loadDados();
  if (!dados) return;

  const itens = Array.isArray(dados.itens) ? dados.itens : [];

  // Credenciais: vêm do ambiente (preferido) ou do JSON (modo manual)
  const usuario = process.env.MUNDOZ_USUARIO || dados.orientador?.usuario || "";
  const senha = process.env.MUNDOZ_SENHA || dados.orientador?.senha || "";
  const nome = process.env.MUNDOZ_NOME || dados.orientador?.nome || "Orientador";

  if (!usuario || !senha) {
    console.log("Faltam as credenciais do orientador (MUNDOZ_USUARIO/MUNDOZ_SENHA).");
    return;
  }
  if (itens.length === 0) {
    console.log("Nenhum item de agenda para registrar. Encerrando.");
    return;
  }

  const pendentes = itens.filter((i) => !isOk(i.status));
  console.log(`Total de itens: ${itens.length} (pendentes: ${pendentes.length})`);

  if (pendentes.length === 0) {
    console.log("Nada pendente. Encerrando.");
    return;
  }

  const orientador = { nome, usuario, senha };

  const browser = await chromium.launch({ headless: HEADLESS });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login único: todos os itens são do mesmo orientador
    try {
      await fazerLogin(page, orientador);
      console.log(`LOGIN OK - ${orientador.nome}`);
    } catch (e) {
      console.log(`LOGIN FALHA - ${orientador.nome}: ${e.message}`);
      return;
    }

    for (const item of pendentes) {
      try {
        await processarItem(page, orientador, item);
        salvar(item, "OK");
        console.log(`MONITORAMENTO OK - ${item.data} ${item.inicio} (${item.atividade})`);
      } catch (e) {
        salvar(item, "FALHA");
        console.log(`MONITORAMENTO FALHA - ${item.data} ${item.inicio}: ${e.message}`);
      }
    }

    await context.close();
  } finally {
    await browser.close();
  }
  console.log("Concluído!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
const parametrosCriatura = new URLSearchParams(window.location.search);
const idCriatura = parametrosCriatura.get("criatura");
const idCampanhaCriatura = parametrosCriatura.get("campanha");

const botaoVoltarCriatura = document.querySelector(".botao-voltar");
const campoNomeCriatura = document.getElementById("nome-criatura");
const campoFotoCriatura = document.getElementById("input-foto-criatura");
const imagemFotoCriatura = document.getElementById("imagem-foto-criatura");
const semFotoCriatura = document.getElementById("sem-foto-criatura");
const botaoRemoverFotoCriatura = document.getElementById("remover-foto-criatura");
const campoAparenciaCriatura = document.getElementById("aparencia-criatura");
const campoAnotacoesCriatura = document.getElementById("anotacoes-criatura");
const campoFisicoCriatura = document.getElementById("fisico-criatura");
const campoCognicaoCriatura = document.getElementById("cognicao-criatura");
const campoPresencaCriatura = document.getElementById("presenca-criatura");
const campoDeslocamentoMetrosCriatura = document.getElementById("deslocamento-metros-criatura");
const campoDeslocamentoQuadradosCriatura = document.getElementById("deslocamento-quadrados-criatura");
const campoPvAtualCriatura = document.getElementById("pv-atual-criatura");
const campoPvMaximoCriatura = document.getElementById("pv-maximo-criatura");
const preenchimentoPvCriatura = document.getElementById("preenchimento-pv-criatura");
const listaPericiasCriatura = document.getElementById("lista-pericias-criatura");
const pontosAtuaisPericiasCriatura = document.getElementById("pontos-atuais-pericias-criatura");
const limitePericiasCriatura = document.getElementById("limite-pericias-criatura");
const tipoRolagemCriatura = document.getElementById("tipo-rolagem-criatura");
const areaRolagemPericiaCriatura = document.getElementById("rolagem-pericia-criatura");
const areaRolagemOutroCriatura = document.getElementById("rolagem-outro-criatura");
const pesquisaPericiaCriatura = document.getElementById("pesquisa-pericia-criatura");
const datalistPericiasCriatura = document.getElementById("datalist-pericias-criatura");
const quantidadeD20Criatura = document.getElementById("quantidade-d20-criatura");
const valorTesteCriatura = document.getElementById("valor-teste-criatura");
const listaDadosPersonalizadosCriatura = document.getElementById("lista-dados-personalizados-criatura");
const botaoAdicionarDadoCriatura = document.getElementById("adicionar-dado-criatura");
const botaoRolarCriatura = document.getElementById("rolar-criatura");
const dadosResultadoCriatura = document.getElementById("dados-resultado-criatura");
const resultadoSucessoCriatura = document.getElementById("resultado-sucesso-criatura");
const historicoRolagensCriatura = document.getElementById("historico-rolagens-criatura");
const listaHabilidadesCriatura = document.getElementById("lista-habilidades-criatura");
const habilidadesCriaturaVazio = document.getElementById("habilidades-criatura-vazio");
const botaoAdicionarHabilidadeCriatura = document.getElementById("adicionar-habilidade-criatura");
const areaPersonagensCampanhaFicha = document.getElementById("personagens-campanha-ficha");
const listaPersonagensCampanhaFicha = document.getElementById("lista-personagens-campanha-ficha");
const listaHistoricoJogadoresCampanhaFicha = document.getElementById("lista-historico-jogadores-campanha-ficha");
const listaHistoricoMestreCampanhaFicha = document.getElementById("lista-historico-mestre-campanha-ficha");

let dadosCriatura = null;
let periciasSistemaCriatura = [];
let periciasCriatura = {};
let habilidadesCriatura = [];
let periciaSelecionadaCriaturaId = null;
let dadosJogadoresCampanha = new Map();
let cancelarVinculosJogadoresCriatura = null;
let cancelamentosJogadoresCriatura = [];
let cancelarHistoricoJogadoresCriatura = null;
let cancelarHistoricoMestreCriatura = null;
let rolagensJogadoresCampanha = [];
let rolagensMestreCampanha = [];
let timerSalvarInformacoesCriatura = null;
let timerSalvarHabilidadesCriatura = null;
let sequenciaHabilidadeCriatura = 0;

function referenciaCriatura() {
  return db.collection("campanhas").doc(idCampanhaCriatura).collection("criaturas").doc(idCriatura);
}
function normalizarTextoCriatura(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function criarIdPericiaCriatura(nome) {
  return normalizarTextoCriatura(nome).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function normalizarAtributoCriatura(atributo) {
  const texto = normalizarTextoCriatura(atributo);
  if (texto.includes("fis")) return "fisico";
  if (texto.includes("pre")) return "presenca";
  return "cognicao";
}
function classeSiglaAtributoCriatura(atributo) {
  if (atributo === "fisico") return "atributo-fisico-sigla";
  if (atributo === "presenca") return "atributo-presenca-sigla";
  return "atributo-cognicao-sigla";
}
function textoSiglaAtributoCriatura(atributo) {
  if (atributo === "fisico") return "(FIS)";
  if (atributo === "presenca") return "(PRE)";
  return "(COG)";
}
function proximoAtributoCriatura(atributo) {
  if (atributo === "fisico") return "cognicao";
  if (atributo === "cognicao") return "presenca";
  return "fisico";
}
function obterAtributoCriatura(atributo) {
  if (atributo === "fisico") return Number(campoFisicoCriatura.value) || 0;
  if (atributo === "presenca") return Number(campoPresencaCriatura.value) || 0;
  return Number(campoCognicaoCriatura.value) || 0;
}
function obterPericiaSistemaCriatura(id) {
  return periciasSistemaCriatura.find(pericia => pericia.id === id) || null;
}
function obterPericiaPorNomeCriatura(nome) {
  const busca = normalizarTextoCriatura(nome);
  return periciasSistemaCriatura.find(pericia => normalizarTextoCriatura(pericia.nome) === busca) || null;
}

botaoVoltarCriatura.addEventListener("click",() => {
  window.location.href = `index.html?campanha=${encodeURIComponent(idCampanhaCriatura || "")}`;
});

/* Navegação */

const botoesAbasCriatura = [...document.querySelectorAll(".aba-ficha")];
const paineisAbasCriatura = [...document.querySelectorAll(".conteudo-aba-ficha")];
const indicadorMenuCriatura = document.getElementById("indicador-menu-criatura");

function atualizarIndicadorCriatura() {
  const ativa = document.querySelector(".aba-ficha.ativa");
  if (!ativa || !indicadorMenuCriatura) return;
  indicadorMenuCriatura.style.left = `${ativa.offsetLeft}px`;
  indicadorMenuCriatura.style.width = `${ativa.offsetWidth}px`;
}
function abrirAbaCriatura(aba) {
  botoesAbasCriatura.forEach(botao => {
    const ativa = botao.dataset.aba === aba;
    botao.classList.toggle("ativa",ativa);
    botao.setAttribute("aria-selected",String(ativa));
  });
  paineisAbasCriatura.forEach(painel => painel.classList.toggle("ativo",painel.id === `aba-${aba}`));
  requestAnimationFrame(atualizarIndicadorCriatura);
}
botoesAbasCriatura.forEach(botao => botao.addEventListener("click",() => abrirAbaCriatura(botao.dataset.aba)));
window.addEventListener("resize",atualizarIndicadorCriatura);

const botoesAreasPontosCriatura = [...document.querySelectorAll(".botao-area-pontos")];
const paineisAreasPontosCriatura = [...document.querySelectorAll("[data-painel-pontos]")];
function abrirAreaPontosCriatura(area) {
  botoesAreasPontosCriatura.forEach(botao => botao.classList.toggle("ativa",botao.dataset.areaPontos === area));
  paineisAreasPontosCriatura.forEach(painel => painel.classList.toggle("area-pontos-ativa",painel.dataset.painelPontos === area));
}
botoesAreasPontosCriatura.forEach(botao => botao.addEventListener("click",() => abrirAreaPontosCriatura(botao.dataset.areaPontos)));

/* Salvamento */

async function salvarCriatura(alteracoes) {
  if (!auth.currentUser || !idCriatura || !idCampanhaCriatura) return;
  try {
    await referenciaCriatura().update({
      ...alteracoes,
      atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (erro) {
    console.error("Erro ao salvar Criatura:",erro);
  }
}
function agendarSalvamentoInformacoesCriatura() {
  clearTimeout(timerSalvarInformacoesCriatura);
  timerSalvarInformacoesCriatura = setTimeout(() => {
    salvarCriatura({
      aparencia:campoAparenciaCriatura.value,
      anotacoes:campoAnotacoesCriatura.value
    });
  },350);
}

/* Foto e cabeçalho */

function mostrarFotoCriatura(foto) {
  const possui = typeof foto === "string" && foto.length > 0;
  imagemFotoCriatura.hidden = !possui;
  semFotoCriatura.hidden = possui;
  botaoRemoverFotoCriatura.hidden = !possui;
  if (possui) imagemFotoCriatura.src = foto;
  else imagemFotoCriatura.removeAttribute("src");
}
function prepararImagemCriatura(arquivo) {
  return new Promise((resolve,reject) => {
    if (!arquivo?.type?.startsWith("image/")) return reject(new Error("arquivo-invalido"));
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const limite = 500;
        const escala = Math.min(limite / imagem.width,limite / imagem.height,1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1,Math.round(imagem.width * escala));
        canvas.height = Math.max(1,Math.round(imagem.height * escala));
        canvas.getContext("2d").drawImage(imagem,0,0,canvas.width,canvas.height);
        const base64 = canvas.toDataURL("image/webp",0.82);
        if (base64.length > 650000) return reject(new Error("imagem-grande"));
        resolve(base64);
      };
      imagem.onerror = reject;
      imagem.src = leitor.result;
    };
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}
campoNomeCriatura.addEventListener("change",() => {
  const nome = campoNomeCriatura.value.trim();
  if (!nome) {
    campoNomeCriatura.value = dadosCriatura?.nome || "Nova Criatura";
    return;
  }
  if (dadosCriatura) dadosCriatura.nome = nome;
  salvarCriatura({nome});
  document.title = `${nome}: A Realidade RPG`;
});
campoFotoCriatura.addEventListener("change",async () => {
  const arquivo = campoFotoCriatura.files?.[0];
  if (!arquivo) return;
  try {
    const foto = await prepararImagemCriatura(arquivo);
    if (dadosCriatura) dadosCriatura.foto = foto;
    mostrarFotoCriatura(foto);
    await salvarCriatura({foto});
  } catch (erro) {
    console.error("Erro ao preparar foto da Criatura:",erro);
    alert(erro.message === "imagem-grande" ? "A imagem ficou grande demais." : "Não foi possível usar essa imagem.");
  }
  campoFotoCriatura.value = "";
});
botaoRemoverFotoCriatura.addEventListener("click",async evento => {
  evento.preventDefault();
  if (dadosCriatura) dadosCriatura.foto = "";
  mostrarFotoCriatura("");
  await salvarCriatura({foto:""});
});
campoAparenciaCriatura.addEventListener("input",agendarSalvamentoInformacoesCriatura);
campoAnotacoesCriatura.addEventListener("input",agendarSalvamentoInformacoesCriatura);

/* Atributos e PV */

function atualizarBarraPvCriatura() {
  const atual = Math.max(0,Number(campoPvAtualCriatura.value) || 0);
  const maximo = Math.max(0,Number(campoPvMaximoCriatura.value) || 0);
  const porcentagem = maximo > 0 ? Math.max(0,Math.min(100,(atual / maximo) * 100)) : 0;
  preenchimentoPvCriatura.style.width = `${porcentagem}%`;
}
function salvarAtributosCriatura() {
  const atributos = {
    fisico:Math.max(0,Math.min(9,Math.trunc(Number(campoFisicoCriatura.value) || 0))),
    cognicao:Math.max(0,Math.min(9,Math.trunc(Number(campoCognicaoCriatura.value) || 0))),
    presenca:Math.max(0,Math.min(9,Math.trunc(Number(campoPresencaCriatura.value) || 0))),
    deslocamentoMetros:Math.max(0,Number(campoDeslocamentoMetrosCriatura.value) || 0),
    deslocamentoQuadrados:Math.max(0,Number(campoDeslocamentoQuadradosCriatura.value) || 0)
  };
  if (dadosCriatura) dadosCriatura.atributos = atributos;
  salvarCriatura({atributos});
  atualizarRolagemPericiaSelecionadaCriatura();
}
[campoFisicoCriatura,campoCognicaoCriatura,campoPresencaCriatura,campoDeslocamentoMetrosCriatura,campoDeslocamentoQuadradosCriatura].forEach(campo => campo.addEventListener("change",salvarAtributosCriatura));
[campoPvAtualCriatura,campoPvMaximoCriatura].forEach(campo => campo.addEventListener("change",() => {
  const pv = {
    atual:Math.max(0,Math.trunc(Number(campoPvAtualCriatura.value) || 0)),
    maximo:Math.max(0,Math.trunc(Number(campoPvMaximoCriatura.value) || 0))
  };
  campoPvAtualCriatura.value = pv.atual;
  campoPvMaximoCriatura.value = pv.maximo;
  if (dadosCriatura) dadosCriatura.pv = pv;
  atualizarBarraPvCriatura();
  salvarCriatura({pv});
}));

/* Perícias */

async function carregarPericiasSistemaCriatura() {
  const resposta = await fetch("index-sistema.html");
  if (!resposta.ok) throw new Error("Não foi possível abrir index-sistema.html.");
  const html = await resposta.text();
  const documento = new DOMParser().parseFromString(html,"text/html");
  periciasSistemaCriatura = [...documento.querySelectorAll("#lista-pericias > li")].map(item => {
    const nome = item.querySelector("b")?.textContent.trim().replace(/:$/," ").trim();
    const texto = item.textContent.replace(/\s+/g," ").trim();
    const atributo = texto.match(/Atributo:\s*(Físico|Cognição|Presença)/i)?.[1];
    if (!nome || !atributo) return null;
    return {id:criarIdPericiaCriatura(nome),nome,atributoPadrao:normalizarAtributoCriatura(atributo)};
  }).filter(Boolean);
}
function obterValorPericiaCriatura(id) {
  return Number(periciasCriatura[id]?.valor) || 5;
}
function obterSomaPericiasCriatura() {
  return periciasSistemaCriatura.reduce((soma,pericia) => soma + obterValorPericiaCriatura(pericia.id),0);
}
function renderizarContadorPericiasCriatura() {
  const atual = obterSomaPericiasCriatura();
  const limite = Math.max(0,Math.trunc(Number(limitePericiasCriatura.value) || 0));
  pontosAtuaisPericiasCriatura.textContent = atual;
  document.querySelector(".contador-pericias-criatura")?.classList.toggle("estourado",atual > limite);
}
function renderizarDatalistPericiasCriatura() {
  datalistPericiasCriatura.replaceChildren();
  periciasSistemaCriatura.forEach(pericia => {
    const opcao = document.createElement("option");
    opcao.value = pericia.nome;
    datalistPericiasCriatura.appendChild(opcao);
  });
}
function renderizarPericiasCriatura() {
  const fragmento = document.createDocumentFragment();
  periciasSistemaCriatura.forEach(pericia => {
    const dados = periciasCriatura[pericia.id] || {valor:5,atributoBase:pericia.atributoPadrao,modificador:""};
    const linha = document.createElement("div");
    linha.className = "linha-pericia-ficha";
    const nomeEAtributo = document.createElement("div");
    nomeEAtributo.className = "nome-e-atributo-pericia";
    const nome = document.createElement("strong");
    nome.textContent = pericia.nome;
    const sigla = document.createElement("button");
    sigla.type = "button";
    sigla.className = `sigla-atributo-pericia ${classeSiglaAtributoCriatura(dados.atributoBase)}`;
    sigla.textContent = textoSiglaAtributoCriatura(dados.atributoBase);
    sigla.addEventListener("click",() => {
      dados.atributoBase = proximoAtributoCriatura(dados.atributoBase);
      periciasCriatura[pericia.id] = dados;
      salvarCriatura({[`pericias.${pericia.id}.atributoBase`]:dados.atributoBase});
      renderizarPericiasCriatura();
      atualizarRolagemPericiaSelecionadaCriatura();
    });
    nomeEAtributo.append(nome,sigla);
    const grupo = document.createElement("div");
    grupo.className = "valores-pericia-ficha";
    const espaco = document.createElement("span");
    espaco.className = "espaco-bonus-natural-ficha";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "18";
    input.step = "1";
    input.value = dados.valor;
    const bom = document.createElement("span");
    bom.className = "valor-bom-ficha";
    bom.textContent = Math.floor(dados.valor / 2);
    const extremo = document.createElement("span");
    extremo.className = "valor-extremo-ficha";
    extremo.textContent = Math.floor(dados.valor / 5);
    const modificador = document.createElement("textarea");
    modificador.className = "modificador-pericia-ficha";
    modificador.rows = 1;
    modificador.wrap = "off";
    modificador.placeholder = "Ex.: +1d20";
    modificador.value = dados.modificador || "";
    input.addEventListener("change",() => {
      const novoValor = Number(input.value);
      if (!Number.isInteger(novoValor) || novoValor < 1 || novoValor > 18) {
        input.value = dados.valor;
        return;
      }
      dados.valor = novoValor;
      periciasCriatura[pericia.id] = dados;
      salvarCriatura({[`pericias.${pericia.id}.valor`]:novoValor});
      renderizarPericiasCriatura();
      atualizarRolagemPericiaSelecionadaCriatura();
    });
    modificador.addEventListener("change",() => {
      dados.modificador = modificador.value;
      periciasCriatura[pericia.id] = dados;
      salvarCriatura({[`pericias.${pericia.id}.modificador`]:dados.modificador});
    });
    grupo.append(espaco,input,bom,extremo,modificador);
    linha.append(nomeEAtributo,grupo);
    fragmento.appendChild(linha);
  });
  listaPericiasCriatura.replaceChildren(fragmento);
  renderizarContadorPericiasCriatura();
}
limitePericiasCriatura.addEventListener("change",() => {
  const limite = Math.max(0,Math.trunc(Number(limitePericiasCriatura.value) || 0));
  limitePericiasCriatura.value = limite;
  if (dadosCriatura) dadosCriatura.limitePontosPericias = limite;
  renderizarContadorPericiasCriatura();
  salvarCriatura({limitePontosPericias:limite});
});

/* Rolagens */

function categoriaIndividualPericiaCriatura(valor,alvo) {
  if (valor === 20) return "desastre";
  if (valor <= Math.floor(alvo / 5)) return "extremo";
  if (valor <= Math.floor(alvo / 2)) return "bom";
  if (valor <= alvo) return "normal";
  return "fracasso";
}
function resultadoPericiaCriatura(resultados,alvo) {
  if (!resultados.length) return "fracasso";
  if (resultados.length >= 2 && resultados.every(valor => valor === 20)) return "desastre-maximo";
  if (resultados.length >= 2 && resultados.every(valor => valor <= Math.floor(alvo / 5))) return "extremo-maximo";
  const menor = Math.min(...resultados);
  if (menor === 20) return "desastre";
  if (menor <= Math.floor(alvo / 5)) return "extremo";
  if (menor <= Math.floor(alvo / 2)) return "bom";
  if (menor <= alvo) return "normal";
  return "fracasso";
}
function nomeCategoriaCriatura(categoria) {
  const nomes = {"desastre-maximo":"DESASTRE MÁXIMO",desastre:"DESASTRE",fracasso:"FRACASSO",normal:"NORMAL",bom:"BOM",extremo:"EXTREMO","extremo-maximo":"EXTREMO MÁXIMO"};
  return nomes[categoria] || String(categoria || "").toUpperCase();
}
function limparResultadoCriatura() {
  dadosResultadoCriatura.replaceChildren();
  resultadoSucessoCriatura.hidden = true;
  resultadoSucessoCriatura.className = "resultado-sucesso-ficha";
}
function mostrarResultadoPericiaCriatura(resultados,alvo,categoria) {
  limparResultadoCriatura();
  resultados.forEach(valor => {
    const numero = document.createElement("span");
    numero.className = `dado-resultado resultado-${categoriaIndividualPericiaCriatura(valor,alvo)}`;
    numero.textContent = valor;
    dadosResultadoCriatura.appendChild(numero);
  });
  resultadoSucessoCriatura.hidden = false;
  resultadoSucessoCriatura.classList.add(`resultado-${categoria}`);
  resultadoSucessoCriatura.textContent = nomeCategoriaCriatura(categoria);
}
function criarLinhaDadoCriatura() {
  const linha = document.createElement("div");
  linha.className = "linha-dado-criatura";
  const quantidade = document.createElement("input");
  quantidade.type = "number";
  quantidade.min = "1";
  quantidade.max = "99";
  quantidade.value = "1";
  const lados = document.createElement("select");
  [4,6,8,10,12,20,30,100].forEach(valor => {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = `d${valor}`;
    if (valor === 20) opcao.selected = true;
    lados.appendChild(opcao);
  });
  const remover = document.createElement("button");
  remover.type = "button";
  remover.className = "remover-dado-criatura";
  remover.textContent = "×";
  remover.addEventListener("click",() => linha.remove());
  linha.append(quantidade,lados,remover);
  return linha;
}
botaoAdicionarDadoCriatura.addEventListener("click",() => listaDadosPersonalizadosCriatura.appendChild(criarLinhaDadoCriatura()));
listaDadosPersonalizadosCriatura.appendChild(criarLinhaDadoCriatura());
tipoRolagemCriatura.addEventListener("change",() => {
  const pericia = tipoRolagemCriatura.value === "pericia";
  areaRolagemPericiaCriatura.hidden = !pericia;
  areaRolagemOutroCriatura.hidden = pericia;
  limparResultadoCriatura();
});
function atualizarRolagemPericiaSelecionadaCriatura() {
  const pericia = obterPericiaSistemaCriatura(periciaSelecionadaCriaturaId);
  if (!pericia) return;
  const dados = periciasCriatura[pericia.id];
  quantidadeD20Criatura.value = obterAtributoCriatura(dados?.atributoBase || pericia.atributoPadrao);
  valorTesteCriatura.value = obterValorPericiaCriatura(pericia.id);
}
pesquisaPericiaCriatura.addEventListener("change",() => {
  const pericia = obterPericiaPorNomeCriatura(pesquisaPericiaCriatura.value);
  periciaSelecionadaCriaturaId = pericia?.id || null;
  atualizarRolagemPericiaSelecionadaCriatura();
});
async function registrarRolagemMestreCriatura(dados) {
  if (!auth.currentUser) return;
  await db.collection("campanhas").doc(idCampanhaCriatura).collection("historicoMestre").add({
    ...dados,
    fichaId:idCriatura,
    origemTipo:"criatura",
    nomeFicha:dadosCriatura?.nome || "Criatura",
    fotoFicha:dadosCriatura?.foto || "",
    criadoPorUid:auth.currentUser.uid,
    criadoEm:firebase.firestore.FieldValue.serverTimestamp()
  });
}
botaoRolarCriatura.addEventListener("click",async () => {
  if (tipoRolagemCriatura.value === "pericia") {
    const pericia = obterPericiaSistemaCriatura(periciaSelecionadaCriaturaId) || obterPericiaPorNomeCriatura(pesquisaPericiaCriatura.value);
    if (!pericia) return alert("Escolha uma Perícia.");
    periciaSelecionadaCriaturaId = pericia.id;
    const quantidade = Math.max(0,Math.trunc(Number(quantidadeD20Criatura.value) || 0));
    const alvo = Math.max(1,Math.min(18,Math.trunc(Number(valorTesteCriatura.value) || obterValorPericiaCriatura(pericia.id))));
    if (quantidade < 1) return alert("A quantidade de d20 precisa ser pelo menos 1 para rolar.");
    const resultados = Array.from({length:quantidade},() => Math.floor(Math.random() * 20) + 1);
    const categoria = resultadoPericiaCriatura(resultados,alvo);
    mostrarResultadoPericiaCriatura(resultados,alvo,categoria);
    await registrarRolagemMestreCriatura({tipo:"pericia",nomeTeste:pericia.nome,quantidadeDados:quantidade,valor:alvo,resultados,resultadoCategoria:categoria});
    return;
  }
  const dados = [...listaDadosPersonalizadosCriatura.querySelectorAll(".linha-dado-criatura")].map(linha => ({
    quantidade:Math.max(1,Math.trunc(Number(linha.querySelector("input")?.value) || 1)),
    lados:Math.max(2,Math.trunc(Number(linha.querySelector("select")?.value) || 20))
  }));
  const resultados = [];
  dados.forEach(dado => {
    for (let i = 0; i < dado.quantidade; i++) resultados.push({lados:dado.lados,valor:Math.floor(Math.random() * dado.lados) + 1});
  });
  const soma = resultados.reduce((total,item) => total + item.valor,0);
  limparResultadoCriatura();
  resultados.forEach(resultado => {
    const numero = document.createElement("span");
    numero.className = "dado-resultado";
    numero.textContent = resultado.valor;
    dadosResultadoCriatura.appendChild(numero);
  });
  resultadoSucessoCriatura.hidden = false;
  resultadoSucessoCriatura.classList.add("resultado-soma");
  resultadoSucessoCriatura.textContent = `Soma: ${soma}`;
  await registrarRolagemMestreCriatura({tipo:"outro",nomeTeste:"Outro Teste",dados,resultados,soma});
});

/* Habilidades */

function agendarSalvarHabilidadesCriatura() {
  clearTimeout(timerSalvarHabilidadesCriatura);
  timerSalvarHabilidadesCriatura = setTimeout(() => salvarCriatura({habilidades:habilidadesCriatura.map(item => ({...item}))}),300);
}
function criarIdHabilidadeCriatura() {
  sequenciaHabilidadeCriatura += 1;
  return `criatura-${Date.now()}-${sequenciaHabilidadeCriatura}`;
}
function criarCampoHabilidadeCriatura(rotulo,valor,chave,habilidade,textarea = false) {
  const label = document.createElement("label");
  label.className = `campo-habilidade-criatura${textarea ? " descricao-habilidade-criatura" : ""}`;
  const titulo = document.createElement("span");
  titulo.textContent = rotulo;
  const campo = document.createElement(textarea ? "textarea" : "input");
  campo.value = valor || "";
  if (textarea) campo.rows = 3;
  campo.addEventListener("input",() => {
    habilidade[chave] = campo.value;
    agendarSalvarHabilidadesCriatura();
  });
  label.append(titulo,campo);
  return label;
}
function renderizarHabilidadesCriatura(idAbrir = null) {
  listaHabilidadesCriatura.replaceChildren();
  habilidadesCriaturaVazio.hidden = habilidadesCriatura.length > 0;
  habilidadesCriatura.forEach(habilidade => {
    const card = document.createElement("article");
    card.className = "card-habilidade-criatura";
    card.dataset.id = habilidade.id;
    const cabecalho = document.createElement("div");
    cabecalho.className = "cabecalho-card-habilidade-criatura";
    const nome = document.createElement("input");
    nome.className = "nome-habilidade-criatura";
    nome.placeholder = "Nome da Habilidade";
    nome.value = habilidade.nome || "";
    nome.addEventListener("input",() => {
      habilidade.nome = nome.value;
      agendarSalvarHabilidadesCriatura();
    });
    const expandir = document.createElement("button");
    expandir.type = "button";
    expandir.className = "expandir-habilidade-criatura";
    expandir.textContent = "▶";
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "excluir-habilidade-criatura";
    excluir.textContent = "🗑";
    const conteudo = document.createElement("div");
    conteudo.className = "conteudo-habilidade-criatura";
    conteudo.hidden = habilidade.id !== idAbrir;
    expandir.addEventListener("click",() => conteudo.hidden = !conteudo.hidden);
    excluir.addEventListener("click",() => {
      if (!confirm(`Excluir "${habilidade.nome.trim() || "esta Habilidade"}"?`)) return;
      habilidadesCriatura = habilidadesCriatura.filter(item => item.id !== habilidade.id);
      renderizarHabilidadesCriatura();
      salvarCriatura({habilidades:habilidadesCriatura.map(item => ({...item}))});
    });
    conteudo.append(
      criarCampoHabilidadeCriatura("CUSTO",habilidade.custo,"custo",habilidade),
      criarCampoHabilidadeCriatura("ALVO",habilidade.alvo,"alvo",habilidade),
      criarCampoHabilidadeCriatura("ALCANCE",habilidade.alcance,"alcance",habilidade),
      criarCampoHabilidadeCriatura("RESISTÊNCIA",habilidade.resistencia,"resistencia",habilidade),
      criarCampoHabilidadeCriatura("DESCRIÇÃO",habilidade.descricao,"descricao",habilidade,true)
    );
    cabecalho.append(nome,expandir,excluir);
    card.append(cabecalho,conteudo);
    listaHabilidadesCriatura.appendChild(card);
  });
  if (idAbrir) requestAnimationFrame(() => listaHabilidadesCriatura.querySelector(`[data-id="${idAbrir}"] .nome-habilidade-criatura`)?.focus());
}
botaoAdicionarHabilidadeCriatura.addEventListener("click",() => {
  const habilidade = {id:criarIdHabilidadeCriatura(),nome:"",custo:"",alvo:"",alcance:"",resistencia:"",descricao:""};
  habilidadesCriatura.push(habilidade);
  renderizarHabilidadesCriatura(habilidade.id);
  salvarCriatura({habilidades:habilidadesCriatura.map(item => ({...item}))});
});

/* Personagens e históricos da Campanha */

function cancelarEscutasJogadoresCriatura() {
  if (cancelarVinculosJogadoresCriatura) cancelarVinculosJogadoresCriatura();
  cancelarVinculosJogadoresCriatura = null;
  cancelamentosJogadoresCriatura.forEach(cancelar => cancelar());
  cancelamentosJogadoresCriatura = [];
}
async function garantirAcessoJogadorCriatura(fichaId) {
  try {
    await db.collection("acessosFichas").doc(fichaId).collection("usuarios").doc(auth.currentUser.uid).set({campanhaId:idCampanhaCriatura});
    return true;
  } catch (erro) {
    console.error("Erro ao liberar acesso à ficha de jogador:",erro);
    return false;
  }
}
function criarCardJogadorCriatura(ficha) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card-personagem-campanha-ficha";
  const foto = document.createElement("div");
  foto.className = "foto-card-personagem-campanha-ficha";
  if (ficha.foto) {
    const img = document.createElement("img");
    img.src = ficha.foto;
    img.alt = `Foto de ${ficha.nome || "personagem"}`;
    foto.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = "SEM FOTO";
    foto.appendChild(span);
  }
  const infos = document.createElement("div");
  infos.className = "informacoes-card-personagem-campanha-ficha";
  const nome = document.createElement("strong");
  nome.className = "nome-card-personagem-campanha-ficha";
  nome.textContent = ficha.nome || "SEM NOME";
  const recursos = document.createElement("div");
  recursos.className = "recursos-card-personagem-campanha-ficha";
  [["PV",ficha.pv,"pv-card-personagem-ficha"],["PD",ficha.pd,"pd-card-personagem-ficha"]].forEach(([rotulo,recurso,classe]) => {
    const area = document.createElement("div");
    area.className = "recurso-card-personagem-ficha";
    const cabecalho = document.createElement("div");
    cabecalho.className = "cabecalho-recurso-card-personagem-ficha";
    const strong = document.createElement("strong");
    strong.textContent = rotulo;
    const valor = document.createElement("span");
    const atual = Math.max(0,Number(recurso?.atual) || 0);
    const maximo = Math.max(0,Number(recurso?.maximo) || 0);
    valor.textContent = `${atual} / ${maximo}`;
    const barra = document.createElement("div");
    barra.className = `barra-card-personagem-ficha ${classe}`;
    const preenchimento = document.createElement("div");
    preenchimento.style.width = `${maximo > 0 ? Math.max(0,Math.min(100,(atual / maximo) * 100)) : 0}%`;
    cabecalho.append(strong,valor);
    barra.appendChild(preenchimento);
    area.append(cabecalho,barra);
    recursos.appendChild(area);
  });
  infos.append(nome,recursos);
  card.append(foto,infos);
  card.addEventListener("click",() => window.location.href = `index-ficha.html?ficha=${encodeURIComponent(ficha.id)}&campanha=${encodeURIComponent(idCampanhaCriatura)}`);
  return card;
}
function renderizarJogadoresCriatura() {
  const jogadores = [...dadosJogadoresCampanha.values()];
  listaPersonagensCampanhaFicha.replaceChildren();
  areaPersonagensCampanhaFicha.hidden = jogadores.length === 0;
  if (!jogadores.length) return;
  let indice = 0;
  while (indice < jogadores.length) {
    let quantidade = Math.min(3,jogadores.length - indice);
    if (jogadores.length - indice === 4) quantidade = 2;
    const linha = document.createElement("div");
    linha.className = "linha-personagens-campanha-ficha";
    linha.style.setProperty("--quantidade-personagens",quantidade);
    jogadores.slice(indice,indice + quantidade).forEach(ficha => linha.appendChild(criarCardJogadorCriatura(ficha)));
    listaPersonagensCampanhaFicha.appendChild(linha);
    indice += quantidade;
  }
}
function iniciarJogadoresCriatura() {
  cancelarEscutasJogadoresCriatura();
  cancelarVinculosJogadoresCriatura = db.collection("campanhas").doc(idCampanhaCriatura).collection("fichasJogadores").orderBy("adicionadoEm","asc").onSnapshot(resultado => {
    cancelamentosJogadoresCriatura.forEach(cancelar => cancelar());
    cancelamentosJogadoresCriatura = [];
    dadosJogadoresCampanha.clear();
    renderizarJogadoresCriatura();
    resultado.docs.forEach(async vinculo => {
      const fichaId = vinculo.data().fichaId || vinculo.id;
      if (!await garantirAcessoJogadorCriatura(fichaId)) return;
      const cancelar = db.collection("fichas").doc(fichaId).onSnapshot(documento => {
        if (documento.exists) dadosJogadoresCampanha.set(fichaId,{id:documento.id,...documento.data()});
        else dadosJogadoresCampanha.delete(fichaId);
        renderizarJogadoresCriatura();
        renderizarHistoricosCampanhaCriatura();
      });
      cancelamentosJogadoresCriatura.push(cancelar);
    });
  });
}
function obterFichaHistoricoCriatura(rolagem) {
  if (rolagem.origemTipo === "criatura" && rolagem.fichaId === idCriatura) return {nome:dadosCriatura?.nome || rolagem.nomeFicha || "Criatura",foto:dadosCriatura?.foto || rolagem.fotoFicha || ""};
  const jogador = dadosJogadoresCampanha.get(rolagem.fichaId);
  if (jogador) return jogador;
  return {nome:rolagem.nomeFicha || "Personagem",foto:rolagem.fotoFicha || ""};
}
function criarItemHistoricoCampanhaCriatura(rolagem) {
  const ficha = obterFichaHistoricoCriatura(rolagem);
  const item = document.createElement("article");
  item.className = "item-historico-campanha-ficha";
  const foto = document.createElement("div");
  foto.className = "foto-historico-campanha-ficha";
  if (ficha.foto) {
    const img = document.createElement("img");
    img.src = ficha.foto;
    img.alt = `Foto de ${ficha.nome || "personagem"}`;
    foto.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = "?";
    foto.appendChild(span);
  }
  const conteudo = document.createElement("div");
  conteudo.className = "conteudo-historico-campanha-ficha";
  const nome = document.createElement("strong");
  nome.className = "nome-personagem-historico-campanha-ficha";
  nome.textContent = ficha.nome || "Personagem";
  const teste = document.createElement("strong");
  teste.className = "teste-historico-campanha-ficha";
  teste.textContent = rolagem.nomeTeste || "Rolagem";
  const detalhes = document.createElement("span");
  detalhes.className = "detalhes-historico-campanha-ficha";
  detalhes.textContent = rolagem.tipo === "pericia" ? `${rolagem.quantidadeDados}d20 • Valor ${rolagem.valor}` : (rolagem.dados || []).map(dado => `${dado.quantidade}d${dado.lados}`).join(" + ");
  const numeros = document.createElement("div");
  numeros.className = "numeros-historico-campanha-ficha";
  if (rolagem.tipo === "pericia") {
    (rolagem.resultados || []).forEach(valor => {
      const numero = document.createElement("span");
      numero.className = `numero-historico resultado-${categoriaIndividualPericiaCriatura(valor,rolagem.valor)}`;
      numero.textContent = valor;
      numeros.appendChild(numero);
    });
  } else {
    (rolagem.resultados || []).forEach(resultado => {
      const numero = document.createElement("span");
      numero.className = "numero-historico";
      numero.textContent = resultado.valor;
      numeros.appendChild(numero);
    });
  }
  const final = document.createElement("strong");
  final.className = "final-historico-campanha-ficha";
  if (rolagem.tipo === "pericia") {
    final.classList.add(`resultado-${rolagem.resultadoCategoria}`);
    final.textContent = nomeCategoriaCriatura(rolagem.resultadoCategoria);
  } else {
    final.classList.add("resultado-soma");
    final.textContent = `Soma: ${rolagem.soma ?? 0}`;
  }
  conteudo.append(nome,teste,detalhes,numeros,final);
  item.append(foto,conteudo);
  return item;
}
function renderizarListaHistoricoCriatura(rolagens,destino,textoVazio) {
  destino.replaceChildren();
  if (!rolagens.length) {
    const vazio = document.createElement("p");
    vazio.className = "historico-campanha-vazio";
    vazio.textContent = textoVazio;
    destino.appendChild(vazio);
    return;
  }
  rolagens.forEach(rolagem => destino.appendChild(criarItemHistoricoCampanhaCriatura(rolagem)));
}
function renderizarHistoricosCampanhaCriatura() {
  renderizarListaHistoricoCriatura(rolagensJogadoresCampanha,listaHistoricoJogadoresCampanhaFicha,"Nenhuma rolagem dos jogadores.");
  renderizarListaHistoricoCriatura(rolagensMestreCampanha,listaHistoricoMestreCampanhaFicha,"Nenhuma rolagem do Mestre.");
  const somenteCriatura = rolagensMestreCampanha.filter(rolagem => rolagem.fichaId === idCriatura).slice(0,15);
  renderizarListaHistoricoCriatura(somenteCriatura,historicoRolagensCriatura,"Nenhuma rolagem desta Criatura.");
}
function iniciarHistoricosCampanhaCriatura() {
  cancelarHistoricoJogadoresCriatura = db.collection("campanhas").doc(idCampanhaCriatura).collection("historicoJogadores").orderBy("criadoEm","desc").limit(30).onSnapshot(resultado => {
    rolagensJogadoresCampanha = resultado.docs.map(documento => ({id:documento.id,...documento.data()}));
    renderizarHistoricosCampanhaCriatura();
  });
  cancelarHistoricoMestreCriatura = db.collection("campanhas").doc(idCampanhaCriatura).collection("historicoMestre").orderBy("criadoEm","desc").limit(30).onSnapshot(resultado => {
    rolagensMestreCampanha = resultado.docs.map(documento => ({id:documento.id,...documento.data()}));
    renderizarHistoricosCampanhaCriatura();
  });
}

/* Inicialização */

async function validarMestreCriatura(usuario) {
  if (!usuario || !idCampanhaCriatura || !idCriatura) return false;
  try {
    const membro = await db.collection("campanhas").doc(idCampanhaCriatura).collection("membros").doc(usuario.uid).get();
    return membro.exists && membro.data().papel === "mestre";
  } catch {
    return false;
  }
}
async function prepararPericiasIniciaisCriatura() {
  const salvas = dadosCriatura?.pericias && typeof dadosCriatura.pericias === "object" ? dadosCriatura.pericias : {};
  const novas = {};
  let mudou = false;
  periciasSistemaCriatura.forEach(pericia => {
    const salva = salvas[pericia.id] || {};
    const valor = Number.isInteger(salva.valor) ? Math.max(1,Math.min(18,salva.valor)) : 5;
    const atributoBase = ["fisico","cognicao","presenca"].includes(salva.atributoBase) ? salva.atributoBase : pericia.atributoPadrao;
    const modificador = typeof salva.modificador === "string" ? salva.modificador : "";
    novas[pericia.id] = {valor,atributoBase,modificador};
    if (!salvas[pericia.id]) mudou = true;
  });
  periciasCriatura = novas;
  if (mudou) {
    dadosCriatura.pericias = novas;
    await salvarCriatura({pericias:novas});
  }
}
async function carregarCriatura(usuario) {
  if (!await validarMestreCriatura(usuario)) {
    window.location.replace("index.html");
    return;
  }
  try {
    const documento = await referenciaCriatura().get();
    if (!documento.exists) {
      window.location.replace(`index.html?campanha=${encodeURIComponent(idCampanhaCriatura)}`);
      return;
    }
    dadosCriatura = {id:documento.id,...documento.data()};
    await carregarPericiasSistemaCriatura();
    await prepararPericiasIniciaisCriatura();
    campoNomeCriatura.value = dadosCriatura.nome || "Nova Criatura";
    mostrarFotoCriatura(dadosCriatura.foto || "");
    campoAparenciaCriatura.value = dadosCriatura.aparencia || "";
    campoAnotacoesCriatura.value = dadosCriatura.anotacoes || "";
    const atributos = dadosCriatura.atributos || {};
    campoFisicoCriatura.value = Number.isInteger(atributos.fisico) ? atributos.fisico : 1;
    campoCognicaoCriatura.value = Number.isInteger(atributos.cognicao) ? atributos.cognicao : 1;
    campoPresencaCriatura.value = Number.isInteger(atributos.presenca) ? atributos.presenca : 1;
    campoDeslocamentoMetrosCriatura.value = Number.isFinite(Number(atributos.deslocamentoMetros)) ? Number(atributos.deslocamentoMetros) : 9;
    campoDeslocamentoQuadradosCriatura.value = Number.isFinite(Number(atributos.deslocamentoQuadrados)) ? Number(atributos.deslocamentoQuadrados) : 6;
    const pv = dadosCriatura.pv || {};
    campoPvAtualCriatura.value = Number.isInteger(pv.atual) ? pv.atual : 50;
    campoPvMaximoCriatura.value = Number.isInteger(pv.maximo) ? pv.maximo : 50;
    limitePericiasCriatura.value = Number.isInteger(dadosCriatura.limitePontosPericias) ? dadosCriatura.limitePontosPericias : 140;
    habilidadesCriatura = Array.isArray(dadosCriatura.habilidades) ? dadosCriatura.habilidades.map(item => ({...item})) : [];
    renderizarPericiasCriatura();
    renderizarDatalistPericiasCriatura();
    atualizarBarraPvCriatura();
    renderizarHabilidadesCriatura();
    iniciarJogadoresCriatura();
    iniciarHistoricosCampanhaCriatura();
    document.title = `${dadosCriatura.nome || "Criatura"}: A Realidade RPG`;
    requestAnimationFrame(atualizarIndicadorCriatura);
  } catch (erro) {
    console.error("Erro ao carregar Criatura:",erro);
    window.location.replace(`index.html?campanha=${encodeURIComponent(idCampanhaCriatura || "")}`);
  }
}

auth.onAuthStateChanged(usuario => carregarCriatura(usuario));
window.addEventListener("beforeunload",() => {
  cancelarEscutasJogadoresCriatura();
  if (cancelarHistoricoJogadoresCriatura) cancelarHistoricoJogadoresCriatura();
  if (cancelarHistoricoMestreCriatura) cancelarHistoricoMestreCriatura();
});

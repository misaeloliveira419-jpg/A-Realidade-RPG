/* Elementos da criação de ficha */

const formConceito = document.getElementById("form-conceito");
const campoNomePersonagem = document.getElementById("nome-personagem");
const campoIdadePersonagem = document.getElementById("idade-personagem");
const campoAparencia = document.getElementById("aparencia-personagem");
const campoPassado = document.getElementById("passado-personagem");
const mensagemConceito = document.getElementById("mensagem-conceito");
const botaoContinuarConceito = document.getElementById("continuar-conceito");

/* Elementos da tela de Perfil */

const formPerfil = document.getElementById("form-perfil");
const radiosPerfil = document.querySelectorAll('input[name="perfil"]');
const mensagemPerfil = document.getElementById("mensagem-perfil");
const botaoContinuarPerfil = document.getElementById("continuar-perfil");

const perfisDisponiveis = ["proativo", "reflexivo", "adaptativo"];

/* Seleção de Perfil */

function obterPerfilSelecionado() {
  return formPerfil.querySelector('input[name="perfil"]:checked')?.value || null;
}

function atualizarEstadoPerfil() {
  const perfil = obterPerfilSelecionado();

  botaoContinuarPerfil.disabled = !(
    perfisDisponiveis.includes(perfil) &&
    auth.currentUser &&
    referenciaFichaAtual &&
    fichaJaCriada
  );
}

formPerfil.addEventListener("change", atualizarEstadoPerfil);

let referenciaFichaAtual = null;
let fichaJaCriada = false;
let etapaSalva = 1;
let uidAnteriorCriacao = null;
let versaoAutenticacao = 0;

/* Elementos da tela de Ocupação */

const formOcupacao = document.getElementById("form-ocupacao");
const campoPesquisaOcupacao = document.getElementById("pesquisa-ocupacao");
const listaOcupacoesCriacao = document.getElementById("lista-ocupacoes-criacao");
const contadorOcupacoes = document.getElementById("contador-ocupacoes");

const nomesOcupacoesSelecionadas = document.getElementById("nomes-ocupacoes-selecionadas");
const resumoPericiasOcupacao = document.getElementById("resumo-pericias-ocupacao");
const resumoPcOcupacao = document.getElementById("resumo-pc-ocupacao");
const resumoCoOcupacao = document.getElementById("resumo-co-ocupacao");

const contadorPericiasNaturais = document.getElementById("contador-pericias-naturais");
const regraPericiasNaturais = document.getElementById("regra-pericias-naturais");

const mensagemOcupacao = document.getElementById("mensagem-ocupacao");
const botaoContinuarOcupacao = document.getElementById("continuar-ocupacao");

let ocupacoesDisponiveis = [];
let ocupacoesSelecionadas = [];
let periciasNaturaisSelecionadas = [];

/* Elementos da tela de Atributos e Perícias */

const formAtributosPericias = document.getElementById("form-atributos-pericias");

const contadorAtributos = document.getElementById("contador-atributos");

const campoFisico = document.getElementById("atributo-fisico");

const campoCognicao = document.getElementById("atributo-cognicao");

const campoPresenca = document.getElementById("atributo-presenca");

const campoDeslocamentoMetros = document.getElementById("deslocamento-metros");

const campoDeslocamentoQuadrados = document.getElementById("deslocamento-quadrados");

const listaPericiasCriacao = document.getElementById("lista-pericias-criacao");

const contadorPontosPericias = document.getElementById("contador-pontos-pericias");

const contadorBonusNaturais = document.getElementById("contador-bonus-naturais");

const mensagemAtributosPericias = document.getElementById("mensagem-atributos-pericias");

const botaoContinuarAtributosPericias = document.getElementById("continuar-atributos-pericias");

/* Estado da etapa 4 */

let atributosPersonagem = {
  fisico: 1,
  cognicao: 1,
  presenca: 1,
  deslocamentoMetros: 9,
  deslocamentoQuadrados: 6
};

let periciasSistema = [];
let valoresPericias = {};

const VALOR_BASE_PERICIA = 4;
const PONTOS_PERICIA_INICIAIS = 25;
const MAXIMO_PONTOS_RECUPERADOS = 15;

const MAXIMO_PERICIA_NORMAL = 12;
const MAXIMO_PERICIA_NATURAL = 14;

const BONUS_NATURAL_TOTAL = 5;
const BONUS_NATURAL_POR_PERICIA = 3;

/* Carregar Perícias do Sistema */

function criarIdPericia(nome) {
  return normalizarBuscaOcupacao(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extrairPericiaDoSistema(item) {
  const nome = item.querySelector("b")?.textContent
    .trim()
    .replace(/:$/, "");

  if (!nome) return null;

  return {
    id: criarIdPericia(nome),
    nome: nome
  };
}

function inicializarValoresPericias() {
  const idsAtuais = new Set();

  periciasSistema.forEach(pericia => {
    idsAtuais.add(pericia.id);

    if (!valoresPericias[pericia.id]) {
      valoresPericias[pericia.id] = {
        valorDistribuido: VALOR_BASE_PERICIA,
        bonusNatural: 0
      };
    }
  });

  Object.keys(valoresPericias).forEach(id => {
    if (!idsAtuais.has(id)) {
      delete valoresPericias[id];
    }
  });
}

async function carregarPericiasDoSistema() {
  try {
    const resposta = await fetch("index-sistema.html");

    if (!resposta.ok) {
      throw new Error("Não foi possível abrir index-sistema.html.");
    }

    const html = await resposta.text();
    const documento =
      new DOMParser().parseFromString(html, "text/html");

    const itens = [
      ...documento.querySelectorAll("#lista-pericias > li")
    ];

    periciasSistema = itens
      .map(extrairPericiaDoSistema)
      .filter(Boolean);

    if (periciasSistema.length === 0) {
      throw new Error("Nenhuma Perícia foi encontrada.");
    }

    inicializarValoresPericias();
    renderizarEtapaAtributosPericias();

    return true;

  } catch (erro) {
    console.error("Erro ao carregar Perícias:", erro);

    listaPericiasCriacao.innerHTML =
      `<p class="aviso-carregamento-pericias">
        Não foi possível carregar as Perícias do Sistema.
      </p>`;

    botaoContinuarAtributosPericias.disabled = true;

    return false;
  }
}

const promessaPericiasSistema =
  carregarPericiasDoSistema();

/* Utilidades das Ocupações */

function normalizarBuscaOcupacao(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarIdOcupacao(nome) {
  return normalizarBuscaOcupacao(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function limparNomePericia(pericia) {
  return pericia
    .trim()
    .replace(/\.$/, "")
    .replace(/^Área\s*-\s*/i, "Área - ");
}

function textoElementoComQuebras(elemento) {
  const copia = elemento.cloneNode(true);

  copia.querySelectorAll("br").forEach(br => {
    br.replaceWith("\n");
  });

  return copia.textContent
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/* Ler as Ocupações diretamente do Sistema */

function extrairOcupacaoDoSistema(item) {
  const nome = item.querySelector("b")?.textContent
    .trim()
    .replace(/:$/, "");

  if (!nome) return null;

  const texto = textoElementoComQuebras(item);

  const indicePericias = texto.search(/Perícias\s*:/i);
  const indiceDoisPontosNome = texto.indexOf(":");

  if (indicePericias === -1 || indiceDoisPontosNome === -1) return null;

  const descricao = texto
    .slice(indiceDoisPontosNome + 1, indicePericias)
    .trim();

  const blocoPericias = texto.match(
    /Perícias\s*:\s*([\s\S]*?)\n\s*(\d+(?:[.,]\d+)?)\s*PC/i
  );

  const valorCo = texto.match(
    /CO\s*:\s*(\d+(?:[.,]\d+)?)/i
  );

  if (!blocoPericias || !valorCo) return null;

  const textoPericias = blocoPericias[1].trim();

  const pc = Number(blocoPericias[2].replace(",", "."));
  const co = Number(valorCo[1].replace(",", "."));

  const linhaAreas = textoPericias.match(
    /Áreas?\s*-\s*([^;\n]+)/i
  );

  const linhaGerais = textoPericias.match(
    /Ger(?:al|ais)\s*[-:]\s*([^;\n.]+)/i
  );

  let pericias = [];
  let areasObrigatorias = [];

  if (linhaAreas && linhaGerais) {
    areasObrigatorias = linhaAreas[1]
      .split(",")
      .map(pericia => "Área - " + pericia.trim());

    const gerais = linhaGerais[1]
      .split(",")
      .map(pericia => limparNomePericia(pericia));

    pericias = [
      ...areasObrigatorias,
      ...gerais
    ];

  } else {
    pericias = textoPericias
      .replace(/\n/g, " ")
      .split(",")
      .map(pericia => limparNomePericia(pericia))
      .filter(Boolean);
  }

  return {
    id: criarIdOcupacao(nome),
    nome: nome,
    descricao: descricao,
    pericias: pericias,
    pc: pc,
    co: co,
    areasObrigatorias: areasObrigatorias
  };
}

async function carregarOcupacoesDoSistema() {
  try {
    const resposta = await fetch("index-sistema.html");

    if (!resposta.ok) {
      throw new Error("Não foi possível abrir index-sistema.html.");
    }

    const html = await resposta.text();
    const documento = new DOMParser().parseFromString(html, "text/html");

    const itens = [
      ...documento.querySelectorAll("#lista-ocupacoes-personagem > li")
    ];

    ocupacoesDisponiveis = itens
      .map(extrairOcupacaoDoSistema)
      .filter(Boolean);

    if (ocupacoesDisponiveis.length === 0) {
      throw new Error("Nenhuma Ocupação foi encontrada.");
    }

    renderizarTelaOcupacao();

    return true;

  } catch (erro) {
    console.error("Erro ao carregar Ocupações:", erro);

    listaOcupacoesCriacao.replaceChildren();

    const aviso = document.createElement("p");
    aviso.className = "aviso-ocupacoes";
    aviso.textContent = "Não foi possível carregar a lista de Ocupações.";

    listaOcupacoesCriacao.appendChild(aviso);

    mensagemOcupacao.textContent =
      "Não foi possível carregar as Ocupações do Sistema.";

    botaoContinuarOcupacao.disabled = true;

    return false;
  }
}

const promessaOcupacoes = carregarOcupacoesDoSistema();

/* Navegação entre etapas */

function abrirEtapaCriacao(id) {
  document.querySelectorAll(".etapa-criacao").forEach(tela => {
    tela.classList.remove("ativa");
  });

  document.getElementById(id)?.classList.add("ativa");
  window.scrollTo(0, 0);
}

document.querySelectorAll(".botao-etapa-anterior").forEach(botao => {
  botao.addEventListener("click", () => {
    abrirEtapaCriacao(botao.dataset.destino);
  });
});

/* Carregamento de rascunhos */

async function carregarRascunho(id, usuario, versao) {
  botaoContinuarConceito.disabled = true;
  mensagemConceito.textContent = "Carregando rascunho...";

  try {
    const referencia = db.collection("fichas").doc(id);
    const documento = await referencia.get();

    if (
      versao !== versaoAutenticacao ||
      auth.currentUser?.uid !== usuario.uid
    ) return;

    if (!documento.exists || documento.data().donoUid !== usuario.uid) {
      mensagemConceito.textContent = "Esta ficha não existe ou não pertence à sua conta.";
      return;
    }

    const ficha = documento.data();

    if (ficha.estado === "pronta") {
      window.location.replace(`index-ficha.html?ficha=${encodeURIComponent(id)}`);
      return;
    }

    referenciaFichaAtual = referencia;
    fichaJaCriada = true;
    etapaSalva = ficha.etapaAtual || 1;

    campoNomePersonagem.value = ficha.nome || "";
    campoIdadePersonagem.value = ficha.idade ?? "";
    campoAparencia.value = ficha.aparencia || "";
    campoPassado.value = ficha.passado || "";

    /* Recuperar o Perfil escolhido */

    radiosPerfil.forEach(radio => {
      radio.checked = radio.value === ficha.perfil;
    });

    atualizarEstadoPerfil();

    /* Recuperar as Ocupações escolhidas */

    await promessaOcupacoes;

    if (versao !== versaoAutenticacao || auth.currentUser?.uid !== usuario.uid) return;

    const idsOcupacoesValidas = new Set(ocupacoesDisponiveis.map(ocupacao => ocupacao.id));

    ocupacoesSelecionadas = Array.isArray(ficha.ocupacoes)
      ? ficha.ocupacoes
          .filter(id => idsOcupacoesValidas.has(id))
          .slice(0, 2)
      : [];

    const periciasDisponiveis = obterPericiasDisponiveis();

    periciasNaturaisSelecionadas =
      Array.isArray(ficha.periciasNaturais)
        ? ficha.periciasNaturais.filter(pericia => {
            return periciasDisponiveis.includes(pericia);
          })
        : [];

    campoPesquisaOcupacao.value = "";

    renderizarTelaOcupacao();

    mensagemConceito.textContent = "";

    /* Recuperar Atributos e Perícias */

    await promessaPericiasSistema;

    if (
      versao !== versaoAutenticacao ||
      auth.currentUser?.uid !== usuario.uid
    ) return;

    if (ficha.atributos) {
      const atributos = ficha.atributos;

      if (
        Number.isInteger(atributos.fisico) &&
        Number.isInteger(atributos.cognicao) &&
        Number.isInteger(atributos.presenca)
      ) {
        atributosPersonagem.fisico =
          atributos.fisico;

        atributosPersonagem.cognicao =
          atributos.cognicao;

        atributosPersonagem.presenca =
          atributos.presenca;
      }

      if (
        Number.isFinite(
          atributos.deslocamentoMetros
        )
      ) {
        atributosPersonagem.deslocamentoMetros =
          atributos.deslocamentoMetros;
      }

      if (
        Number.isFinite(
          atributos.deslocamentoQuadrados
        )
      ) {
        atributosPersonagem.deslocamentoQuadrados =
          atributos.deslocamentoQuadrados;
      }
    }

    inicializarValoresPericias();

    if (
      ficha.pericias &&
      typeof ficha.pericias === "object"
    ) {
      periciasSistema.forEach(pericia => {
        const salva =
          ficha.pericias[pericia.id];

        if (!salva) return;

        if (
          Number.isInteger(
            salva.valorDistribuido
          )
        ) {
          valoresPericias[pericia.id].valorDistribuido =
            salva.valorDistribuido;
        }

        if (
          Number.isInteger(
            salva.bonusNatural
          )
        ) {
          valoresPericias[pericia.id].bonusNatural =
            salva.bonusNatural;
        }
      });
    }

    sincronizarBonusComPericiasNaturais();
    renderizarEtapaAtributosPericias();

    if (etapaSalva >= 5) {
      await promessaItensIniciaisSistema;

      if (versao !== versaoAutenticacao || auth.currentUser?.uid !== usuario.uid) return;

      restaurarInventarioInicial(ficha.inventario);
      renderizarEtapaItensIniciais();
      abrirEtapaCriacao("tela-itens-iniciais");

    } else if (etapaSalva >= 4) {
      abrirEtapaCriacao("tela-atributos-pericias");

    } else if (etapaSalva >= 3) {
      abrirEtapaCriacao("tela-ocupacao");

    } else if (etapaSalva >= 2) {
      abrirEtapaCriacao("tela-perfil");
    }

  } catch (erro) {
    console.error("Erro ao carregar ficha:", erro);

    if (versao === versaoAutenticacao) {
      mensagemConceito.textContent = "Não foi possível carregar o rascunho. Recarregue a página.";
    }

  } finally {
    if (versao === versaoAutenticacao) {
      botaoContinuarConceito.disabled = false;
    }
  }
}

/* Verificação da conta conectada */

auth.onAuthStateChanged(usuario => {
  const versao = ++versaoAutenticacao;

  if (uidAnteriorCriacao && uidAnteriorCriacao !== usuario?.uid) {
    formConceito.reset();
    formPerfil.reset();

    referenciaFichaAtual = null;
    fichaJaCriada = false;
    etapaSalva = 1;

    /* Limpar Ocupações */

    ocupacoesSelecionadas = [];
    periciasNaturaisSelecionadas = [];

    campoPesquisaOcupacao.value = "";

    /* Limpar Atributos */

    atributosPersonagem = {
      fisico: 1,
      cognicao: 1,
      presenca: 1,
      deslocamentoMetros: 9,
      deslocamentoQuadrados: 6
    };

    /* Limpar Perícias */

    valoresPericias = {};

    inicializarValoresPericias();

    /* Limpar Itens Iniciais */

    inventarioInicial = [];
    sequenciaInstanciaItem = 0;
    finalizandoFicha = false;
    campoPesquisaItens.value = "";
    mensagemItensIniciais.textContent = "";
    renderizarEtapaItensIniciais();

    /* Limpar mensagens */

    mensagemPerfil.textContent = "";
    mensagemOcupacao.textContent = "";
    mensagemAtributosPericias.textContent = "";

    /* Atualizar as telas */

    atualizarEstadoPerfil();
    renderizarTelaOcupacao();
    renderizarEtapaAtributosPericias();

    history.replaceState({}, "", window.location.pathname);
    abrirEtapaCriacao("tela-conceito");
  }

  uidAnteriorCriacao = usuario?.uid || null;

  if (!usuario) {
    botaoContinuarConceito.disabled = true;
    mensagemConceito.textContent = "Entre em uma conta para criar sua ficha.";
    botaoContinuarPerfil.disabled = true;
    botaoContinuarOcupacao.disabled = true;
    botaoContinuarAtributosPericias.disabled = true;
    botaoFinalizarFicha.disabled = true;
    return;
  }

  mensagemConceito.textContent = "";

  const idRascunho = new URLSearchParams(window.location.search).get("ficha");

  if (idRascunho) {
    carregarRascunho(idRascunho, usuario, versao);
  } else {
    botaoContinuarConceito.disabled = false;
  }
});

/* Salvamento do conceito */

formConceito.addEventListener("submit", async evento => {
  evento.preventDefault();

  const usuario = auth.currentUser;
  const nome = campoNomePersonagem.value.trim();
  const idadeTexto = campoIdadePersonagem.value.trim();
  const idade = Number(idadeTexto);
  const aparencia = campoAparencia.value.trim();
  const passado = campoPassado.value.trim();

  if (!usuario) {
    mensagemConceito.textContent = "Entre em uma conta para continuar.";
    return;
  }

  if (!nome || !idadeTexto || !Number.isInteger(idade) || idade < 0) {
    mensagemConceito.textContent = "Preencha corretamente o nome e a idade do personagem.";
    return;
  }

  if (new URLSearchParams(window.location.search).has("ficha") && !referenciaFichaAtual) {
    mensagemConceito.textContent = "Aguarde o carregamento da ficha antes de continuar.";
    return;
  }

  botaoContinuarConceito.disabled = true;
  mensagemConceito.textContent = "Salvando rascunho...";

  try {
    if (!referenciaFichaAtual) {
      referenciaFichaAtual = db.collection("fichas").doc();
    }

    if (!fichaJaCriada) {
      await referenciaFichaAtual.set({
        donoUid: usuario.uid,
        nome: nome,
        idade: idade,
        aparencia: aparencia,
        passado: passado,
        foto: "",
        estado: "rascunho",
        etapaAtual: 2,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });

      fichaJaCriada = true;

    } else {
      await referenciaFichaAtual.update({
        nome: nome,
        idade: idade,
        aparencia: aparencia,
        passado: passado,
        etapaAtual: Math.max(etapaSalva, 2),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    etapaSalva = Math.max(etapaSalva, 2);

    const url = new URL(window.location.href);
    url.searchParams.set("ficha", referenciaFichaAtual.id);

    history.replaceState({}, "", url.pathname + url.search);

    mensagemConceito.textContent = "";
    atualizarEstadoPerfil();
    abrirEtapaCriacao("tela-perfil");

  } catch (erro) {
    console.error("Erro ao salvar conceito:", erro);
    mensagemConceito.textContent = "Não foi possível salvar. Verifique sua conexão e tente novamente.";

  } finally {
    botaoContinuarConceito.disabled = false;
  }
});

/* Salvamento do Perfil */

formPerfil.addEventListener("submit", async evento => {
  evento.preventDefault();

  const usuario = auth.currentUser;
  const perfil = obterPerfilSelecionado();

  if (!usuario) {
    mensagemPerfil.textContent = "Entre em uma conta para continuar.";
    return;
  }

  if (!perfisDisponiveis.includes(perfil)) {
    mensagemPerfil.textContent = "Selecione um Perfil para continuar.";
    return;
  }

  if (!referenciaFichaAtual || !fichaJaCriada) {
    mensagemPerfil.textContent = "Salve o Conceito antes de escolher seu Perfil.";
    return;
  }

  botaoContinuarPerfil.disabled = true;
  mensagemPerfil.textContent = "Salvando Perfil...";

  try {
    await referenciaFichaAtual.update({
      perfil: perfil,
      etapaAtual: Math.max(etapaSalva, 3),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    /* Evitar navegar se a conta mudou durante o salvamento */

    if (auth.currentUser?.uid !== usuario.uid) return;

    etapaSalva = Math.max(etapaSalva, 3);

    mensagemPerfil.textContent = "";
    renderizarTelaOcupacao();
    abrirEtapaCriacao("tela-ocupacao");

  } catch (erro) {
    console.error("Erro ao salvar Perfil:", erro);

    if (auth.currentUser?.uid === usuario.uid) {
      mensagemPerfil.textContent =
        "Não foi possível salvar seu Perfil. Tente novamente.";
    }

  } finally {
    atualizarEstadoPerfil();
  }
});

/* Dados das Ocupações escolhidas */

function obterOcupacaoPorId(id) {
  return ocupacoesDisponiveis.find(ocupacao => ocupacao.id === id) || null;
}

function obterOcupacoesSelecionadas() {
  return ocupacoesSelecionadas
    .map(obterOcupacaoPorId)
    .filter(Boolean);
}

function obterPericiasDisponiveis() {
  const resultado = [];
  const adicionadas = new Set();

  obterOcupacoesSelecionadas().forEach(ocupacao => {
    ocupacao.pericias.forEach(pericia => {
      if (adicionadas.has(pericia)) return;

      adicionadas.add(pericia);
      resultado.push(pericia);
    });
  });

  return resultado;
}

function calcularMediaOcupacoes(campo) {
  const ocupacoes = obterOcupacoesSelecionadas();

  if (ocupacoes.length === 0) return null;

  const total = ocupacoes.reduce((soma, ocupacao) => {
    return soma + Number(ocupacao[campo] || 0);
  }, 0);

  return total / ocupacoes.length;
}

function formatarNumeroOcupacao(valor) {
  if (valor === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(valor);
}

/* Resumo superior */

function renderizarResumoOcupacoes() {
  const ocupacoes = obterOcupacoesSelecionadas();

  nomesOcupacoesSelecionadas.replaceChildren();

  if (ocupacoes.length === 0) {
    const nenhuma = document.createElement("span");
    nenhuma.className = "nenhuma-ocupacao";
    nenhuma.textContent = "Nenhuma ainda";

    nomesOcupacoesSelecionadas.appendChild(nenhuma);

    resumoPcOcupacao.textContent = "—";
    resumoCoOcupacao.textContent = "—";

    return;
  }

  ocupacoes.forEach(ocupacao => {
    const nome = document.createElement("span");

    nome.className = "nome-ocupacao-selecionada";
    nome.textContent = ocupacao.nome;

    nomesOcupacoesSelecionadas.appendChild(nome);
  });

  resumoPcOcupacao.textContent =
    formatarNumeroOcupacao(calcularMediaOcupacoes("pc"));

  resumoCoOcupacao.textContent =
    formatarNumeroOcupacao(calcularMediaOcupacoes("co"));
}

/* Cards das Ocupações */

function criarLinhaCardOcupacao(rotulo, texto) {
  const linha = document.createElement("div");

  const titulo = document.createElement("strong");
  titulo.textContent = rotulo + ": ";

  const conteudo = document.createElement("span");
  conteudo.textContent = texto;

  linha.append(titulo, conteudo);

  return linha;
}

function criarCardOcupacao(ocupacao) {
  const card = document.createElement("button");

  card.type = "button";
  card.className = "card-ocupacao";
  card.dataset.ocupacao = ocupacao.id;

  const selecionada = ocupacoesSelecionadas.includes(ocupacao.id);

  card.classList.toggle("selecionada", selecionada);
  card.setAttribute("aria-pressed", String(selecionada));

  const nome = document.createElement("span");
  nome.className = "nome-card-ocupacao";
  nome.textContent = ocupacao.nome;

  const descricao = document.createElement("span");
  descricao.className = "descricao-card-ocupacao";
  descricao.textContent = ocupacao.descricao;

  const detalhes = document.createElement("div");
  detalhes.className = "detalhes-card-ocupacao";

  if (ocupacao.areasObrigatorias.length > 0) {
    const gerais = ocupacao.pericias.filter(pericia => {
      return !ocupacao.areasObrigatorias.includes(pericia);
    });

    detalhes.appendChild(
      criarLinhaCardOcupacao(
        "Áreas",
        ocupacao.areasObrigatorias
          .map(pericia => pericia.replace(/^Área - /, ""))
          .join(", ")
      )
    );

    detalhes.appendChild(
      criarLinhaCardOcupacao(
        "Gerais",
        gerais.join(", ")
      )
    );

  } else {
    detalhes.appendChild(
      criarLinhaCardOcupacao(
        "Perícias",
        ocupacao.pericias.join(", ")
      )
    );
  }

  const valores = document.createElement("div");
  valores.className = "valores-card-ocupacao";

  const pc = document.createElement("span");
  pc.textContent = `${formatarNumeroOcupacao(ocupacao.pc)} PC`;

  const co = document.createElement("span");
  co.textContent = `CO: ${formatarNumeroOcupacao(ocupacao.co)}`;

  valores.append(pc, co);

  card.append(nome, descricao, detalhes, valores);

  card.addEventListener("click", () => {
    alternarOcupacao(ocupacao.id);
  });

  return card;
}

function renderizarListaOcupacoes() {
  if (ocupacoesDisponiveis.length === 0) return;

  const pesquisa = normalizarBuscaOcupacao(
    campoPesquisaOcupacao.value
  );

  const ocupacoesFiltradas = ocupacoesDisponiveis.filter(ocupacao => {
    if (!pesquisa) return true;

    const textoBusca = normalizarBuscaOcupacao([
      ocupacao.nome,
      ocupacao.descricao,
      ...ocupacao.pericias
    ].join(" "));

    return textoBusca.includes(pesquisa);
  });

  const fragmento = document.createDocumentFragment();

  if (ocupacoesFiltradas.length === 0) {
    const aviso = document.createElement("p");

    aviso.className = "aviso-ocupacoes";
    aviso.textContent = "Nenhuma Ocupação encontrada.";

    fragmento.appendChild(aviso);

  } else {
    ocupacoesFiltradas.forEach(ocupacao => {
      fragmento.appendChild(
        criarCardOcupacao(ocupacao)
      );
    });
  }

  listaOcupacoesCriacao.replaceChildren(fragmento);
}

/* Seleção das Ocupações */

function alternarOcupacao(id) {
  mensagemOcupacao.textContent = "";

  const indice = ocupacoesSelecionadas.indexOf(id);

  if (indice !== -1) {
    ocupacoesSelecionadas.splice(indice, 1);

  } else {
    if (ocupacoesSelecionadas.length >= 2) {
      mensagemOcupacao.textContent =
        "Você pode escolher no máximo 2 Ocupações.";

      return;
    }

    ocupacoesSelecionadas.push(id);
  }

  const disponiveis = obterPericiasDisponiveis();

  periciasNaturaisSelecionadas =
    periciasNaturaisSelecionadas.filter(pericia => {
      return disponiveis.includes(pericia);
    });

  renderizarTelaOcupacao();
}

/* Regra das 3 Perícias Naturais */

function obterOcupacoesComAreasObrigatorias() {
  return obterOcupacoesSelecionadas().filter(ocupacao => {
    return ocupacao.areasObrigatorias.length > 0;
  });
}

function obterOrigensAreaObrigatoria(pericia) {
  return obterOcupacoesComAreasObrigatorias()
    .filter(ocupacao => {
      return ocupacao.areasObrigatorias.includes(pericia);
    })
    .map(ocupacao => ocupacao.nome);
}

function validarPericiasNaturais() {
  const periciasDisponiveis = obterPericiasDisponiveis();

  if (ocupacoesSelecionadas.length === 0) {
    return {
      valida: false,
      pericias: [],
      mensagem: "Escolha pelo menos uma Ocupação."
    };
  }

  if (periciasDisponiveis.length <= 3) {
    return {
      valida: true,
      pericias: periciasDisponiveis,
      mensagem: ""
    };
  }

  if (periciasNaturaisSelecionadas.length !== 3) {
    return {
      valida: false,
      pericias: periciasNaturaisSelecionadas,
      mensagem: "Escolha exatamente 3 Perícias Naturais."
    };
  }

  const ocupacoesEspeciais = obterOcupacoesComAreasObrigatorias();

  for (const ocupacao of ocupacoesEspeciais) {
    const possuiAreaDaOcupacao =
      periciasNaturaisSelecionadas.some(pericia => {
        return ocupacao.areasObrigatorias.includes(pericia);
      });

    if (!possuiAreaDaOcupacao) {
      return {
        valida: false,
        pericias: periciasNaturaisSelecionadas,
        mensagem:
          `Escolha pelo menos uma Perícia de Área de ${ocupacao.nome}.`
      };
    }
  }

  return {
    valida: true,
    pericias: periciasNaturaisSelecionadas,
    mensagem: ""
  };
}

function renderizarEscolhaPericiasNaturais() {
  const periciasDisponiveis = obterPericiasDisponiveis();

  resumoPericiasOcupacao.replaceChildren();

  /* Nenhuma Ocupação selecionada */

  if (
    ocupacoesSelecionadas.length === 0 ||
    periciasDisponiveis.length === 0
  ) {
    periciasNaturaisSelecionadas = [];

    contadorPericiasNaturais.hidden = true;
    regraPericiasNaturais.hidden = true;

    const traco = document.createElement("span");
    traco.textContent = "—";

    resumoPericiasOcupacao.appendChild(traco);

    return;
  }

  /* Até 3 Perícias: todas são automaticamente Naturais */

  if (periciasDisponiveis.length <= 3) {
    periciasNaturaisSelecionadas = [
      ...periciasDisponiveis
    ];

    contadorPericiasNaturais.hidden = true;
    regraPericiasNaturais.hidden = true;

    periciasDisponiveis.forEach(pericia => {
      const item = document.createElement("span");

      item.className = "pericia-resumo-ocupacao";
      item.textContent = pericia;

      resumoPericiasOcupacao.appendChild(item);
    });

    return;
  }

  /* Mais de 3 Perícias: jogador escolhe 3 */

  periciasNaturaisSelecionadas =
    periciasNaturaisSelecionadas.filter(pericia => {
      return periciasDisponiveis.includes(pericia);
    });

  contadorPericiasNaturais.hidden = false;
  contadorPericiasNaturais.textContent =
    `${periciasNaturaisSelecionadas.length} / 3`;

  regraPericiasNaturais.hidden = false;

  const ocupacoesEspeciais =
    obterOcupacoesComAreasObrigatorias();

  if (ocupacoesEspeciais.length === 0) {
    regraPericiasNaturais.textContent =
      "Escolha 3 entre as Perícias Naturais disponíveis.";

  } else if (ocupacoesEspeciais.length === 1) {
    regraPericiasNaturais.textContent =
      `Escolha 3 Perícias. Pelo menos uma deve ser uma Perícia de Área de ${ocupacoesEspeciais[0].nome}.`;

  } else {
    const nomes = ocupacoesEspeciais
      .map(ocupacao => ocupacao.nome)
      .join(" e ");

    regraPericiasNaturais.textContent =
      `Escolha 3 Perícias. Deve haver pelo menos uma Perícia de Área de cada uma destas Ocupações: ${nomes}.`;
  }

  const fragmento = document.createDocumentFragment();

  periciasDisponiveis.forEach(pericia => {
    const label = document.createElement("label");
    label.className = "opcao-pericia-natural";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.value = pericia;
    checkbox.checked =
      periciasNaturaisSelecionadas.includes(pericia);

    const conteudo = document.createElement("span");
    conteudo.className = "conteudo-pericia-natural";

    const nome = document.createElement("strong");
    nome.textContent = pericia;

    conteudo.appendChild(nome);

    const origens = obterOrigensAreaObrigatoria(pericia);

    if (origens.length > 0) {
      const origem = document.createElement("span");

      origem.className = "origem-area-pericia";
      origem.textContent =
        "Área de " + origens.join(" / ");

      conteudo.appendChild(origem);
    }

    checkbox.addEventListener("change", () => {
      mensagemOcupacao.textContent = "";

      if (checkbox.checked) {
        if (periciasNaturaisSelecionadas.length >= 3) {
          checkbox.checked = false;

          mensagemOcupacao.textContent =
            "Você pode escolher somente 3 Perícias Naturais.";

          return;
        }

        periciasNaturaisSelecionadas.push(pericia);

      } else {
        periciasNaturaisSelecionadas =
          periciasNaturaisSelecionadas.filter(valor => {
            return valor !== pericia;
          });
      }

      renderizarEscolhaPericiasNaturais();

      const validacao = validarPericiasNaturais();

      if (
        periciasNaturaisSelecionadas.length === 3 &&
        !validacao.valida
      ) {
        mensagemOcupacao.textContent =
          validacao.mensagem;
      }

      atualizarEstadoOcupacao();
    });

    label.append(checkbox, conteudo);
    fragmento.appendChild(label);
  });

  resumoPericiasOcupacao.appendChild(fragmento);
}

/* Estado geral da etapa */

function atualizarEstadoOcupacao() {
  const validacao = validarPericiasNaturais();

  botaoContinuarOcupacao.disabled = !(
    auth.currentUser &&
    referenciaFichaAtual &&
    fichaJaCriada &&
    ocupacoesSelecionadas.length >= 1 &&
    ocupacoesSelecionadas.length <= 2 &&
    validacao.valida
  );
}

function renderizarTelaOcupacao() {
  contadorOcupacoes.textContent =
    `${ocupacoesSelecionadas.length} / 2 selecionadas`;

  renderizarResumoOcupacoes();
  renderizarListaOcupacoes();
  renderizarEscolhaPericiasNaturais();
  atualizarEstadoOcupacao();
}

/* Pesquisa */

campoPesquisaOcupacao.addEventListener("input", () => {
  renderizarListaOcupacoes();
});

/* Salvamento da Ocupação */

formOcupacao.addEventListener("submit", async evento => {
  evento.preventDefault();

  const usuario = auth.currentUser;
  const validacao = validarPericiasNaturais();

  if (!usuario) {
    mensagemOcupacao.textContent =
      "Entre em uma conta para continuar.";

    return;
  }

  if (
    ocupacoesSelecionadas.length < 1 ||
    ocupacoesSelecionadas.length > 2
  ) {
    mensagemOcupacao.textContent =
      "Escolha uma ou duas Ocupações.";

    return;
  }

  if (!validacao.valida) {
    mensagemOcupacao.textContent =
      validacao.mensagem;

    return;
  }

  if (!referenciaFichaAtual || !fichaJaCriada) {
    mensagemOcupacao.textContent =
      "Salve as etapas anteriores antes de continuar.";

    return;
  }

  botaoContinuarOcupacao.disabled = true;
  mensagemOcupacao.textContent =
    "Salvando Ocupação...";

  try {
    await referenciaFichaAtual.update({
      ocupacoes: [...ocupacoesSelecionadas],
      periciasNaturais: [...validacao.pericias],
      etapaAtual: Math.max(etapaSalva, 4),
      atualizadoEm:
        firebase.firestore.FieldValue.serverTimestamp()
    });

    if (auth.currentUser?.uid !== usuario.uid) return;

    etapaSalva = Math.max(etapaSalva, 4);

    mensagemOcupacao.textContent = "";

    await promessaPericiasSistema;

    sincronizarBonusComPericiasNaturais();
    renderizarEtapaAtributosPericias();

    abrirEtapaCriacao("tela-atributos-pericias");

  } catch (erro) {
    console.error("Erro ao salvar Ocupação:", erro);

    if (auth.currentUser?.uid === usuario.uid) {
      mensagemOcupacao.textContent =
        "Não foi possível salvar suas Ocupações. Tente novamente.";
    }

  } finally {
    atualizarEstadoOcupacao();
  }
});

/* Atributos */

function obterTotalAtributos() {
  return (
    atributosPersonagem.fisico +
    atributosPersonagem.cognicao +
    atributosPersonagem.presenca
  );
}

function arredondarParaBaixoUmaCasa(valor) {
  return Math.floor((valor + 0.0000001) * 10) / 10;
}

function renderizarAtributos() {
  campoFisico.value = atributosPersonagem.fisico;
  campoCognicao.value = atributosPersonagem.cognicao;
  campoPresenca.value = atributosPersonagem.presenca;

  campoDeslocamentoMetros.value =
    atributosPersonagem.deslocamentoMetros;

  campoDeslocamentoQuadrados.value =
    atributosPersonagem.deslocamentoQuadrados;

  contadorAtributos.textContent =
    `${obterTotalAtributos()} / 4`;
}

function alterarAtributoPrincipal(chave, campo) {
  const valorAnterior = atributosPersonagem[chave];
  const novoValor = Number(campo.value);

  mensagemAtributosPericias.textContent = "";

  if (
    !Number.isInteger(novoValor) ||
    novoValor < 0 ||
    novoValor > 3
  ) {
    campo.value = valorAnterior;

    mensagemAtributosPericias.textContent =
      "Os Atributos principais devem ter valores inteiros entre 0 e 3.";

    return;
  }

  const totalSemAtributo =
    obterTotalAtributos() - valorAnterior;

  if (totalSemAtributo + novoValor > 4) {
    campo.value = valorAnterior;

    mensagemAtributosPericias.textContent =
      "Você possui apenas 4 pontos de Atributo para distribuir.";

    return;
  }

  atributosPersonagem[chave] = novoValor;

  renderizarAtributos();
  atualizarEstadoAtributosPericias();
}

document.querySelectorAll(".input-atributo-principal").forEach(campo => {
  campo.addEventListener("change", () => {
    alterarAtributoPrincipal(
      campo.dataset.atributo,
      campo
    );
  });
});

/* Deslocamento */

campoDeslocamentoMetros.addEventListener("change", () => {
  const metros = Number(campoDeslocamentoMetros.value);

  mensagemAtributosPericias.textContent = "";

  if (!Number.isFinite(metros) || metros < 0) {
    renderizarAtributos();

    mensagemAtributosPericias.textContent =
      "Informe um valor válido de Deslocamento.";

    return;
  }

  atributosPersonagem.deslocamentoMetros =
    arredondarParaBaixoUmaCasa(metros);

  atributosPersonagem.deslocamentoQuadrados =
    arredondarParaBaixoUmaCasa(
      atributosPersonagem.deslocamentoMetros / 1.5
    );

  renderizarAtributos();
});

campoDeslocamentoQuadrados.addEventListener("change", () => {
  const quadrados = Number(campoDeslocamentoQuadrados.value);

  mensagemAtributosPericias.textContent = "";

  if (!Number.isFinite(quadrados) || quadrados < 0) {
    renderizarAtributos();

    mensagemAtributosPericias.textContent =
      "Informe um valor válido de Deslocamento.";

    return;
  }

  atributosPersonagem.deslocamentoQuadrados =
    arredondarParaBaixoUmaCasa(quadrados);

  atributosPersonagem.deslocamentoMetros =
    arredondarParaBaixoUmaCasa(
      atributosPersonagem.deslocamentoQuadrados * 1.5
    );

  renderizarAtributos();
});

/* Utilidades das Perícias */

function ehPericiaNatural(pericia) {
  const nome = normalizarBuscaOcupacao(pericia.nome);

  return periciasNaturaisSelecionadas.some(periciaNatural => {
    return normalizarBuscaOcupacao(periciaNatural) === nome;
  });
}

function copiarValoresPericias() {
  const copia = {};

  Object.entries(valoresPericias).forEach(([id, dados]) => {
    copia[id] = {
      valorDistribuido: dados.valorDistribuido,
      bonusNatural: dados.bonusNatural
    };
  });

  return copia;
}

function obterResumoPontosPericias(
  valores = valoresPericias
) {
  let gastosNormais = 0;
  let pontosRecuperados = 0;
  let bonusNatural = 0;

  Object.values(valores).forEach(dados => {
    if (dados.valorDistribuido > VALOR_BASE_PERICIA) {
      gastosNormais +=
        dados.valorDistribuido - VALOR_BASE_PERICIA;
    }

    if (dados.valorDistribuido < VALOR_BASE_PERICIA) {
      pontosRecuperados +=
        VALOR_BASE_PERICIA - dados.valorDistribuido;
    }

    bonusNatural += dados.bonusNatural;
  });

  return {
    gastosNormais: gastosNormais,
    pontosRecuperados: pontosRecuperados,
    limiteNormal:
      PONTOS_PERICIA_INICIAIS + pontosRecuperados,
    bonusNatural: bonusNatural
  };
}

function pontosNormaisCompletos() {
  const resumo = obterResumoPontosPericias();

  return resumo.gastosNormais === resumo.limiteNormal;
}

function obterValorFinalPericia(id) {
  const dados = valoresPericias[id];

  if (!dados) return VALOR_BASE_PERICIA;

  return (
    dados.valorDistribuido +
    dados.bonusNatural
  );
}

function sincronizarBonusComPericiasNaturais() {
  periciasSistema.forEach(pericia => {
    const dados = valoresPericias[pericia.id];

    if (!dados) return;

    if (!ehPericiaNatural(pericia)) {
      dados.bonusNatural = 0;
    }
  });
}

function alterarValorPericia(id, novoValorFinal) {
  const pericia =
    periciasSistema.find(item => item.id === id);

  const dadosAtuais = valoresPericias[id];

  if (!pericia || !dadosAtuais) return false;

  const natural = ehPericiaNatural(pericia);

  const bonusAtual = natural
    ? dadosAtuais.bonusNatural
    : 0;

  mensagemAtributosPericias.textContent = "";

  if (
    !Number.isInteger(novoValorFinal) ||
    novoValorFinal < 1 ||
    novoValorFinal > (
      natural
        ? MAXIMO_PERICIA_NATURAL
        : MAXIMO_PERICIA_NORMAL
    )
  ) {
    mensagemAtributosPericias.textContent =
      natural
        ? "Uma Perícia Natural deve ter valor final entre 1 e 14."
        : "Uma Perícia deve ter valor entre 1 e 12.";

    return false;
  }

  /*
  O número exibido já inclui o bônus Natural.
  Portanto retiramos o bônus para descobrir
  qual seria o valor normal distribuído.
  */

  const novoValorDistribuido =
    novoValorFinal - bonusAtual;

  if (
    !Number.isInteger(novoValorDistribuido) ||
    novoValorDistribuido < 1
  ) {
    mensagemAtributosPericias.textContent =
      "Reduza primeiro o bônus Natural dessa Perícia para diminuir seu valor até esse ponto.";

    return false;
  }

  if (
    novoValorDistribuido >
    MAXIMO_PERICIA_NORMAL
  ) {
    mensagemAtributosPericias.textContent =
      "Os pontos normais podem elevar uma Perícia no máximo até 12.";

    return false;
  }

  const candidato = copiarValoresPericias();

  candidato[id].valorDistribuido =
    novoValorDistribuido;

  const resumoCandidato =
    obterResumoPontosPericias(candidato);

  if (
    resumoCandidato.pontosRecuperados >
    MAXIMO_PONTOS_RECUPERADOS
  ) {
    mensagemAtributosPericias.textContent =
      "Você já recuperou o máximo de 15 pontos diminuindo Perícias.";

    return false;
  }

  if (
    resumoCandidato.gastosNormais >
    resumoCandidato.limiteNormal
  ) {
    mensagemAtributosPericias.textContent =
      "Você não possui pontos normais suficientes para esse aumento.";

    return false;
  }

  valoresPericias = candidato;

  return true;
}

function alterarBonusNatural(id, novoBonus) {
  const pericia =
    periciasSistema.find(item => item.id === id);

  const dadosAtuais =
    valoresPericias[id];

  if (
    !pericia ||
    !dadosAtuais ||
    !ehPericiaNatural(pericia)
  ) {
    return false;
  }

  mensagemAtributosPericias.textContent = "";

  if (
    !Number.isInteger(novoBonus) ||
    novoBonus < 0 ||
    novoBonus > BONUS_NATURAL_POR_PERICIA
  ) {
    mensagemAtributosPericias.textContent =
      "Cada Perícia Natural pode receber entre +0 e +3 pontos bônus.";

    return false;
  }

  const candidato =
    copiarValoresPericias();

  candidato[id].bonusNatural =
    novoBonus;

  const resumoCandidato =
    obterResumoPontosPericias(candidato);

  if (
    resumoCandidato.bonusNatural >
    BONUS_NATURAL_TOTAL
  ) {
    mensagemAtributosPericias.textContent =
      "Você possui somente 5 pontos bônus de Perícias Naturais.";

    return false;
  }

  const valorFinal =
    candidato[id].valorDistribuido +
    candidato[id].bonusNatural;

  if (
    valorFinal >
    MAXIMO_PERICIA_NATURAL
  ) {
    mensagemAtributosPericias.textContent =
      "O valor final de uma Perícia Natural não pode ultrapassar 14.";

    return false;
  }

  valoresPericias = candidato;

  return true;
}

/* Contadores das Perícias */

function renderizarContadoresPericias() {
  const resumo =
    obterResumoPontosPericias();

  contadorPontosPericias.textContent =
    `${resumo.gastosNormais} / ${resumo.limiteNormal}`;

  contadorBonusNaturais.textContent =
    `Perícias Naturais: ${resumo.bonusNatural} / 5`;
}

/* Renderização das Perícias */

function criarLinhaPericia(pericia) {
  const dados = valoresPericias[pericia.id];

  const valorNormal =
    dados.valorDistribuido +
    dados.bonusNatural;

  const valorBom =
    Math.floor(valorNormal / 2);

  const valorExtremo =
    Math.floor(valorNormal / 5);

  const natural = ehPericiaNatural(pericia);

  const linha = document.createElement("div");
  linha.className = "linha-pericia-criacao";

  if (natural) {
    linha.classList.add("pericia-natural");
  }

  const nome =
    document.createElement("span");

  nome.className =
    "nome-pericia-criacao";

  nome.textContent =
    pericia.nome;

  /* Grupo dos valores à direita */

  const grupoValores =
    document.createElement("div");

  grupoValores.className =
    "grupo-valores-pericia";

  /* Bônus da Perícia Natural */

  if (natural) {
    const controleBonus =
      document.createElement("label");

    controleBonus.className =
      "controle-bonus-natural";

    controleBonus.title =
      "Pontos bônus desta Perícia Natural";

    const sinal =
      document.createElement("span");

    sinal.textContent = "+";

    const inputBonus =
      document.createElement("input");

    inputBonus.type = "number";
    inputBonus.min = "0";
    inputBonus.max = "3";
    inputBonus.step = "1";
    inputBonus.value =
      dados.bonusNatural;

    inputBonus.setAttribute(
      "aria-label",
      `Bônus Natural de ${pericia.nome}`
    );

    inputBonus.addEventListener("change", () => {
      const novoBonus =
        Number(inputBonus.value);

      const alterou =
        alterarBonusNatural(
          pericia.id,
          novoBonus
        );

      if (!alterou) {
        inputBonus.value =
          valoresPericias[pericia.id]
            .bonusNatural;
      }

      renderizarEtapaAtributosPericias();
    });

    controleBonus.append(
      sinal,
      inputBonus
    );

    grupoValores.appendChild(
      controleBonus
    );
  }

  const valores = document.createElement("div");

  valores.className = "valores-pericia";

  /* Normal */

  const caixaNormal = document.createElement("div");
  caixaNormal.className = "caixa-normal-pericia";

  const inputNormal = document.createElement("input");

  inputNormal.type = "number";
  inputNormal.step = "1";
  inputNormal.min = natural ? String(1 + dados.bonusNatural) : "1";
  inputNormal.max = natural ? "14" : "12";
  inputNormal.value = valorNormal;
  inputNormal.className = "input-normal-pericia";
  inputNormal.title = "Sucesso Normal";

  inputNormal.setAttribute(
    "aria-label",
    `${pericia.nome} - Sucesso Normal`
  );

  inputNormal.addEventListener("change", () => {
    const novoValor = Number(inputNormal.value);

    const alterou =
      alterarValorPericia(
        pericia.id,
        novoValor
      );

    if (!alterou) {
      inputNormal.value =
        obterValorFinalPericia(pericia.id);
    }

    renderizarEtapaAtributosPericias();
  });

  caixaNormal.appendChild(inputNormal);

  /* Bom */

  const caixaBom = document.createElement("div");

  caixaBom.className = "caixa-bom-pericia";
  caixaBom.textContent = valorBom;
  caixaBom.title = "Sucesso Bom";

  caixaBom.setAttribute(
    "aria-label",
    `${pericia.nome} - Sucesso Bom: ${valorBom}`
  );

  /* Extremo */

  const caixaExtremo = document.createElement("div");

  caixaExtremo.className =
    "caixa-extremo-pericia";

  caixaExtremo.textContent =
    valorExtremo;

  caixaExtremo.title =
    "Sucesso Extremo";

  caixaExtremo.setAttribute(
    "aria-label",
    `${pericia.nome} - Sucesso Extremo: ${valorExtremo}`
  );

  valores.append(
    caixaNormal,
    caixaBom,
    caixaExtremo
  );

  grupoValores.appendChild(valores);

  linha.append(
    nome,
    grupoValores
  );

  return linha;
}

function renderizarListaPericiasCriacao() {
  if (periciasSistema.length === 0) return;

  const fragmento =
    document.createDocumentFragment();

  periciasSistema.forEach(pericia => {
    fragmento.appendChild(
      criarLinhaPericia(pericia)
    );
  });

  listaPericiasCriacao.replaceChildren(fragmento);
}

function atualizarEstadoAtributosPericias() {
  const resumo = obterResumoPontosPericias();

  const atributosCompletos =
    obterTotalAtributos() === 4;

  const periciasCompletas =
    resumo.gastosNormais === resumo.limiteNormal;

  const naturaisCompletas =
    resumo.bonusNatural === BONUS_NATURAL_TOTAL;

  botaoContinuarAtributosPericias.disabled = !(
    auth.currentUser &&
    referenciaFichaAtual &&
    fichaJaCriada &&
    atributosCompletos &&
    periciasCompletas &&
    naturaisCompletas &&
    periciasSistema.length > 0
  );
}

function renderizarEtapaAtributosPericias() {
  renderizarAtributos();
  renderizarContadoresPericias();
  renderizarListaPericiasCriacao();
  atualizarEstadoAtributosPericias();
}

/* Salvamento dos Atributos e Perícias */

formAtributosPericias.addEventListener("submit", async evento => {
  evento.preventDefault();

  const usuario = auth.currentUser;
  const resumo = obterResumoPontosPericias();

  if (!usuario) {
    mensagemAtributosPericias.textContent =
      "Entre em uma conta para continuar.";

    return;
  }

  if (obterTotalAtributos() !== 4) {
    mensagemAtributosPericias.textContent =
      "Distribua os 4 pontos de Atributo.";

    return;
  }

  if (
    resumo.gastosNormais !==
    resumo.limiteNormal
  ) {
    mensagemAtributosPericias.textContent =
      "Distribua todos os pontos normais de Perícia.";

    return;
  }

  if (
    resumo.bonusNatural !==
    BONUS_NATURAL_TOTAL
  ) {
    mensagemAtributosPericias.textContent =
      "Distribua os 5 pontos bônus das Perícias Naturais.";

    return;
  }

  if (
    !referenciaFichaAtual ||
    !fichaJaCriada
  ) {
    mensagemAtributosPericias.textContent =
      "Salve as etapas anteriores antes de continuar.";

    return;
  }

  const periciasParaSalvar = {};

  periciasSistema.forEach(pericia => {
    const dados =
      valoresPericias[pericia.id];

    periciasParaSalvar[pericia.id] = {
      nome: pericia.nome,
      valorDistribuido:
        dados.valorDistribuido,
      bonusNatural:
        dados.bonusNatural
    };
  });

  botaoContinuarAtributosPericias.disabled = true;

  mensagemAtributosPericias.textContent =
    "Salvando Atributos e Perícias...";

  try {
    await referenciaFichaAtual.update({
      atributos: {
        fisico:
          atributosPersonagem.fisico,

        cognicao:
          atributosPersonagem.cognicao,

        presenca:
          atributosPersonagem.presenca,

        deslocamentoMetros:
          atributosPersonagem.deslocamentoMetros,

        deslocamentoQuadrados:
          atributosPersonagem.deslocamentoQuadrados
      },

      pericias: periciasParaSalvar,

      etapaAtual:
        Math.max(etapaSalva, 5),

      atualizadoEm:
        firebase.firestore.FieldValue.serverTimestamp()
    });

    if (
      auth.currentUser?.uid !==
      usuario.uid
    ) return;

    etapaSalva =
      Math.max(etapaSalva, 5);

    mensagemAtributosPericias.textContent = "";

    await promessaItensIniciaisSistema;

    if (auth.currentUser?.uid !== usuario.uid) return;

    renderizarEtapaItensIniciais();
    abrirEtapaCriacao("tela-itens-iniciais");

  } catch (erro) {
    console.error(
      "Erro ao salvar Atributos e Perícias:",
      erro
    );

    if (
      auth.currentUser?.uid ===
      usuario.uid
    ) {
      mensagemAtributosPericias.textContent =
        "Não foi possível salvar os Atributos e Perícias. Tente novamente.";
    }

  } finally {
    atualizarEstadoAtributosPericias();
  }
});

/* Etapa 5: Itens Iniciais */

const formItensIniciais = document.getElementById("form-itens-iniciais");
const ocupacoesItensIniciais = document.getElementById("ocupacoes-itens-iniciais");
const pcRestanteItens = document.getElementById("pc-restante-itens");
const creditoItens = document.getElementById("credito-itens");
const campoPesquisaItens = document.getElementById("pesquisa-itens");
const listaItensComuns = document.getElementById("lista-itens-comuns");
const listaItensEspeciais = document.getElementById("lista-itens-especiais");
const listaInventarioInicial = document.getElementById("lista-inventario-inicial");
const contadorCargaInventario = document.getElementById("contador-carga-inventario");
const avisoCargaInventario = document.getElementById("aviso-carga-inventario");
const mensagemItensIniciais = document.getElementById("mensagem-itens-iniciais");
const botaoFinalizarFicha = document.getElementById("finalizar-ficha");

let itensIniciaisSistema = [];
let inventarioInicial = [];
let sequenciaInstanciaItem = 0;
let finalizandoFicha = false;
let filaSalvamentoInventario = Promise.resolve();

function criarIdItem(nome, categoria) {
  return `${categoria}-${normalizarBuscaOcupacao(nome).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}`;
}

function extrairNumeroItem(texto) {
  const resultado = String(texto || "").match(/-?\d+(?:[.,]\d+)?/);
  return resultado ? Number(resultado[0].replace(",",".")) : NaN;
}

function formatarNumeroItem(valor) {
  return new Intl.NumberFormat("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:2}).format(valor);
}

function formatarCredito(valor) {
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2}).format(valor);
}

function encontrarTabelaItens(documento, titulo) {
  const alvo = normalizarBuscaOcupacao(titulo).replace(/:$/,"");
  const cabecalho = [...documento.querySelectorAll("h3")].find(elemento => normalizarBuscaOcupacao(elemento.textContent).replace(/:$/,"") === alvo);
  if (!cabecalho) return null;

  let elemento = cabecalho.nextElementSibling;

  while (elemento && elemento.tagName !== "TABLE") {
    elemento = elemento.nextElementSibling;
  }

  return elemento?.tagName === "TABLE" ? elemento : null;
}

function extrairItensTabela(tabela, categoria) {
  if (!tabela) return [];

  return [...tabela.querySelectorAll("tbody tr")].map(linha => {
    const celulas = [...linha.querySelectorAll("td")];
    if (celulas.length < 5) return null;

    const nome = celulas[0].textContent.trim();
    const descricao = textoElementoComQuebras(celulas[1]);
    const peso = extrairNumeroItem(celulas[2].textContent);
    const custo = extrairNumeroItem(celulas[3].textContent);
    const textoCompatibilidade = celulas[4].textContent.trim();

    if (!nome || !Number.isFinite(peso) || !Number.isFinite(custo)) return null;

    const compatibilidades = textoCompatibilidade === "-"
      ? []
      : textoCompatibilidade.split(",").map(valor => valor.trim()).filter(Boolean);

    return {
      id: criarIdItem(nome,categoria),
      nome: nome,
      descricao: descricao,
      peso: peso,
      custo: custo,
      compatibilidades: compatibilidades,
      categoria: categoria
    };
  }).filter(Boolean);
}

async function carregarItensIniciaisDoSistema() {
  try {
    const resposta = await fetch("index-sistema.html");
    if (!resposta.ok) throw new Error("Não foi possível abrir index-sistema.html.");

    const html = await resposta.text();
    const documento = new DOMParser().parseFromString(html,"text/html");

    const tabelaComuns = encontrarTabelaItens(documento,"Itens Comuns");
    const tabelaEspeciais = encontrarTabelaItens(documento,"Itens Especiais");

    itensIniciaisSistema = [
      ...extrairItensTabela(tabelaComuns,"comum"),
      ...extrairItensTabela(tabelaEspeciais,"especial")
    ];

    if (itensIniciaisSistema.length === 0) throw new Error("Nenhum Item Inicial foi encontrado.");

    renderizarEtapaItensIniciais();
    return true;

  } catch (erro) {
    console.error("Erro ao carregar Itens Iniciais:",erro);
    listaItensComuns.innerHTML = `<p class="aviso-itens">Não foi possível carregar os Itens.</p>`;
    listaItensEspeciais.innerHTML = `<p class="aviso-itens">Não foi possível carregar os Itens.</p>`;
    botaoFinalizarFicha.disabled = true;
    return false;
  }
}

const promessaItensIniciaisSistema = carregarItensIniciaisDoSistema();

/* Cálculos */

function obterPcInicial() {
  return Number(calcularMediaOcupacoes("pc") || 0);
}

function obterCoPersonagem() {
  return Number(calcularMediaOcupacoes("co") || 0);
}

function itemCompativelComOcupacao(item) {
  const ocupacoes = new Set(obterOcupacoesSelecionadas().map(ocupacao => normalizarBuscaOcupacao(ocupacao.nome)));

  return item.compatibilidades.some(compatibilidade => {
    return ocupacoes.has(normalizarBuscaOcupacao(compatibilidade));
  });
}

function calcularInventario(inventario = inventarioInicial) {
  let descontosRestantes = 2;
  let gasto = 0;
  let peso = 0;

  const itens = inventario.map(item => {
    const compativel = itemCompativelComOcupacao(item);
    let descontoOcupacao = 0;

    if (compativel && descontosRestantes > 0 && item.custo > 0) {
      descontoOcupacao = 1;
      descontosRestantes--;
    }

    const custoFinal = Math.max(0,item.custo - descontoOcupacao);

    gasto += custoFinal;
    peso += item.peso;

    return {
      ...item,
      compativel: compativel,
      descontoOcupacao: descontoOcupacao,
      custoFinal: custoFinal
    };
  });

  return {
    itens: itens,
    gasto: Math.round(gasto * 100) / 100,
    peso: Math.round(peso * 100) / 100,
    descontosUsados: 2 - descontosRestantes
  };
}

function obterCapacidadeCarga() {
  const atletismo = obterValorFinalPericia(criarIdPericia("Atletismo"));
  return 5 + atributosPersonagem.fisico + Math.floor(atletismo / 4);
}

function obterResumoFinanceiroItens() {
  const calculo = calcularInventario();
  const pcInicial = obterPcInicial();
  const pcRestante = Math.round((pcInicial - calculo.gasto) * 100) / 100;
  const co = obterCoPersonagem();
  const credito = co * (0.25 + pcRestante);

  return {
    calculo: calculo,
    pcInicial: pcInicial,
    pcRestante: pcRestante,
    co: co,
    credito: credito,
    capacidade: obterCapacidadeCarga()
  };
}

function quantidadeItemInventario(id) {
  return inventarioInicial.filter(item => item.id === id).length;
}

/* Resumo superior */

function renderizarResumoItensIniciais() {
  const ocupacoes = obterOcupacoesSelecionadas();
  const resumo = obterResumoFinanceiroItens();

  ocupacoesItensIniciais.textContent = ocupacoes.length
    ? ocupacoes.map(ocupacao => ocupacao.nome).join(" • ")
    : "—";

  pcRestanteItens.textContent = `${formatarNumeroItem(resumo.pcRestante)} / ${formatarNumeroItem(resumo.pcInicial)} PC`;
  creditoItens.textContent = formatarCredito(resumo.credito);
  contadorCargaInventario.textContent = `${formatarNumeroItem(resumo.calculo.peso)} / ${formatarNumeroItem(resumo.capacidade)}`;

  avisoCargaInventario.classList.remove("excesso-grave");

  if (resumo.calculo.peso > resumo.capacidade * 2) {
    avisoCargaInventario.textContent = "Carga acima do dobro da capacidade: -1/3 e -1/2 do Deslocamento.";
    avisoCargaInventario.classList.add("excesso-grave");
  } else if (resumo.calculo.peso > resumo.capacidade) {
    avisoCargaInventario.textContent = "Capacidade de Carga ultrapassada: -1/3 do Deslocamento.";
  } else {
    avisoCargaInventario.textContent = "";
  }
}

/* Cards dos Itens disponíveis */

function obterCustoAoAdicionarItem(item) {
  const atual = calcularInventario();
  const candidato = calcularInventario([...inventarioInicial,item]);
  return Math.round((candidato.gasto - atual.gasto) * 100) / 100;
}

function criarCardItemDisponivel(item) {
  const card = document.createElement("article");
  card.className = "card-item-disponivel";

  const compativel = itemCompativelComOcupacao(item);
  if (compativel) card.classList.add("compativel");

  const conteudo = document.createElement("div");
  conteudo.className = "conteudo-item-disponivel";

  const nome = document.createElement("strong");
  nome.className = "nome-item-disponivel";
  nome.textContent = item.nome;

  const descricao = document.createElement("p");
  descricao.className = "descricao-item-disponivel";
  descricao.textContent = item.descricao;
  descricao.title = item.descricao;

  const dados = document.createElement("div");
  dados.className = "dados-item-disponivel";

  const peso = document.createElement("span");
  peso.textContent = `Peso: ${formatarNumeroItem(item.peso)}`;

  const custoAoAdicionar = obterCustoAoAdicionarItem(item);
  const custo = document.createElement("span");

  if (custoAoAdicionar < item.custo) {
    custo.className = "custo-item-com-desconto";
    custo.textContent = `Custo: ${formatarNumeroItem(item.custo)} → ${formatarNumeroItem(custoAoAdicionar)} PC`;
  } else {
    custo.textContent = `Custo: ${formatarNumeroItem(item.custo)} PC`;
  }

  dados.append(peso,custo);
  conteudo.append(nome,descricao,dados);

  if (item.compatibilidades.length > 0) {
    const compatibilidade = document.createElement("span");
    compatibilidade.className = "compatibilidade-item";
    compatibilidade.textContent = `Compat.: ${item.compatibilidades.join(", ")}`;
    compatibilidade.title = item.compatibilidades.join(", ");
    conteudo.appendChild(compatibilidade);
  }

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-adicionar-item";
  botao.textContent = "+";

  const candidato = calcularInventario([...inventarioInicial,item]);
  const limiteQuantidade = quantidadeItemInventario(item.id) >= 2;
  const semPc = candidato.gasto > obterPcInicial() + 0.000001;

  botao.disabled = finalizandoFicha || limiteQuantidade || semPc;
  botao.title = limiteQuantidade
    ? "Você já possui 2 unidades deste Item."
    : semPc
      ? "PC insuficiente."
      : "Adicionar ao Inventário";

  botao.addEventListener("click",() => adicionarItemInicial(item));
  card.append(conteudo,botao);

  return card;
}

function itemCorrespondePesquisa(item,pesquisa) {
  if (!pesquisa) return true;

  const texto = normalizarBuscaOcupacao([
    item.nome,
    item.descricao,
    item.categoria === "comum" ? "Item Comum" : "Item Especial",
    `Peso ${formatarNumeroItem(item.peso)}`,
    `${formatarNumeroItem(item.custo)} PC`,
    ...item.compatibilidades
  ].join(" "));

  return texto.includes(pesquisa);
}

function renderizarListaCategoriaItens(categoria,destino) {
  const pesquisa = normalizarBuscaOcupacao(campoPesquisaItens.value);
  const itens = itensIniciaisSistema.filter(item => item.categoria === categoria && itemCorrespondePesquisa(item,pesquisa));

  if (itens.length === 0) {
    destino.innerHTML = `<p class="aviso-itens">Nenhum Item encontrado.</p>`;
    return;
  }

  const fragmento = document.createDocumentFragment();
  itens.forEach(item => fragmento.appendChild(criarCardItemDisponivel(item)));
  destino.replaceChildren(fragmento);
}

function renderizarListasItensDisponiveis() {
  if (itensIniciaisSistema.length === 0) return;
  renderizarListaCategoriaItens("comum",listaItensComuns);
  renderizarListaCategoriaItens("especial",listaItensEspeciais);
}

/* Inventário */

function criarCardItemInventario(item) {
  const card = document.createElement("article");
  card.className = "card-item-inventario";
  if (item.descontoOcupacao > 0) card.classList.add("com-desconto");

  const conteudo = document.createElement("div");

  const nome = document.createElement("strong");
  nome.className = "nome-item-inventario";
  nome.textContent = item.nome;

  const dados = document.createElement("div");
  dados.className = "dados-item-inventario";

  const peso = document.createElement("span");
  peso.textContent = `Peso: ${formatarNumeroItem(item.peso)}`;

  const custo = document.createElement("span");
  custo.textContent = `Custo: ${formatarNumeroItem(item.custoFinal)} PC`;

  dados.append(peso,custo);
  conteudo.append(nome,dados);

  if (item.descontoOcupacao > 0) {
    const desconto = document.createElement("span");
    desconto.className = "desconto-item-inventario";
    desconto.textContent = "Compatibilidade de Ocupação: -1 PC";
    conteudo.appendChild(desconto);
  }

  const remover = document.createElement("button");
  remover.type = "button";
  remover.className = "botao-remover-item";
  remover.textContent = "×";
  remover.title = "Remover Item";
  remover.disabled = finalizandoFicha;
  remover.addEventListener("click",() => removerItemInicial(item.instanciaId));

  card.append(conteudo,remover);
  return card;
}

function renderizarInventarioInicial() {
  const calculo = calcularInventario();

  if (calculo.itens.length === 0) {
    listaInventarioInicial.innerHTML = `<p class="inventario-vazio">Nenhum Item selecionado.</p>`;
    return;
  }

  const fragmento = document.createDocumentFragment();
  calculo.itens.forEach(item => fragmento.appendChild(criarCardItemInventario(item)));
  listaInventarioInicial.replaceChildren(fragmento);
}

function adicionarItemInicial(item) {
  if (finalizandoFicha || quantidadeItemInventario(item.id) >= 2) return;

  const candidato = calcularInventario([...inventarioInicial,item]);

  if (candidato.gasto > obterPcInicial() + 0.000001) {
    mensagemItensIniciais.textContent = "Você não possui PC suficiente para comprar este Item.";
    return;
  }

  inventarioInicial.push({
    ...item,
    compatibilidades: [...item.compatibilidades],
    instanciaId: ++sequenciaInstanciaItem
  });

  mensagemItensIniciais.textContent = "";
  renderizarEtapaItensIniciais();
  salvarRascunhoItensIniciais();
}

function removerItemInicial(instanciaId) {
  if (finalizandoFicha) return;

  inventarioInicial = inventarioInicial.filter(item => item.instanciaId !== instanciaId);
  mensagemItensIniciais.textContent = "";
  renderizarEtapaItensIniciais();
  salvarRascunhoItensIniciais();
}

/* Salvamento automático da etapa */

function serializarInventarioBase() {
  return inventarioInicial.map(item => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    peso: item.peso,
    custo: item.custo,
    compatibilidades: [...item.compatibilidades],
    categoria: item.categoria,
    personalizado: false
  }));
}

function salvarRascunhoItensIniciais() {
  const usuario = auth.currentUser;
  const referencia = referenciaFichaAtual;

  if (!usuario || !referencia || !fichaJaCriada) return;

  const resumo = obterResumoFinanceiroItens();
  const inventario = serializarInventarioBase();

  filaSalvamentoInventario = filaSalvamentoInventario.catch(() => {}).then(async () => {
    if (auth.currentUser?.uid !== usuario.uid || referenciaFichaAtual?.id !== referencia.id) return;

    await referencia.update({
      inventario: inventario,
      pcInicial: resumo.pcInicial,
      pcRestante: resumo.pcRestante,
      coeficienteCredito: resumo.co,
      credito: resumo.credito,
      capacidadeCarga: resumo.capacidade,
      pesoInventario: resumo.calculo.peso,
      etapaAtual: Math.max(etapaSalva,5),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(erro => {
    console.error("Erro ao salvar Inventário:",erro);
    mensagemItensIniciais.textContent = "Não foi possível salvar automaticamente o Inventário.";
  });
}

function restaurarInventarioInicial(itensSalvos) {
  inventarioInicial = [];
  sequenciaInstanciaItem = 0;

  if (!Array.isArray(itensSalvos)) return;

  itensSalvos.forEach(item => {
    const custo = Number(item.custoBase ?? item.custo);
    const peso = Number(item.peso);

    if (!item.nome || !Number.isFinite(custo) || !Number.isFinite(peso)) return;
    if (inventarioInicial.filter(atual => atual.id === item.id).length >= 2) return;

    inventarioInicial.push({
      id: item.id || criarIdItem(item.nome,item.categoria || "comum"),
      nome: item.nome,
      descricao: item.descricao || "",
      peso: peso,
      custo: custo,
      compatibilidades: Array.isArray(item.compatibilidades) ? [...item.compatibilidades] : [],
      categoria: item.categoria === "especial" ? "especial" : "comum",
      instanciaId: ++sequenciaInstanciaItem
    });
  });
}

/* Estado geral */

function atualizarEstadoItensIniciais() {
  const resumo = obterResumoFinanceiroItens();

  botaoFinalizarFicha.disabled = !(
    auth.currentUser &&
    referenciaFichaAtual &&
    fichaJaCriada &&
    itensIniciaisSistema.length > 0 &&
    resumo.pcRestante >= -0.000001 &&
    !finalizandoFicha
  );
}

function renderizarEtapaItensIniciais() {
  renderizarResumoItensIniciais();
  renderizarListasItensDisponiveis();
  renderizarInventarioInicial();
  atualizarEstadoItensIniciais();
}

campoPesquisaItens.addEventListener("input",renderizarListasItensDisponiveis);

/* Finalização */

formItensIniciais.addEventListener("submit",async evento => {
  evento.preventDefault();

  const usuario = auth.currentUser;
  if (!usuario) {
    mensagemItensIniciais.textContent = "Entre em uma conta para finalizar a ficha.";
    return;
  }

  if (!referenciaFichaAtual || !fichaJaCriada) {
    mensagemItensIniciais.textContent = "A ficha ainda não foi salva corretamente.";
    return;
  }

  const resumo = obterResumoFinanceiroItens();

  if (resumo.pcRestante < -0.000001) {
    mensagemItensIniciais.textContent = "Remova Itens até que o PC restante seja pelo menos 0.";
    return;
  }

  finalizandoFicha = true;
  mensagemItensIniciais.textContent = "Finalizando ficha...";
  renderizarEtapaItensIniciais();

  try {
    await filaSalvamentoInventario.catch(() => {});

    const resumoFinal = obterResumoFinanceiroItens();

    const inventarioFinal = resumoFinal.calculo.itens.map(item => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      peso: item.peso,
      custoBase: item.custo,
      custoFinal: item.custoFinal,
      descontoOcupacao: item.descontoOcupacao,
      compatibilidades: [...item.compatibilidades],
      categoria: item.categoria,
      personalizado: false
    }));

    await referenciaFichaAtual.update({
      estado: "pronta",
      etapaAtual: 5,
      inventario: inventarioFinal,
      pcInicial: resumoFinal.pcInicial,
      pcRestante: resumoFinal.pcRestante,
      coeficienteCredito: resumoFinal.co,
      credito: resumoFinal.credito,
      capacidadeCarga: resumoFinal.capacidade,
      pesoInventario: resumoFinal.calculo.peso,
      finalizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (auth.currentUser?.uid !== usuario.uid) return;

    window.location.href = `index-ficha.html?ficha=${encodeURIComponent(referenciaFichaAtual.id)}`;

  } catch (erro) {
    console.error("Erro ao finalizar ficha:",erro);
    mensagemItensIniciais.textContent = "Não foi possível finalizar a ficha. Tente novamente.";
    finalizandoFicha = false;
    renderizarEtapaItensIniciais();
  }
});
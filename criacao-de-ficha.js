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

    if (etapaSalva >= 4) {
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

    ocupacoesSelecionadas = [];
    periciasNaturaisSelecionadas = [];

    campoPesquisaOcupacao.value = "";

    mensagemPerfil.textContent = "";
    mensagemOcupacao.textContent = "";

    atualizarEstadoPerfil();
    renderizarTelaOcupacao();

    history.replaceState({}, "", window.location.pathname);
    abrirEtapaCriacao("tela-conceito");
  }

  uidAnteriorCriacao = usuario?.uid || null;

  if (!usuario) {
    botaoContinuarConceito.disabled = true;
    mensagemConceito.textContent = "Entre em uma conta para criar sua ficha.";
    botaoContinuarPerfil.disabled = true;
    botaoContinuarOcupacao.disabled = true;
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
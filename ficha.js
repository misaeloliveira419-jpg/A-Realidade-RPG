const idFicha = new URLSearchParams(window.location.search).get("ficha");

const previewLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const campoNomeFicha = document.getElementById("nome-personagem-ficha");
const campoFotoFicha = document.getElementById("input-foto-ficha");
const imagemFotoFicha = document.getElementById("imagem-foto-ficha");
const semFotoFicha = document.getElementById("sem-foto-ficha");
const botaoRemoverFotoFicha = document.getElementById("remover-foto-ficha");

let dadosFichaAtual = null;
let nomeFichaSalvo = "";

/* Elementos da aba Informações */

const campoOcupacao1Ficha = document.getElementById("ocupacao-1-ficha");
const campoOcupacao2Ficha = document.getElementById("ocupacao-2-ficha");
const campoPerfilFicha = document.getElementById("perfil-ficha");
const campoIdadeFicha = document.getElementById("idade-ficha");
const campoAparenciaFicha = document.getElementById("aparencia-ficha");
const campoPassadoFicha = document.getElementById("passado-ficha");
const campoAnotacoesFicha = document.getElementById("anotacoes-ficha");

let ocupacoesFichaDisponiveis = [];

function verificarElementosPontosFicha() {
  const elementos = {
    "ncp-ficha": campoNcpFicha,
    "neo-ficha": campoNeoFicha,
    "credito-ficha": campoCreditoFicha,
    "contador-atributos-ficha": contadorAtributosFicha,

    "fisico-ficha": campoFisicoFicha,
    "cognicao-ficha": campoCognicaoFicha,
    "presenca-ficha": campoPresencaFicha,
    "deslocamento-metros-ficha": campoDeslocamentoMetrosFicha,
    "deslocamento-quadrados-ficha": campoDeslocamentoQuadradosFicha,

    "pv-atual-ficha": campoPvAtualFicha,
    "pv-maximo-ficha": campoPvMaximoFicha,
    "pd-atual-ficha": campoPdAtualFicha,
    "pd-maximo-ficha": campoPdMaximoFicha,

    "lista-pericias-ficha": listaPericiasFicha,

    "tipo-rolagem-ficha": tipoRolagemFicha,
    "rolagem-pericia-ficha": areaRolagemPericiaFicha,
    "rolagem-outro-ficha": areaRolagemOutroFicha,
    "pesquisa-pericia-rolagem": pesquisaPericiaRolagem,
    "quantidade-d20-ficha": quantidadeD20Ficha,
    "valor-teste-pericia": valorTestePericia,

    "rolar-ficha": botaoRolarFicha,
    "salvar-rolagem-ficha": botaoSalvarRolagemFicha,

    ".dados-resultado-ficha": dadosResultadoFicha,
    ".resultado-sucesso-ficha": resultadoSucessoFicha,

    "lista-historico-rolagens-ficha": listaHistoricoRolagensFicha,
    "lista-rolagens-salvas-ficha": listaRolagensSalvasFicha
  };

  const faltando = Object.entries(elementos)
    .filter(([, elemento]) => !elemento)
    .map(([nome]) => nome);

  if (faltando.length > 0) {
    throw new Error(
      `Elementos ausentes na tela de Pontos de Ficha: ${faltando.join(", ")}`
    );
  }
}

/* Cabeçalho da ficha */

function mostrarFotoFicha(foto) {
  const possuiFoto = typeof foto === "string" && foto.startsWith("data:image/");

  imagemFotoFicha.hidden = !possuiFoto;
  semFotoFicha.hidden = possuiFoto;
  botaoRemoverFotoFicha.hidden = !possuiFoto;

  if (possuiFoto) {
    imagemFotoFicha.src = foto;
  } else {
    imagemFotoFicha.removeAttribute("src");
  }
}

function preencherCabecalhoFicha(ficha) {
  dadosFichaAtual = ficha;

  nomeFichaSalvo = ficha.nome || "Nome do Personagem";
  campoNomeFicha.value = nomeFichaSalvo;

  mostrarFotoFicha(ficha.foto || "");
}

campoNomeFicha.addEventListener("change", async () => {
  const novoNome = campoNomeFicha.value.trim();

  if (!novoNome) {
    campoNomeFicha.value = nomeFichaSalvo || "Nome do Personagem";
    return;
  }

  if (previewLocal) {
    nomeFichaSalvo = novoNome;
    document.title = `${novoNome}: A Realidade RPG`;
    return;
  }

  if (!auth.currentUser || !idFicha || novoNome === nomeFichaSalvo) return;

  try {
    await db.collection("fichas").doc(idFicha).update({
      nome: novoNome,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    nomeFichaSalvo = novoNome;
    if (dadosFichaAtual) {
      dadosFichaAtual.nome = novoNome;
    }
    document.title = `${novoNome}: A Realidade RPG`;

  } catch (erro) {
    console.error("Erro ao alterar nome da ficha:", erro);
    campoNomeFicha.value = nomeFichaSalvo;
  }
});

function carregarImagemArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir a imagem."));
    };

    imagem.src = url;
  });
}

async function prepararFotoFicha(arquivo) {
  const imagem = await carregarImagemArquivo(arquivo);

  let largura = imagem.width;
  let altura = imagem.height;

  const tamanhoMaximo = 500;

  if (largura > tamanhoMaximo || altura > tamanhoMaximo) {
    const escala = Math.min(tamanhoMaximo / largura, tamanhoMaximo / altura);

    largura = Math.round(largura * escala);
    altura = Math.round(altura * escala);
  }

  const canvas = document.createElement("canvas");

  canvas.width = largura;
  canvas.height = altura;

  canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);

  let qualidade = 0.82;
  let foto = canvas.toDataURL("image/jpeg", qualidade);

  while (foto.length > 600000 && qualidade > 0.45) {
    qualidade -= 0.07;
    foto = canvas.toDataURL("image/jpeg", qualidade);
  }

  if (foto.length > 650000) {
    throw new Error("A imagem continua grande demais.");
  }

  return foto;
}

campoFotoFicha.addEventListener("change", async () => {
  const arquivo = campoFotoFicha.files?.[0];

  if (!arquivo) return;

  try {
    const foto = await prepararFotoFicha(arquivo);

    mostrarFotoFicha(foto);

    if (previewLocal) return;

    if (!auth.currentUser || !idFicha) return;

    await db.collection("fichas").doc(idFicha).update({
      foto: foto,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (dadosFichaAtual) {
      dadosFichaAtual.foto = foto;
    }

  } catch (erro) {
    console.error("Erro ao alterar foto da ficha:", erro);

    mostrarFotoFicha(dadosFichaAtual?.foto || "");
  } finally {
    campoFotoFicha.value = "";
  }
});

botaoRemoverFotoFicha.addEventListener("click", async evento => {
  evento.preventDefault();
  evento.stopPropagation();

  if (previewLocal) {
    mostrarFotoFicha("");

    if (dadosFichaAtual) {
      dadosFichaAtual.foto = "";
    }

    return;
  }

  if (!auth.currentUser || !idFicha) return;

  const fotoAnterior = dadosFichaAtual?.foto || "";

  botaoRemoverFotoFicha.disabled = true;

  try {
    await db.collection("fichas").doc(idFicha).update({
      foto: "",
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (dadosFichaAtual) {
      dadosFichaAtual.foto = "";
    }

    mostrarFotoFicha("");

  } catch (erro) {
    console.error("Erro ao remover foto da ficha:", erro);
    mostrarFotoFicha(fotoAnterior);

  } finally {
    botaoRemoverFotoFicha.disabled = false;
  }
});

async function carregarFichaAutenticada(usuario) {
  if (!usuario || !idFicha) {
    window.location.replace("index-suas-fichas.html");
    return;
  }

  let documento;

  /* Ler a ficha no Firestore */

  try {
    documento = await db.collection("fichas").doc(idFicha).get();

  } catch (erro) {
    console.error("Erro ao ler a ficha no Firestore:", erro);

    if (
      erro?.code === "permission-denied" ||
      erro?.code === "not-found"
    ) {
      window.location.replace("index-suas-fichas.html");
    }

    return;
  }

  if (!documento.exists) {
    window.location.replace("index-suas-fichas.html");
    return;
  }

  const ficha = documento.data();

  if (ficha.donoUid !== usuario.uid) {
    window.location.replace("index-suas-fichas.html");
    return;
  }

  if (ficha.estado !== "pronta") {
    window.location.replace(
      `index-criacao-de-ficha.html?ficha=${encodeURIComponent(idFicha)}`
    );
    return;
  }

  /* Montar a interface */

  try {
    preencherCabecalhoFicha(ficha);

    await preencherInformacoesFicha(ficha);
    await preencherPontosFicha(ficha);

    iniciarEscutasRolagensFicha();

    document.title =
      `${ficha.nome || "Ficha"}: A Realidade RPG`;

  } catch (erro) {
    console.error(
      "Erro ao montar a interface da ficha:",
      erro
    );
  }
}

/* Navegação das abas da ficha */

const botoesAbasFicha = [...document.querySelectorAll(".aba-ficha")];
const conteudosAbasFicha = [...document.querySelectorAll(".conteudo-aba-ficha")];
const indicadorMenuFicha = document.getElementById("indicador-menu-ficha");

function posicionarIndicadorFicha(botao, animar = true) {
  if (!botao || !indicadorMenuFicha) return;

  if (!animar) {
    indicadorMenuFicha.style.transition = "none";
  }

  indicadorMenuFicha.style.left = `${botao.offsetLeft}px`;
  indicadorMenuFicha.style.width = `${botao.offsetWidth}px`;

  if (!animar) {
    requestAnimationFrame(() => {
      indicadorMenuFicha.style.transition = "";
    });
  }
}

function abrirAbaFicha(nomeAba) {
  const botaoAtivo = botoesAbasFicha.find(botao => botao.dataset.aba === nomeAba);
  if (!botaoAtivo) return;

  botoesAbasFicha.forEach(botao => {
    const ativa = botao === botaoAtivo;
    botao.classList.toggle("ativa", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });

  conteudosAbasFicha.forEach(conteudo => {
    conteudo.classList.toggle("ativo", conteudo.id === `aba-${nomeAba}`);
  });

  posicionarIndicadorFicha(botaoAtivo);
}

botoesAbasFicha.forEach(botao => {
  botao.addEventListener("click", () => {
    abrirAbaFicha(botao.dataset.aba);
  });
});

window.addEventListener("resize", () => {
  posicionarIndicadorFicha(document.querySelector(".aba-ficha.ativa"), false);
});

requestAnimationFrame(() => {
  posicionarIndicadorFicha(document.querySelector(".aba-ficha.ativa"), false);
});

/* Ocupações da ficha */

function normalizarOcupacaoFicha(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarIdOcupacaoFicha(nome) {
  return normalizarOcupacaoFicha(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderizarOpcoesOcupacoesFicha() {
  campoOcupacao1Ficha.replaceChildren();
  campoOcupacao2Ficha.replaceChildren();

  const opcaoInicial = document.createElement("option");
  opcaoInicial.value = "";
  opcaoInicial.textContent = "Selecione uma Ocupação";
  opcaoInicial.disabled = true;

  campoOcupacao1Ficha.appendChild(opcaoInicial);

  const opcaoNenhuma = document.createElement("option");
  opcaoNenhuma.value = "";
  opcaoNenhuma.textContent = "Nenhuma";

  campoOcupacao2Ficha.appendChild(opcaoNenhuma);

  ocupacoesFichaDisponiveis.forEach(ocupacao => {
    const opcao1 = document.createElement("option");
    opcao1.value = ocupacao.id;
    opcao1.textContent = ocupacao.nome;

    const opcao2 = opcao1.cloneNode(true);

    campoOcupacao1Ficha.appendChild(opcao1);
    campoOcupacao2Ficha.appendChild(opcao2);
  });
}

async function carregarOcupacoesFichaDoSistema() {
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

    ocupacoesFichaDisponiveis = itens
      .map(item => {
        const nome = item.querySelector("b")?.textContent
          .trim()
          .replace(/:$/, "");

        if (!nome) return null;

        return {
          id: criarIdOcupacaoFicha(nome),
          nome: nome
        };
      })
      .filter(Boolean);

    renderizarOpcoesOcupacoesFicha();

    return true;

  } catch (erro) {
    console.error("Erro ao carregar Ocupações da ficha:", erro);

    campoOcupacao1Ficha.innerHTML =
      `<option value="">Não foi possível carregar</option>`;

    campoOcupacao2Ficha.innerHTML =
      `<option value="">Não foi possível carregar</option>`;

    return false;
  }
}

const promessaOcupacoesFicha = carregarOcupacoesFichaDoSistema();

/* Preencher a aba Informações */

async function preencherInformacoesFicha(ficha) {
  await promessaOcupacoesFicha;

  const ocupacoes =
    Array.isArray(ficha.ocupacoes)
      ? ficha.ocupacoes.slice(0, 2)
      : [];

  campoOcupacao1Ficha.value =
    ocupacoes[0] || "";

  campoOcupacao2Ficha.value =
    ocupacoes[1] || "";

  campoPerfilFicha.value =
    ficha.perfil || "";

  campoIdadeFicha.value =
    ficha.idade ?? "";

  campoAparenciaFicha.value =
    ficha.aparencia || "";

  campoPassadoFicha.value =
    ficha.passado || "";

  campoAnotacoesFicha.value =
    ficha.anotacoes || "";
}

/* Salvamento da aba Informações */

let filaSalvamentoInformacoes = Promise.resolve();
let versaoSalvamentoInformacoes = 0;

function obterDadosInformacoesFicha() {
  const ocupacao1 = campoOcupacao1Ficha.value;
  let ocupacao2 = campoOcupacao2Ficha.value;

  if (!ocupacao1) {
    return {
      valido: false,
      mensagem: "A primeira Ocupação não pode ficar vazia."
    };
  }

  if (ocupacao2 === ocupacao1) {
    ocupacao2 = "";
    campoOcupacao2Ficha.value = "";
  }

  const idade = Number(campoIdadeFicha.value);

  if (!Number.isInteger(idade) || idade < 0) {
    return {
      valido: false,
      mensagem: "A idade precisa ser um número inteiro igual ou maior que 0."
    };
  }

  return {
    valido: true,
    dados: {
      perfil: campoPerfilFicha.value,
      ocupacoes: ocupacao2
        ? [ocupacao1, ocupacao2]
        : [ocupacao1],
      idade: idade,
      aparencia: campoAparenciaFicha.value,
      passado: campoPassadoFicha.value,
      anotacoes: campoAnotacoesFicha.value
    }
  };
}

function atualizarDadosLocaisInformacoes(dados) {
  if (!dadosFichaAtual) return;

  dadosFichaAtual.perfil = dados.perfil;
  dadosFichaAtual.ocupacoes = [...dados.ocupacoes];
  dadosFichaAtual.idade = dados.idade;
  dadosFichaAtual.aparencia = dados.aparencia;
  dadosFichaAtual.passado = dados.passado;
  dadosFichaAtual.anotacoes = dados.anotacoes;
}

function salvarInformacoesFicha() {
  const resultado = obterDadosInformacoesFicha();

  if (!resultado.valido) {
    console.warn(resultado.mensagem);

    if (dadosFichaAtual) {
      preencherInformacoesFicha(dadosFichaAtual);
    }

    return;
  }

  const dados = resultado.dados;
  const versao = ++versaoSalvamentoInformacoes;

  if (previewLocal) {
    atualizarDadosLocaisInformacoes(dados);
    return;
  }

  if (!auth.currentUser || !idFicha || !dadosFichaAtual) return;

  const uidUsuario = auth.currentUser.uid;

  filaSalvamentoInformacoes = filaSalvamentoInformacoes
    .catch(() => {})
    .then(async () => {
      try {
        if (auth.currentUser?.uid !== uidUsuario) return;

        await db.collection("fichas").doc(idFicha).update({
          perfil: dados.perfil,
          ocupacoes: [...dados.ocupacoes],
          idade: dados.idade,
          aparencia: dados.aparencia,
          passado: dados.passado,
          anotacoes: dados.anotacoes,
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });

        atualizarDadosLocaisInformacoes(dados);

      } catch (erro) {
        console.error("Erro ao salvar Informações da ficha:", erro);

        if (
          versao === versaoSalvamentoInformacoes &&
          dadosFichaAtual
        ) {
          await preencherInformacoesFicha(dadosFichaAtual);
        }
      }
    });
}

/* Alterações dos campos de Informações */

campoOcupacao1Ficha.addEventListener("change", () => {
  if (
    campoOcupacao2Ficha.value &&
    campoOcupacao2Ficha.value === campoOcupacao1Ficha.value
  ) {
    campoOcupacao2Ficha.value = "";
  }

  salvarInformacoesFicha();
});

campoOcupacao2Ficha.addEventListener("change", () => {
  if (
    campoOcupacao2Ficha.value &&
    campoOcupacao2Ficha.value === campoOcupacao1Ficha.value
  ) {
    campoOcupacao2Ficha.value = "";
  }

  salvarInformacoesFicha();
});

campoPerfilFicha.addEventListener("change", salvarInformacoesFicha);
campoIdadeFicha.addEventListener("change", salvarInformacoesFicha);
campoAparenciaFicha.addEventListener("change", salvarInformacoesFicha);
campoPassadoFicha.addEventListener("change", salvarInformacoesFicha);
campoAnotacoesFicha.addEventListener("change", salvarInformacoesFicha);

/* Dados para o Live Preview */

if (previewLocal) {
  const fichaPreview = {
    nome: "Nome do Personagem",
    foto: "",
    perfil: "proativo",
    ocupacoes: [],
    idade: 24,
    aparencia: "Descrição da aparência do personagem.",
    passado: "História e passado do personagem.",
    anotacoes: ""
  };

  preencherCabecalhoFicha(fichaPreview);
  preencherInformacoesFicha(fichaPreview);
}

/* Menu responsivo de Pontos de Ficha */

const botoesAreasPontos = [
  ...document.querySelectorAll(".botao-area-pontos")
];

const paineisAreasPontos = [
  ...document.querySelectorAll("[data-painel-pontos]")
];

function abrirAreaPontosFicha(area) {
  botoesAreasPontos.forEach(botao => {
    botao.classList.toggle(
      "ativa",
      botao.dataset.areaPontos === area
    );
  });

  paineisAreasPontos.forEach(painel => {
    painel.classList.toggle(
      "area-pontos-ativa",
      painel.dataset.painelPontos === area
    );
  });
}

botoesAreasPontos.forEach(botao => {
  botao.addEventListener("click", () => {
    abrirAreaPontosFicha(
      botao.dataset.areaPontos
    );
  });
});

/* Pontos de Ficha */

const campoNcpFicha = document.getElementById("ncp-ficha");
const campoNeoFicha = document.getElementById("neo-ficha");
const campoCreditoFicha = document.getElementById("credito-ficha");
const contadorAtributosFicha = document.getElementById("contador-atributos-ficha");

const campoFisicoFicha = document.getElementById("fisico-ficha");
const campoCognicaoFicha = document.getElementById("cognicao-ficha");
const campoPresencaFicha = document.getElementById("presenca-ficha");
const campoDeslocamentoMetrosFicha = document.getElementById("deslocamento-metros-ficha");
const campoDeslocamentoQuadradosFicha = document.getElementById("deslocamento-quadrados-ficha");

const campoPvAtualFicha = document.getElementById("pv-atual-ficha");
const campoPvMaximoFicha = document.getElementById("pv-maximo-ficha");
const campoPdAtualFicha = document.getElementById("pd-atual-ficha");
const campoPdMaximoFicha = document.getElementById("pd-maximo-ficha");

const preenchimentoPvFicha = document.querySelector(".barra-pv .preenchimento-recurso");
const preenchimentoPdFicha = document.querySelector(".barra-pd .preenchimento-recurso");

const listaPericiasFicha = document.getElementById("lista-pericias-ficha");

const tipoRolagemFicha = document.getElementById("tipo-rolagem-ficha");
const areaRolagemPericiaFicha = document.getElementById("rolagem-pericia-ficha");
const areaRolagemOutroFicha = document.getElementById("rolagem-outro-ficha");
const pesquisaPericiaRolagem = document.getElementById("pesquisa-pericia-rolagem");
const quantidadeD20Ficha = document.getElementById("quantidade-d20-ficha");
const valorTestePericia = document.getElementById("valor-teste-pericia");

const botaoRolarFicha = document.getElementById("rolar-ficha");
const botaoSalvarRolagemFicha = document.getElementById("salvar-rolagem-ficha");

const dadosResultadoFicha = document.querySelector(".dados-resultado-ficha");
const resultadoSucessoFicha = document.querySelector(".resultado-sucesso-ficha");

const listaHistoricoRolagensFicha = document.getElementById("lista-historico-rolagens-ficha");
const listaRolagensSalvasFicha = document.getElementById("lista-rolagens-salvas-ficha");

let periciasPontosFicha = [];
let estadoPericiasFicha = {};

let estadoAtributosFicha = {
  fisico: 1,
  cognicao: 1,
  presenca: 2,
  deslocamentoMetros: 9,
  deslocamentoQuadrados: 6
};

let estadoPvFicha = {
  atual: 0,
  maximo: 0,
  manual: false
};

let estadoPdFicha = {
  atual: 0,
  maximo: 0,
  manual: false
};

let periciaSelecionadaRolagemId = null;
let ultimaRolagemFicha = null;

let filaSalvamentoPontos = Promise.resolve();

let cancelarEscutaHistoricoRolagens = null;
let cancelarEscutaRolagensSalvas = null;


/* Utilidades */

function normalizarTextoPontosFicha(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarIdPericiaPontosFicha(nome) {
  return normalizarTextoPontosFicha(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizarAtributoPericiaFicha(nome) {
  const atributo = normalizarTextoPontosFicha(nome);

  if (atributo.includes("fisico")) return "fisico";
  if (atributo.includes("presenca")) return "presenca";

  return "cognicao";
}

function siglaAtributoPericiaFicha(atributo) {
  if (atributo === "fisico") return "(FIS)";
  if (atributo === "presenca") return "(PRE)";

  return "(COG)";
}

function proximoAtributoPericiaFicha(atributo) {
  if (atributo === "fisico") return "cognicao";
  if (atributo === "cognicao") return "presenca";

  return "fisico";
}

function classeSiglaAtributoFicha(atributo) {
  if (atributo === "fisico") return "atributo-fisico-sigla";
  if (atributo === "presenca") return "atributo-presenca-sigla";

  return "atributo-cognicao-sigla";
}


/* Perícias do Sistema */

async function carregarPericiasPontosFicha() {
  try {
    const resposta = await fetch("index-sistema.html");

    if (!resposta.ok) {
      throw new Error("Não foi possível abrir index-sistema.html.");
    }

    const html = await resposta.text();
    const documento = new DOMParser().parseFromString(html, "text/html");

    const itens = [
      ...documento.querySelectorAll("#lista-pericias > li")
    ];

    periciasPontosFicha = itens
      .map(item => {
        const nome = item.querySelector("b")?.textContent
          .trim()
          .replace(/:$/, "");

        const texto = item.textContent
          .replace(/\s+/g, " ")
          .trim();

        const atributo = texto.match(
          /Atributo:\s*(Físico|Cognição|Presença)/i
        )?.[1];

        if (!nome || !atributo) return null;

        return {
          id: criarIdPericiaPontosFicha(nome),
          nome: nome,
          atributoPadrao: normalizarAtributoPericiaFicha(atributo)
        };
      })
      .filter(Boolean);

    preencherDatalistPericiasRolagem();

    return true;

  } catch (erro) {
    console.error("Erro ao carregar Perícias da ficha:", erro);

    listaPericiasFicha.innerHTML =
      "<p>Não foi possível carregar as Perícias.</p>";

    return false;
  }
}

const promessaPericiasPontosFicha =
  carregarPericiasPontosFicha();


/* Valores das Perícias */

function obterValorPericiaFicha(id) {
  return estadoPericiasFicha[id]?.valor ?? 4;
}

function obterValorPericiaFichaPorNome(nome) {
  return obterValorPericiaFicha(
    criarIdPericiaPontosFicha(nome)
  );
}

function obterValorAtributoFicha(atributo) {
  return Number(
    estadoAtributosFicha[atributo]
  ) || 0;
}


/* PV e PD */

function calcularPvFicha() {
  return Math.floor(
    15 +
    obterValorAtributoFicha("fisico") +
    obterValorPericiaFichaPorNome("Fortitude") / 3 +
    obterValorPericiaFichaPorNome("Atletismo") / 4
  );
}

function calcularPdFicha() {
  return Math.floor(
    20 +
    obterValorAtributoFicha("presenca") +
    obterValorPericiaFichaPorNome("Vontade") / 2
  );
}

function atualizarBarraRecursoFicha(
  estado,
  preenchimento
) {
  const porcentagem =
    estado.maximo > 0
      ? Math.max(
          0,
          Math.min(
            100,
            estado.atual / estado.maximo * 100
          )
        )
      : 0;

  preenchimento.style.width =
    `${porcentagem}%`;
}

function renderizarPvPdFicha() {
  campoPvAtualFicha.value =
    estadoPvFicha.atual;

  campoPvMaximoFicha.value =
    estadoPvFicha.maximo;

  campoPdAtualFicha.value =
    estadoPdFicha.atual;

  campoPdMaximoFicha.value =
    estadoPdFicha.maximo;

  atualizarBarraRecursoFicha(
    estadoPvFicha,
    preenchimentoPvFicha
  );

  atualizarBarraRecursoFicha(
    estadoPdFicha,
    preenchimentoPdFicha
  );
}

function recalcularRecursosAutomaticos(
  alteracoes = null
) {
  if (!estadoPvFicha.manual) {
    const maximo = calcularPvFicha();

    estadoPvFicha = {
      atual: maximo,
      maximo: maximo,
      manual: false
    };

    if (alteracoes) {
      alteracoes.pv = {
        ...estadoPvFicha
      };
    }
  }

  if (!estadoPdFicha.manual) {
    const maximo = calcularPdFicha();

    estadoPdFicha = {
      atual: maximo,
      maximo: maximo,
      manual: false
    };

    if (alteracoes) {
      alteracoes.pd = {
        ...estadoPdFicha
      };
    }
  }

  renderizarPvPdFicha();
}


/* Contador de Atributos */

function atualizarContadorAtributosFicha() {
  const total =
    obterValorAtributoFicha("fisico") +
    obterValorAtributoFicha("cognicao") +
    obterValorAtributoFicha("presenca");

  contadorAtributosFicha.textContent =
    `${total}/4`;
}


/* Salvamento */

function salvarAtualizacaoPontosFicha(
  alteracoes
) {
  if (previewLocal) {
    return Promise.resolve();
  }

  if (
    !auth.currentUser ||
    !idFicha
  ) {
    return Promise.resolve();
  }

  const uid =
    auth.currentUser.uid;

  filaSalvamentoPontos =
    filaSalvamentoPontos
      .catch(() => {})
      .then(async () => {
        if (
          auth.currentUser?.uid !== uid
        ) return;

        await db
          .collection("fichas")
          .doc(idFicha)
          .update({
            ...alteracoes,

            atualizadoEm:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          });
      })
      .catch(erro => {
        console.error(
          "Erro ao salvar Pontos de Ficha:",
          erro
        );
      });

  return filaSalvamentoPontos;
}


/* Renderizar Perícias */

function renderizarPericiasPontosFicha() {
  if (!periciasPontosFicha.length) return;

  const fragmento =
    document.createDocumentFragment();

  periciasPontosFicha.forEach(pericia => {
    const dados =
      estadoPericiasFicha[pericia.id];

    if (!dados) return;

    const linha =
      document.createElement("div");

    linha.className =
      "linha-pericia-ficha";

    if (dados.bonusNatural > 0) {
      linha.classList.add(
        "pericia-natural-ficha"
      );
    }

    const nomeEAtributo =
      document.createElement("div");

    nomeEAtributo.className =
      "nome-e-atributo-pericia";

    const nome =
      document.createElement("strong");

    nome.textContent =
      pericia.nome;

    const sigla =
      document.createElement("button");

    sigla.type = "button";

    sigla.className =
      `sigla-atributo-pericia ${classeSiglaAtributoFicha(dados.atributoBase)}`;

    sigla.textContent =
      siglaAtributoPericiaFicha(
        dados.atributoBase
      );

    sigla.title =
      "Clique para alterar o Atributo base";

    sigla.addEventListener(
      "click",
      () => {
        const novoAtributo =
          proximoAtributoPericiaFicha(
            dados.atributoBase
          );

        dados.atributoBase =
          novoAtributo;

        if (
          dadosFichaAtual
            ?.pericias
            ?.[pericia.id]
        ) {
          dadosFichaAtual
            .pericias[pericia.id]
            .atributoBase =
              novoAtributo;
        }

        salvarAtualizacaoPontosFicha({
          [`pericias.${pericia.id}.atributoBase`]:
            novoAtributo
        });

        if (
          periciaSelecionadaRolagemId ===
          pericia.id
        ) {
          atualizarParametrosRolagemPericia(
            pericia.id
          );
        }

        renderizarPericiasPontosFicha();
      }
    );

    nomeEAtributo.append(
      nome,
      sigla
    );

    const grupoValores =
      document.createElement("div");

    grupoValores.className =
      "valores-pericia-ficha";

    if (dados.bonusNatural > 0) {
      const bonus =
        document.createElement("span");

      bonus.className =
        "bonus-natural-ficha";

      bonus.textContent =
        `+${dados.bonusNatural}`;

      grupoValores.appendChild(
        bonus
      );
    }

    const inputNormal =
      document.createElement("input");

    inputNormal.type = "number";
    inputNormal.min = "0";
    inputNormal.max = "99";
    inputNormal.step = "1";
    inputNormal.value = dados.valor;

    const bom =
      document.createElement("span");

    bom.className =
      "valor-bom-ficha";

    bom.textContent =
      Math.floor(dados.valor / 2);

    const extremo =
      document.createElement("span");

    extremo.className =
      "valor-extremo-ficha";

    extremo.textContent =
      Math.floor(dados.valor / 5);

    inputNormal.addEventListener(
      "change",
      () => {
        const novoValor =
          Number(inputNormal.value);

        if (
          !Number.isInteger(novoValor) ||
          novoValor < 0 ||
          novoValor > 99
        ) {
          inputNormal.value =
            dados.valor;

          return;
        }

        dados.valor =
          novoValor;

        if (dadosFichaAtual) {
          dadosFichaAtual.pericias ||= {};

          dadosFichaAtual
            .pericias[pericia.id] ||= {};

          dadosFichaAtual
            .pericias[pericia.id]
            .valorAtual =
              novoValor;
        }

        const alteracoes = {
          [`pericias.${pericia.id}.valorAtual`]:
            novoValor
        };

        recalcularRecursosAutomaticos(
          alteracoes
        );

        salvarAtualizacaoPontosFicha(
          alteracoes
        );

        if (
          periciaSelecionadaRolagemId ===
          pericia.id
        ) {
          valorTestePericia.value =
            novoValor;
        }

        renderizarPericiasPontosFicha();
      }
    );

    grupoValores.append(
      inputNormal,
      bom,
      extremo
    );

    linha.append(
      nomeEAtributo,
      grupoValores
    );

    fragmento.appendChild(
      linha
    );
  });

  listaPericiasFicha.replaceChildren(
    fragmento
  );
}


/* Preencher Pontos de Ficha */

async function preencherPontosFicha(ficha) {
  verificarElementosPontosFicha();
  await promessaPericiasPontosFicha;

  campoNcpFicha.value =
    String(
      Number.isInteger(ficha.ncp)
        ? ficha.ncp
        : 0
    );

  campoNeoFicha.value =
    String(
      Number.isInteger(ficha.neo)
        ? ficha.neo
        : 0
    );

  campoCreditoFicha.value =
    Number.isFinite(Number(ficha.credito))
      ? Number(ficha.credito)
      : 0;

  const atributos =
    ficha.atributos || {};

  estadoAtributosFicha = {
    fisico:
      Number.isInteger(atributos.fisico)
        ? atributos.fisico
        : 1,

    cognicao:
      Number.isInteger(atributos.cognicao)
        ? atributos.cognicao
        : 1,

    presenca:
      Number.isInteger(atributos.presenca)
        ? atributos.presenca
        : 2,

    deslocamentoMetros:
      Number.isFinite(
        Number(
          atributos.deslocamentoMetros
        )
      )
        ? Number(
            atributos.deslocamentoMetros
          )
        : 9,

    deslocamentoQuadrados:
      Number.isFinite(
        Number(
          atributos.deslocamentoQuadrados
        )
      )
        ? Number(
            atributos.deslocamentoQuadrados
          )
        : 6
  };

  campoFisicoFicha.value =
    estadoAtributosFicha.fisico;

  campoCognicaoFicha.value =
    estadoAtributosFicha.cognicao;

  campoPresencaFicha.value =
    estadoAtributosFicha.presenca;

  campoDeslocamentoMetrosFicha.value =
    estadoAtributosFicha
      .deslocamentoMetros;

  campoDeslocamentoQuadradosFicha.value =
    estadoAtributosFicha
      .deslocamentoQuadrados;

  atualizarContadorAtributosFicha();

  const periciasSalvas =
    ficha.pericias || {};

  estadoPericiasFicha = {};

  periciasPontosFicha.forEach(
    pericia => {
      const salva =
        periciasSalvas[pericia.id] || {};

      const valorDistribuido =
        Number(
          salva.valorDistribuido
        );

      const bonusNatural =
        Number(
          salva.bonusNatural
        ) || 0;

      const valorCriacao =
        Number.isFinite(
          valorDistribuido
        )
          ? valorDistribuido +
            bonusNatural
          : 4;

      const atributoBase =
        [
          "fisico",
          "cognicao",
          "presenca"
        ].includes(
          salva.atributoBase
        )
          ? salva.atributoBase
          : pericia.atributoPadrao;

      estadoPericiasFicha[
        pericia.id
      ] = {
        valor:
          Number.isInteger(
            salva.valorAtual
          )
            ? salva.valorAtual
            : valorCriacao,

        bonusNatural:
          bonusNatural,

        atributoBase:
          atributoBase
      };
    }
  );

  renderizarPericiasPontosFicha();
  preencherDatalistPericiasRolagem();

  if (ficha.pv && typeof ficha.pv === "object" && ficha.pv.manual === true) {
    estadoPvFicha = {
      atual: Number(ficha.pv.atual) || 0,

      maximo: Number(ficha.pv.maximo) || 0,

      manual: true
    };

  } else {
    const maximo = calcularPvFicha();

    estadoPvFicha = {
      atual: maximo,
      maximo: maximo,
      manual: false
    };
  }

  if (ficha.pd && typeof ficha.pd === "object" && ficha.pd.manual === true) {
    estadoPdFicha = {
      atual: Number(ficha.pd.atual) || 0,

      maximo: Number(ficha.pd.maximo) || 0,

      manual: true
    };

  } else {
    const maximo = calcularPdFicha();

    estadoPdFicha = {
      atual: maximo,
      maximo: maximo,
      manual: false
    };
  }

  renderizarPvPdFicha();
  inicializarAreaRolagensFicha();
}

/* Alterações de NCP, NEO e Crédito */

campoNcpFicha.addEventListener(
  "change",
  () => {
    const ncp =
      Number(campoNcpFicha.value);

    if (
      !Number.isInteger(ncp) ||
      ncp < 0 ||
      ncp > 5
    ) return;

    if (dadosFichaAtual) {
      dadosFichaAtual.ncp = ncp;
    }

    salvarAtualizacaoPontosFicha({
      ncp: ncp
    });
  }
);

campoNeoFicha.addEventListener(
  "change",
  () => {
    const neo =
      Number(campoNeoFicha.value);

    if (
      !Number.isInteger(neo) ||
      neo < 0 ||
      neo > 10
    ) return;

    if (dadosFichaAtual) {
      dadosFichaAtual.neo = neo;
    }

    salvarAtualizacaoPontosFicha({
      neo: neo
    });
  }
);

campoCreditoFicha.addEventListener(
  "change",
  () => {
    const credito =
      Number(
        campoCreditoFicha.value
      );

    if (!Number.isFinite(credito)) {
      campoCreditoFicha.value =
        Number(
          dadosFichaAtual?.credito
        ) || 0;

      return;
    }

    if (dadosFichaAtual) {
      dadosFichaAtual.credito =
        credito;
    }

    salvarAtualizacaoPontosFicha({
      credito: credito
    });
  }
);


/* Alterações dos Atributos */

function configurarCampoAtributoFicha(
  campo,
  chave
) {
  campo.addEventListener(
    "change",
    () => {
      const valor =
        Number(campo.value);

      if (
        !Number.isInteger(valor) ||
        valor < 0 ||
        valor > 9
      ) {
        campo.value =
          estadoAtributosFicha[
            chave
          ];

        return;
      }

      estadoAtributosFicha[
        chave
      ] = valor;

      if (
        dadosFichaAtual
          ?.atributos
      ) {
        dadosFichaAtual
          .atributos[chave] =
            valor;
      }

      atualizarContadorAtributosFicha();

      const alteracoes = {
        [`atributos.${chave}`]:
          valor
      };

      recalcularRecursosAutomaticos(
        alteracoes
      );

      salvarAtualizacaoPontosFicha(
        alteracoes
      );

      if (
        periciaSelecionadaRolagemId
      ) {
        atualizarParametrosRolagemPericia(
          periciaSelecionadaRolagemId
        );
      }
    }
  );
}

configurarCampoAtributoFicha(
  campoFisicoFicha,
  "fisico"
);

configurarCampoAtributoFicha(
  campoCognicaoFicha,
  "cognicao"
);

configurarCampoAtributoFicha(
  campoPresencaFicha,
  "presenca"
);


/* Deslocamento */

function configurarDeslocamentoFicha(
  campo,
  chave
) {
  campo.addEventListener(
    "change",
    () => {
      const valor =
        Number(campo.value);

      if (
        !Number.isFinite(valor) ||
        valor < 0
      ) {
        campo.value =
          estadoAtributosFicha[
            chave
          ];

        return;
      }

      estadoAtributosFicha[
        chave
      ] = valor;

      if (
        dadosFichaAtual
          ?.atributos
      ) {
        dadosFichaAtual
          .atributos[chave] =
            valor;
      }

      salvarAtualizacaoPontosFicha({
        [`atributos.${chave}`]:
          valor
      });
    }
  );
}

configurarDeslocamentoFicha(
  campoDeslocamentoMetrosFicha,
  "deslocamentoMetros"
);

configurarDeslocamentoFicha(
  campoDeslocamentoQuadradosFicha,
  "deslocamentoQuadrados"
);


/* PV e PD manuais */

function salvarRecursoManualFicha(
  tipo
) {
  const ehPv =
    tipo === "pv";

  const campoAtual =
    ehPv
      ? campoPvAtualFicha
      : campoPdAtualFicha;

  const campoMaximo =
    ehPv
      ? campoPvMaximoFicha
      : campoPdMaximoFicha;

  const atual =
    Number(campoAtual.value);

  const maximo =
    Number(campoMaximo.value);

  if (
    !Number.isInteger(atual) ||
    atual < 0 ||
    !Number.isInteger(maximo) ||
    maximo < 0
  ) {
    renderizarPvPdFicha();
    return;
  }

  const novoEstado = {
    atual: atual,
    maximo: maximo,
    manual: true
  };

  if (ehPv) {
    estadoPvFicha =
      novoEstado;

    if (dadosFichaAtual) {
      dadosFichaAtual.pv = {
        ...novoEstado
      };
    }

  } else {
    estadoPdFicha =
      novoEstado;

    if (dadosFichaAtual) {
      dadosFichaAtual.pd = {
        ...novoEstado
      };
    }
  }

  renderizarPvPdFicha();

  salvarAtualizacaoPontosFicha({
    [tipo]: novoEstado
  });
}

campoPvAtualFicha.addEventListener(
  "change",
  () => salvarRecursoManualFicha("pv")
);

campoPvMaximoFicha.addEventListener(
  "change",
  () => salvarRecursoManualFicha("pv")
);

campoPdAtualFicha.addEventListener(
  "change",
  () => salvarRecursoManualFicha("pd")
);

campoPdMaximoFicha.addEventListener(
  "change",
  () => salvarRecursoManualFicha("pd")
);

/* Rolagens */

function preencherDatalistPericiasRolagem() {
  if (!pesquisaPericiaRolagem) return;

  let datalist =
    document.getElementById(
      "datalist-pericias-rolagem-ficha"
    );

  if (!datalist) {
    datalist =
      document.createElement(
        "datalist"
      );

    datalist.id =
      "datalist-pericias-rolagem-ficha";

    document.body.appendChild(
      datalist
    );
  }

  datalist.replaceChildren();

  periciasPontosFicha.forEach(
    pericia => {
      const opcao =
        document.createElement(
          "option"
        );

      opcao.value =
        pericia.nome;

      datalist.appendChild(
        opcao
      );
    }
  );

  pesquisaPericiaRolagem
    .setAttribute(
      "list",
      datalist.id
    );
}

function buscarPericiaRolagemPorTexto(
  texto
) {
  const busca =
    normalizarTextoPontosFicha(
      texto
    );

  return (
    periciasPontosFicha.find(
      pericia =>
        normalizarTextoPontosFicha(
          pericia.nome
        ) === busca
    ) || null
  );
}

function atualizarParametrosRolagemPericia(
  id
) {
  const pericia =
    periciasPontosFicha.find(
      item => item.id === id
    );

  const dados =
    estadoPericiasFicha[id];

  if (!pericia || !dados) return;

  periciaSelecionadaRolagemId =
    id;

  pesquisaPericiaRolagem.value =
    pericia.nome;

  quantidadeD20Ficha.value =
    obterValorAtributoFicha(
      dados.atributoBase
    );

  valorTestePericia.value =
    dados.valor;
}

pesquisaPericiaRolagem.addEventListener(
  "input",
  () => {
    const pericia =
      buscarPericiaRolagemPorTexto(
        pesquisaPericiaRolagem.value
      );

    if (!pericia) {
      periciaSelecionadaRolagemId =
        null;

      return;
    }

    atualizarParametrosRolagemPericia(
      pericia.id
    );
  }
);


/* Dados personalizados */

function criarLinhaDadoOutroFicha(
  configuracao = {
    quantidade: 1,
    lados: 20
  },
  principal = false
) {
  const linha =
    document.createElement("div");

  linha.className =
    "linha-dado-personalizado";

  const quantidade =
    document.createElement("input");

  quantidade.type = "number";
  quantidade.min = "1";
  quantidade.max = "99";
  quantidade.step = "1";
  quantidade.value =
    configuracao.quantidade;

  const dado =
    document.createElement("select");

  [
    4,
    6,
    8,
    10,
    12,
    20,
    100
  ].forEach(lados => {
    const opcao =
      document.createElement(
        "option"
      );

    opcao.value =
      String(lados);

    opcao.textContent =
      `d${lados}`;

    opcao.selected =
      lados ===
      Number(
        configuracao.lados
      );

    dado.appendChild(opcao);
  });

  const botao =
    document.createElement("button");

  botao.type = "button";

  botao.className =
    principal
      ? "adicionar-dado-rolagem"
      : "remover-dado-rolagem";

  botao.textContent =
    principal ? "+" : "×";

  if (principal) {
    botao.addEventListener(
      "click",
      () => {
        areaRolagemOutroFicha
          .appendChild(
            criarLinhaDadoOutroFicha(
              {
                quantidade: 1,
                lados: 20
              },
              false
            )
          );
      }
    );

  } else {
    botao.addEventListener(
      "click",
      () => linha.remove()
    );
  }

  linha.append(
    quantidade,
    dado,
    botao
  );

  return linha;
}

function renderizarConfiguracaoOutroFicha(
  configuracoes = [
    {
      quantidade: 1,
      lados: 20
    }
  ]
) {
  areaRolagemOutroFicha
    .replaceChildren();

  configuracoes.forEach(
    (configuracao, indice) => {
      areaRolagemOutroFicha
        .appendChild(
          criarLinhaDadoOutroFicha(
            configuracao,
            indice === 0
          )
        );
    }
  );
}

function obterConfiguracaoOutroFicha() {
  const linhas = [
    ...areaRolagemOutroFicha
      .querySelectorAll(
        ".linha-dado-personalizado"
      )
  ];

  const configuracoes = [];

  for (const linha of linhas) {
    const quantidade =
      Number(
        linha.querySelector(
          "input"
        )?.value
      );

    const lados =
      Number(
        linha.querySelector(
          "select"
        )?.value
      );

    if (
      !Number.isInteger(
        quantidade
      ) ||
      quantidade < 1 ||
      quantidade > 99 ||
      ![
        4,
        6,
        8,
        10,
        12,
        20,
        100
      ].includes(lados)
    ) {
      return null;
    }

    configuracoes.push({
      quantidade: quantidade,
      lados: lados
    });
  }

  return configuracoes;
}


/* Troca do tipo de teste */

function limparResultadoRolagemFicha() {
  dadosResultadoFicha
    .replaceChildren();

  resultadoSucessoFicha
    .textContent = "";

  resultadoSucessoFicha
    .className =
      "resultado-sucesso-ficha";

  resultadoSucessoFicha.hidden =
    true;

  botaoSalvarRolagemFicha.hidden =
    true;

  ultimaRolagemFicha = null;
}

function alternarTipoRolagemFicha() {
  const pericia =
    tipoRolagemFicha.value ===
    "pericia";

  areaRolagemPericiaFicha.hidden =
    !pericia;

  areaRolagemOutroFicha.hidden =
    pericia;

  limparResultadoRolagemFicha();
}

function inicializarAreaRolagensFicha() {
  renderizarConfiguracaoOutroFicha();

  listaHistoricoRolagensFicha
    .replaceChildren();

  listaRolagensSalvasFicha
    .replaceChildren();

  limparResultadoRolagemFicha();
  alternarTipoRolagemFicha();
}

tipoRolagemFicha.addEventListener(
  "change",
  alternarTipoRolagemFicha
);


/* Resultado dos dados */

function rolarDadoFicha(lados) {
  return (
    Math.floor(
      Math.random() * lados
    ) + 1
  );
}

function categoriaIndividualPericiaFicha(
  resultado,
  valor
) {
  if (resultado === 20) {
    return "desastre";
  }

  if (
    resultado <=
    Math.floor(valor / 5)
  ) {
    return "extremo";
  }

  if (
    resultado <=
    Math.floor(valor / 2)
  ) {
    return "bom";
  }

  if (resultado <= valor) {
    return "normal";
  }

  return "fracasso";
}

function categoriaFinalPericiaFicha(
  resultados,
  valor
) {
  if (
    resultados.length >= 2 &&
    resultados.every(
      resultado =>
        resultado === 20
    )
  ) {
    return "desastre-maximo";
  }

  const limiteExtremo =
    Math.floor(valor / 5);

  if (
    resultados.length >= 2 &&
    limiteExtremo > 0 &&
    resultados.every(
      resultado =>
        resultado <=
        limiteExtremo
    )
  ) {
    return "extremo-maximo";
  }

  return categoriaIndividualPericiaFicha(
    Math.min(...resultados),
    valor
  );
}

function nomeCategoriaRolagemFicha(
  categoria
) {
  const nomes = {
    "desastre-maximo":
      "Desastre Máximo",

    desastre:
      "Desastre",

    fracasso:
      "Fracasso",

    normal:
      "Normal",

    bom:
      "Bom",

    extremo:
      "Extremo",

    "extremo-maximo":
      "Extremo Máximo"
  };

  return (
    nomes[categoria] ||
    categoria
  );
}

function criarResultadoDadoFicha(
  valor,
  categoria = ""
) {
  const dado =
    document.createElement("span");

  dado.className =
    "dado-resultado";

  dado.textContent =
    valor;

  if (categoria) {
    dado.classList.add(
      `resultado-${categoria}`
    );
  }

  return dado;
}

function renderizarResultadoPericiaFicha(
  resultados,
  valor,
  categoriaFinal
) {
  dadosResultadoFicha
    .replaceChildren();

  resultados.forEach(
    resultado => {
      dadosResultadoFicha
        .appendChild(
          criarResultadoDadoFicha(
            resultado,
            categoriaIndividualPericiaFicha(
              resultado,
              valor
            )
          )
        );
    }
  );

  const menor =
    Math.min(...resultados);

  resultadoSucessoFicha.hidden =
    false;

  resultadoSucessoFicha.className =
    `resultado-sucesso-ficha resultado-${categoriaFinal}`;

  resultadoSucessoFicha.textContent =
    `${menor} - ${nomeCategoriaRolagemFicha(categoriaFinal)}`;
}

function renderizarResultadoOutroFicha(
  resultados,
  soma
) {
  dadosResultadoFicha
    .replaceChildren();

  resultados.forEach(
    resultado => {
      const dado =
        criarResultadoDadoFicha(
          resultado.valor
        );

      dado.title =
        `d${resultado.lados}`;

      dadosResultadoFicha
        .appendChild(dado);
    }
  );

  resultadoSucessoFicha.hidden =
    false;

  resultadoSucessoFicha.className =
    "resultado-sucesso-ficha resultado-soma";

  resultadoSucessoFicha.textContent =
    `Soma: ${soma}`;
}

/* Histórico */

async function registrarRolagemHistoricoFicha(
  dados
) {
  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) return;

  try {
    await db
      .collection("fichas")
      .doc(idFicha)
      .collection(
        "historicoRolagens"
      )
      .add({
        ...dados,

        criadoPorUid:
          auth.currentUser.uid,

        criadoEm:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

  } catch (erro) {
    console.error(
      "Erro ao registrar rolagem:",
      erro
    );
  }
}


/* Teste de Perícia */

async function executarRolagemPericiaFicha() {
  const pericia =
    periciasPontosFicha.find(
      item =>
        item.id ===
        periciaSelecionadaRolagemId
    );

  const quantidade =
    Number(
      quantidadeD20Ficha.value
    );

  const valor =
    Number(
      valorTestePericia.value
    );

  if (!pericia) {
    alert(
      "Selecione uma Perícia válida."
    );

    return;
  }

  if (
    !Number.isInteger(
      quantidade
    ) ||
    quantidade < 1 ||
    quantidade > 99
  ) {
    alert(
      "A quantidade de dados deve ser um número inteiro entre 1 e 99."
    );

    return;
  }

  if (
    !Number.isInteger(valor) ||
    valor < 0 ||
    valor > 99
  ) {
    alert(
      "O valor da Perícia deve ser um número inteiro entre 0 e 99."
    );

    return;
  }

  const resultados =
    Array.from(
      {
        length: quantidade
      },
      () => rolarDadoFicha(20)
    );

  const categoriaFinal =
    categoriaFinalPericiaFicha(
      resultados,
      valor
    );

  renderizarResultadoPericiaFicha(
    resultados,
    valor,
    categoriaFinal
  );

  ultimaRolagemFicha = {
    tipo: "pericia",
    periciaId: pericia.id,
    periciaNome: pericia.nome,
    quantidadeDados: quantidade,
    valor: valor
  };

  botaoSalvarRolagemFicha.hidden =
    false;

  await registrarRolagemHistoricoFicha({
    tipo: "pericia",
    nomeTeste: pericia.nome,
    periciaId: pericia.id,
    quantidadeDados: quantidade,
    valor: valor,
    resultados: resultados,
    resultadoValor:
      Math.min(...resultados),
    resultadoCategoria:
      categoriaFinal
  });
}


/* Outro teste */

async function executarRolagemOutroFicha() {
  const configuracoes =
    obterConfiguracaoOutroFicha();

  if (
    !configuracoes ||
    configuracoes.length === 0
  ) {
    alert(
      "Configure pelo menos um dado válido."
    );

    return;
  }

  const resultados = [];

  configuracoes.forEach(
    configuracao => {
      for (
        let i = 0;
        i < configuracao.quantidade;
        i++
      ) {
        resultados.push({
          lados:
            configuracao.lados,

          valor:
            rolarDadoFicha(
              configuracao.lados
            )
        });
      }
    }
  );

  const soma =
    resultados.reduce(
      (
        total,
        resultado
      ) =>
        total +
        resultado.valor,
      0
    );

  renderizarResultadoOutroFicha(
    resultados,
    soma
  );

  ultimaRolagemFicha = {
    tipo: "outro",

    dados:
      configuracoes.map(
        configuracao => ({
          ...configuracao
        })
      )
  };

  botaoSalvarRolagemFicha.hidden =
    false;

  await registrarRolagemHistoricoFicha({
    tipo: "outro",
    nomeTeste: "Outro teste",
    dados: configuracoes,
    resultados: resultados,
    soma: soma
  });
}


botaoRolarFicha.addEventListener(
  "click",
  () => {
    if (
      tipoRolagemFicha.value ===
      "pericia"
    ) {
      executarRolagemPericiaFicha();

    } else {
      executarRolagemOutroFicha();
    }
  }
);

/* Rolagens salvas */

function textoConfiguracaoRolagemSalva(
  rolagem
) {
  if (
    rolagem.tipo === "pericia"
  ) {
    return `${rolagem.quantidadeDados}d20 • Valor ${rolagem.valor}`;
  }

  return (
    rolagem.dados || []
  )
    .map(
      dado =>
        `${dado.quantidade}d${dado.lados}`
    )
    .join(" + ");
}

botaoSalvarRolagemFicha.addEventListener(
  "click",
  async () => {
    if (!ultimaRolagemFicha) return;

    const nome =
      prompt(
        "Nome desta rolagem salva:",
        ultimaRolagemFicha
          .periciaNome ||
        "Novo teste"
      )?.trim();

    if (!nome) return;

    if (previewLocal) return;

    if (
      !auth.currentUser ||
      !idFicha
    ) return;

    try {
      await db
        .collection("fichas")
        .doc(idFicha)
        .collection(
          "rolagensSalvas"
        )
        .add({
          ...ultimaRolagemFicha,

          nome: nome,

          criadoPorUid:
            auth.currentUser.uid,

          criadoEm:
            firebase.firestore
              .FieldValue
              .serverTimestamp()
        });

    } catch (erro) {
      console.error(
        "Erro ao salvar rolagem:",
        erro
      );

      alert(
        "Não foi possível salvar essa rolagem."
      );
    }
  }
);

function renderizarHistoricoRolagensFicha(
  documentos
) {
  const fragmento =
    document.createDocumentFragment();

  documentos.forEach(
    documento => {
      const rolagem =
        documento.data();

      const item =
        document.createElement(
          "article"
        );

      item.className =
        "item-historico-rolagem";

      const nome =
        document.createElement(
          "strong"
        );

      nome.textContent =
        rolagem.nomeTeste ||
        "Rolagem";

      const detalhes =
        document.createElement(
          "span"
        );

      if (
        rolagem.tipo ===
        "pericia"
      ) {
        detalhes.textContent =
          `${rolagem.quantidadeDados}d20 • Valor ${rolagem.valor}`;

      } else {
        detalhes.textContent =
          (
            rolagem.dados || []
          )
            .map(
              dado =>
                `${dado.quantidade}d${dado.lados}`
            )
            .join(" + ");
      }

      const numeros =
        document.createElement(
          "div"
        );

      if (
        rolagem.tipo ===
        "pericia"
      ) {
        (
          rolagem.resultados ||
          []
        ).forEach(
          valorDado => {
            const span =
              document.createElement(
                "span"
              );

            span.className =
              `numero-historico resultado-${categoriaIndividualPericiaFicha(valorDado,rolagem.valor)}`;

            span.textContent =
              valorDado;

            numeros.appendChild(
              span
            );
          }
        );

      } else {
        (
          rolagem.resultados ||
          []
        ).forEach(
          resultado => {
            const span =
              document.createElement(
                "span"
              );

            span.className =
              "numero-historico";

            span.textContent =
              resultado.valor;

            numeros.appendChild(
              span
            );
          }
        );
      }

      const final =
        document.createElement(
          "strong"
        );

      if (
        rolagem.tipo ===
        "pericia"
      ) {
        final.className =
          `resultado-${rolagem.resultadoCategoria}`;

        final.textContent =
          nomeCategoriaRolagemFicha(
            rolagem.resultadoCategoria
          );

      } else {
        final.textContent =
          `Soma: ${rolagem.soma ?? 0}`;
      }

      item.append(
        nome,
        detalhes,
        numeros,
        final
      );

      fragmento.appendChild(
        item
      );
    }
  );

  listaHistoricoRolagensFicha
    .replaceChildren(
      fragmento
    );
}

function carregarRolagemSalvaNaTela(
  rolagem
) {
  tipoRolagemFicha.value =
    rolagem.tipo;

  alternarTipoRolagemFicha();

  if (
    rolagem.tipo === "pericia"
  ) {
    const pericia =
      periciasPontosFicha.find(
        item =>
          item.id ===
          rolagem.periciaId
      );

    if (pericia) {
      periciaSelecionadaRolagemId =
        pericia.id;

      pesquisaPericiaRolagem.value =
        pericia.nome;
    }

    quantidadeD20Ficha.value =
      rolagem.quantidadeDados;

    valorTestePericia.value =
      rolagem.valor;

    return;
  }

  renderizarConfiguracaoOutroFicha(
    Array.isArray(
      rolagem.dados
    ) &&
    rolagem.dados.length
      ? rolagem.dados
      : [
          {
            quantidade: 1,
            lados: 20
          }
        ]
  );
}

function renderizarRolagensSalvasFicha(
  documentos
) {
  const fragmento =
    document.createDocumentFragment();

  documentos.forEach(
    documento => {
      const rolagem =
        documento.data();

      const botao =
        document.createElement(
          "button"
        );

      botao.type = "button";

      botao.className =
        "rolagem-salva-exemplo";

      const nome =
        document.createElement(
          "strong"
        );

      nome.textContent =
        rolagem.nome ||
        "Rolagem salva";

      const detalhes =
        document.createElement(
          "span"
        );

      detalhes.textContent =
        textoConfiguracaoRolagemSalva(
          rolagem
        );

      botao.append(
        nome,
        detalhes
      );

      botao.addEventListener(
        "click",
        () => {
          carregarRolagemSalvaNaTela(
            rolagem
          );
        }
      );

      const botaoExcluir =
        document.createElement(
          "button"
        );

      botaoExcluir.type =
        "button";

      botaoExcluir.className =
        "botao-excluir-rolagem-salva";

      botaoExcluir.textContent =
        "×";

      botaoExcluir.title =
        "Excluir rolagem salva";

      botaoExcluir.setAttribute(
        "aria-label",
        "Excluir rolagem salva"
      );

      botaoExcluir.addEventListener(
        "click",
        async evento => {
          evento.preventDefault();
          evento.stopPropagation();

          const nomeRolagem =
            rolagem.nome ||
            "Rolagem salva";

          const confirmar =
            window.confirm(
              `Excluir "${nomeRolagem}"?`
            );

          if (!confirmar) return;

          if (
            previewLocal ||
            !auth.currentUser ||
            !idFicha
          ) return;

          botaoExcluir.disabled =
            true;

          try {
            await db
              .collection("fichas")
              .doc(idFicha)
              .collection(
                "rolagensSalvas"
              )
              .doc(documento.id)
              .delete();

          } catch (erro) {
            console.error(
              "Erro ao excluir rolagem salva:",
              erro
            );

            botaoExcluir.disabled =
              false;

            alert(
              "Não foi possível excluir essa rolagem."
            );
          }
        }
      );

      container.append(
        botao,
        botaoExcluir
      );

      fragmento.appendChild(
        botao
      );
    }
  );

  listaRolagensSalvasFicha
    .replaceChildren(
      fragmento
    );
}


/* Escutas em tempo real */

function iniciarEscutasRolagensFicha() {
  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) return;

  if (
    cancelarEscutaHistoricoRolagens
  ) {
    cancelarEscutaHistoricoRolagens();
  }

  if (
    cancelarEscutaRolagensSalvas
  ) {
    cancelarEscutaRolagensSalvas();
  }

  cancelarEscutaHistoricoRolagens =
    db
      .collection("fichas")
      .doc(idFicha)
      .collection(
        "historicoRolagens"
      )
      .orderBy(
        "criadoEm",
        "desc"
      )
      .limit(50)
      .onSnapshot(
        resultado => {
          renderizarHistoricoRolagensFicha(
            resultado.docs
          );
        },
        erro => {
          console.error(
            "Erro ao acompanhar histórico de rolagens:",
            erro
          );
        }
      );

  cancelarEscutaRolagensSalvas =
    db
      .collection("fichas")
      .doc(idFicha)
      .collection(
        "rolagensSalvas"
      )
      .orderBy(
        "criadoEm",
        "desc"
      )
      .onSnapshot(
        resultado => {
          renderizarRolagensSalvasFicha(
            resultado.docs
          );
        },
        erro => {
          console.error(
            "Erro ao acompanhar rolagens salvas:",
            erro
          );
        }
      );
}

if (previewLocal) {
  promessaPericiasPontosFicha
    .then(() => {
      preencherPontosFicha(
        dadosFichaAtual || {
          atributos: {
            fisico: 1,
            cognicao: 1,
            presenca: 2,
            deslocamentoMetros: 9,
            deslocamentoQuadrados: 6
          },

          pericias: {},
          credito: 250,
          ncp: 0,
          neo: 0
        }
      );
    });
}

/* Inicialização da ficha real */

if (!previewLocal) {
  auth.onAuthStateChanged(usuario => {
    carregarFichaAutenticada(usuario);
  });
}
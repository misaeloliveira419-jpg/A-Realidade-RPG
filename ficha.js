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
    await preencherHabilidadesFicha(ficha);
    await preencherInventarioFicha(ficha);

    iniciarEscutasRolagensFicha();
    iniciarEscutaRecursosFicha();

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

/* Habilidades */

const botoesAreasHabilidades = [...document.querySelectorAll(".botao-area-habilidade")];
const paineisAreasHabilidades = [...document.querySelectorAll("[data-painel-habilidade]")];

const campoPerfilHabilidadesFicha = document.getElementById("perfil-habilidades-ficha");
const campoOcupacaoHabilidadesFicha = document.getElementById("ocupacao-habilidades-ficha");
const campoOcupacao2HabilidadesFicha = document.getElementById("ocupacao-2-habilidades-ficha");
const campoNivelPerfilHabilidadesFicha = document.getElementById("nivel-perfil-habilidades-ficha");
const campoNivelOcupacaoHabilidadesFicha = document.getElementById("nivel-ocupacao-habilidades-ficha");

const listaHabilidadesPerfil = document.getElementById("lista-habilidades-perfil-ficha");
const listaHabilidadesPessoais = document.getElementById("lista-habilidades-pessoais-ficha");
const listaHabilidadesOcupacao = document.getElementById("lista-habilidades-ocupacao-ficha");
const botaoAdicionarHabilidadePessoal = document.getElementById("adicionar-habilidade-pessoal-ficha");

const botaoAdicionarHabilidadePerfil =
  document.getElementById(
    "adicionar-habilidade-perfil-ficha"
  );

const botaoAdicionarHabilidadeOcupacao =
  document.getElementById(
    "adicionar-habilidade-ocupacao-ficha"
  );

const fundoCatalogoHabilidades =
  document.getElementById(
    "fundo-catalogo-habilidades"
  );

const catalogoHabilidadesFicha =
  document.getElementById(
    "catalogo-habilidades-ficha"
  );

const fecharCatalogoHabilidades =
  document.getElementById(
    "fechar-catalogo-habilidades"
  );

const pesquisaCatalogoHabilidades =
  document.getElementById(
    "pesquisa-catalogo-habilidades"
  );

const menuPerfisCatalogoHabilidades =
  document.getElementById(
    "menu-perfis-catalogo-habilidades"
  );

const menuOcupacoesCatalogoHabilidades =
  document.getElementById(
    "menu-ocupacoes-catalogo-habilidades"
  );

const ocupacaoCatalogoHabilidades =
  document.getElementById(
    "ocupacao-catalogo-habilidades"
  );

const listaCatalogoHabilidades =
  document.getElementById(
    "lista-catalogo-habilidades"
  );

const botoesPerfisCatalogoHabilidades = [
  ...document.querySelectorAll(
    ".botao-perfil-catalogo-habilidades"
  )
];

let catalogoHabilidadesSistema = {
  perfis: {},
  ocupacoes: {}
};

let catalogoCompletoHabilidadesSistema = {
  perfis: {},
  ocupacoes: {}
};

let tipoCatalogoHabilidadesAberto = null;
let perfilCatalogoHabilidadesAtivo = "adaptativo";

let estadoHabilidadesFicha = {
  inicializadas: false,
  perfil: [],
  pessoais: [],
  ocupacao: [],
  escolhaOcupacaoPendente: false
};

let filaSalvamentoHabilidades = Promise.resolve();
let timerSalvamentoHabilidades = null;
let sequenciaHabilidadePessoal = 0;


/* Menu responsivo */

function abrirAreaHabilidadesFicha(area) {
  botoesAreasHabilidades.forEach(botao => {
    botao.classList.toggle(
      "ativa",
      botao.dataset.areaHabilidade === area
    );
  });

  paineisAreasHabilidades.forEach(painel => {
    painel.classList.toggle(
      "area-habilidade-ativa",
      painel.dataset.painelHabilidade === area
    );
  });
}

botoesAreasHabilidades.forEach(botao => {
  botao.addEventListener("click", () => {
    abrirAreaHabilidadesFicha(
      botao.dataset.areaHabilidade
    );
  });
});


/* Utilidades */

function normalizarTextoHabilidade(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarIdHabilidadeFicha(
  tipo,
  categoria,
  origem = ""
) {
  const origemNormalizada =
    normalizarTextoHabilidade(origem)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return [
    tipo,
    `categoria-${categoria}`,
    origemNormalizada || "geral"
  ].join("-");
}

function criarIdHabilidadePessoalFicha() {
  sequenciaHabilidadePessoal += 1;

  return (
    `pessoal-${Date.now()}-` +
    `${sequenciaHabilidadePessoal}`
  );
}

function nomeOcupacaoHabilidadeFicha(
  ocupacaoId
) {
  const ocupacao =
    ocupacoesFichaDisponiveis.find(
      item =>
        item.id === ocupacaoId
    );

  return (
    ocupacao?.nome ||
    ocupacaoId ||
    ""
  );
}

function textoHabilidadeSeguro(valor) {
  return typeof valor === "string"
    ? valor
    : "";
}

function habilidadeVaziaCategoriaZero() {
  return {
    categoria: 0,
    nome: "",
    custo: "",
    alvo: "",
    alcance: "",
    resistencia: "",
    descricao: ""
  };
}

function normalizarHabilidadeSalva(
  habilidade,
  tipo,
  indice
) {
  const dados =
    habilidade &&
    typeof habilidade === "object"
      ? habilidade
      : {};

  const categoriaNumero =
    Number(dados.categoria);

  const categoria =
    Number.isInteger(categoriaNumero)
      ? categoriaNumero
      : (
          tipo === "pessoais"
            ? indice + 1
            : 0
        );

  const origem =
    textoHabilidadeSeguro(
      dados.origem
    );

  return {
    catalogoId: textoHabilidadeSeguro(dados.catalogoId),
    id: textoHabilidadeSeguro(dados.id) || criarIdHabilidadeFicha(tipo, categoria, origem || String(indice)),

    categoria: categoria,

    nome:
      textoHabilidadeSeguro(
        dados.nome
      ),

    custo:
      textoHabilidadeSeguro(
        dados.custo
      ),

    alvo:
      textoHabilidadeSeguro(
        dados.alvo
      ),

    alcance:
      textoHabilidadeSeguro(
        dados.alcance
      ),

    resistencia:
      textoHabilidadeSeguro(
        dados.resistencia
      ),

    descricao:
      textoHabilidadeSeguro(
        dados.descricao
      ),

    origem: origem
  };
}

function normalizarEstadoHabilidadesFicha(
  habilidades
) {
  const dados =
    habilidades &&
    typeof habilidades === "object"
      ? habilidades
      : {};

  return {
    inicializadas:
      dados.inicializadas === true,

    perfil:
      Array.isArray(dados.perfil)
        ? dados.perfil.map(
            (item, indice) =>
              normalizarHabilidadeSalva(
                item,
                "perfil",
                indice
              )
          )
        : [],

    pessoais:
      Array.isArray(dados.pessoais)
        ? dados.pessoais.map(
            (item, indice) =>
              normalizarHabilidadeSalva(
                item,
                "pessoais",
                indice
              )
          )
        : [],

    ocupacao:
      Array.isArray(dados.ocupacao)
        ? dados.ocupacao.map(
            (item, indice) =>
              normalizarHabilidadeSalva(
                item,
                "ocupacao",
                indice
              )
          )
        : [],

    escolhaOcupacaoPendente:
      dados.escolhaOcupacaoPendente ===
        true
  };
}

function copiarEstadoHabilidadesFicha() {
  const copiarLista =
    lista =>
      lista.map(
        habilidade => ({
          catalogoId:
            habilidade.catalogoId || "",

          id:
            habilidade.id,

          categoria:
            habilidade.categoria,

          nome:
            habilidade.nome,

          custo:
            habilidade.custo,

          alvo:
            habilidade.alvo,

          alcance:
            habilidade.alcance,

          resistencia:
            habilidade.resistencia,

          descricao:
            habilidade.descricao,

          origem:
            habilidade.origem
        })
      );

  return {
    inicializadas: true,

    perfil:
      copiarLista(
        estadoHabilidadesFicha.perfil
      ),

    pessoais:
      copiarLista(
        estadoHabilidadesFicha.pessoais
      ),

    ocupacao:
      copiarLista(
        estadoHabilidadesFicha.ocupacao
      ),

    escolhaOcupacaoPendente:
      estadoHabilidadesFicha
        .escolhaOcupacaoPendente ===
          true
  };
}


/* Ler Habilidades do Sistema */

function encontrarTabelaDepoisDoTitulo(
  titulo
) {
  let elemento =
    titulo.nextElementSibling;

  while (
    elemento &&
    !elemento.matches(
      "h2, h3, table"
    )
  ) {
    elemento =
      elemento.nextElementSibling;
  }

  return elemento?.matches(
    "table.tabela-habilidades"
  )
    ? elemento
    : null;
}

function extrairHabilidadeCategoriaZero(
  tabela
) {
  if (!tabela) {
    return habilidadeVaziaCategoriaZero();
  }

  const cabecalhos = [
    ...tabela.querySelectorAll(
      "thead th"
    )
  ].map(
    th =>
      normalizarTextoHabilidade(
        th.textContent
      )
  );

  const linhas = [
    ...tabela.querySelectorAll(
      "tbody tr"
    )
  ];

  const indiceCategoria =
    cabecalhos.indexOf(
      "categoria"
    ) >= 0
      ? cabecalhos.indexOf(
          "categoria"
        )
      : 0;

  const linhaCategoriaZero =
    linhas.find(
      linha => {
        const celulas = [
          ...linha.querySelectorAll(
            "td"
          )
        ];

        return (
          Number(
            celulas[
              indiceCategoria
            ]?.textContent
              ?.trim()
          ) === 0
        );
      }
    );

  if (!linhaCategoriaZero) {
    return habilidadeVaziaCategoriaZero();
  }

  const celulas = [
    ...linhaCategoriaZero
      .querySelectorAll("td")
  ];

  function valorCampo(
    nomes,
    indicePadrao = -1
  ) {
    let indice = -1;

    for (const nome of nomes) {
      const encontrado =
        cabecalhos.indexOf(
          normalizarTextoHabilidade(
            nome
          )
        );

      if (encontrado >= 0) {
        indice =
          encontrado;

        break;
      }
    }

    if (
      indice < 0 &&
      indicePadrao >= 0
    ) {
      indice =
        indicePadrao;
    }

    return (
      celulas[indice]
        ?.textContent
        ?.trim() ||
      ""
    );
  }

  return {
    categoria: 0,

    nome:
      valorCampo(
        ["habilidade", "nome"],
        1
      ),

    custo:
      valorCampo(
        ["custo"]
      ),

    alvo:
      valorCampo(
        ["alvo"]
      ),

    alcance:
      valorCampo(
        ["alcance"]
      ),

    resistencia:
      valorCampo(
        ["resistencia"]
      ),

    descricao:
      valorCampo(
        ["descricao"],
        2
      )
  };
}

function extrairTodasHabilidadesTabela(
  tabela,
  tipo,
  origem
) {
  if (!tabela) {
    return [];
  }

  const cabecalhos = [
    ...tabela.querySelectorAll(
      "thead th"
    )
  ].map(
    th =>
      normalizarTextoHabilidade(
        th.textContent
      )
  );

  const linhas = [
    ...tabela.querySelectorAll(
      "tbody tr"
    )
  ];

  function indiceCampo(
    nomes,
    indicePadrao = -1
  ) {
    for (const nome of nomes) {
      const indice =
        cabecalhos.indexOf(
          normalizarTextoHabilidade(
            nome
          )
        );

      if (indice >= 0) {
        return indice;
      }
    }

    return indicePadrao;
  }

  const indiceCategoria =
    indiceCampo(
      ["categoria"],
      0
    );

  const indiceNome =
    indiceCampo(
      ["habilidade", "nome"],
      1
    );

  const indiceCusto =
    indiceCampo(
      ["custo"]
    );

  const indiceAlvo =
    indiceCampo(
      ["alvo"]
    );

  const indiceAlcance =
    indiceCampo(
      ["alcance"]
    );

  const indiceResistencia =
    indiceCampo(
      ["resistencia"]
    );

  const indiceDescricao =
    indiceCampo(
      ["descricao"],
      2
    );

  function textoCelula(
    celulas,
    indice
  ) {
    if (indice < 0) {
      return "";
    }

    return (
      celulas[indice]
        ?.textContent
        ?.trim() ||
      ""
    );
  }

  return linhas.map(
    (linha, indiceLinha) => {
      const celulas = [
        ...linha.querySelectorAll(
          "td"
        )
      ];

      const categoriaNumero =
        Number(
          textoCelula(
            celulas,
            indiceCategoria
          )
        );

      const categoria =
        Number.isInteger(
          categoriaNumero
        )
          ? categoriaNumero
          : 0;

      const nome =
        textoCelula(
          celulas,
          indiceNome
        );

      return {
        catalogoId:
          [
            tipo,
            origem,
            categoria,
            indiceLinha
          ].join("|"),

        categoria:
          categoria,

        nome:
          nome,

        custo:
          textoCelula(
            celulas,
            indiceCusto
          ),

        alvo:
          textoCelula(
            celulas,
            indiceAlvo
          ),

        alcance:
          textoCelula(
            celulas,
            indiceAlcance
          ),

        resistencia:
          textoCelula(
            celulas,
            indiceResistencia
          ),

        descricao:
          textoCelula(
            celulas,
            indiceDescricao
          ),

        origem:
          origem
      };
    }
  );
}

async function carregarCatalogoHabilidadesSistema() {
  try {
    const resposta =
      await fetch(
        "index-sistema.html"
      );

    if (!resposta.ok) {
      throw new Error(
        "Não foi possível abrir index-sistema.html."
      );
    }

    const html =
      await resposta.text();

    const documento =
      new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );

    const tela =
      documento.querySelector(
        "#tela-niveis-habilidades"
      );

    if (!tela) {
      throw new Error(
        "A área de Níveis e Habilidades não foi encontrada."
      );
    }

    const catalogo = {
      perfis: {},
      ocupacoes: {}
    };

    const catalogoCompleto = {
      perfis: {},
      ocupacoes: {}
    };

    [
      ...tela.querySelectorAll(
        "h3"
      )
    ].forEach(
      titulo => {
        const texto =
          titulo.textContent
            .trim();

        const textoNormalizado =
          normalizarTextoHabilidade(
            texto
          );

        const tabela =
          encontrarTabelaDepoisDoTitulo(
            titulo
          );

        if (
          textoNormalizado.startsWith(
            "perfil -"
          )
        ) {
          const nome =
            texto
              .replace(
                /^Perfil\s*-\s*/i,
                ""
              )
              .trim();

          const id =
            normalizarTextoHabilidade(
              nome
            )
              .replace(
                /[^a-z0-9]+/g,
                "-"
              )
              .replace(
                /^-+|-+$/g,
                ""
              );

          const habilidades =
            extrairTodasHabilidadesTabela(
              tabela,
              "perfil",
              id
            );

          catalogoCompleto.perfis[id] =
            habilidades;

          catalogo.perfis[id] =
            habilidades.find(
              habilidade =>
                habilidade.categoria === 0
            ) ||
            habilidadeVaziaCategoriaZero();

          return;
        }

        if (
          textoNormalizado.startsWith(
            "ocupacao -"
          )
        ) {
          const nome =
            texto
              .replace(
                /^Ocupação\s*-\s*/i,
                ""
              )
              .trim();

          const id =
            criarIdOcupacaoFicha(
              nome
            );

          const habilidades =
            extrairTodasHabilidadesTabela(
              tabela,
              "ocupacao",
              id
            );

          catalogoCompleto.ocupacoes[id] =
            habilidades;

          catalogo.ocupacoes[id] =
            habilidades.find(
              habilidade =>
                habilidade.categoria === 0
            ) ||
            habilidadeVaziaCategoriaZero();
        }
      }
    );

    catalogoHabilidadesSistema =
      catalogo;

    catalogoCompletoHabilidadesSistema =
      catalogoCompleto;

    return catalogo;

  } catch (erro) {
    console.error(
      "Erro ao carregar Habilidades do Sistema:",
      erro
    );

    catalogoHabilidadesSistema = {
      perfis: {},
      ocupacoes: {}
    };

    catalogoCompletoHabilidadesSistema = {
      perfis: {},
      ocupacoes: {}
    };

    return catalogoHabilidadesSistema;
  }
}

const promessaCatalogoHabilidadesSistema =
  carregarCatalogoHabilidadesSistema();


/* Estado inicial */

function criarHabilidadeDoSistema(
  tipo,
  origem,
  dadosSistema
) {
  const dados =
    dadosSistema &&
    typeof dadosSistema === "object"
      ? dadosSistema
      : habilidadeVaziaCategoriaZero();

  return {
    catalogoId:
      textoHabilidadeSeguro(
        dados.catalogoId
      ),

    id:
      criarIdHabilidadeFicha(
        tipo,
        0,
        origem
      ),

    categoria: 0,

    nome:
      textoHabilidadeSeguro(
        dados.nome
      ),

    custo:
      textoHabilidadeSeguro(
        dados.custo
      ),

    alvo:
      textoHabilidadeSeguro(
        dados.alvo
      ),

    alcance:
      textoHabilidadeSeguro(
        dados.alcance
      ),

    resistencia:
      textoHabilidadeSeguro(
        dados.resistencia
      ),

    descricao:
      textoHabilidadeSeguro(
        dados.descricao
      ),

    origem:
      origem
  };
}

async function criarEstadoInicialHabilidadesFicha(
  ficha
) {
  await promessaCatalogoHabilidadesSistema;

  const perfil =
    [
      "proativo",
      "reflexivo",
      "adaptativo"
    ].includes(ficha.perfil)
      ? ficha.perfil
      : "adaptativo";

  const ocupacoes =
    Array.isArray(ficha.ocupacoes)
      ? ficha.ocupacoes
          .filter(
            ocupacao =>
              typeof ocupacao ===
                "string" &&
              ocupacao
          )
          .slice(0, 2)
      : [];

  const habilidadePerfil =
    criarHabilidadeDoSistema(
      "perfil",
      perfil,
      catalogoHabilidadesSistema
        .perfis[perfil]
    );

  const habilidadesOcupacao =
    ocupacoes.map(
      ocupacao =>
        criarHabilidadeDoSistema(
          "ocupacao",
          ocupacao,
          catalogoHabilidadesSistema
            .ocupacoes[ocupacao]
        )
    );

  return {
    inicializadas: true,

    perfil: [
      habilidadePerfil
    ],

    pessoais: [],

    ocupacao:
      habilidadesOcupacao,

    escolhaOcupacaoPendente:
      habilidadesOcupacao.length > 1
  };
}


/* Salvamento */

function salvarEstadoHabilidadesFichaAgora() {
  const copia =
    copiarEstadoHabilidadesFicha();

  if (dadosFichaAtual) {
    dadosFichaAtual.habilidades =
      copia;
  }

  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) {
    return Promise.resolve();
  }

  filaSalvamentoHabilidades =
    filaSalvamentoHabilidades
      .catch(() => {})
      .then(
        async () => {
          await db
            .collection("fichas")
            .doc(idFicha)
            .update({
              habilidades:
                copia,

              atualizadoEm:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            });
        }
      );

  return filaSalvamentoHabilidades
    .catch(
      erro => {
        console.error(
          "Erro ao salvar Habilidades:",
          erro
        );

        throw erro;
      }
    );
}

function agendarSalvamentoHabilidadesFicha() {
  clearTimeout(
    timerSalvamentoHabilidades
  );

  timerSalvamentoHabilidades =
    setTimeout(
      () => {
        salvarEstadoHabilidadesFichaAgora()
          .catch(() => {});
      },
      400
    );
}

function salvarHabilidadesFichaImediatamente() {
  clearTimeout(
    timerSalvamentoHabilidades
  );

  return salvarEstadoHabilidadesFichaAgora();
}


/* Cabeçalho */

function preencherOpcoesOcupacaoHabilidadesFicha(
  ocupacao1Atual,
  ocupacao2Atual = ""
) {
  if (
    !campoOcupacaoHabilidadesFicha ||
    !campoOcupacao2HabilidadesFicha
  ) {
    return;
  }

  campoOcupacaoHabilidadesFicha
    .replaceChildren();

  campoOcupacao2HabilidadesFicha
    .replaceChildren();


  /* Opção inicial da Ocupação 1 */

  const opcaoInicial =
    document.createElement(
      "option"
    );

  opcaoInicial.value = "";

  opcaoInicial.textContent =
    "Selecione uma Ocupação";

  opcaoInicial.disabled = true;

  campoOcupacaoHabilidadesFicha
    .appendChild(
      opcaoInicial
    );


  /* Opção Nenhuma da Ocupação 2 */

  const opcaoNenhuma =
    document.createElement(
      "option"
    );

  opcaoNenhuma.value = "";

  opcaoNenhuma.textContent =
    "Nenhuma";

  campoOcupacao2HabilidadesFicha
    .appendChild(
      opcaoNenhuma
    );


  /* Todas as Ocupações */

  ocupacoesFichaDisponiveis.forEach(
    ocupacao => {
      const opcao1 =
        document.createElement(
          "option"
        );

      opcao1.value =
        ocupacao.id;

      opcao1.textContent =
        ocupacao.nome;

      const opcao2 =
        opcao1.cloneNode(
          true
        );

      campoOcupacaoHabilidadesFicha
        .appendChild(
          opcao1
        );

      campoOcupacao2HabilidadesFicha
        .appendChild(
          opcao2
        );
    }
  );


  /* Garante Ocupações antigas que não estejam mais na lista */

  function adicionarOcupacaoAusente(
    campo,
    valor
  ) {
    if (!valor) return;

    const existe = [
      ...campo.options
    ].some(
      opcao =>
        opcao.value ===
          valor
    );

    if (existe) return;

    const opcao =
      document.createElement(
        "option"
      );

    opcao.value =
      valor;

    opcao.textContent =
      nomeOcupacaoHabilidadeFicha(
        valor
      );

    campo.appendChild(
      opcao
    );
  }

  adicionarOcupacaoAusente(
    campoOcupacaoHabilidadesFicha,
    ocupacao1Atual
  );

  adicionarOcupacaoAusente(
    campoOcupacao2HabilidadesFicha,
    ocupacao2Atual
  );


  /* Valores atuais */

  campoOcupacaoHabilidadesFicha.value =
    ocupacao1Atual || "";

  campoOcupacao2HabilidadesFicha.value =
    ocupacao2Atual || "";
}


async function preencherCabecalhoHabilidadesFicha(
  ficha
) {
  await promessaOcupacoesFicha;

  const ocupacoes =
    Array.isArray(
      ficha.ocupacoes
    )
      ? ficha.ocupacoes
          .slice(0, 2)
      : [];

  const ocupacao1Atual =
    ocupacoes[0] || "";

  const ocupacao2Atual =
    ocupacoes[1] || "";

  campoPerfilHabilidadesFicha.value =
    ficha.perfil ||
    "adaptativo";

  preencherOpcoesOcupacaoHabilidadesFicha(
    ocupacao1Atual,
    ocupacao2Atual
  );

  campoNivelPerfilHabilidadesFicha.value =
    String(
      Number.isInteger(
        ficha.ncp
      )
        ? ficha.ncp
        : 0
    );

  campoNivelOcupacaoHabilidadesFicha.value =
    String(
      Number.isInteger(
        ficha.neo
      )
        ? ficha.neo
        : 0
    );
}


function sincronizarCabecalhoHabilidadesComFicha() {
  campoPerfilHabilidadesFicha.value =
    campoPerfilFicha.value ||
    dadosFichaAtual?.perfil ||
    "adaptativo";

  const ocupacao1 =
    campoOcupacao1Ficha.value ||
    dadosFichaAtual
      ?.ocupacoes?.[0] ||
    "";

  const ocupacao2 =
    campoOcupacao2Ficha.value ||
    dadosFichaAtual
      ?.ocupacoes?.[1] ||
    "";

  preencherOpcoesOcupacaoHabilidadesFicha(
    ocupacao1,
    ocupacao2
  );

  campoNivelPerfilHabilidadesFicha.value =
    document.getElementById(
      "ncp-ficha"
    )?.value || "0";

  campoNivelOcupacaoHabilidadesFicha.value =
    document.getElementById(
      "neo-ficha"
    )?.value || "0";
}


/* Crescimento automático dos campos */

function ajustarAlturaCampoHabilidade(
  campo
) {
  campo.style.height =
    "auto";

  campo.style.height =
    `${campo.scrollHeight}px`;
}


/* Cards */

function criarCardHabilidadeFicha(
  habilidade,
  tipo,
  opcoes = {}
) {
  const card =
    document.createElement(
      "article"
    );

  const abertoInicial =
    opcoes.aberto === true;

  card.className =
    "card-habilidade-ficha";

  if (abertoInicial) {
    card.classList.add(
      "aberta"
    );
  }

  card.dataset.categoriaHabilidade =
    String(
      habilidade.categoria
    );

  card.dataset.idHabilidade =
    habilidade.id;

  card.innerHTML = `
    <div class="cabecalho-card-habilidade">
      <span class="categoria-habilidade"></span>

      <input
        class="nome-habilidade-ficha"
        type="text"
        aria-label="Nome da Habilidade"
      >

      <button
        class="expandir-habilidade-ficha"
        type="button"
        aria-label="Expandir Habilidade"
      >
        ▶
      </button>

      <button
        class="excluir-habilidade-ficha"
        type="button"
        aria-label="Excluir Habilidade"
      >
        🗑
      </button>
    </div>

    <div class="conteudo-card-habilidade">

      <div class="linha-tripla-habilidade">

        <label>
          <span>CUSTO</span>
          <textarea
            rows="1"
            data-campo-habilidade="custo"
          ></textarea>
        </label>

        <label>
          <span>ALVO</span>
          <textarea
            rows="1"
            data-campo-habilidade="alvo"
          ></textarea>
        </label>

        <label>
          <span>ALCANCE</span>
          <textarea
            rows="1"
            data-campo-habilidade="alcance"
          ></textarea>
        </label>

      </div>

      <label class="campo-largo-habilidade">
        <span>RESISTÊNCIA</span>

        <textarea
          rows="1"
          data-campo-habilidade="resistencia"
        ></textarea>
      </label>

      <label class="campo-largo-habilidade">
        <span>DESCRIÇÃO</span>

        <textarea
          class="descricao-habilidade-ficha"
          rows="3"
          data-campo-habilidade="descricao"
        ></textarea>
      </label>

    </div>
  `;

  card.querySelector(
    ".categoria-habilidade"
  ).textContent =
    String(
      habilidade.categoria
    );

  const nome =
    card.querySelector(
      ".nome-habilidade-ficha"
    );

  const conteudo =
    card.querySelector(
      ".conteudo-card-habilidade"
    );

  const botaoExpandir =
    card.querySelector(
      ".expandir-habilidade-ficha"
    );

  const botaoExcluir =
    card.querySelector(
      ".excluir-habilidade-ficha"
    );

  nome.value =
    habilidade.nome;

  if (tipo === "pessoais") {
    nome.placeholder =
      "Nome da Habilidade";
  }

  conteudo.hidden =
    !abertoInicial;

  botaoExpandir.addEventListener(
    "click",
    () => {
      const abrir =
        conteudo.hidden;

      conteudo.hidden =
        !abrir;

      card.classList.toggle(
        "aberta",
        abrir
      );

      if (abrir) {
        requestAnimationFrame(
          () => {
            conteudo
              .querySelectorAll(
                "textarea"
              )
              .forEach(
                ajustarAlturaCampoHabilidade
              );
          }
        );
      }
    }
  );

  botaoExcluir.addEventListener(
    "click",
    () => {
      excluirHabilidadeFicha(
        tipo,
        habilidade.id
      );
    }
  );

  nome.addEventListener(
    "input",
    () => {
      habilidade.nome =
        nome.value;

      agendarSalvamentoHabilidadesFicha();
    }
  );

  conteudo
    .querySelectorAll(
      "[data-campo-habilidade]"
    )
    .forEach(
      campo => {
        const chave =
          campo.dataset
            .campoHabilidade;

        campo.value =
          habilidade[chave] ||
          "";

        campo.addEventListener(
          "input",
          () => {
            habilidade[chave] =
              campo.value;

            ajustarAlturaCampoHabilidade(
              campo
            );

            agendarSalvamentoHabilidadesFicha();
          }
        );
      }
    );

  if (
    opcoes.mostrarEscolha ===
      true
  ) {
    const escolha =
      document.createElement(
        "div"
      );

    escolha.className =
      "escolha-habilidade-ocupacao";

    const origem =
      document.createElement(
        "span"
      );

    origem.className =
      "origem-habilidade-ocupacao";

    origem.textContent =
      nomeOcupacaoHabilidadeFicha(
        habilidade.origem
      );

    const botaoEscolher =
      document.createElement(
        "button"
      );

    botaoEscolher.type =
      "button";

    botaoEscolher.className =
      "botao-escolher-habilidade-ocupacao";

    botaoEscolher.textContent =
      "ESCOLHER";

    botaoEscolher.addEventListener(
      "click",
      () => {
        escolherHabilidadeOcupacaoFicha(
          habilidade.id
        );
      }
    );

    escolha.append(
      origem,
      botaoEscolher
    );

    card.appendChild(
      escolha
    );
  }

  if (abertoInicial) {
    requestAnimationFrame(
      () => {
        conteudo
          .querySelectorAll(
            "textarea"
          )
          .forEach(
            ajustarAlturaCampoHabilidade
          );
      }
    );
  }

  return card;
}

function renderizarListaHabilidadesFicha(
  tipo,
  lista,
  destino,
  idAbrir = null
) {
  destino.replaceChildren();

  const escolhaOcupacao =
    tipo === "ocupacao" &&
    estadoHabilidadesFicha
      .escolhaOcupacaoPendente &&
    lista.length > 1;

  if (escolhaOcupacao) {
    const aviso =
      document.createElement(
        "p"
      );

    aviso.className =
      "aviso-escolha-habilidade-ocupacao";

    aviso.textContent =
      "Escolha uma das Habilidades de Categoria 0. Você pode abrir os cards antes de confirmar.";

    destino.appendChild(
      aviso
    );
  }

  lista.forEach(
    habilidade => {
      destino.appendChild(
        criarCardHabilidadeFicha(
          habilidade,
          tipo,
          {
            aberto:
              habilidade.id ===
                idAbrir,

            mostrarEscolha:
              escolhaOcupacao
          }
        )
      );
    }
  );
}

function renderizarHabilidadesFicha(
  idAbrir = null
) {
  renderizarListaHabilidadesFicha(
    "perfil",
    estadoHabilidadesFicha.perfil,
    listaHabilidadesPerfil,
    idAbrir
  );

  renderizarListaHabilidadesFicha(
    "pessoais",
    estadoHabilidadesFicha.pessoais,
    listaHabilidadesPessoais,
    idAbrir
  );

  renderizarListaHabilidadesFicha(
    "ocupacao",
    estadoHabilidadesFicha.ocupacao,
    listaHabilidadesOcupacao,
    idAbrir
  );
}


/* Excluir */

function excluirHabilidadeFicha(tipo, id) {
  const listas = {
    perfil:
      estadoHabilidadesFicha.perfil,

    pessoais:
      estadoHabilidadesFicha.pessoais,

    ocupacao:
      estadoHabilidadesFicha.ocupacao
  };

  const lista =
    listas[tipo];

  if (!lista) return;

  const habilidade =
    lista.find(
      item =>
        item.id === id
    );

  if (!habilidade) return;

  const nome =
    habilidade.nome.trim() ||
    "esta Habilidade";

  const confirmar =
    window.confirm(
      `Excluir "${nome}"?`
    );

  if (!confirmar) return;

  const novaLista =
    lista.filter(
      item =>
        item.id !== id
    );

  if (tipo === "perfil") {
    estadoHabilidadesFicha.perfil =
      novaLista;
  }

  if (tipo === "pessoais") {
    estadoHabilidadesFicha.pessoais =
      novaLista;
  }

  if (tipo === "ocupacao") {
    estadoHabilidadesFicha.ocupacao =
      novaLista;

    if (
      novaLista.length <= 1
    ) {
      estadoHabilidadesFicha
        .escolhaOcupacaoPendente =
          false;
    }
  }

  renderizarHabilidadesFicha();

  salvarHabilidadesFichaImediatamente()
    .catch(
      () => {
        alert(
          "Não foi possível salvar a exclusão da Habilidade."
        );
      }
    );
}


/* Escolha entre duas Ocupações */

function escolherHabilidadeOcupacaoFicha(
  id
) {
  const habilidade =
    estadoHabilidadesFicha
      .ocupacao
      .find(
        item =>
          item.id === id
      );

  if (!habilidade) return;

  const nomeOcupacao =
    nomeOcupacaoHabilidadeFicha(
      habilidade.origem
    );

  const confirmar =
    window.confirm(
      `Escolher a Habilidade de ${nomeOcupacao}? A outra opção será removida.`
    );

  if (!confirmar) return;

  const estadoAnterior = {
    ocupacao: [
      ...estadoHabilidadesFicha
        .ocupacao
    ],

    escolhaOcupacaoPendente:
      estadoHabilidadesFicha
        .escolhaOcupacaoPendente
  };

  estadoHabilidadesFicha.ocupacao = [
    habilidade
  ];

  estadoHabilidadesFicha
    .escolhaOcupacaoPendente =
      false;

  renderizarHabilidadesFicha();

  salvarHabilidadesFichaImediatamente()
    .catch(
      () => {
        estadoHabilidadesFicha
          .ocupacao =
            estadoAnterior.ocupacao;

        estadoHabilidadesFicha
          .escolhaOcupacaoPendente =
            estadoAnterior
              .escolhaOcupacaoPendente;

        renderizarHabilidadesFicha();

        alert(
          "Não foi possível confirmar a escolha da Habilidade."
        );
      }
    );
}


/* Criar Habilidade Pessoal */

function obterProximaCategoriaPessoal() {
  const categorias =
    estadoHabilidadesFicha
      .pessoais
      .map(
        habilidade =>
          Number(
            habilidade.categoria
          )
      )
      .filter(
        Number.isInteger
      );

  return categorias.length
    ? Math.max(...categorias) + 1
    : 1;
}

function criarHabilidadePessoalFicha() {
  const categoria =
    obterProximaCategoriaPessoal();

  const habilidade = {
    id:
      criarIdHabilidadePessoalFicha(),

    categoria:
      categoria,

    nome: "",
    custo: "",
    alvo: "",
    alcance: "",
    resistencia: "",
    descricao: "",
    origem: ""
  };

  estadoHabilidadesFicha
    .pessoais
    .push(
      habilidade
    );

  renderizarHabilidadesFicha(
    habilidade.id
  );

  salvarHabilidadesFichaImediatamente()
    .catch(() => {});

  requestAnimationFrame(
    () => {
      listaHabilidadesPessoais
        .querySelector(
          `[data-id-habilidade="${habilidade.id}"]`
        )
        ?.querySelector(
          ".nome-habilidade-ficha"
        )
        ?.focus();
    }
  );
}

botaoAdicionarHabilidadePessoal
  ?.addEventListener(
    "click",
    criarHabilidadePessoalFicha
  );

/* Catálogo de Habilidades */

function obterHabilidadesAdquiridasPorTipo(
  tipo
) {
  if (tipo === "perfil") {
    return estadoHabilidadesFicha.perfil;
  }

  if (tipo === "ocupacao") {
    return estadoHabilidadesFicha.ocupacao;
  }

  return [];
}


function habilidadeCatalogoJaAdquirida(
  tipo,
  habilidade
) {
  const adquiridas =
    obterHabilidadesAdquiridasPorTipo(
      tipo
    );

  return adquiridas.some(
    adquirida => {
      if (
        adquirida.catalogoId &&
        habilidade.catalogoId &&
        adquirida.catalogoId ===
          habilidade.catalogoId
      ) {
        return true;
      }

      const mesmaOrigem =
        adquirida.origem ===
          habilidade.origem;

      const mesmaCategoria =
        Number(
          adquirida.categoria
        ) ===
          Number(
            habilidade.categoria
          );

      if (
        !mesmaOrigem ||
        !mesmaCategoria
      ) {
        return false;
      }

      /*
        Compatibilidade com fichas antigas,
        cuja Categoria 0 ainda não possuía
        catalogoId.
      */

      if (
        Number(
          habilidade.categoria
        ) === 0 &&
        !adquirida.catalogoId
      ) {
        return true;
      }

      const nomeAdquirida =
        normalizarTextoHabilidade(
          adquirida.nome
        );

      const nomeCatalogo =
        normalizarTextoHabilidade(
          habilidade.nome
        );

      return (
        nomeAdquirida &&
        nomeAdquirida ===
          nomeCatalogo
      );
    }
  );
}


function habilidadeCatalogoCompativel(
  tipo,
  habilidade
) {
  if (tipo === "perfil") {
    return (
      habilidade.origem ===
        campoPerfilHabilidadesFicha
          .value
    );
  }

  if (tipo === "ocupacao") {
    const ocupacoesPersonagem = [
      campoOcupacaoHabilidadesFicha
        .value,

      campoOcupacao2HabilidadesFicha
        .value
    ].filter(Boolean);

    return ocupacoesPersonagem.includes(
      habilidade.origem
    );
  }

  return false;
}


function textoIncompatibilidadeHabilidade(
  tipo,
  habilidade
) {
  if (tipo === "perfil") {
    const perfil =
      habilidade.origem
        ? habilidade.origem
            .charAt(0)
            .toUpperCase() +
          habilidade.origem.slice(1)
        : "desconhecido";

    return (
      `Esta Habilidade pertence ao Perfil ${perfil} ` +
      "e não é compatível com o Perfil atual do personagem."
    );
  }

  const ocupacao =
    nomeOcupacaoHabilidadeFicha(
      habilidade.origem
    ) ||
    "esta Ocupação";

  return (
    `Esta Habilidade pertence à Ocupação ${ocupacao} ` +
    "e não é compatível com as Ocupações atuais do personagem."
  );
}


function habilidadeCombinaComPesquisa(
  habilidade,
  pesquisa
) {
  const termo =
    normalizarTextoHabilidade(
      pesquisa
    );

  if (!termo) {
    return true;
  }

  const textoCompleto =
    [
      habilidade.nome,
      habilidade.custo,
      habilidade.alvo,
      habilidade.alcance,
      habilidade.resistencia,
      habilidade.descricao
    ]
      .map(
        normalizarTextoHabilidade
      )
      .join(" ");

  return textoCompleto.includes(
    termo
  );
}


function copiarHabilidadeDoCatalogo(
  tipo,
  habilidade
) {
  return {
    catalogoId:
      habilidade.catalogoId,

    id:
      [
        "adquirida",
        tipo,
        Date.now(),
        Math.random()
          .toString(36)
          .slice(2, 8)
      ].join("-"),

    categoria:
      habilidade.categoria,

    nome:
      habilidade.nome,

    custo:
      habilidade.custo,

    alvo:
      habilidade.alvo,

    alcance:
      habilidade.alcance,

    resistencia:
      habilidade.resistencia,

    descricao:
      habilidade.descricao,

    origem:
      habilidade.origem
  };
}


async function adicionarHabilidadeDoCatalogo(
  tipo,
  habilidade
) {
  if (
    habilidadeCatalogoJaAdquirida(
      tipo,
      habilidade
    )
  ) {
    alert(
      "Esta Habilidade já foi adicionada ao personagem."
    );

    return;
  }

  if (
    !habilidadeCatalogoCompativel(
      tipo,
      habilidade
    )
  ) {
    alert(
      textoIncompatibilidadeHabilidade(
        tipo,
        habilidade
      )
    );

    return;
  }

  const novaHabilidade =
    copiarHabilidadeDoCatalogo(
      tipo,
      habilidade
    );

  if (tipo === "perfil") {
    estadoHabilidadesFicha
      .perfil
      .push(
        novaHabilidade
      );
  }

  if (tipo === "ocupacao") {
    estadoHabilidadesFicha
      .ocupacao
      .push(
        novaHabilidade
      );
  }

  renderizarHabilidadesFicha(
    novaHabilidade.id
  );

  renderizarCatalogoHabilidades();

  try {
    await salvarHabilidadesFichaImediatamente();

  } catch (erro) {
    console.error(
      "Erro ao adicionar Habilidade:",
      erro
    );

    alert(
      "Não foi possível salvar a Habilidade."
    );
  }
}


function criarCardCatalogoHabilidade(
  habilidade
) {
  const tipo =
    tipoCatalogoHabilidadesAberto;

  const adquirida =
    habilidadeCatalogoJaAdquirida(
      tipo,
      habilidade
    );

  const compativel =
    habilidadeCatalogoCompativel(
      tipo,
      habilidade
    );

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "card-catalogo-habilidade";

  const cabecalho =
    document.createElement(
      "div"
    );

  cabecalho.className =
    "cabecalho-card-catalogo-habilidade";

  const categoria =
    document.createElement(
      "span"
    );

  categoria.className =
    "categoria-habilidade-catalogo";

  categoria.textContent =
    String(
      habilidade.categoria
    );

  const nome =
    document.createElement(
      "strong"
    );

  nome.className =
    "nome-habilidade-catalogo";

  nome.textContent =
    habilidade.nome;

  const botaoExpandir =
    document.createElement(
      "button"
    );

  botaoExpandir.type =
    "button";

  botaoExpandir.className =
    "expandir-habilidade-catalogo";

  botaoExpandir.textContent =
    "▶";

  botaoExpandir.setAttribute(
    "aria-label",
    "Abrir Habilidade"
  );

  const botaoAdicionar =
    document.createElement(
      "button"
    );

  botaoAdicionar.type =
    "button";

  botaoAdicionar.className =
    "adicionar-habilidade-catalogo";

  if (adquirida) {
    botaoAdicionar.classList.add(
      "ja-adicionada"
    );

    botaoAdicionar.textContent =
      "✓";

    botaoAdicionar.title =
      "Habilidade já adicionada";

  } else {
    botaoAdicionar.textContent =
      "+";

    if (!compativel) {
      botaoAdicionar.classList.add(
        "incompativel"
      );

      botaoAdicionar.setAttribute(
        "aria-disabled",
        "true"
      );

      botaoAdicionar.title =
        "Habilidade incompatível";
    }
  }

  cabecalho.append(
    categoria,
    nome,
    botaoExpandir,
    botaoAdicionar
  );


  /* Conteúdo expandido */

  const conteudo =
    document.createElement(
      "div"
    );

  conteudo.className =
    "conteudo-card-catalogo-habilidade";

  conteudo.hidden = true;

  conteudo.innerHTML = `
    <div class="linha-tripla-habilidade">

      <label>
        <span>CUSTO</span>
        <textarea
          rows="1"
          readonly
          data-campo-catalogo="custo"
        ></textarea>
      </label>

      <label>
        <span>ALVO</span>
        <textarea
          rows="1"
          readonly
          data-campo-catalogo="alvo"
        ></textarea>
      </label>

      <label>
        <span>ALCANCE</span>
        <textarea
          rows="1"
          readonly
          data-campo-catalogo="alcance"
        ></textarea>
      </label>

    </div>

    <label class="campo-largo-habilidade">
      <span>RESISTÊNCIA</span>

      <textarea
        rows="1"
        readonly
        data-campo-catalogo="resistencia"
      ></textarea>
    </label>

    <label class="campo-largo-habilidade">
      <span>DESCRIÇÃO</span>

      <textarea
        class="descricao-habilidade-catalogo"
        rows="3"
        readonly
        data-campo-catalogo="descricao"
      ></textarea>
    </label>
  `;

  conteudo
    .querySelectorAll(
      "[data-campo-catalogo]"
    )
    .forEach(
      campo => {
        const chave =
          campo.dataset
            .campoCatalogo;

        campo.value =
          habilidade[chave] || "";
      }
    );


  /* Abrir e fechar */

  botaoExpandir.addEventListener(
    "click",
    () => {
      const abrir =
        conteudo.hidden;

      conteudo.hidden =
        !abrir;

      card.classList.toggle(
        "aberta",
        abrir
      );

      if (abrir) {
        requestAnimationFrame(
          () => {
            conteudo
              .querySelectorAll(
                "textarea"
              )
              .forEach(
                ajustarAlturaCampoHabilidade
              );
          }
        );
      }
    }
  );


  /* Adicionar */

  botaoAdicionar.addEventListener(
    "click",
    () => {
      if (adquirida) {
        alert(
          "Esta Habilidade já foi adicionada ao personagem."
        );

        return;
      }

      if (!compativel) {
        alert(
          textoIncompatibilidadeHabilidade(
            tipo,
            habilidade
          )
        );

        return;
      }

      adicionarHabilidadeDoCatalogo(
        tipo,
        habilidade
      );
    }
  );

  card.append(
    cabecalho,
    conteudo
  );

  return card;
}


function obterHabilidadesCatalogoAtual() {
  if (
    tipoCatalogoHabilidadesAberto ===
      "perfil"
  ) {
    return (
      catalogoCompletoHabilidadesSistema
        .perfis[
          perfilCatalogoHabilidadesAtivo
        ] ||
      []
    );
  }

  if (
    tipoCatalogoHabilidadesAberto ===
      "ocupacao"
  ) {
    return (
      catalogoCompletoHabilidadesSistema
        .ocupacoes[
          ocupacaoCatalogoHabilidades
            .value
        ] ||
      []
    );
  }

  return [];
}


function renderizarCatalogoHabilidades() {
  if (
    !tipoCatalogoHabilidadesAberto
  ) {
    return;
  }

  const pesquisa =
    pesquisaCatalogoHabilidades
      .value;

  const habilidades =
    obterHabilidadesCatalogoAtual()
      .filter(
        habilidade =>
          habilidadeCombinaComPesquisa(
            habilidade,
            pesquisa
          )
      );

  listaCatalogoHabilidades
    .replaceChildren();

  if (!habilidades.length) {
    const aviso =
      document.createElement(
        "p"
      );

    aviso.className =
      "catalogo-habilidades-vazio";

    aviso.textContent =
      pesquisa
        ? "Nenhuma Habilidade encontrada."
        : "Nenhuma Habilidade disponível.";

    listaCatalogoHabilidades
      .appendChild(
        aviso
      );

    return;
  }

  const fragmento =
    document.createDocumentFragment();

  habilidades.forEach(
    habilidade => {
      fragmento.appendChild(
        criarCardCatalogoHabilidade(
          habilidade
        )
      );
    }
  );

  listaCatalogoHabilidades
    .appendChild(
      fragmento
    );
}


function preencherSelectOcupacoesCatalogo() {
  ocupacaoCatalogoHabilidades
    .replaceChildren();

  const ocupacoesCatalogo =
    Object.keys(
      catalogoCompletoHabilidadesSistema
        .ocupacoes
    );

  ocupacoesCatalogo.forEach(
    id => {
      const opcao =
        document.createElement(
          "option"
        );

      opcao.value =
        id;

      opcao.textContent =
        nomeOcupacaoHabilidadeFicha(
          id
        );

      ocupacaoCatalogoHabilidades
        .appendChild(
          opcao
        );
    }
  );

  const ocupacoesPersonagem = [
    campoOcupacaoHabilidadesFicha
      .value,

    campoOcupacao2HabilidadesFicha
      .value
  ].filter(Boolean);

  const primeiraCompativel =
    ocupacoesPersonagem.find(
      id =>
        ocupacoesCatalogo.includes(
          id
        )
    );

  ocupacaoCatalogoHabilidades.value =
    primeiraCompativel ||
    ocupacoesCatalogo[0] ||
    "";
}


function atualizarMenuPerfisCatalogo() {
  botoesPerfisCatalogoHabilidades
    .forEach(
      botao => {
        botao.classList.toggle(
          "ativa",
          botao.dataset
            .perfilCatalogo ===
              perfilCatalogoHabilidadesAtivo
        );
      }
    );
}


function abrirCatalogoHabilidades(
  tipo
) {
  tipoCatalogoHabilidadesAberto =
    tipo;

  pesquisaCatalogoHabilidades.value =
    "";

  fundoCatalogoHabilidades.hidden =
    false;

  document.body.classList.add(
    "catalogo-habilidades-aberto"
  );

  if (tipo === "perfil") {
    menuPerfisCatalogoHabilidades.hidden =
      false;

    menuOcupacoesCatalogoHabilidades.hidden =
      true;

    perfilCatalogoHabilidadesAtivo =
      campoPerfilHabilidadesFicha
        .value ||
      "adaptativo";

    atualizarMenuPerfisCatalogo();

  } else {
    menuPerfisCatalogoHabilidades.hidden =
      true;

    menuOcupacoesCatalogoHabilidades.hidden =
      false;

    preencherSelectOcupacoesCatalogo();
  }

  renderizarCatalogoHabilidades();

  requestAnimationFrame(
    () => {
      pesquisaCatalogoHabilidades
        .focus();
    }
  );
}


function fecharCatalogoHabilidadesFicha() {
  fundoCatalogoHabilidades.hidden =
    true;

  tipoCatalogoHabilidadesAberto =
    null;

  document.body.classList.remove(
    "catalogo-habilidades-aberto"
  );
}


botaoAdicionarHabilidadePerfil
  ?.addEventListener(
    "click",
    () => {
      abrirCatalogoHabilidades(
        "perfil"
      );
    }
  );


botaoAdicionarHabilidadeOcupacao
  ?.addEventListener(
    "click",
    () => {
      abrirCatalogoHabilidades(
        "ocupacao"
      );
    }
  );


fecharCatalogoHabilidades
  ?.addEventListener(
    "click",
    fecharCatalogoHabilidadesFicha
  );


fundoCatalogoHabilidades
  ?.addEventListener(
    "click",
    evento => {
      if (
        evento.target ===
          fundoCatalogoHabilidades
      ) {
        fecharCatalogoHabilidadesFicha();
      }
    }
  );


document.addEventListener(
  "keydown",
  evento => {
    if (
      evento.key === "Escape" &&
      !fundoCatalogoHabilidades.hidden
    ) {
      fecharCatalogoHabilidadesFicha();
    }
  }
);


pesquisaCatalogoHabilidades
  ?.addEventListener(
    "input",
    renderizarCatalogoHabilidades
  );


botoesPerfisCatalogoHabilidades
  .forEach(
    botao => {
      botao.addEventListener(
        "click",
        () => {
          perfilCatalogoHabilidadesAtivo =
            botao.dataset
              .perfilCatalogo;

          atualizarMenuPerfisCatalogo();
          renderizarCatalogoHabilidades();
        }
      );
    }
  );


ocupacaoCatalogoHabilidades
  ?.addEventListener(
    "change",
    renderizarCatalogoHabilidades
  );

/* Preencher a aba */

async function preencherHabilidadesFicha(ficha) {
  await promessaOcupacoesFicha;
  await promessaCatalogoHabilidadesSistema;

  await preencherCabecalhoHabilidadesFicha(ficha);

  const salvo = normalizarEstadoHabilidadesFicha(ficha.habilidades);

  if (salvo.inicializadas) {
    estadoHabilidadesFicha = salvo;

  } else {
    estadoHabilidadesFicha = await criarEstadoInicialHabilidadesFicha(ficha);

    try {
      await salvarHabilidadesFichaImediatamente();

    } catch (erro) {
      console.error("Não foi possível salvar a inicialização das Habilidades:", erro);
    }
  }

  renderizarHabilidadesFicha();
}


/* Sincronização com Informações e Painel Principal */

campoPerfilHabilidadesFicha ?.addEventListener("change", () => {
  campoPerfilFicha.value = campoPerfilHabilidadesFicha.value;
  salvarInformacoesFicha();
});

campoOcupacaoHabilidadesFicha ?.addEventListener("change", () => {
  const novaOcupacao = campoOcupacaoHabilidadesFicha.value;
  campoOcupacao1Ficha.value = novaOcupacao;

  if (novaOcupacao && campoOcupacao2Ficha.value === novaOcupacao) {
    campoOcupacao2Ficha.value = "";
    campoOcupacao2HabilidadesFicha.value = "";
  }
  
  salvarInformacoesFicha();
});

campoOcupacao2HabilidadesFicha
  ?.addEventListener(
    "change",
    () => {
      const novaOcupacao =
        campoOcupacao2HabilidadesFicha
          .value;

      if (
        novaOcupacao &&
        novaOcupacao ===
          campoOcupacao1Ficha.value
      ) {
        campoOcupacao2HabilidadesFicha.value =
          "";

        campoOcupacao2Ficha.value =
          "";

      } else {
        campoOcupacao2Ficha.value =
          novaOcupacao;
      }

      salvarInformacoesFicha();
    }
  );

campoNivelPerfilHabilidadesFicha
  ?.addEventListener(
    "change",
    () => {
      const campoNcp =
        document.getElementById(
          "ncp-ficha"
        );

      if (!campoNcp) return;

      campoNcp.value =
        campoNivelPerfilHabilidadesFicha
          .value;

      campoNcp.dispatchEvent(
        new Event("change")
      );
    }
  );

campoNivelOcupacaoHabilidadesFicha
  ?.addEventListener(
    "change",
    () => {
      const campoNeo =
        document.getElementById(
          "neo-ficha"
        );

      if (!campoNeo) return;

      campoNeo.value =
        campoNivelOcupacaoHabilidadesFicha
          .value;

      campoNeo.dispatchEvent(
        new Event("change")
      );
    }
  );

campoPerfilFicha.addEventListener(
  "change",
  () => {
    campoPerfilHabilidadesFicha.value =
      campoPerfilFicha.value;
  }
);

campoOcupacao1Ficha.addEventListener(
  "change",
  sincronizarCabecalhoHabilidadesComFicha
);

campoOcupacao2Ficha.addEventListener(
  "change",
  sincronizarCabecalhoHabilidadesComFicha
);
document
  .getElementById(
    "ncp-ficha"
  )
  ?.addEventListener(
    "change",
    evento => {
      campoNivelPerfilHabilidadesFicha.value =
        evento.target.value;
    }
  );

document.getElementById("neo-ficha")?.addEventListener("change", evento => {
  campoNivelOcupacaoHabilidadesFicha.value = evento.target.value;
});

/* Inventário */
const listaInventarioFicha = document.getElementById("lista-inventario-ficha");
const contadorCargaFicha = document.getElementById("contador-carga-ficha");
const creditoInventarioFicha = document.getElementById("credito-inventario-ficha");
const botaoAdicionarItemFicha = document.getElementById("adicionar-item-ficha");
const botaoCriarItemFicha = document.getElementById("criar-item-ficha");
const criadorItemFicha = document.getElementById("criador-item-ficha");
const nomeCriarItemFicha = document.getElementById("nome-criar-item-ficha");
const pesoCriarItemFicha = document.getElementById("peso-criar-item-ficha");
const custoPcCriarItemFicha = document.getElementById("custo-pc-criar-item-ficha");
const custoCreditoCriarItemFicha = document.getElementById("custo-credito-criar-item-ficha");
const descricaoCriarItemFicha = document.getElementById("descricao-criar-item-ficha");
const confirmarCriarItemFicha = document.getElementById("confirmar-criar-item-ficha");
const fundoCatalogoItensFicha = document.getElementById("fundo-catalogo-itens");
const fecharCatalogoItensFicha = document.getElementById("fechar-catalogo-itens");
const pesquisaCatalogoItensFicha = document.getElementById("pesquisa-catalogo-itens");
const creditoCatalogoItensFicha = document.getElementById("credito-catalogo-itens");
const listaCatalogoItensFicha = document.getElementById("lista-catalogo-itens");
let inventarioFicha = [];
let catalogoItensFicha = [];
let custosCreditoItensFicha = {};
let capacidadeCargaMaximaFicha = 0;
let filaSalvamentoInventarioFicha = Promise.resolve();
let timerSalvamentoInventarioFicha = null;
let operacaoInventarioFichaEmAndamento = false;
function formatarNumeroInventarioFicha(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";
  return new Intl.NumberFormat("pt-BR",{minimumFractionDigits: 0,maximumFractionDigits: 2}).format(numero);
}
function formatarCreditoInventarioFicha(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";
  return new Intl.NumberFormat("pt-BR",{minimumFractionDigits: 0,maximumFractionDigits: 2}).format(numero);
}
function normalizarNomeItemFicha(nome) {
  return String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s*[—–-]\s*\d+\s+balas?\s*$/i,"").replace(/[^a-z0-9]+/g," ").trim();
}
function criarIdItemFicha(nome,categoria = "item") {
  return `${categoria}-${normalizarNomeItemFicha(nome).replace(/\s+/g,"-")}`;
}
function extrairNumeroItemFicha(texto) {
  const resultado = String(texto || "").match(/-?\d+(?:[.,]\d+)?/);
  return resultado ? Number(resultado[0].replace(",",".")) : NaN;
}
function extrairCreditoItemFicha(texto) {
  const valor = String(texto || "").replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",",".");
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}
function extrairTextoComQuebrasItemFicha(celula) {
  if (!celula) return "";
  const copia = celula.cloneNode(true);
  copia.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
  return copia.textContent.replace(/[ \t]+\n/g,"\n").replace(/\n[ \t]+/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
function obterCreditoAtualInventarioFicha() {
  const campo = document.getElementById("credito-ficha");
  const creditoCampo = Number(campo?.value);
  if (Number.isFinite(creditoCampo)) return creditoCampo;
  const creditoSalvo = Number(dadosFichaAtual?.credito);
  return Number.isFinite(creditoSalvo) ? creditoSalvo : 0;
}
function definirCreditoAtualInventarioFicha(valor) {
  const credito = Math.round(Number(valor) * 100) / 100;
  const campo = document.getElementById("credito-ficha");
  if (campo) campo.value = credito;
  if (dadosFichaAtual) dadosFichaAtual.credito = credito;
  atualizarCreditoInventarioFicha();
}
function atualizarCreditoInventarioFicha() {
  const credito = obterCreditoAtualInventarioFicha();
  if (creditoInventarioFicha) creditoInventarioFicha.textContent = `R$ ${formatarCreditoInventarioFicha(credito)}`;
  if (creditoCatalogoItensFicha) creditoCatalogoItensFicha.textContent = `R$ ${formatarCreditoInventarioFicha(credito)}`;
}
function obterPesoAtualInventarioFicha() {
  return inventarioFicha.reduce((total,item) => {
    const peso = Number(item.peso);
    return total + (Number.isFinite(peso) ? peso : 0);
  },0);
}
function obterCustoFinalItemFicha(item) {
  const custoFinal = Number(item.custoFinal);
  if (Number.isFinite(custoFinal)) return custoFinal;
  const custoBase = Number(item.custoBase);
  if (Number.isFinite(custoBase)) return custoBase;
  const custo = Number(item.custo);
  return Number.isFinite(custo) ? custo : 0;
}
function obterCustoCreditoItemFicha(item) {
  const custoSalvo = Number(item.custoCredito);
  if (Number.isFinite(custoSalvo)) return custoSalvo;
  const custoSistema = custosCreditoItensFicha[normalizarNomeItemFicha(item.nome)];
  return Number.isFinite(custoSistema) ? custoSistema : null;
}
function atualizarContadorCargaFicha() {
  if (!contadorCargaFicha) return;
  const pesoAtual = obterPesoAtualInventarioFicha();
  contadorCargaFicha.textContent = `${formatarNumeroInventarioFicha(pesoAtual)} / ${formatarNumeroInventarioFicha(capacidadeCargaMaximaFicha)}`;
}
function ajustarAlturaDescricaoItemFicha(campo) {
  campo.style.height = "auto";
  campo.style.height = `${Math.max(65,campo.scrollHeight)}px`;
}
async function carregarCatalogoItensFicha() {
  try {
    const resposta = await fetch("index-sistema.html");
    if (!resposta.ok) throw new Error("Não foi possível abrir index-sistema.html.");
    const html = await resposta.text();
    const documento = new DOMParser().parseFromString(html,"text/html");
    const tabelaCredito = documento.querySelector(".tabela-credito-itens");
    const custosCredito = {};
    tabelaCredito?.querySelectorAll("tbody tr").forEach(linha => {
      const celulas = linha.querySelectorAll("td");
      const nome = celulas[0]?.textContent.trim() || "";
      const custo = extrairCreditoItemFicha(celulas[1]?.textContent);
      if (!nome || custo === null) return;
      custosCredito[normalizarNomeItemFicha(nome)] = custo;
    });
    custosCreditoItensFicha = custosCredito;
    const itens = [];
    documento.querySelectorAll(".tabela-itens").forEach(tabela => {
      const areaTabela = tabela.closest(".area-tabela-itens");
      let tituloAnterior = areaTabela?.previousElementSibling || null;
      while (tituloAnterior && tituloAnterior.tagName !== "H3") tituloAnterior = tituloAnterior.previousElementSibling;
      const titulo = normalizarNomeItemFicha(tituloAnterior?.textContent);
      const categoria = titulo.includes("especiais") ? "especial" : "comum";
      tabela.querySelectorAll("tbody tr").forEach(linha => {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 4) return;
        const nome = celulas[0]?.textContent.trim() || "";
        const descricao = extrairTextoComQuebrasItemFicha(celulas[1]);
        const peso = extrairNumeroItemFicha(celulas[2]?.textContent);
        const custoPc = extrairNumeroItemFicha(celulas[3]?.textContent);
        const compatibilidadeTexto = celulas[4]?.textContent.trim() || "";
        if (!nome || !Number.isFinite(peso) || !Number.isFinite(custoPc)) return;
        const compatibilidades = compatibilidadeTexto && compatibilidadeTexto !== "-" ? compatibilidadeTexto.split(",").map(valor => valor.trim()).filter(Boolean) : [];
        itens.push({
          id: criarIdItemFicha(nome,categoria),
          nome: nome,
          descricao: descricao,
          peso: peso,
          custo: custoPc,
          custoBase: custoPc,
          custoFinal: custoPc,
          custoCredito: custosCredito[normalizarNomeItemFicha(nome)] ?? null,
          compatibilidades: compatibilidades,
          categoria: categoria,
          personalizado: false
        });
      });
    });
    catalogoItensFicha = itens;
    return true;
  } catch (erro) {
    console.error("Erro ao carregar catálogo de Itens:",erro);
    catalogoItensFicha = [];
    custosCreditoItensFicha = {};
    return false;
  }
}
const promessaCatalogoItensFicha = carregarCatalogoItensFicha();
function salvarInventarioFichaAgora() {
  if (dadosFichaAtual) dadosFichaAtual.inventario = inventarioFicha.map(item => ({...item}));
  if (previewLocal || !auth.currentUser || !idFicha) return Promise.resolve();
  const inventarioParaSalvar = inventarioFicha.map(item => ({...item}));
  filaSalvamentoInventarioFicha = filaSalvamentoInventarioFicha.catch(() => {}).then(async () => {
    await db.collection("fichas").doc(idFicha).update({
      inventario: inventarioParaSalvar,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  return filaSalvamentoInventarioFicha.catch(erro => {
    console.error("Erro ao salvar Inventário:",erro);
    throw erro;
  });
}
function agendarSalvamentoInventarioFicha() {
  clearTimeout(timerSalvamentoInventarioFicha);
  timerSalvamentoInventarioFicha = setTimeout(() => {
    salvarInventarioFichaAgora().catch(() => {});
  },400);
}
function criarCardItemFicha(item) {
  const card = document.createElement("article");
  card.className = "card-item-ficha";
  const cabecalho = document.createElement("div");
  cabecalho.className = "cabecalho-card-item-ficha";
  const nome = document.createElement("strong");
  nome.className = "nome-item-ficha";
  nome.textContent = item.nome || "Item";
  const peso = document.createElement("span");
  peso.className = "dado-item-ficha peso-item-ficha";
  peso.textContent = `Peso: ${formatarNumeroInventarioFicha(item.peso)}`;
  const custo = document.createElement("span");
  custo.className = "dado-item-ficha custo-item-ficha";
  const custoCredito = obterCustoCreditoItemFicha(item);
  custo.textContent = `Custo: ${formatarNumeroInventarioFicha(obterCustoFinalItemFicha(item))} PC / R$ ${custoCredito === null ? "—" : formatarCreditoInventarioFicha(custoCredito)}`;
  const botaoExpandir = document.createElement("button");
  botaoExpandir.type = "button";
  botaoExpandir.className = "expandir-item-ficha";
  botaoExpandir.textContent = "▶";
  botaoExpandir.setAttribute("aria-label","Expandir Item");
  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "excluir-item-ficha";
  botaoExcluir.textContent = "🗑";
  botaoExcluir.setAttribute("aria-label","Excluir Item");
  botaoExcluir.title = "Excluir Item";
  botaoExcluir.addEventListener("click",async () => {
    if (operacaoInventarioFichaEmAndamento) return;
    const confirmarExclusao = confirm(`Excluir "${item.nome || "Item"}" do Inventário?`);
    if (!confirmarExclusao) return;
    const indice = inventarioFicha.indexOf(item);
    if (indice < 0) return;
    const inventarioAnterior = inventarioFicha.map(itemAnterior => ({...itemAnterior}));
    operacaoInventarioFichaEmAndamento = true;
    inventarioFicha.splice(indice,1);
    renderizarInventarioFicha();
    try {
      await salvarInventarioFichaAgora();
    } catch (erro) {
      console.error("Erro ao excluir Item:",erro);
      inventarioFicha = inventarioAnterior;
      renderizarInventarioFicha();
      alert("Não foi possível excluir o Item.");
    } finally {
      operacaoInventarioFichaEmAndamento = false;
    }
  });
  const conteudo = document.createElement("div");
  conteudo.className = "conteudo-card-item-ficha";
  conteudo.hidden = true;
  const campoDescricao = document.createElement("label");
  campoDescricao.className = "campo-descricao-item-ficha";
  const tituloDescricao = document.createElement("span");
  tituloDescricao.textContent = "DESCRIÇÃO";
  const descricao = document.createElement("textarea");
  descricao.className = "descricao-item-ficha";
  descricao.rows = 3;
  descricao.placeholder = "Descrição do Item...";
  descricao.value = typeof item.descricao === "string" ? item.descricao : "";
  descricao.addEventListener("input",() => {
    item.descricao = descricao.value;
    ajustarAlturaDescricaoItemFicha(descricao);
    agendarSalvamentoInventarioFicha();
  });
  botaoExpandir.addEventListener("click",() => {
    const abrir = conteudo.hidden;
    conteudo.hidden = !abrir;
    card.classList.toggle("aberto",abrir);
    if (abrir) requestAnimationFrame(() => ajustarAlturaDescricaoItemFicha(descricao));
  });
  campoDescricao.append(tituloDescricao,descricao);
  conteudo.appendChild(campoDescricao);
  cabecalho.append(nome,peso,custo,botaoExpandir,botaoExcluir);
  card.append(cabecalho,conteudo);
  return card;
}
function renderizarInventarioFicha() {
  if (!listaInventarioFicha) return;
  listaInventarioFicha.replaceChildren();
  atualizarContadorCargaFicha();
  atualizarCreditoInventarioFicha();
  if (inventarioFicha.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "inventario-ficha-vazio";
    vazio.textContent = "Nenhum Item no Inventário.";
    listaInventarioFicha.appendChild(vazio);
    return;
  }
  const fragmento = document.createDocumentFragment();
  inventarioFicha.forEach(item => fragmento.appendChild(criarCardItemFicha(item)));
  listaInventarioFicha.appendChild(fragmento);
}
function itemCatalogoCorrespondePesquisaFicha(item,pesquisa) {
  const termo = normalizarNomeItemFicha(pesquisa);
  if (!termo) return true;
  const texto = normalizarNomeItemFicha(`${item.nome} ${item.descricao} ${item.categoria}`);
  return texto.includes(termo);
}
function criarCardCatalogoItemFicha(item) {
  const card = document.createElement("article");
  card.className = "card-catalogo-item-ficha";
  const cabecalho = document.createElement("div");
  cabecalho.className = "cabecalho-card-catalogo-item-ficha";
  const informacoes = document.createElement("div");
  informacoes.className = "informacoes-catalogo-item-ficha";
  const nome = document.createElement("strong");
  nome.className = "nome-catalogo-item-ficha";
  nome.textContent = item.nome;
  const dados = document.createElement("div");
  dados.className = "dados-catalogo-item-ficha";
  const peso = document.createElement("span");
  peso.textContent = `Peso: ${formatarNumeroInventarioFicha(item.peso)}`;
  const custo = document.createElement("span");
  const custoCredito = obterCustoCreditoItemFicha(item);
  custo.textContent = `Custo: ${formatarNumeroInventarioFicha(item.custoFinal)} PC / R$ ${custoCredito === null ? "—" : formatarCreditoInventarioFicha(custoCredito)}`;
  dados.append(peso,custo);
  informacoes.append(nome,dados);
  const botaoExpandir = document.createElement("button");
  botaoExpandir.type = "button";
  botaoExpandir.className = "expandir-catalogo-item-ficha";
  botaoExpandir.textContent = "▶";
  botaoExpandir.setAttribute("aria-label","Abrir Item");
  const botaoAdicionar = document.createElement("button");
  botaoAdicionar.type = "button";
  botaoAdicionar.className = "adicionar-catalogo-item-ficha";
  botaoAdicionar.textContent = "+";
  const creditoAtual = obterCreditoAtualInventarioFicha();
  const possuiPreco = custoCredito !== null;
  const possuiCredito = possuiPreco && creditoAtual >= custoCredito;
  if (!possuiPreco || !possuiCredito) {
    botaoAdicionar.classList.add("indisponivel");
    botaoAdicionar.setAttribute("aria-disabled","true");
  }
  const conteudo = document.createElement("div");
  conteudo.className = "conteudo-catalogo-item-ficha";
  conteudo.hidden = true;
  const tituloDescricao = document.createElement("span");
  tituloDescricao.textContent = "DESCRIÇÃO";
  const descricao = document.createElement("textarea");
  descricao.rows = 3;
  descricao.readOnly = true;
  descricao.value = item.descricao || "";
  conteudo.append(tituloDescricao,descricao);
  botaoExpandir.addEventListener("click",() => {
    const abrir = conteudo.hidden;
    conteudo.hidden = !abrir;
    card.classList.toggle("aberto",abrir);
    if (abrir) requestAnimationFrame(() => ajustarAlturaDescricaoItemFicha(descricao));
  });
  botaoAdicionar.addEventListener("click",async () => {
    if (!possuiPreco) {
      alert("Este Item não possui Custo em Crédito definido no Sistema.");
      return;
    }
    if (obterCreditoAtualInventarioFicha() < custoCredito) {
      alert("Você não possui Crédito suficiente para adquirir este Item.");
      return;
    }
    await adicionarItemAoInventarioFicha({
      ...item,
      custoCredito: custoCredito
    },custoCredito);
  });
  cabecalho.append(informacoes,botaoExpandir,botaoAdicionar);
  card.append(cabecalho,conteudo);
  return card;
}
function renderizarCatalogoItensFicha() {
  if (!listaCatalogoItensFicha) return;
  atualizarCreditoInventarioFicha();
  const pesquisa = pesquisaCatalogoItensFicha?.value || "";
  const itens = catalogoItensFicha.filter(item => itemCatalogoCorrespondePesquisaFicha(item,pesquisa));
  listaCatalogoItensFicha.replaceChildren();
  if (itens.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "catalogo-itens-vazio";
    vazio.textContent = pesquisa ? "Nenhum Item encontrado." : "Nenhum Item disponível.";
    listaCatalogoItensFicha.appendChild(vazio);
    return;
  }
  const fragmento = document.createDocumentFragment();
  itens.forEach(item => fragmento.appendChild(criarCardCatalogoItemFicha(item)));
  listaCatalogoItensFicha.appendChild(fragmento);
}
async function abrirCatalogoItensFicha() {
  await promessaCatalogoItensFicha;
  pesquisaCatalogoItensFicha.value = "";
  fundoCatalogoItensFicha.hidden = false;
  document.body.classList.add("catalogo-itens-aberto");
  renderizarCatalogoItensFicha();
  requestAnimationFrame(() => pesquisaCatalogoItensFicha.focus());
}
function fecharCatalogoItens() {
  fundoCatalogoItensFicha.hidden = true;
  document.body.classList.remove("catalogo-itens-aberto");
}
async function adicionarItemAoInventarioFicha(item,custoCredito) {
  if (operacaoInventarioFichaEmAndamento) return false;
  const creditoAnterior = obterCreditoAtualInventarioFicha();
  const custo = Number(custoCredito);
  if (!Number.isFinite(custo) || custo < 0) return false;
  if (creditoAnterior < custo) {
    alert("Você não possui Crédito suficiente para adquirir este Item.");
    return false;
  }
  operacaoInventarioFichaEmAndamento = true;
  const inventarioAnterior = inventarioFicha.map(itemAtual => ({...itemAtual}));
  const novoCredito = Math.round((creditoAnterior - custo) * 100) / 100;
  inventarioFicha.push({...item});
  definirCreditoAtualInventarioFicha(novoCredito);
  renderizarInventarioFicha();
  renderizarCatalogoItensFicha();
  if (previewLocal) {
    operacaoInventarioFichaEmAndamento = false;
    return true;
  }
  const inventarioParaSalvar = inventarioFicha.map(itemAtual => ({...itemAtual}));
  const salvamento = filaSalvamentoInventarioFicha.catch(() => {}).then(async () => {
    await db.collection("fichas").doc(idFicha).update({
      inventario: inventarioParaSalvar,
      credito: novoCredito,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  filaSalvamentoInventarioFicha = salvamento;
  try {
    await salvamento;
    if (dadosFichaAtual) {
      dadosFichaAtual.inventario = inventarioFicha.map(itemAtual => ({...itemAtual}));
      dadosFichaAtual.credito = novoCredito;
    }
    operacaoInventarioFichaEmAndamento = false;
    renderizarCatalogoItensFicha();
    return true;
  } catch (erro) {
    console.error("Erro ao adicionar Item:",erro);
    inventarioFicha = inventarioAnterior;
    definirCreditoAtualInventarioFicha(creditoAnterior);
    renderizarInventarioFicha();
    renderizarCatalogoItensFicha();
    operacaoInventarioFichaEmAndamento = false;
    alert("Não foi possível adicionar o Item.");
    return false;
  }
}
function limparCriadorItemFicha() {
  nomeCriarItemFicha.value = "";
  pesoCriarItemFicha.value = "";
  custoPcCriarItemFicha.value = "";
  custoCreditoCriarItemFicha.value = "";
  descricaoCriarItemFicha.value = "";
}
async function criarItemPersonalizadoFicha() {
  const nome = nomeCriarItemFicha.value.trim();
  const pesoTexto = pesoCriarItemFicha.value.trim();
  const custoPcTexto = custoPcCriarItemFicha.value.trim();
  const custoCreditoTexto = custoCreditoCriarItemFicha.value.trim();
  const descricao = descricaoCriarItemFicha.value.trim();
  if (!nome || pesoTexto === "" || custoPcTexto === "" || custoCreditoTexto === "") {
    alert("Preencha o Nome, Peso, Custo em PC e Custo em R$ do Item.");
    return;
  }
  const peso = Number(pesoTexto);
  const custoPc = Number(custoPcTexto);
  const custoCredito = Number(custoCreditoTexto);
  if (!Number.isFinite(peso) || !Number.isFinite(custoPc) || custoPc < 0 || !Number.isFinite(custoCredito) || custoCredito < 0) {
    alert("Confira os valores de Peso e Custo do Item.");
    return;
  }
  if (obterCreditoAtualInventarioFicha() < custoCredito) {
    alert("Você não possui Crédito suficiente para criar este Item com esse custo.");
    return;
  }
  const item = {
    id: `${criarIdItemFicha(nome,"personalizado")}-${Date.now()}`,
    nome: nome,
    descricao: descricao,
    peso: peso,
    custo: custoPc,
    custoBase: custoPc,
    custoFinal: custoPc,
    custoCredito: custoCredito,
    compatibilidades: [],
    categoria: "personalizado",
    personalizado: true
  };
  const adicionado = await adicionarItemAoInventarioFicha(item,custoCredito);
  if (!adicionado) return;
  limparCriadorItemFicha();
  criadorItemFicha.hidden = true;
  botaoCriarItemFicha.classList.remove("ativo");
}
async function preencherInventarioFicha(ficha) {
  await promessaCatalogoItensFicha;
  inventarioFicha = Array.isArray(ficha.inventario) ? ficha.inventario.map(item => ({
    ...item,
    descricao: typeof item.descricao === "string" ? item.descricao : ""
  })) : [];
  const capacidade = Number(ficha.capacidadeCarga);
  capacidadeCargaMaximaFicha = Number.isFinite(capacidade) ? capacidade : 0;
  renderizarInventarioFicha();
}
botaoAdicionarItemFicha?.addEventListener("click",abrirCatalogoItensFicha);
botaoCriarItemFicha?.addEventListener("click",() => {
  const abrir = criadorItemFicha.hidden;
  criadorItemFicha.hidden = !abrir;
  botaoCriarItemFicha.classList.toggle("ativo",abrir);
  if (abrir) requestAnimationFrame(() => nomeCriarItemFicha.focus());
});
confirmarCriarItemFicha?.addEventListener("click",criarItemPersonalizadoFicha);
fecharCatalogoItensFicha?.addEventListener("click",fecharCatalogoItens);
pesquisaCatalogoItensFicha?.addEventListener("input",renderizarCatalogoItensFicha);
fundoCatalogoItensFicha?.addEventListener("click",evento => {
  if (evento.target === fundoCatalogoItensFicha) fecharCatalogoItens();
});
document.addEventListener("keydown",evento => {
  if (evento.key === "Escape" && fundoCatalogoItensFicha && !fundoCatalogoItensFicha.hidden) fecharCatalogoItens();
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
const contadorPontosPericiasFicha = document.getElementById("contador-pontos-pericias-ficha");
const contadorNaturaisPericiasFicha = document.getElementById("contador-naturais-pericias-ficha");

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
let modificadoresPericiasLayout = {};
let limitePontosPericiasFicha = 25;

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
let cancelarEscutaRecursosFicha = null;


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

function renderizarContadoresPericiasFicha() {
  let pontosPericias = 0;
  let bonusNaturais = 0;

  Object.values(
    estadoPericiasFicha
  ).forEach(
    dados => {
      const valor =
        Number(dados.valor) || 0;

      const bonusNatural =
        Number(
          dados.bonusNatural
        ) || 0;

      /*
        Remove o bônus Natural para
        descobrir o valor normal
        distribuído na Perícia.
      */

      const valorDistribuido =
        valor - bonusNatural;

      /*
        A base de toda Perícia é 4.

        Só contamos como pontos gastos
        aquilo que estiver acima de 4.
      */

      if (valorDistribuido > 4) {
        pontosPericias +=
          valorDistribuido - 4;
      }

      bonusNaturais +=
        bonusNatural;
    }
  );

  contadorPontosPericiasFicha
    .textContent =
      `${pontosPericias} / ${limitePontosPericiasFicha}`;

  contadorNaturaisPericiasFicha
    .textContent =
      `NATURAIS: ${bonusNaturais} / 5`;
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
        document.createElement(
          "span"
        );

      bonus.className =
        "bonus-natural-ficha";

      bonus.textContent =
        `+${dados.bonusNatural}`;

      grupoValores.appendChild(
        bonus
      );

    } else {
      const espacoBonus =
        document.createElement(
          "span"
        );

      espacoBonus.className =
        "espaco-bonus-natural-ficha";

      grupoValores.appendChild(
        espacoBonus
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

    const extremo = document.createElement("span");

    extremo.className = "valor-extremo-ficha";

    extremo.textContent = Math.floor(dados.valor / 5);

    const modificador = document.createElement("textarea");

    modificador.className =
      "modificador-pericia-ficha";

    modificador.rows = 1;
    modificador.wrap = "off";

    modificador.placeholder =
      "Ex.: +1d20";

    modificador.value =
      modificadoresPericiasLayout[
        pericia.id
      ] || "";

    modificador.addEventListener(
      "input",
      () => {
        modificadoresPericiasLayout[
          pericia.id
        ] =
          modificador.value;
      }
    );

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
      extremo,
      modificador
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

  renderizarContadoresPericiasFicha();
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

  let pontosRecuperadosCriacao = 0;

  Object.values(
    periciasSalvas
  ).forEach(
    salva => {
      const valorDistribuido =
        Number(
          salva.valorDistribuido
        );

      if (Number.isFinite(valorDistribuido) &&valorDistribuido < 4) {
        pontosRecuperadosCriacao += 4 - valorDistribuido;
      }
    }
  );

  limitePontosPericiasFicha = 25 + pontosRecuperadosCriacao;

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
      dadosFichaAtual.credito = credito;
    }

    atualizarCreditoInventarioFicha();
    if (fundoCatalogoItensFicha && !fundoCatalogoItensFicha.hidden) renderizarCatalogoItensFicha();

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

function arredondarDeslocamentoFicha(
  valor
) {
  return (
    Math.floor(
      (valor + 0.0000001) * 10
    ) / 10
  );
}

function atualizarDeslocamentoFicha(
  metros,
  quadrados
) {
  estadoAtributosFicha
    .deslocamentoMetros =
      metros;

  estadoAtributosFicha
    .deslocamentoQuadrados =
      quadrados;

  campoDeslocamentoMetrosFicha.value =
    metros;

  campoDeslocamentoQuadradosFicha.value =
    quadrados;

  if (dadosFichaAtual) {
    dadosFichaAtual.atributos ||= {};

    dadosFichaAtual
      .atributos
      .deslocamentoMetros =
        metros;

    dadosFichaAtual
      .atributos
      .deslocamentoQuadrados =
        quadrados;
  }

  salvarAtualizacaoPontosFicha({
    "atributos.deslocamentoMetros":
      metros,

    "atributos.deslocamentoQuadrados":
      quadrados
  });
}

campoDeslocamentoMetrosFicha.addEventListener("change", () => {
  const metros = Number(campoDeslocamentoMetrosFicha.value);

  if (!Number.isFinite(metros) || metros < 0) {
    campoDeslocamentoMetrosFicha.value = estadoAtributosFicha.deslocamentoMetros;
    return;
  }

  const metrosFinal = arredondarDeslocamentoFicha(metros);

  const quadradosFinal = arredondarDeslocamentoFicha(metrosFinal / 1.5);

  atualizarDeslocamentoFicha(metrosFinal, quadradosFinal);
});

campoDeslocamentoQuadradosFicha
  .addEventListener(
    "change",
    () => {
      const quadrados =
        Number(
          campoDeslocamentoQuadradosFicha
            .value
        );

      if (
        !Number.isFinite(quadrados) ||
        quadrados < 0
      ) {
        campoDeslocamentoQuadradosFicha
          .value =
            estadoAtributosFicha
              .deslocamentoQuadrados;

        return;
      }

      const quadradosFinal =
        arredondarDeslocamentoFicha(
          quadrados
        );

      const metrosFinal =
        arredondarDeslocamentoFicha(
          quadradosFinal * 1.5
        );

      atualizarDeslocamentoFicha(metrosFinal, quadradosFinal);
    });


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
  removivel = true
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

    dado.appendChild(
      opcao
    );
  });

  linha.append(
    quantidade,
    dado
  );

  if (removivel) {
    const botaoRemover =
      document.createElement(
        "button"
      );

    botaoRemover.type =
      "button";

    botaoRemover.className =
      "remover-dado-rolagem";

    botaoRemover.textContent =
      "×";

    botaoRemover.addEventListener(
      "click",
      () => {
        linha.remove();
      }
    );

    linha.appendChild(
      botaoRemover
    );
  }

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
            indice !== 0
          )
        );
    }
  );

  const botaoAdicionar =
    document.createElement(
      "button"
    );

  botaoAdicionar.type =
    "button";

  botaoAdicionar.className =
    "adicionar-dado-rolagem";

  botaoAdicionar.textContent =
    "+";

  botaoAdicionar.title =
    "Adicionar outro dado";

  botaoAdicionar.addEventListener(
    "click",
    () => {
      const novaLinha =
        criarLinhaDadoOutroFicha(
          {
            quantidade: 1,
            lados: 20
          },
          true
        );

      areaRolagemOutroFicha
        .insertBefore(
          novaLinha,
          botaoAdicionar
        );
    }
  );

  areaRolagemOutroFicha
    .appendChild(
      botaoAdicionar
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
      const grupo =
        document.createElement(
          "div"
        );

      grupo.className =
        "resultado-dado-outro-ficha";

      const dado =
        criarResultadoDadoFicha(
          resultado.valor
        );

      const tipo =
        document.createElement(
          "span"
        );

      tipo.className =
        "tipo-dado-resultado";

      tipo.textContent =
        `d${resultado.lados}`;

      grupo.append(
        dado,
        tipo
      );

      dadosResultadoFicha
        .appendChild(
          grupo
        );
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

async function limitarHistoricoRolagensFicha() {
  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) return;

  try {
    const referenciaHistorico =
      db
        .collection("fichas")
        .doc(idFicha)
        .collection("historicoRolagens");

    const resultado =
      await referenciaHistorico
        .orderBy(
          "criadoEm",
          "desc"
        )
        .get();

    const excedentes =
      resultado.docs.slice(15);

    if (
      excedentes.length === 0
    ) return;

    /*
      O Firestore limita batches a 500 operações.
      Usamos 450 para ficar com margem.
    */

    for (
      let inicio = 0;
      inicio < excedentes.length;
      inicio += 450
    ) {
      const lote =
        db.batch();

      const grupo =
        excedentes.slice(
          inicio,
          inicio + 450
        );

      grupo.forEach(
        documento => {
          lote.delete(
            documento.ref
          );
        }
      );

      await lote.commit();
    }

  } catch (erro) {
    console.error(
      "Erro ao limitar histórico de rolagens:",
      erro
    );
  }
}

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

      await limitarHistoricoRolagensFicha();

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

      const container =
        document.createElement(
          "div"
        );

      container.className =
        "container-rolagem-salva";

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
        container
      );
    }
  );

  listaRolagensSalvasFicha
    .replaceChildren(
      fragmento
    );
}

/* PV e PD em tempo real */

function recursoFichaMudou(
  atual,
  novo
) {
  return (
    atual.atual !== novo.atual ||
    atual.maximo !== novo.maximo ||
    atual.manual !== novo.manual
  );
}

function obterRecursoTempoRealFicha(
  recurso
) {
  if (
    !recurso ||
    typeof recurso !== "object"
  ) {
    return null;
  }

  const atual =
    Number(recurso.atual);

  const maximo =
    Number(recurso.maximo);

  if (
    !Number.isInteger(atual) ||
    atual < 0 ||
    !Number.isInteger(maximo) ||
    maximo < 0
  ) {
    return null;
  }

  return {
    atual: atual,
    maximo: maximo,
    manual:
      recurso.manual === true
  };
}

function aplicarRecursosTempoRealFicha(
  ficha
) {
  const novoPv =
    obterRecursoTempoRealFicha(
      ficha.pv
    );

  const novoPd =
    obterRecursoTempoRealFicha(
      ficha.pd
    );

  let precisaRenderizar =
    false;

  if (
    novoPv &&
    recursoFichaMudou(
      estadoPvFicha,
      novoPv
    )
  ) {
    estadoPvFicha = {
      ...novoPv
    };

    if (dadosFichaAtual) {
      dadosFichaAtual.pv = {
        ...novoPv
      };
    }

    precisaRenderizar =
      true;
  }

  if (
    novoPd &&
    recursoFichaMudou(
      estadoPdFicha,
      novoPd
    )
  ) {
    estadoPdFicha = {
      ...novoPd
    };

    if (dadosFichaAtual) {
      dadosFichaAtual.pd = {
        ...novoPd
      };
    }

    precisaRenderizar =
      true;
  }

  if (precisaRenderizar) {
    renderizarPvPdFicha();
  }
}

function iniciarEscutaRecursosFicha() {
  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) {
    return;
  }

  if (
    cancelarEscutaRecursosFicha
  ) {
    cancelarEscutaRecursosFicha();
  }

  cancelarEscutaRecursosFicha =
    db
      .collection("fichas")
      .doc(idFicha)
      .onSnapshot(
        documento => {
          if (!documento.exists) {
            return;
          }

          aplicarRecursosTempoRealFicha(
            documento.data()
          );
        },
        erro => {
          console.error(
            "Erro ao acompanhar PV e PD em tempo real:",
            erro
          );
        }
      );
}

/* Escutas em tempo real */

function iniciarEscutasRolagensFicha() {
  if (
    previewLocal ||
    !auth.currentUser ||
    !idFicha
  ) return;

  limitarHistoricoRolagensFicha();

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
      .limit(15)
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
    .then(async () => {
      const fichaPreview =
        dadosFichaAtual || {
          perfil: "adaptativo",

          ocupacoes: [
            "estudante"
          ],

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
          neo: 1
        };

      await preencherPontosFicha(
        fichaPreview
      );

      await preencherHabilidadesFicha(
        fichaPreview
      );
    });
}

/* Inicialização da ficha real */

if (!previewLocal) {
  auth.onAuthStateChanged(usuario => {
    carregarFichaAutenticada(usuario);
  });
}
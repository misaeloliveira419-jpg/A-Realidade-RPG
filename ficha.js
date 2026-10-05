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

if (!previewLocal) {
  auth.onAuthStateChanged(async usuario => {
    if (!usuario || !idFicha) {
      window.location.replace("index-suas-fichas.html");
      return;
    }

    try {
      const documento = await db.collection("fichas").doc(idFicha).get();

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
        window.location.replace(`index-criacao-de-ficha.html?ficha=${encodeURIComponent(idFicha)}`);
        return;
      }

      preencherCabecalhoFicha(ficha);

      await preencherInformacoesFicha(ficha);

      document.title = `${ficha.nome || "Ficha"}: A Realidade RPG`;

    } catch (erro) {
      console.error("Erro ao carregar ficha:", erro);
      window.location.replace("index-suas-fichas.html");
    }
  });
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
const idFicha = new URLSearchParams(window.location.search).get("ficha");

const previewLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const campoNomeFicha = document.getElementById("nome-personagem-ficha");
const campoFotoFicha = document.getElementById("input-foto-ficha");
const imagemFotoFicha = document.getElementById("imagem-foto-ficha");
const semFotoFicha = document.getElementById("sem-foto-ficha");
const botaoRemoverFotoFicha = document.getElementById("remover-foto-ficha");

let dadosFichaAtual = null;
let nomeFichaSalvo = "";

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

if (previewLocal) {
  preencherCabecalhoFicha({
    nome: "Nome do Personagem",
    foto: ""
  });
}

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
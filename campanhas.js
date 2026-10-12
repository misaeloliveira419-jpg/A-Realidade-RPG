const listaCampanhas = document.getElementById("lista-campanhas");
const cardAdicionarCampanha = document.getElementById("card-adicionar-campanha");

const campoLinkCampanha = document.getElementById("link-campanha");
const campoNomeCampanha = document.getElementById("nome-campanha");
const campoDescricaoCampanha = document.getElementById("descricao-campanha");

const botaoConfirmarEntrarCampanha = document.getElementById("confirmar-entrar-campanha");
const botaoConfirmarCriarCampanha = document.getElementById("confirmar-criar-campanha");

const nomeCampanhaAtual = document.getElementById("nome-campanha-atual");
const descricaoCampanhaAtual = document.getElementById("descricao-campanha-atual");
const papelCampanhaAtual = document.getElementById("papel-campanha-atual");

const botaoEditarNomeCampanha = document.getElementById("editar-nome-campanha");
const botaoEditarDescricaoCampanha = document.getElementById("editar-descricao-campanha");
const controlesMestreCampanha = document.getElementById("controles-mestre-campanha");
const linkConviteAtual = document.getElementById("link-convite-atual");
const botaoCopiarLink = document.getElementById("copiar-link-campanha");
const botaoRegenerarLink = document.getElementById("regenerar-link-campanha");

const listaMembrosCampanha = document.getElementById("lista-membros-campanha");
const abasFichasCampanha = document.getElementById("abas-fichas-campanha");
const conteudoFichasCampanha = document.getElementById("conteudo-fichas-campanha");
const botoesAbasFichasCampanha = [...document.querySelectorAll(".aba-ficha-campanha")];
const modalAdicionarPersonagemCampanha = document.getElementById("modal-adicionar-personagem-campanha");
const fecharModalFichasCampanha = document.getElementById("fechar-modal-fichas-campanha");
const listaSuasFichasCampanha = document.getElementById("lista-suas-fichas-campanha");
const botaoSairCampanha = document.getElementById("sair-campanha");

let cancelarEscutaCampanhas = null;
let cancelarEscutaCampanhaAtual = null;
let cancelarEscutaMembroAtual = null;
let cancelarEscutaMembros = null;
let cancelarEscutaFichasCampanha = null;
let cancelarEscutaSuasFichasCampanha = null;
let cancelamentosDadosFichasCampanha = [];
let cancelarEscutaFichasNpcsCampanha = null;
let cancelamentosDadosFichasNpcsCampanha = [];
let cancelarEscutaCriaturasCampanha = null;
let ordemCriaturasCampanha = [];
let dadosCriaturasCampanha = new Map();

let campanhaAtualId = null;
let campanhaAtualDados = null;
let papelAtualCampanha = null;
let conviteURLProcessado = false;
let tipoFichasCampanhaAtual = "jogadores";
let fichasUsuarioCampanha = [];
let idsFichasJogadoresCampanha = new Set();
let ordemFichasJogadoresCampanha = [];
let dadosFichasJogadoresCampanha = new Map();
let idsFichasNpcsCampanha = new Set();
let ordemFichasNpcsCampanha = [];
let dadosFichasNpcsCampanha = new Map();

window.campanhaAtualId = null;
window.papelCampanhaAtual = null;

/*Utilidades*/

async function editarNomeCampanha() {
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  const novoNome = prompt("Novo nome da campanha:", campanhaAtualDados?.nome || "");

  if (novoNome === null) return;

  const nome = novoNome.trim();

  if (!nome) {
    alert("O nome da campanha não pode ficar vazio.");
    return;
  }

  try {
    await db.collection("campanhas").doc(campanhaAtualId).update({
      nome: nome,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (erro) {
    console.error("Erro ao editar nome da campanha:", erro);
    alert("Não foi possível alterar o nome da campanha.");
  }
}

async function editarDescricaoCampanha() {
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  const novaDescricao = prompt("Nova descrição da campanha:", campanhaAtualDados?.descricao || "");

  if (novaDescricao === null) return;

  try {
    await db.collection("campanhas").doc(campanhaAtualId).update({
      descricao: novaDescricao.trim(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (erro) {
    console.error("Erro ao editar descrição da campanha:", erro);
    alert("Não foi possível alterar a descrição da campanha.");
  }
}

function obterDadosBasicosUsuario() {
  const usuario = auth.currentUser;
  const dados = window.dadosUsuarioAtual || {};

  return {
    uid: usuario.uid,
    nome: dados.nome || usuario.displayName || usuario.email?.split("@")[0] || "Jogador",
    foto: dados.foto || usuario.photoURL || ""
  };
}

function gerarCodigoAleatorio(tamanho = 8) {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const numeros = new Uint32Array(tamanho);

  crypto.getRandomValues(numeros);

  return Array.from(numeros, numero => caracteres[numero % caracteres.length]).join("");
}

function gerarLinkConvite(codigo) {
  const url = new URL(window.location.href);

  url.search = "";
  url.hash = "";
  url.searchParams.set("convite", codigo);

  return url.toString();
}

function extrairCodigoConvite(valor) {
  const texto = valor.trim();

  if (!texto) return "";

  try {
    const url = new URL(texto);
    return url.searchParams.get("convite") || "";
  } catch {
    return texto;
  }
}

function removerConviteDaURL() {
  const url = new URL(window.location.href);

  url.searchParams.delete("convite");

  history.replaceState({}, "", url.pathname + url.search + url.hash);
}

/*Lista de Campanhas*/

function limparCardsCampanhas() {
  listaCampanhas.querySelectorAll(".campanha-salva").forEach(card => card.remove());
}

function prepararImagemCampanha(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) {
      reject(new Error("arquivo-invalido"));
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const imagem = new Image();

      imagem.onload = () => {
        const limiteLargura = 800;
        const limiteAltura = 450;

        const escala = Math.min(
          limiteLargura / imagem.width,
          limiteAltura / imagem.height,
          1
        );

        const largura = Math.round(imagem.width * escala);
        const altura = Math.round(imagem.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagem, 0, 0, largura, altura);

        const imagemBase64 = canvas.toDataURL("image/webp", 0.8);

        if (imagemBase64.length > 850000) {
          reject(new Error("imagem-grande"));
          return;
        }

        resolve(imagemBase64);
      };

      imagem.onerror = reject;
      imagem.src = leitor.result;
    };

    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function criarCardCampanha(campanha) {
  const card = document.createElement("div");
  card.className = "campanha-salva";
  card.dataset.campanhaId = campanha.id;
  card.tabIndex = 0;

  const areaImagem = document.createElement("div");
  areaImagem.className = "imagem-card-campanha";

  if (campanha.imagemCampanha) {
    const imagem = document.createElement("img");
    imagem.src = campanha.imagemCampanha;
    imagem.alt = `Imagem da campanha ${campanha.nome || ""}`;
    areaImagem.appendChild(imagem);
  }

  const areaMenu = document.createElement("div");
  areaMenu.className = "area-menu-card-campanha";

  const botaoMenu = document.createElement("button");
  botaoMenu.type = "button";
  botaoMenu.className = "botao-menu-card-campanha";
  botaoMenu.textContent = "...";
  botaoMenu.title = "Opções da campanha";

  const menu = document.createElement("div");
  menu.className = "menu-card-campanha";

  if (campanha.papelUsuario === "mestre") {
    const botaoImagem = document.createElement("button");
    botaoImagem.type = "button";
    botaoImagem.textContent = campanha.imagemCampanha
    ? "Alterar imagem da campanha"
    : "Adicionar imagem da campanha";

    const inputImagem = document.createElement("input");
    inputImagem.type = "file";
    inputImagem.accept = "image/*";
    inputImagem.hidden = true;

    botaoImagem.addEventListener("click", evento => {
      evento.stopPropagation();
      menu.classList.remove("ativo");
      inputImagem.click();
    });

    inputImagem.addEventListener("change", async () => {
      const arquivo = inputImagem.files?.[0];
      if (!arquivo) return;

      const imagem = await adicionarImagemCampanha(campanha, arquivo, botaoImagem);

      if (imagem) {
        campanha.imagemCampanha = imagem;

        const novoCard = criarCardCampanha(campanha);
        card.replaceWith(novoCard);
      }

      inputImagem.value = "";
    });

    menu.appendChild(botaoImagem);
    menu.appendChild(inputImagem);

    if (campanha.imagemCampanha) {
      const botaoDeletarImagem = document.createElement("button");
      botaoDeletarImagem.type = "button";
      botaoDeletarImagem.textContent = "Deletar imagem da campanha";
      botaoDeletarImagem.className = "acao-perigosa-card";

      botaoDeletarImagem.addEventListener("click", async evento => {
        evento.stopPropagation();
        menu.classList.remove("ativo");

        const deletou = await deletarImagemCampanha(campanha);

        if (deletou) {
          campanha.imagemCampanha = "";

          const novoCard = criarCardCampanha(campanha);
          card.replaceWith(novoCard);
        }
      });

      menu.appendChild(botaoDeletarImagem);
    }
  }

  const botaoAcao = document.createElement("button");
  botaoAcao.type = "button";

  if (campanha.papelUsuario === "mestre") {
    botaoAcao.textContent = "Deletar campanha";
    botaoAcao.className = "acao-perigosa-card";

    botaoAcao.addEventListener("click", evento => {
      evento.stopPropagation();
      menu.classList.remove("ativo");
      deletarCampanhaPeloCard(campanha);
    });
  } else {
    botaoAcao.textContent = "Sair da campanha";

    botaoAcao.addEventListener("click", evento => {
      evento.stopPropagation();
      menu.classList.remove("ativo");
      sairCampanhaPeloCard(campanha);
    });
  }

  menu.appendChild(botaoAcao);

  botaoMenu.addEventListener("click", evento => {
    evento.stopPropagation();

    document.querySelectorAll(".menu-card-campanha.ativo").forEach(outroMenu => {
      if (outroMenu !== menu) outroMenu.classList.remove("ativo");
    });

    menu.classList.toggle("ativo");
  });

  menu.addEventListener("click", evento => evento.stopPropagation());

  areaMenu.appendChild(botaoMenu);
  areaMenu.appendChild(menu);
  areaImagem.appendChild(areaMenu);

  const areaNome = document.createElement("div");
  areaNome.className = "nome-card-campanha";

  const nome = document.createElement("strong");
  nome.textContent = campanha.nome || "Campanha sem nome";

  areaNome.appendChild(nome);

  card.appendChild(areaImagem);
  card.appendChild(areaNome);

  card.addEventListener("click", () => abrirCampanha(campanha.id));

  card.addEventListener("keydown", evento => {
    if (evento.key === "Enter") abrirCampanha(campanha.id);
  });

  return card;
}

async function adicionarImagemCampanha(campanha, arquivo, botao) {
  const usuario = auth.currentUser;

  if (!usuario || !campanha?.id || campanha.papelUsuario !== "mestre") return null;

  const textoOriginal = botao.textContent;

  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    const imagem = await prepararImagemCampanha(arquivo);

    await db
      .collection("fotos")
      .doc("campanhas")
      .collection("imagens")
      .doc(campanha.id)
      .set({
        imagem: imagem,
        atualizadoPor: usuario.uid,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });

    return imagem;

  } catch (erro) {
    console.error("Erro ao salvar imagem da campanha:", erro);

    if (erro.message === "imagem-grande") {
      alert("Mesmo após ser reduzida, essa imagem ficou grande demais.");
    } else if (erro.message === "arquivo-invalido") {
      alert("Selecione um arquivo de imagem.");
    } else if (erro.code === "permission-denied") {
      alert("Você não tem permissão para alterar a imagem desta campanha.");
    } else {
      alert("Não foi possível salvar a imagem da campanha.");
    }

    return null;

  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

async function deletarImagemCampanha(campanha) {
  const usuario = auth.currentUser;

  if (!usuario || !campanha?.id || campanha.papelUsuario !== "mestre") {
    return false;
  }

  if (!confirm("Deseja deletar a imagem desta campanha?")) {
    return false;
  }

  try {
    await db
      .collection("fotos")
      .doc("campanhas")
      .collection("imagens")
      .doc(campanha.id)
      .delete();

    return true;

  } catch (erro) {
    console.error("Erro ao deletar imagem da campanha:", erro);
    alert("Não foi possível deletar a imagem da campanha.");
    return false;
  }
}

async function sairCampanhaPeloCard(campanha) {
  const usuario = auth.currentUser;

  if (!usuario || !campanha?.id) return;

  if (!confirm(`Deseja sair da campanha "${campanha.nome}"?`)) return;

  try {
    const batch = db.batch();

    batch.delete(
      db.collection("campanhas")
        .doc(campanha.id)
        .collection("membros")
        .doc(usuario.uid)
    );

    batch.delete(
      db.collection("usuarios")
        .doc(usuario.uid)
        .collection("campanhas")
        .doc(campanha.id)
    );

    await batch.commit();

  } catch (erro) {
    console.error("Erro ao sair da campanha:", erro);
    alert("Não foi possível sair da campanha.");
  }
}

async function deletarCampanhaPeloCard(campanha) {
  const usuario = auth.currentUser;

  if (!usuario || !campanha?.id || campanha.papelUsuario !== "mestre") return;

  const confirmar = confirm(
    `Deseja realmente deletar "${campanha.nome}"?\n\nEssa ação não poderá ser desfeita.`
  );

  if (!confirmar) return;

  try {

    const referenciaCampanha = db.collection("campanhas").doc(campanha.id);
    const referenciaFoto = db
    .collection("fotos")
    .doc("campanhas")
    .collection("imagens")
    .doc(campanha.id);
    const membros = await referenciaCampanha.collection("membros").get();

    const batch = db.batch();

    membros.forEach(documentoMembro => {
      const uid = documentoMembro.id;

      batch.delete(documentoMembro.ref);

      batch.delete(
        db.collection("usuarios")
        .doc(uid)
        .collection("campanhas")
        .doc(campanha.id)
      );
    });

    batch.delete(referenciaFoto);

    if (campanha.conviteCodigo) {
      batch.delete(
        db.collection("convitesCampanha").doc(campanha.conviteCodigo)
      );
    }

    batch.delete(referenciaCampanha);

    await batch.commit();

  } catch (erro) {
    console.error("Erro ao deletar campanha:", erro);
    alert("Não foi possível deletar a campanha.");
  }
}

async function renderizarCampanhas(documentos, uidEscuta) {
  const campanhas = [];

  for (const documento of documentos) {
    const referenciaCampanha = db.collection("campanhas").doc(documento.id);
    
    const [campanha, membro, foto] = await Promise.all([
      referenciaCampanha.get(),
      referenciaCampanha.collection("membros").doc(uidEscuta).get(),
      db.collection("fotos")
      .doc("campanhas")
      .collection("imagens")
      .doc(documento.id)
      .get()
    ]);
    
    if (campanha.exists && membro.exists) {
      campanhas.push({
        id: campanha.id,
        ...campanha.data(),
        papelUsuario: membro.data().papel,
        imagemCampanha: foto.exists ? foto.data().imagem : ""
      });
    }
  }

  if (auth.currentUser?.uid !== uidEscuta) return;

  campanhas.sort((a, b) => {
    const tempoA = a.criadoEm?.toMillis?.() || 0;
    const tempoB = b.criadoEm?.toMillis?.() || 0;
    return tempoA - tempoB;
  });

  limparCardsCampanhas();

  campanhas.forEach(campanha => {
    listaCampanhas.insertBefore(criarCardCampanha(campanha), cardAdicionarCampanha);
  });
}

function iniciarEscutaCampanhas(usuario) {
  if (cancelarEscutaCampanhas) cancelarEscutaCampanhas();

  cancelarEscutaCampanhas = null;
  limparCardsCampanhas();

  if (!usuario) return;

  const uidEscuta = usuario.uid;

  cancelarEscutaCampanhas = db.collection("usuarios").doc(uidEscuta).collection("campanhas").onSnapshot(resultado => {
    renderizarCampanhas(resultado.docs, uidEscuta).catch(erro => console.error("Erro ao montar campanhas:", erro));
  }, erro => {
    console.error("Erro ao carregar campanhas:", erro);
  });
}

/*Criar campanha*/

async function criarCampanha() {
  const usuario = auth.currentUser;
  const nome = campoNomeCampanha.value.trim();
  const descricao = campoDescricaoCampanha.value.trim();

  if (!usuario) {
    alert("Você precisa estar em uma conta para criar uma campanha.");
    return;
  }

  if (usuario.uid !== UID_CRIADOR_CAMPANHAS) {
    alert("Somente o Misa Mouse pode criar campanhas.");
    return;
  }

  if (!nome) {
    alert("Digite um nome para a campanha.");
    return;
  }

  botaoConfirmarCriarCampanha.disabled = true;
  botaoConfirmarCriarCampanha.textContent = "Criando...";

  try {
    const dadosUsuario = obterDadosBasicosUsuario();
    const referenciaCampanha = db.collection("campanhas").doc();

    let criada = false;

    for (let tentativa = 0; tentativa < 10 && !criada; tentativa++) {
      const codigo = gerarCodigoAleatorio();
      const referenciaConvite = db.collection("convitesCampanha").doc(codigo);

      try {
        await db.runTransaction(async transacao => {
          const conviteExistente = await transacao.get(referenciaConvite);

          if (conviteExistente.exists) {
            throw new Error("codigo-em-uso");
          }

          const servidor = firebase.firestore.FieldValue.serverTimestamp();
          const referenciaMembro = referenciaCampanha.collection("membros").doc(usuario.uid);
          const referenciaUsuarioCampanha = db.collection("usuarios").doc(usuario.uid).collection("campanhas").doc(referenciaCampanha.id);

          transacao.set(referenciaCampanha, {
            nome: nome,
            descricao: descricao,
            donoUid: usuario.uid,
            conviteCodigo: codigo,
            criadoEm: servidor,
            atualizadoEm: servidor
          });

          transacao.set(referenciaMembro, {
            uid: usuario.uid,
            nome: dadosUsuario.nome,
            foto: dadosUsuario.foto,
            papel: "mestre",
            conviteCodigo: codigo,
            entrouEm: servidor
          });

          transacao.set(referenciaUsuarioCampanha, {
            campanhaId: referenciaCampanha.id,
            entrouEm: servidor
          });

          transacao.set(referenciaConvite, {
            campanhaId: referenciaCampanha.id,
            ativo: true,
            criadoPor: usuario.uid,
            criadoEm: servidor
          });
        });

        criada = true;

      } catch (erro) {
        if (erro.message !== "codigo-em-uso") throw erro;
      }
    }

    if (!criada) {
      throw new Error("Não foi possível gerar um código de convite.");
    }

    campoNomeCampanha.value = "";
    campoDescricaoCampanha.value = "";

    await abrirCampanha(referenciaCampanha.id);

  } catch (erro) {
    console.error("Erro ao criar campanha:", erro);
    alert("Não foi possível criar a campanha.");

  } finally {
    botaoConfirmarCriarCampanha.disabled = false;
    botaoConfirmarCriarCampanha.textContent = "Criar Campanha";
  }
}

/*Entrar por convite*/

async function entrarCampanha() {
  const usuario = auth.currentUser;
  const codigo = extrairCodigoConvite(campoLinkCampanha.value);

  if (!usuario) {
    alert("Você precisa estar em uma conta para entrar em uma campanha.");
    return;
  }

  if (!codigo) {
    alert("Cole o link ou código da campanha.");
    return;
  }

  botaoConfirmarEntrarCampanha.disabled = true;
  botaoConfirmarEntrarCampanha.textContent = "Entrando...";

  try {
    const referenciaConvite = db.collection("convitesCampanha").doc(codigo);
    const convite = await referenciaConvite.get();

    if (!convite.exists || convite.data().ativo !== true) {
      throw new Error("convite-invalido");
    }

    const campanhaId = convite.data().campanhaId;
    const referenciaUsuarioCampanha = db.collection("usuarios").doc(usuario.uid).collection("campanhas").doc(campanhaId);
    const usuarioCampanha = await referenciaUsuarioCampanha.get();

    if (usuarioCampanha.exists) {
      campoLinkCampanha.value = "";
      removerConviteDaURL();
      await abrirCampanha(campanhaId);
      return;
    }

    const dadosUsuario = obterDadosBasicosUsuario();
    const referenciaMembro = db.collection("campanhas").doc(campanhaId).collection("membros").doc(usuario.uid);

    const batch = db.batch();
    const servidor = firebase.firestore.FieldValue.serverTimestamp();

    batch.set(referenciaMembro, {
      uid: usuario.uid,
      nome: dadosUsuario.nome,
      foto: dadosUsuario.foto,
      papel: "jogador",
      conviteCodigo: codigo,
      entrouEm: servidor
    });

    batch.set(referenciaUsuarioCampanha, {
      campanhaId: campanhaId,
      entrouEm: servidor
    });

    await batch.commit();

    campoLinkCampanha.value = "";
    removerConviteDaURL();

    await abrirCampanha(campanhaId);

  } catch (erro) {
    console.error("Erro ao entrar na campanha:", erro);

    if (erro.message === "convite-invalido") {
      alert("Esse convite não existe mais ou não é válido.");
    } else if (erro.code === "permission-denied") {
      alert("O Firebase bloqueou a entrada na campanha. Verifique as regras do Firestore.");
    } else {
      alert("Não foi possível entrar na campanha.");
    }

  } finally {
    botaoConfirmarEntrarCampanha.disabled = false;
    botaoConfirmarEntrarCampanha.textContent = "Entrar na Campanha";
  }
}

/*Fichas da campanha*/

function converterDataCampanha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor?.toDate === "function") return valor.toDate();

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}
function formatarDataCampanha(valor) {
  const data = converterDataCampanha(valor);
  if (!data) return "--/--/----";

  return new Intl.DateTimeFormat("pt-BR",{
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(data);
}
function formatarTempoCampanha(valor) {
  const data = converterDataCampanha(valor);
  if (!data) return "agora";

  const diferenca = Math.max(0,Date.now() - data.getTime());
  const minutos = Math.floor(diferenca / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) return `${dias} dia${dias !== 1 ? "s" : ""}`;
  if (horas > 0) return `${horas} hora${horas !== 1 ? "s" : ""}`;
  return `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
}
function criarFotoPersonagemCampanha(ficha,classe) {
  const areaFoto = document.createElement("div");
  areaFoto.className = classe;

  if (ficha.foto) {
    const imagem = document.createElement("img");
    imagem.src = ficha.foto;
    imagem.alt = `Foto de ${ficha.nome || "personagem"}`;
    areaFoto.appendChild(imagem);
  } else {
    const semFoto = document.createElement("span");
    semFoto.textContent = "SEM FOTO";
    areaFoto.classList.add("sem-foto");
    areaFoto.appendChild(semFoto);
  }

  return areaFoto;
}
function podeRemoverFichaCampanha(tipo,dados) {
  const usuario = auth.currentUser;

  if (!usuario || !campanhaAtualId) return false;

  if (tipo === "jogador") {
    return papelAtualCampanha === "mestre" || dados.donoUid === usuario.uid;
  }

  return papelAtualCampanha === "mestre";
}

async function removerFichaDaCampanha(tipo,id,nome) {
  if (!campanhaAtualId || !id) return;

  const configuracoes = {
    jogador: {
      colecao: "fichasJogadores",
      nome: "personagem",
      mensagem: `Remover "${nome || "este personagem"}" da campanha?`
    },

    npc: {
      colecao: "fichasNpcs",
      nome: "NPC",
      mensagem: `Remover o NPC "${nome || "Sem nome"}" da campanha? A ficha original continuará em Suas Fichas.`
    },

    criatura: {
      colecao: "criaturas",
      nome: "Criatura",
      mensagem: `Excluir permanentemente a Criatura "${nome || "Sem nome"}" desta campanha?`
    }
  };

  const configuracao = configuracoes[tipo];

  if (!configuracao) return;

  const confirmar = window.confirm(
    configuracao.mensagem
  );

  if (!confirmar) return;

  try {
    await db.collection("campanhas")
      .doc(campanhaAtualId)
      .collection(configuracao.colecao)
      .doc(id)
      .delete();

  } catch (erro) {
    console.error(
      `Erro ao remover ${configuracao.nome} da campanha:`,
      erro
    );

    alert(
      `Não foi possível remover ${configuracao.nome} da campanha.`
    );
  }
}

function criarBotaoRemoverFichaCampanha(tipo,dados) {
  if (
    !podeRemoverFichaCampanha(
      tipo,
      dados
    )
  ) return null;

  const botao =
    document.createElement("button");

  botao.type = "button";
  botao.className =
    "botao-remover-ficha-campanha";

  botao.textContent = "🗑";

  botao.title =
    tipo === "criatura"
      ? "Excluir Criatura"
      : "Remover da campanha";

  botao.setAttribute(
    "aria-label",
    botao.title
  );

  botao.addEventListener(
    "click",
    async evento => {
      evento.preventDefault();
      evento.stopPropagation();

      await removerFichaDaCampanha(
        tipo,
        dados.id,
        dados.nome
      );
    }
  );

  return botao;
}
function criarCardPersonagemCampanha(ficha,tipo = "jogador") {
  const container =
    document.createElement("div");

  container.className =
    "container-card-personagem-campanha";

  const card =
    document.createElement("button");

  card.type = "button";
  card.className =
    "card-personagem-campanha";

  const foto =
    criarFotoPersonagemCampanha(
      ficha,
      "foto-personagem-campanha"
    );

  const informacoes =
    document.createElement("div");

  informacoes.className =
    "informacoes-personagem-campanha";

  const nome =
    document.createElement("strong");

  nome.className =
    "nome-personagem-campanha";

  nome.textContent =
    ficha.nome || "SEM NOME";

  const atualizado =
    document.createElement("span");

  atualizado.className =
    "data-personagem-campanha";

  atualizado.innerHTML =
    `<b>Atualizado há:</b> ${formatarTempoCampanha(ficha.atualizadoEm)}`;

  const criado =
    document.createElement("span");

  criado.className =
    "data-personagem-campanha";

  criado.innerHTML =
    `<b>Criado em:</b> ${formatarDataCampanha(ficha.criadoEm)}`;

  informacoes.append(
    nome,
    atualizado,
    criado
  );

  card.append(
    foto,
    informacoes
  );

  card.addEventListener(
    "click",
    () => {
      if (
        !campanhaAtualId ||
        !ficha.id
      ) return;

      if (tipo === "criatura") {
        const parametros =
          new URLSearchParams({
            criatura: ficha.id,
            campanha: campanhaAtualId
          });

        window.location.href =
          `index-criatura.html?${parametros.toString()}`;

        return;
      }

      const parametros =
        new URLSearchParams({
          ficha: ficha.id,
          campanha: campanhaAtualId
        });

      window.location.href =
        `index-ficha.html?${parametros.toString()}`;
    }
  );

  container.appendChild(card);

  const botaoRemover =
    criarBotaoRemoverFichaCampanha(
      tipo,
      ficha
    );

  if (botaoRemover) {
    container.appendChild(
      botaoRemover
    );
  }

  return container;
}
function criarBotaoAdicionarPersonagemCampanha() {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-adicionar-personagem-campanha";
  botao.innerHTML = `<span>+</span> ADICIONAR PERSONAGEM`;

  botao.addEventListener("click",abrirModalAdicionarPersonagemCampanha);

  return botao;
}
function renderizarJogadoresCampanha() {
  conteudoFichasCampanha.replaceChildren();

  const area = document.createElement("div");
  area.className = "area-jogadores-campanha";

  const cabecalho = document.createElement("div");
  cabecalho.className = "cabecalho-jogadores-campanha";

  const titulo = document.createElement("h3");
  titulo.textContent = "JOGADORES";

  cabecalho.appendChild(titulo);

  const botaoAdicionar = criarBotaoAdicionarPersonagemCampanha();

  const grade = document.createElement("div");
  grade.className = "grade-personagens-campanha";

  const fichas = ordemFichasJogadoresCampanha
    .map(id => dadosFichasJogadoresCampanha.get(id))
    .filter(Boolean);

  if (fichas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "fichas-campanha-vazio";
    vazio.textContent = "Nenhum personagem foi adicionado à campanha.";

    grade.appendChild(vazio);
  } else {
    fichas.forEach(ficha => {
      grade.appendChild(criarCardPersonagemCampanha(ficha,"jogador"));
    });
  }

  area.append(cabecalho,botaoAdicionar,grade);
  conteudoFichasCampanha.appendChild(area);
}
function renderizarNpcsCampanha() {
  conteudoFichasCampanha.replaceChildren();

  const area = document.createElement("div");
  area.className = "area-jogadores-campanha";

  const cabecalho = document.createElement("div");
  cabecalho.className = "cabecalho-jogadores-campanha";

  const titulo = document.createElement("h3");
  titulo.textContent = "NPC's";

  cabecalho.appendChild(titulo);

  const botaoAdicionar =
    criarBotaoAdicionarPersonagemCampanha();

  const grade = document.createElement("div");
  grade.className = "grade-personagens-campanha";

  const fichas = ordemFichasNpcsCampanha
    .map(id => dadosFichasNpcsCampanha.get(id))
    .filter(Boolean);

  if (fichas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "fichas-campanha-vazio";
    vazio.textContent = "Nenhum NPC foi adicionado à campanha.";

    grade.appendChild(vazio);

  } else {
    fichas.forEach(ficha => {
      grade.appendChild(criarCardPersonagemCampanha(ficha, "npc"));
    });
  }

  area.append(cabecalho, botaoAdicionar, grade);

  conteudoFichasCampanha.appendChild(area);
}
function criarBotaoAdicionarCriaturaCampanha() {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-adicionar-personagem-campanha";
  botao.innerHTML = `<span>+</span> ADICIONAR CRIATURA`;

  botao.addEventListener(
    "click",
    criarCriaturaCampanha
  );

  return botao;
}

function criarCardCriaturaCampanha(criatura) {
  return criarCardPersonagemCampanha(criatura, "criatura");
}
function renderizarCriaturasCampanha() {
  conteudoFichasCampanha.replaceChildren();

  const area =
    document.createElement("div");

  area.className =
    "area-jogadores-campanha";

  const cabecalho =
    document.createElement("div");

  cabecalho.className =
    "cabecalho-jogadores-campanha";

  const titulo =
    document.createElement("h3");

  titulo.textContent =
    "CRIATURAS";

  cabecalho.appendChild(
    titulo
  );

  const botaoAdicionar =
    criarBotaoAdicionarCriaturaCampanha();

  const grade =
    document.createElement("div");

  grade.className =
    "grade-personagens-campanha";

  const criaturas =
    ordemCriaturasCampanha
      .map(
        id =>
          dadosCriaturasCampanha.get(id)
      )
      .filter(Boolean);

  if (
    criaturas.length === 0
  ) {
    const vazio =
      document.createElement("p");

    vazio.className =
      "fichas-campanha-vazio";

    vazio.textContent =
      "Nenhuma criatura foi adicionada à campanha.";

    grade.appendChild(vazio);

  } else {
    criaturas.forEach(
      criatura => {
        grade.appendChild(
          criarCardCriaturaCampanha(
            criatura
          )
        );
      }
    );
  }

  area.append(
    cabecalho,
    botaoAdicionar,
    grade
  );

  conteudoFichasCampanha
    .appendChild(area);
}

async function criarCriaturaCampanha() {
  const usuario =
    auth.currentUser;

  if (
    !usuario ||
    !campanhaAtualId ||
    papelAtualCampanha !== "mestre"
  ) return;

  const referencia =
    db.collection("campanhas")
      .doc(campanhaAtualId)
      .collection("criaturas")
      .doc();

  try {
    await referencia.set({
      tipo: "criatura",

      nome:
        "Nova Criatura",

      foto: "",

      aparencia: "",
      anotacoes: "",

      atributos: {
        fisico: 1,
        cognicao: 1,
        presenca: 1,
        deslocamentoMetros: 9,
        deslocamentoQuadrados: 6
      },

      pericias: {},

      limitePontosPericias:
        140,

      pv: {
        atual: 50,
        maximo: 50
      },

      habilidades: [],

      criadoPor:
        usuario.uid,

      criadoEm:
        firebase.firestore
          .FieldValue
          .serverTimestamp(),

      atualizadoEm:
        firebase.firestore
          .FieldValue
          .serverTimestamp()
    });

    const parametros =
      new URLSearchParams({
        criatura:
          referencia.id,
        campanha:
          campanhaAtualId
      });

    window.location.href =
      `index-criatura.html?${parametros.toString()}`;

  } catch (erro) {
    console.error(
      "Erro ao criar Criatura:",
      erro
    );

    alert(
      "Não foi possível criar a Criatura."
    );
  }
}

function iniciarEscutaCriaturasCampanha() {
  if (
    cancelarEscutaCriaturasCampanha
  ) {
    cancelarEscutaCriaturasCampanha();
    cancelarEscutaCriaturasCampanha =
      null;
  }

  if (
    !campanhaAtualId ||
    !auth.currentUser ||
    papelAtualCampanha !== "mestre"
  ) {
    renderizarConteudoFichasCampanha();
    return;
  }

  const idCampanha =
    campanhaAtualId;

  cancelarEscutaCriaturasCampanha =
    db.collection("campanhas")
      .doc(idCampanha)
      .collection("criaturas")
      .orderBy(
        "criadoEm",
        "asc"
      )
      .onSnapshot(
        resultado => {
          if (
            campanhaAtualId !==
            idCampanha
          ) return;

          ordemCriaturasCampanha =
            resultado.docs.map(
              documento =>
                documento.id
            );

          dadosCriaturasCampanha.clear();

          resultado.docs.forEach(
            documento => {
              dadosCriaturasCampanha.set(
                documento.id,
                {
                  id: documento.id,
                  ...documento.data()
                }
              );
            }
          );

          renderizarConteudoFichasCampanha();
        },
        erro => {
          console.error(
            "Erro ao acompanhar Criaturas da campanha:",
            erro
          );
        }
      );
}
function renderizarConteudoFichasCampanha() {
  botoesAbasFichasCampanha.forEach(botao => {
    botao.classList.toggle(
      "ativa",
      botao.dataset.tipo === tipoFichasCampanhaAtual
    );
  });

  if (
    tipoFichasCampanhaAtual ===
    "jogadores"
  ) {
    renderizarJogadoresCampanha();
    return;
  }

  if (
    tipoFichasCampanhaAtual ===
    "npcs"
  ) {
    renderizarNpcsCampanha();
    return;
  }

  if (
    tipoFichasCampanhaAtual ===
    "criaturas"
  ) {
    renderizarCriaturasCampanha();
    return;
  }
}
function criarCardSeletorFichaCampanha(ficha) {
  const card = document.createElement("article");
  card.className = "card-seletor-ficha-campanha";

  const adicionandoNpc =
    tipoFichasCampanhaAtual === "npcs";

  const jaAdicionada = adicionandoNpc
    ? idsFichasNpcsCampanha.has(ficha.id)
    : idsFichasJogadoresCampanha.has(ficha.id);

  if (jaAdicionada) {
    card.classList.add("ja-adicionada");
  }

  const foto =
    criarFotoPersonagemCampanha(
      ficha,
      "foto-seletor-ficha-campanha"
    );

  const nome =
    document.createElement("strong");

  nome.className =
    "nome-seletor-ficha-campanha";

  nome.textContent =
    ficha.nome || "SEM NOME";

  const botaoAdicionar =
    document.createElement("button");

  botaoAdicionar.type = "button";
  botaoAdicionar.className =
    "adicionar-ficha-campanha";

  botaoAdicionar.textContent =
    jaAdicionada ? "✓" : "+";

  botaoAdicionar.title =
    jaAdicionada
      ? "Ficha já adicionada"
      : "Adicionar à campanha";

  botaoAdicionar.setAttribute(
    "aria-label",
    jaAdicionada
      ? "Ficha já adicionada"
      : `Adicionar ${ficha.nome || "personagem"} à campanha`
  );

  botaoAdicionar.disabled =
    jaAdicionada;

  botaoAdicionar.addEventListener(
    "click",
    async evento => {
      evento.stopPropagation();

      if (jaAdicionada) return;

      if (adicionandoNpc) {
        await adicionarFichaNpcCampanha(
          ficha
        );

        return;
      }

      await adicionarFichaJogadorCampanha(
        ficha
      );
    }
  );

  card.append(
    foto,
    nome,
    botaoAdicionar
  );

  return card;
}
function renderizarSuasFichasCampanha() {
  listaSuasFichasCampanha.replaceChildren();

  const fichasProntas = fichasUsuarioCampanha.filter(ficha => ficha.estado === "pronta");

  if (fichasProntas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "suas-fichas-campanha-vazio";
    vazio.textContent = "Você ainda não possui nenhuma ficha pronta.";

    listaSuasFichasCampanha.appendChild(vazio);
    return;
  }

  fichasProntas.forEach(ficha => {
    listaSuasFichasCampanha.appendChild(criarCardSeletorFichaCampanha(ficha));
  });
}
function iniciarEscutaSuasFichasCampanha() {
  if (cancelarEscutaSuasFichasCampanha) {
    cancelarEscutaSuasFichasCampanha();
    cancelarEscutaSuasFichasCampanha = null;
  }

  const usuario = auth.currentUser;

  if (!usuario) return;

  cancelarEscutaSuasFichasCampanha = db.collection("fichas")
    .where("donoUid","==",usuario.uid)
    .onSnapshot(resultado => {
      fichasUsuarioCampanha = resultado.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
      }));

      fichasUsuarioCampanha.sort((a,b) => {
        const dataA = a.atualizadoEm?.toMillis?.() || 0;
        const dataB = b.atualizadoEm?.toMillis?.() || 0;
        return dataB - dataA;
      });

      renderizarSuasFichasCampanha();

    },erro => {
      console.error("Erro ao carregar fichas do usuário:",erro);
      listaSuasFichasCampanha.innerHTML = `<p class="suas-fichas-campanha-vazio">Não foi possível carregar suas fichas.</p>`;
    });
}
function abrirModalAdicionarPersonagemCampanha() {
  if (
    !campanhaAtualId ||
    !auth.currentUser
  ) return;

  if (
    tipoFichasCampanhaAtual === "npcs" &&
    papelAtualCampanha !== "mestre"
  ) return;

  const titulo =
    document.getElementById(
      "titulo-modal-fichas-campanha"
    );

  const texto =
    modalAdicionarPersonagemCampanha
      .querySelector(
        ".texto-modal-fichas-campanha"
      );

  if (
    tipoFichasCampanhaAtual === "npcs"
  ) {
    if (titulo) {
      titulo.textContent = "SUAS FICHAS";
    }

    if (texto) {
      texto.textContent =
        "Escolha uma ficha sua para adicionar como NPC à campanha.";
    }

  } else {
    if (titulo) {
      titulo.textContent = "SUAS FICHAS";
    }

    if (texto) {
      texto.textContent =
        "Escolha uma ficha para adicionar à campanha.";
    }
  }

  modalAdicionarPersonagemCampanha.hidden =
    false;

  document.body.classList.add(
    "modal-fichas-campanha-aberto"
  );

  iniciarEscutaSuasFichasCampanha();
}
function fecharModalAdicionarPersonagemCampanha() {
  modalAdicionarPersonagemCampanha.hidden = true;
  document.body.classList.remove("modal-fichas-campanha-aberto");

  if (cancelarEscutaSuasFichasCampanha) {
    cancelarEscutaSuasFichasCampanha();
    cancelarEscutaSuasFichasCampanha = null;
  }

  fichasUsuarioCampanha = [];
  listaSuasFichasCampanha.replaceChildren();
}
async function adicionarFichaJogadorCampanha(ficha) {
  const usuario = auth.currentUser;

  if (!usuario || !campanhaAtualId || !ficha?.id) return;
  if (ficha.donoUid !== usuario.uid) return;
  if (ficha.estado !== "pronta") return;
  if (idsFichasJogadoresCampanha.has(ficha.id)) return;

  try {
    await db.collection("campanhas")
      .doc(campanhaAtualId)
      .collection("fichasJogadores")
      .doc(ficha.id)
      .set({
        fichaId: ficha.id,
        donoUid: usuario.uid,
        adicionadoPor: usuario.uid,
        adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });

    fecharModalAdicionarPersonagemCampanha();

  } catch (erro) {
    console.error("Erro ao adicionar personagem à campanha:",erro);

    if (erro.code === "permission-denied") {
      alert("O Firebase bloqueou a adição da ficha. Precisaremos liberar essa operação nas regras do Firestore.");
      return;
    }

    alert("Não foi possível adicionar o personagem à campanha.");
  }
}
async function adicionarFichaNpcCampanha(ficha) {
  const usuario = auth.currentUser;

  if (
    !usuario ||
    !campanhaAtualId ||
    !ficha?.id
  ) return;

  if (papelAtualCampanha !== "mestre") return;
  if (ficha.donoUid !== usuario.uid) return;
  if (ficha.estado !== "pronta") return;

  if (
    idsFichasNpcsCampanha.has(
      ficha.id
    )
  ) return;

  try {
    await db.collection("campanhas")
      .doc(campanhaAtualId)
      .collection("fichasNpcs")
      .doc(ficha.id)
      .set({
        fichaId: ficha.id,
        donoUid: usuario.uid,
        adicionadoPor: usuario.uid,
        adicionadoEm:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

    fecharModalAdicionarPersonagemCampanha();

  } catch (erro) {
    console.error(
      "Erro ao adicionar NPC à campanha:",
      erro
    );

    if (
      erro.code === "permission-denied"
    ) {
      alert(
        "O Firebase bloqueou a adição do NPC. Verifique se as novas regras do Firestore foram publicadas."
      );

      return;
    }

    alert(
      "Não foi possível adicionar o NPC à campanha."
    );
  }
}
function cancelarEscutasDadosFichasCampanha() {
  cancelamentosDadosFichasCampanha.forEach(cancelar => cancelar());
  cancelamentosDadosFichasCampanha = [];
}
function cancelarEscutasDadosFichasNpcsCampanha() {
  cancelamentosDadosFichasNpcsCampanha
    .forEach(cancelar => cancelar());

  cancelamentosDadosFichasNpcsCampanha = [];
}
async function garantirAcessoFichaCampanha(fichaId,idCampanha) {
  const usuario = auth.currentUser;

  if (!usuario || !fichaId || !idCampanha) return false;

  try {
    await db.collection("acessosFichas")
      .doc(fichaId)
      .collection("usuarios")
      .doc(usuario.uid)
      .set({
        campanhaId: idCampanha
      });

    return true;

  } catch (erro) {
    console.error("ERRO ACESSO FICHA:",{
      fichaId: fichaId,
      campanhaId: idCampanha,
      uid: usuario.uid,
      codigo: erro.code,
      mensagem: erro.message
    });

    return false;
  }
}
function iniciarEscutaFichasCampanha() {
  if (cancelarEscutaFichasCampanha) {
    cancelarEscutaFichasCampanha();
    cancelarEscutaFichasCampanha = null;
  }

  cancelarEscutasDadosFichasCampanha();
  idsFichasJogadoresCampanha = new Set();
  ordemFichasJogadoresCampanha = [];
  dadosFichasJogadoresCampanha.clear();

  if (!campanhaAtualId || !auth.currentUser) {
    renderizarConteudoFichasCampanha();
    return;
  }

  const idCampanha = campanhaAtualId;

  cancelarEscutaFichasCampanha = db.collection("campanhas")
    .doc(idCampanha)
    .collection("fichasJogadores")
    .orderBy("adicionadoEm","asc")
    .onSnapshot(resultado => {
      cancelarEscutasDadosFichasCampanha();

      ordemFichasJogadoresCampanha = resultado.docs.map(documento => documento.id);
      idsFichasJogadoresCampanha = new Set(ordemFichasJogadoresCampanha);
      dadosFichasJogadoresCampanha.clear();

      renderizarConteudoFichasCampanha();

      resultado.docs.forEach(async documentoVinculo => {
        const dadosVinculo = documentoVinculo.data();
        const fichaId = dadosVinculo.fichaId || documentoVinculo.id;
        const acessoLiberado = await garantirAcessoFichaCampanha(fichaId,idCampanha);

        if (!acessoLiberado || campanhaAtualId !== idCampanha) return;

        const cancelar = db.collection("fichas").doc(fichaId).onSnapshot(documentoFicha => {
          if (campanhaAtualId !== idCampanha) return;

          if (!documentoFicha.exists) {
            dadosFichasJogadoresCampanha.delete(fichaId);
            renderizarConteudoFichasCampanha();
            return;
          }

          dadosFichasJogadoresCampanha.set(fichaId,{
            id: documentoFicha.id,
            ...documentoFicha.data()
          });

          renderizarConteudoFichasCampanha();

          if (!modalAdicionarPersonagemCampanha.hidden) {
            renderizarSuasFichasCampanha();
          }

        },erro => {
          console.error("ERRO LEITURA FICHA:",{
            fichaId: fichaId,
            campanhaId: idCampanha,
            codigo: erro.code,
            mensagem: erro.message
          });
        });

      cancelamentosDadosFichasCampanha.push(cancelar);
    });

  },erro => {
    console.error("ERRO FICHAS JOGADORES:",{
      campanhaId: idCampanha,
      codigo: erro.code,
      mensagem: erro.message
    });
  });
}
function iniciarEscutaFichasNpcsCampanha() {
  if (cancelarEscutaFichasNpcsCampanha) {
    cancelarEscutaFichasNpcsCampanha();
    cancelarEscutaFichasNpcsCampanha = null;
  }

  cancelarEscutasDadosFichasNpcsCampanha();

  idsFichasNpcsCampanha =
    new Set();

  ordemFichasNpcsCampanha = [];

  dadosFichasNpcsCampanha.clear();

  if (
    !campanhaAtualId ||
    !auth.currentUser ||
    papelAtualCampanha !== "mestre"
  ) {
    renderizarConteudoFichasCampanha();
    return;
  }

  const idCampanha =
    campanhaAtualId;

  cancelarEscutaFichasNpcsCampanha =
    db.collection("campanhas")
      .doc(idCampanha)
      .collection("fichasNpcs")
      .orderBy(
        "adicionadoEm",
        "asc"
      )
      .onSnapshot(
        resultado => {
          cancelarEscutasDadosFichasNpcsCampanha();

          ordemFichasNpcsCampanha =
            resultado.docs.map(
              documento =>
                documento.id
            );

          idsFichasNpcsCampanha =
            new Set(
              ordemFichasNpcsCampanha
            );

          dadosFichasNpcsCampanha.clear();

          renderizarConteudoFichasCampanha();

          resultado.docs.forEach(
            async documentoVinculo => {
              const dadosVinculo =
                documentoVinculo.data();

              const fichaId =
                dadosVinculo.fichaId ||
                documentoVinculo.id;

              const acessoLiberado =
                await garantirAcessoFichaCampanha(
                  fichaId,
                  idCampanha
                );

              if (
                !acessoLiberado ||
                campanhaAtualId !==
                  idCampanha
              ) return;

              const cancelar =
                db.collection("fichas")
                  .doc(fichaId)
                  .onSnapshot(
                    documentoFicha => {
                      if (
                        campanhaAtualId !==
                        idCampanha
                      ) return;

                      if (
                        !documentoFicha.exists
                      ) {
                        dadosFichasNpcsCampanha
                          .delete(fichaId);

                        renderizarConteudoFichasCampanha();
                        return;
                      }

                      dadosFichasNpcsCampanha
                        .set(
                          fichaId,
                          {
                            id:
                              documentoFicha.id,
                            ...documentoFicha.data()
                          }
                        );

                      renderizarConteudoFichasCampanha();

                      if (
                        !modalAdicionarPersonagemCampanha
                          .hidden
                      ) {
                        renderizarSuasFichasCampanha();
                      }
                    },
                    erro => {
                      console.error(
                        `Erro ao acompanhar NPC ${fichaId}:`,
                        erro
                      );
                    }
                  );

              cancelamentosDadosFichasNpcsCampanha
                .push(cancelar);
            }
          );
        },
        erro => {
          console.error(
            "Erro ao acompanhar NPCs da campanha:",
            erro
          );
        }
      );
}

/*Abrir campanha*/

function atualizarDadosCampanha(dados) {
  campanhaAtualDados = dados;

  nomeCampanhaAtual.textContent = dados.nome || "Campanha sem nome";
  descricaoCampanhaAtual.textContent = dados.descricao || "";

  if (papelAtualCampanha === "mestre") {
    linkConviteAtual.value = gerarLinkConvite(dados.conviteCodigo);
  }

  botaoSairCampanha.hidden = dados.donoUid === auth.currentUser?.uid;
}

function aplicarPapelCampanha(membro) {
  papelAtualCampanha = membro.papel;

  window.papelCampanhaAtual = membro.papel;

  const mestre = membro.papel === "mestre";

  if (mestre && campanhaAtualId) {
    iniciarEscutaFichasNpcsCampanha();
  } else {
    if (cancelarEscutaFichasNpcsCampanha) {
      cancelarEscutaFichasNpcsCampanha();
      cancelarEscutaFichasNpcsCampanha = null;
    }

    cancelarEscutasDadosFichasNpcsCampanha();

    idsFichasNpcsCampanha = new Set();

    ordemFichasNpcsCampanha = [];

    dadosFichasNpcsCampanha.clear();
  }

  if (mestre && campanhaAtualId) {
    iniciarEscutaCriaturasCampanha();
  } else {
    if (cancelarEscutaCriaturasCampanha) {
    cancelarEscutaCriaturasCampanha();
    cancelarEscutaCriaturasCampanha = null;
    }
    
    ordemCriaturasCampanha = [];
    dadosCriaturasCampanha.clear();
  }

  papelCampanhaAtual.textContent = mestre ? "Mestre" : "Jogador";

  document.querySelectorAll("#tela-campanha .somente-mestre").forEach(elemento => {
    elemento.hidden = !mestre;
  });

  abasFichasCampanha.classList.toggle("modo-mestre", mestre);
  abasFichasCampanha.classList.toggle("modo-jogador", !mestre);

  if (mestre && campanhaAtualDados) {
    linkConviteAtual.value = gerarLinkConvite(campanhaAtualDados.conviteCodigo);
  }

  window.iniciarMusicaCampanha?.({
    campanhaId: campanhaAtualId,
    papel: membro.papel
  });

  iniciarEscutaMembros();
}
async function abrirCampanha(id) {
  const usuario = auth.currentUser;

  if (!usuario) return;

  const referenciaCampanha = db.collection("campanhas").doc(id);
  const referenciaMembro = referenciaCampanha.collection("membros").doc(usuario.uid);

  try {
    const [campanha, membro] = await Promise.all([
      referenciaCampanha.get(),
      referenciaMembro.get()
    ]);

    if (!campanha.exists || !membro.exists) {
      alert("Você não tem acesso a essa campanha.");
      return;
    }

    campanhaAtualId = id;
    campanhaAtualDados = campanha.data();

    window.campanhaAtualId = id;

    tipoFichasCampanhaAtual = "jogadores";
    renderizarConteudoFichasCampanha();

    atualizarDadosCampanha(campanha.data());
    aplicarPapelCampanha(membro.data());

    abrirTelaSite("tela-campanha");
    iniciarEscutasCampanhaAtual();

  } catch (erro) {
    console.error("Erro ao abrir campanha:", erro);
    alert("Não foi possível abrir a campanha.");
  }
}

window.abrirCampanha = abrirCampanha;

/*Tempo real*/

function cancelarEscutasCampanha() {
  if (cancelarEscutaCampanhaAtual) cancelarEscutaCampanhaAtual();
  if (cancelarEscutaMembroAtual) cancelarEscutaMembroAtual();
  if (cancelarEscutaMembros) cancelarEscutaMembros();
  if (cancelarEscutaFichasCampanha) cancelarEscutaFichasCampanha();
  if (cancelarEscutaFichasNpcsCampanha) cancelarEscutaFichasNpcsCampanha();
  if (cancelarEscutaCriaturasCampanha) {
    cancelarEscutaCriaturasCampanha();
  }

  cancelarEscutasDadosFichasCampanha();
  cancelarEscutasDadosFichasNpcsCampanha();

  cancelarEscutaCampanhaAtual = null;
  cancelarEscutaMembroAtual = null;
  cancelarEscutaMembros = null;
  cancelarEscutaFichasCampanha = null;
  cancelarEscutaFichasNpcsCampanha = null;
  cancelarEscutaCriaturasCampanha = null;
}
function iniciarEscutasCampanhaAtual() {
  cancelarEscutasCampanha();

  if (!campanhaAtualId || !auth.currentUser) return;

  const id = campanhaAtualId;
  const uid = auth.currentUser.uid;

  cancelarEscutaCampanhaAtual = db.collection("campanhas").doc(id).onSnapshot(documento => {
    if (!documento.exists || campanhaAtualId !== id) return;
    atualizarDadosCampanha(documento.data());
  });

  cancelarEscutaMembroAtual = db.collection("campanhas").doc(id).collection("membros").doc(uid).onSnapshot(documento => {
    if (!documento.exists) {
      cancelarEscutasCampanha();
      campanhaAtualId = null;
      window.campanhaAtualId = null;
      abrirTelaSite("tela-selecionar-campanhas");
      return;
    }

    aplicarPapelCampanha(documento.data());

  }, erro => {
    console.error("Acesso à campanha encerrado:", erro);
    abrirTelaSite("tela-selecionar-campanhas");
  });

  iniciarEscutaFichasCampanha();

  if (papelAtualCampanha === "mestre") {
    iniciarEscutaFichasNpcsCampanha();
  }

  if (papelAtualCampanha === "mestre") {
    iniciarEscutaCriaturasCampanha();
  }
}

/*Membros*/

function iniciarEscutaMembros() {
  if (cancelarEscutaMembros) return;
  if (!campanhaAtualId || !auth.currentUser) return;

  cancelarEscutaMembros = db.collection("campanhas").doc(campanhaAtualId).collection("membros").orderBy("entrouEm", "asc").onSnapshot(resultado => {
    listaMembrosCampanha.innerHTML = "";

    resultado.forEach(documento => {
      const membro = documento.data();
      const linha = document.createElement("div");

      linha.className = "membro-campanha";

      const nome = document.createElement("span");
      nome.textContent = `${membro.nome || "Jogador"} — ${membro.papel === "mestre" ? "Mestre" : "Jogador"}`;

      linha.appendChild(nome);

      if (papelAtualCampanha === "mestre" && membro.papel === "jogador") {
        const areaConfiguracoes = document.createElement("div");
        areaConfiguracoes.className = "area-configurar-membro";

        const engrenagem = document.createElement("button");
        engrenagem.type = "button";
        engrenagem.className = "botao-configurar-membro";
        engrenagem.title = "Opções do membro";
        engrenagem.textContent = "⚙";
        
        const menu = document.createElement("div");
        menu.className = "menu-configurar-membro";

        const promover = document.createElement("button");
        promover.type = "button";
        promover.textContent = "Tornar Mestre";
        promover.addEventListener("click", evento => {
          evento.stopPropagation();
          menu.classList.remove("ativo");
          promoverJogador(documento.id);
        });
        
        const expulsar = document.createElement("button");
        expulsar.type = "button";
        expulsar.textContent = "Expulsar";
        expulsar.addEventListener("click", evento => {
          evento.stopPropagation();
          menu.classList.remove("ativo");
          expulsarJogador(documento.id, membro.nome);
        });

  menu.appendChild(promover);
  menu.appendChild(expulsar);

  engrenagem.addEventListener("click", evento => {
    evento.stopPropagation();

    document.querySelectorAll(".menu-configurar-membro.ativo").forEach(outroMenu => {
      if (outroMenu !== menu) outroMenu.classList.remove("ativo");
    });

    menu.classList.toggle("ativo");
  });

  menu.addEventListener("click", evento => evento.stopPropagation());

  areaConfiguracoes.appendChild(engrenagem);
  areaConfiguracoes.appendChild(menu);
  linha.appendChild(areaConfiguracoes);
}

      listaMembrosCampanha.appendChild(linha);
    });
  });
}

document.addEventListener("click", () => {
  document.querySelectorAll(".menu-configurar-membro.ativo").forEach(menu => {
    menu.classList.remove("ativo");
  });
});

async function promoverJogador(uid) {
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  try {
    await db.collection("campanhas").doc(campanhaAtualId).collection("membros").doc(uid).update({
      papel: "mestre"
    });

  } catch (erro) {
    console.error("Erro ao promover jogador:", erro);
    alert("Não foi possível tornar esse jogador Mestre.");
  }
}

async function expulsarJogador(uid, nome) {
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  if (!confirm(`Expulsar ${nome || "este jogador"} da campanha?`)) return;

  try {
    const batch = db.batch();

    batch.delete(db.collection("campanhas").doc(campanhaAtualId).collection("membros").doc(uid));
    batch.delete(db.collection("usuarios").doc(uid).collection("campanhas").doc(campanhaAtualId));

    await batch.commit();

  } catch (erro) {
    console.error("Erro ao expulsar jogador:", erro);
    alert("Não foi possível expulsar esse jogador.");
  }
}

/*Sair da campanha*/

async function sairCampanha() {
  const usuario = auth.currentUser;

  if (!usuario || !campanhaAtualId || !campanhaAtualDados) return;

  if (campanhaAtualDados.donoUid === usuario.uid) {
    alert("O dono da campanha não pode sair dela.");
    return;
  }

  if (!confirm("Deseja sair desta campanha?")) return;

  try {
    const id = campanhaAtualId;
    const batch = db.batch();

    batch.delete(db.collection("campanhas").doc(id).collection("membros").doc(usuario.uid));
    batch.delete(db.collection("usuarios").doc(usuario.uid).collection("campanhas").doc(id));

    await batch.commit();

    cancelarEscutasCampanha();

    campanhaAtualId = null;
    campanhaAtualDados = null;
    papelAtualCampanha = null;

    window.campanhaAtualId = null;
    window.papelCampanhaAtual = null;

    abrirTelaSite("tela-selecionar-campanhas");

  } catch (erro) {
    console.error("Erro ao sair da campanha:", erro);
    alert("Não foi possível sair da campanha.");
  }
}

/*Convite*/

async function regenerarLinkCampanha() {
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  if (!confirm("O link atual deixará de funcionar. Gerar um novo?")) return;

  try {
    let concluido = false;

    for (let tentativa = 0; tentativa < 10 && !concluido; tentativa++) {
      const novoCodigo = gerarCodigoAleatorio();

      try {
        await db.runTransaction(async transacao => {
          const referenciaCampanha = db.collection("campanhas").doc(campanhaAtualId);
          const campanha = await transacao.get(referenciaCampanha);

          if (!campanha.exists) throw new Error("campanha-inexistente");

          const codigoAntigo = campanha.data().conviteCodigo;
          const referenciaNovoConvite = db.collection("convitesCampanha").doc(novoCodigo);
          const novoConvite = await transacao.get(referenciaNovoConvite);

          if (novoConvite.exists) throw new Error("codigo-em-uso");

          const servidor = firebase.firestore.FieldValue.serverTimestamp();

          transacao.update(referenciaCampanha, {
            conviteCodigo: novoCodigo,
            atualizadoEm: servidor
          });

          transacao.set(referenciaNovoConvite, {
            campanhaId: campanhaAtualId,
            ativo: true,
            criadoPor: auth.currentUser.uid,
            criadoEm: servidor
          });

          if (codigoAntigo) {
            transacao.delete(db.collection("convitesCampanha").doc(codigoAntigo));
          }
        });

        concluido = true;

      } catch (erro) {
        if (erro.message !== "codigo-em-uso") throw erro;
      }
    }

    if (!concluido) throw new Error("Não foi possível gerar um código.");

  } catch (erro) {
    console.error("Erro ao gerar novo convite:", erro);
    alert("Não foi possível gerar um novo link.");
  }
}

async function copiarLinkCampanha() {
  if (!linkConviteAtual.value) return;

  try {
    await navigator.clipboard.writeText(linkConviteAtual.value);
    botaoCopiarLink.textContent = "Copiado!";

    setTimeout(() => {
      botaoCopiarLink.textContent = "Copiar link";
    }, 1200);

  } catch {
    linkConviteAtual.select();
    document.execCommand("copy");
  }
}

/*Link recebido*/

function verificarConviteNaURL(usuario) {
  if (conviteURLProcessado || !usuario) return;

  const codigo = new URL(window.location.href).searchParams.get("convite");

  if (!codigo) return;

  conviteURLProcessado = true;

  campoLinkCampanha.value = window.location.href;

  abrirTelaSite("tela-entrar-campanha");
}

async function verificarCampanhaNaURL(usuario) {
  if (!usuario) return;

  const url = new URL(window.location.href);
  const campanhaId = url.searchParams.get("campanha");

  if (!campanhaId) return;

  url.searchParams.delete("campanha");
  history.replaceState({}, "", url.pathname + url.search + url.hash);

  await abrirCampanha(campanhaId);
}

/*Eventos*/

botoesAbasFichasCampanha.forEach(botao => {
  botao.addEventListener("click",() => {
    tipoFichasCampanhaAtual = botao.dataset.tipo || "jogadores";
    renderizarConteudoFichasCampanha();
  });
});

fecharModalFichasCampanha.addEventListener("click",fecharModalAdicionarPersonagemCampanha);

modalAdicionarPersonagemCampanha.addEventListener("click",evento => {
  if (evento.target === modalAdicionarPersonagemCampanha) fecharModalAdicionarPersonagemCampanha();
});

document.addEventListener("keydown",evento => {
  if (evento.key === "Escape" && !modalAdicionarPersonagemCampanha.hidden) {
    fecharModalAdicionarPersonagemCampanha();
  }
});

botaoConfirmarCriarCampanha.addEventListener("click", criarCampanha);
botaoConfirmarEntrarCampanha.addEventListener("click", entrarCampanha);
botaoEditarNomeCampanha.addEventListener("click", editarNomeCampanha);
botaoEditarDescricaoCampanha.addEventListener("click", editarDescricaoCampanha);
botaoRegenerarLink.addEventListener("click", regenerarLinkCampanha);
botaoCopiarLink.addEventListener("click", copiarLinkCampanha);
botaoSairCampanha.addEventListener("click", sairCampanha);

document.querySelector("#tela-campanha .botao-voltar")?.addEventListener("click", cancelarEscutasCampanha);

/* Autenticação e permissões de campanhas */

auth.onAuthStateChanged(usuario => {
  iniciarEscutaCampanhas(usuario);
  verificarConviteNaURL(usuario);
  verificarCampanhaNaURL(usuario);

  const podeCriar = usuario?.uid === UID_CRIADOR_CAMPANHAS;

  const secaoCriar = document.getElementById("secao-criar-campanha");

  if (secaoCriar) {
    secaoCriar.hidden = !podeCriar;
  }

  const legendaCard = cardAdicionarCampanha?.querySelector("span");

  if (legendaCard) {
    legendaCard.textContent = podeCriar
      ? "ADICIONAR CAMPANHA"
      : "ENTRAR EM CAMPANHA";
  }
});

/*Fundo header dentro de tela campanha*/

function fundoHeaderTelaCampanha(id) {

  const destino = document.getElementById(id);
  const body = document.querySelector('body');
  
  if (!destino || !body) return;

  if (id === "tela-campanha"){
    body.style.background = "linear-gradient(90deg, rgb(30,20,0), rgb(35,25,0), rgb(30,20,0), rgb(20,0,35),  rgb(0,20,30), rgb(30,0,30))";
  }
  else {
    body.style.background = "";
  }
}

document.addEventListener("click", () => {
  document.querySelectorAll(".menu-card-campanha.ativo").forEach(menu => {
    menu.classList.remove("ativo");
  });
});
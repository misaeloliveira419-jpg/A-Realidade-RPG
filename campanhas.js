const listaCampanhas = document.getElementById("lista-campanhas");
const cardAdicionarCampanha = document.getElementById("card-adicionar-campanha");
const storageCampanhas = firebase.storage();

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
const botaoSairCampanha = document.getElementById("sair-campanha");

let cancelarEscutaCampanhas = null;
let cancelarEscutaCampanhaAtual = null;
let cancelarEscutaMembroAtual = null;
let cancelarEscutaMembros = null;

let campanhaAtualId = null;
let campanhaAtualDados = null;
let papelAtualCampanha = null;
let conviteURLProcessado = false;

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

async function adicionarImagemCampanha(campanha, arquivo, botao) {
  const usuario = auth.currentUser;

  if (!usuario || !campanha?.id) return;

  const textoOriginal = botao.textContent;

  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    const imagem = await prepararImagemCampanha(arquivo);

    const imagemDoCard = document.querySelector(`.campanha-salva[data-campanha-id="${campanha.id}"] .imagem-card-campanha`);
    
    if (imagemDoCard) {
      imagemDoCard.querySelector("img")?.remove();
      const novaImagem = document.createElement("img");
      novaImagem.src = imagem;
      novaImagem.alt = `Imagem da campanha ${campanha.nome || ""}`;

      imagemDoCard.prepend(novaImagem);
  }

  } catch (erro) {
    console.error("Erro ao salvar imagem da campanha:", erro);

    if (erro.message === "imagem-grande") {
      alert("Mesmo após ser reduzida, essa imagem ficou grande demais.");
    } else if (erro.message === "arquivo-invalido") {
      alert("Selecione um arquivo de imagem.");
    } else {
      alert("Não foi possível salvar a imagem da campanha.");
    }
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
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

  const botaoImagem = document.createElement("button");
  botaoImagem.type = "button";
  botaoImagem.textContent = "Adicionar imagem da campanha";

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

    await adicionarImagemCampanha(campanha, arquivo, botaoImagem);
    inputImagem.value = "";
  });

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

  menu.appendChild(botaoImagem);
  menu.appendChild(botaoAcao);
  menu.appendChild(inputImagem);

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
  if (!auth.currentUser || !campanha?.id) return;

  if (!arquivo.type.startsWith("image/")) {
    alert("Selecione um arquivo de imagem.");
    return;
  }

  if (arquivo.size > 5 * 1024 * 1024) {
    alert("A imagem precisa ter no máximo 5 MB.");
    return;
  }

  const textoOriginal = botao.textContent;

  botao.disabled = true;
  botao.textContent = "Enviando...";

  try {
    const referenciaImagem = storageCampanhas.ref(`campanhas/${campanha.id}/capa`);

    await referenciaImagem.put(arquivo, {
      contentType: arquivo.type
    });

    const urlOriginal = await referenciaImagem.getDownloadURL();
    const url = `${urlOriginal}&v=${Date.now()}`;

    await db.collection("campanhas").doc(campanha.id).update({
      imagemUrl: url,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

  } catch (erro) {
    console.error("Erro ao adicionar imagem da campanha:", erro);
    alert("Não foi possível adicionar a imagem.");

  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
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
    try {
      await storageCampanhas.ref(`campanhas/${campanha.id}/capa`).delete();
    } catch (erroStorage) {
      if (erroStorage.code !== "storage/object-not-found") {
        console.warn("Não foi possível apagar a imagem da campanha:", erroStorage);
      }
    }

    const referenciaCampanha = db.collection("campanhas").doc(campanha.id);
    const referenciaFoto = db.collection("fotos").doc("campanhas").collection("imagens").doc(campanha.id);
    const membros = await referenciaCampanha.collection("membros").get();

    const batch = db.batch();

    membros.forEach(documentoMembro => {
      const uid = documentoMembro.id;

      batch.delete(documentoMembro.ref);

      batch.delete(referenciaFoto);
    });

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

  papelCampanhaAtual.textContent = mestre ? "Mestre" : "Jogador";

  document.querySelectorAll("#tela-campanha .somente-mestre").forEach(elemento => {
    elemento.hidden = !mestre;
  });

  abasFichasCampanha.classList.toggle("modo-mestre", mestre);
  abasFichasCampanha.classList.toggle("modo-jogador", !mestre);

  if (mestre && campanhaAtualDados) {
    linkConviteAtual.value = gerarLinkConvite(campanhaAtualDados.conviteCodigo);
  }
  
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

  cancelarEscutaCampanhaAtual = null;
  cancelarEscutaMembroAtual = null;
  cancelarEscutaMembros = null;
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

/*Eventos*/

botaoConfirmarCriarCampanha.addEventListener("click", criarCampanha);
botaoConfirmarEntrarCampanha.addEventListener("click", entrarCampanha);
botaoEditarNomeCampanha.addEventListener("click", editarNomeCampanha);
botaoEditarDescricaoCampanha.addEventListener("click", editarDescricaoCampanha);
botaoRegenerarLink.addEventListener("click", regenerarLinkCampanha);
botaoCopiarLink.addEventListener("click", copiarLinkCampanha);
botaoSairCampanha.addEventListener("click", sairCampanha);

document.querySelector("#tela-campanha .botao-voltar")?.addEventListener("click", cancelarEscutasCampanha);

auth.onAuthStateChanged(usuario => {
  iniciarEscutaCampanhas(usuario);
  verificarConviteNaURL(usuario);
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
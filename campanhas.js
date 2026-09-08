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

function criarCardCampanha(campanha) {
  const card = document.createElement("button");

  card.type = "button";
  card.className = "campanha-salva";

  const nome = document.createElement("strong");
  nome.textContent = campanha.nome || "Campanha sem nome";

  const descricao = document.createElement("span");
  descricao.textContent = campanha.descricao || "";

  card.appendChild(nome);
  card.appendChild(descricao);

  card.addEventListener("click", () => abrirCampanha(campanha.id));

  return card;
}

async function renderizarCampanhas(documentos, uidEscuta) {
  const campanhas = [];

  for (const documento of documentos) {
    const campanha = await db.collection("campanhas").doc(documento.id).get();

    if (campanha.exists) {
      campanhas.push({
        id: campanha.id,
        ...campanha.data()
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

  cancelarEscutaCampanhas = db.collection("usuarios").doc(uidEscuta).collection("campanhas").orderBy("criadaEm", "asc").onSnapshot(resultado => {
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
            criadaEm: servidor,
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
    const dadosUsuario = obterDadosBasicosUsuario();

    const campanhaId = await db.runTransaction(async transacao => {
      const referenciaConvite = db.collection("convitesCampanha").doc(codigo);
      const convite = await transacao.get(referenciaConvite);

      if (!convite.exists || convite.data().ativo !== true) {
        throw new Error("convite-invalido");
      }

      const id = convite.data().campanhaId;
      const referenciaCampanha = db.collection("campanhas").doc(id);
      const referenciaMembro = referenciaCampanha.collection("membros").doc(usuario.uid);
      const referenciaUsuarioCampanha = db.collection("usuarios").doc(usuario.uid).collection("campanhas").doc(id);

      const campanha = await transacao.get(referenciaCampanha);
      const membro = await transacao.get(referenciaMembro);
      const usuarioCampanha = await transacao.get(referenciaUsuarioCampanha);

      if (!campanha.exists || campanha.data().conviteCodigo !== codigo) {
        throw new Error("convite-invalido");
      }

      if (!membro.exists) {
        transacao.set(referenciaMembro, {
          uid: usuario.uid,
          nome: dadosUsuario.nome,
          foto: dadosUsuario.foto,
          papel: "jogador",
          conviteCodigo: codigo,
          entrouEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      if (!usuarioCampanha.exists) {
        transacao.set(referenciaUsuarioCampanha, {
          campanhaId: id,
          criadaEm: campanha.data().criadoEm,
          entrouEm: membro.exists ? membro.data().entrouEm : firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return id;
    });

    campoLinkCampanha.value = "";
    removerConviteDaURL();

    await abrirCampanha(campanhaId);

  } catch (erro) {
    console.error("Erro ao entrar na campanha:", erro);

    if (erro.message === "convite-invalido" || erro.code === "permission-denied") {
      alert("Esse convite não existe mais ou não é válido.");
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

  if (mestre) {
    if (campanhaAtualDados) linkConviteAtual.value = gerarLinkConvite(campanhaAtualDados.conviteCodigo);
    iniciarEscutaMembros();
  } else {
    if (cancelarEscutaMembros) cancelarEscutaMembros();
    cancelarEscutaMembros = null;
    listaMembrosCampanha.innerHTML = "";
  }
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
  if (!campanhaAtualId || papelAtualCampanha !== "mestre") return;

  cancelarEscutaMembros = db.collection("campanhas").doc(campanhaAtualId).collection("membros").orderBy("entrouEm", "asc").onSnapshot(resultado => {
    listaMembrosCampanha.innerHTML = "";

    resultado.forEach(documento => {
      const membro = documento.data();
      const linha = document.createElement("div");

      linha.className = "membro-campanha";

      const nome = document.createElement("span");
      nome.textContent = `${membro.nome || "Jogador"} — ${membro.papel === "mestre" ? "Mestre" : "Jogador"}`;

      linha.appendChild(nome);

      if (membro.papel === "jogador") {
        const promover = document.createElement("button");
        promover.type = "button";
        promover.textContent = "Tornar Mestre";
        promover.addEventListener("click", () => promoverJogador(documento.id));

        const expulsar = document.createElement("button");
        expulsar.type = "button";
        expulsar.textContent = "Expulsar";
        expulsar.addEventListener("click", () => expulsarJogador(documento.id, membro.nome));

        linha.appendChild(promover);
        linha.appendChild(expulsar);
      }

      listaMembrosCampanha.appendChild(linha);
    });
  });
}

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
botaoRegenerarLink.addEventListener("click", regenerarLinkCampanha);
botaoCopiarLink.addEventListener("click", copiarLinkCampanha);
botaoSairCampanha.addEventListener("click", sairCampanha);

document.querySelector("#tela-campanha .botao-voltar")?.addEventListener("click", cancelarEscutasCampanha);

auth.onAuthStateChanged(usuario => {
  iniciarEscutaCampanhas(usuario);
  verificarConviteNaURL(usuario);
});
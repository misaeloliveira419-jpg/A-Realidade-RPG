/* Elementos da criação de ficha */

const formConceito = document.getElementById("form-conceito");
const campoNomePersonagem = document.getElementById("nome-personagem");
const campoIdadePersonagem = document.getElementById("idade-personagem");
const campoAparencia = document.getElementById("aparencia-personagem");
const campoPassado = document.getElementById("passado-personagem");
const mensagemConceito = document.getElementById("mensagem-conceito");
const botaoContinuarConceito = document.getElementById("continuar-conceito");

let referenciaFichaAtual = null;
let fichaJaCriada = false;
let etapaSalva = 1;
let uidAnteriorCriacao = null;
let versaoAutenticacao = 0;

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

    mensagemConceito.textContent = "";

    if (etapaSalva >= 2) {
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
    referenciaFichaAtual = null;
    fichaJaCriada = false;
    etapaSalva = 1;

    history.replaceState({}, "", window.location.pathname);
    abrirEtapaCriacao("tela-conceito");
  }

  uidAnteriorCriacao = usuario?.uid || null;

  if (!usuario) {
    botaoContinuarConceito.disabled = true;
    mensagemConceito.textContent = "Entre em uma conta para criar sua ficha.";
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
    abrirEtapaCriacao("tela-perfil");

  } catch (erro) {
    console.error("Erro ao salvar conceito:", erro);
    mensagemConceito.textContent = "Não foi possível salvar. Verifique sua conexão e tente novamente.";

  } finally {
    botaoContinuarConceito.disabled = false;
  }
});
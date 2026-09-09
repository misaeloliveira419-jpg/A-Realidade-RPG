const botaoCriarConta = document.getElementById("criar-conta");
const telaCriarConta = document.getElementById("tela-criar-conta");
const botaoFecharCriarConta = document.getElementById("fechar-criar-conta");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const campoConfirmarSenha = document.getElementById("confirmar-senha");
const botaoConfirmarCriarConta = document.getElementById("confirmar-criar-conta");
const botaoCriarContaGoogle = document.getElementById("criar-conta-google");
const erroCriarConta = document.getElementById("erro-criar-conta");
const menuContas = document.getElementById("menu-contas");
const listaOutrasContas = document.getElementById("lista-outras-contas");
const botaoAdicionarOutraConta = document.getElementById("adicionar-outra-conta");
const areaConta = document.querySelector(".area-conta");

let adicionandoOutraConta = false;
let grupoContasPendente = null;
let uidContaAnterior = null;

const telaTrocarConta = document.getElementById("tela-trocar-conta");
const botaoFecharTrocarConta = document.getElementById("fechar-trocar-conta");
const nomeTrocarConta = document.getElementById("nome-trocar-conta");
const campoSenhaTrocarConta = document.getElementById("senha-trocar-conta");
const botaoConfirmarTrocarConta = document.getElementById("confirmar-trocar-conta");
const erroTrocarConta = document.getElementById("erro-trocar-conta");

let contaTrocaPendente = null;

window.usuarioAtual = null;
window.dadosUsuarioAtual = null;

function abrirTelaCriarConta() {
  erroCriarConta.textContent = "";
  telaCriarConta.classList.add("ativa");
}

function fecharTelaCriarConta() {
  telaCriarConta.classList.remove("ativa");
  erroCriarConta.textContent = "";
}

botaoCriarConta.addEventListener("click", async evento => {
  evento.stopPropagation();

  if (!auth.currentUser) {
    abrirTelaCriarConta();
    return;
  }
  
  if (menuContas.classList.contains("ativo")) {
    menuContas.classList.remove("ativo");
    return;
  }

  await renderizarMenuContas();
  menuContas.classList.toggle("ativo");
});

botaoAdicionarOutraConta.addEventListener("click", async evento => {
  evento.stopPropagation();
  menuContas.classList.remove("ativo");

  try {
    grupoContasPendente = await prepararGrupoContas();

    if (!grupoContasPendente) {
      console.error("Não foi possível preparar o grupo de contas.");
      return;
    }

    adicionandoOutraConta = true;
    abrirTelaCriarConta();

  } catch (erro) {
    console.error("Erro ao preparar outra conta:", erro);
  }
});

document.addEventListener("click", evento => {
  if (!areaConta.contains(evento.target)) {
    menuContas.classList.remove("ativo");
  }
});

botaoFecharCriarConta.addEventListener("click", fecharTelaCriarConta);

telaCriarConta.addEventListener("click", evento => {
  if (evento.target === telaCriarConta) {
    fecharTelaCriarConta();
  }
});

async function salvarUsuarioNoFirestore(usuario, provedor) {
  if (!usuario) return;

  const referencia = db.collection("usuarios").doc(usuario.uid);
  const documento = await referencia.get();

  if (documento.exists) {
    await referencia.set({
      uid: usuario.uid,
      email: usuario.email || "",
      nome: usuario.displayName || "",
      foto: usuario.photoURL || "",
      provedor: provedor,
      ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
    }, {
      merge: true
    });

    return;
  }

  await referencia.set({
    uid: usuario.uid,
    email: usuario.email || "",
    nome: usuario.displayName || "",
    foto: usuario.photoURL || "",
    provedor: provedor,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/*Grupo de contas*/

function obterNomeConta(usuario, dados = {}) {
  return dados?.nome || usuario?.displayName || usuario?.email?.split("@")[0] || "Conta";
}

function obterProvedorConta(usuario) {
  const usaGoogle = usuario.providerData?.some(provedor => provedor.providerId === "google.com");
  return usaGoogle ? "google" : "email";
}

async function prepararGrupoContas() {
  const usuario = auth.currentUser;
  if (!usuario) return null;

  const referenciaUsuario = db.collection("usuarios").doc(usuario.uid);
  const documentoUsuario = await referenciaUsuario.get();
  const dadosUsuario = documentoUsuario.data() || {};

  if (dadosUsuario.grupoContasId) {
    return dadosUsuario.grupoContasId;
  }

  const referenciaGrupo = db.collection("gruposContas").doc();

  const membros = {};
  membros[usuario.uid] = {
    nome: obterNomeConta(usuario, dadosUsuario),
    foto: usuario.photoURL || dadosUsuario.foto || "",
    email: usuario.email || "",
    provedor: obterProvedorConta(usuario)
  };

  await referenciaGrupo.set({
    membros: membros,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });

  await referenciaUsuario.set({
    grupoContasId: referenciaGrupo.id
  }, {
    merge: true
  });

  window.dadosUsuarioAtual = {
    ...dadosUsuario,
    grupoContasId: referenciaGrupo.id
  };

  return referenciaGrupo.id;
}

async function vincularContaAoGrupo(usuario) {
  if (!adicionandoOutraConta || !grupoContasPendente || !usuario) return true;

  try {
    const referenciaUsuario = db.collection("usuarios").doc(usuario.uid);
    const documentoUsuario = await referenciaUsuario.get();
    const dadosUsuario = documentoUsuario.data() || {};

    const dadosMembro = {
      nome: obterNomeConta(usuario, dadosUsuario),
      foto: usuario.photoURL || dadosUsuario.foto || "",
      email: usuario.email || "",
      provedor: obterProvedorConta(usuario)
    };

    const referenciaGrupo = db.collection("gruposContas").doc(grupoContasPendente);
    const caminhoMembro = new firebase.firestore.FieldPath("membros", usuario.uid);

    await referenciaGrupo.update(
      caminhoMembro, dadosMembro,
      "atualizadoEm", firebase.firestore.FieldValue.serverTimestamp()
    );

    await referenciaUsuario.set({
      grupoContasId: grupoContasPendente
    }, {
      merge: true
    });

    adicionandoOutraConta = false;
    grupoContasPendente = null;

    await renderizarMenuContas();

    return true;

  } catch (erro) {
    console.error("Erro ao vincular as contas:", erro);
    return false;
  }
}

async function atualizarMeuMembroNoGrupo(usuario, dadosUsuario) {
  if (!usuario || !dadosUsuario?.grupoContasId) return;

  try {
    const referenciaGrupo = db.collection("gruposContas").doc(dadosUsuario.grupoContasId);
    const caminhoMembro = new firebase.firestore.FieldPath("membros", usuario.uid);

    const dadosMembro = {
      nome: obterNomeConta(usuario, dadosUsuario),
      foto: usuario.photoURL || dadosUsuario.foto || "",
      email: usuario.email || "",
      provedor: obterProvedorConta(usuario)
    };

    await referenciaGrupo.update(
      caminhoMembro, dadosMembro,
      "atualizadoEm", firebase.firestore.FieldValue.serverTimestamp()
    );

  } catch (erro) {
    console.error("Erro ao atualizar dados da conta no grupo:", erro);
  }
}

async function trocarParaConta(conta) {
  if (!conta || conta.uid === auth.currentUser?.uid) return;

  menuContas.classList.remove("ativo");

  if (conta.provedor === "google") {
    await trocarParaContaGoogle(conta);
    return;
  }

  if (conta.provedor === "email") {
    abrirTrocaContaEmail(conta);
    return;
  }

  alert("Não foi possível identificar como esta conta foi criada.");
}

async function trocarParaContaGoogle(conta) {
  try {
    const provedorGoogle = new firebase.auth.GoogleAuthProvider();

    if (conta.email) {
      provedorGoogle.setCustomParameters({
        login_hint: conta.email
      });
    } else {
      provedorGoogle.setCustomParameters({
        prompt: "select_account"
      });
    }

    const resultado = await auth.signInWithPopup(provedorGoogle);

    if (resultado.user.uid !== conta.uid) {
      alert("Você selecionou uma conta diferente de " + conta.nome + ".");
      return;
    }

  } catch (erro) {
    console.error("Erro ao trocar de conta:", erro);
  }
}

function abrirTrocaContaEmail(conta) {
  contaTrocaPendente = conta;

  nomeTrocarConta.textContent = conta.nome || "ENTRAR NA CONTA";
  campoSenhaTrocarConta.value = "";
  erroTrocarConta.textContent = "";

  telaTrocarConta.classList.add("ativa");
  campoSenhaTrocarConta.focus();
}

function fecharTrocaContaEmail() {
  telaTrocarConta.classList.remove("ativa");
  campoSenhaTrocarConta.value = "";
  erroTrocarConta.textContent = "";
  contaTrocaPendente = null;
}

botaoFecharTrocarConta.addEventListener("click", fecharTrocaContaEmail);

botaoConfirmarTrocarConta.addEventListener("click", async () => {
  if (!contaTrocaPendente) return;

  const senha = campoSenhaTrocarConta.value;

  if (!senha) {
    erroTrocarConta.textContent = "Digite a senha.";
    return;
  }

  botaoConfirmarTrocarConta.disabled = true;
  botaoConfirmarTrocarConta.textContent = "Entrando...";

  try {
    const resultado = await auth.signInWithEmailAndPassword(contaTrocaPendente.email, senha);

    if (resultado.user.uid !== contaTrocaPendente.uid) {
      erroTrocarConta.textContent = "Essa não é a conta selecionada.";
      return;
    }

    fecharTrocaContaEmail();

  } catch (erro) {
    console.error("Erro ao trocar de conta:", erro);

    if (erro.code === "auth/wrong-password" || erro.code === "auth/invalid-credential") {
      erroTrocarConta.textContent = "Senha incorreta.";
    } else {
      erroTrocarConta.textContent = "Não foi possível entrar nesta conta.";
    }

  } finally {
    botaoConfirmarTrocarConta.disabled = false;
    botaoConfirmarTrocarConta.textContent = "Entrar nesta conta";
  }
});

async function renderizarMenuContas() {
  listaOutrasContas.innerHTML = "";

  const usuario = auth.currentUser;
  if (!usuario) return;

  try {
    const documentoUsuario = await db.collection("usuarios").doc(usuario.uid).get();
    const dadosUsuario = documentoUsuario.data() || {};
    const grupoContasId = dadosUsuario.grupoContasId;

    if (!grupoContasId) return;

    const documentoGrupo = await db.collection("gruposContas").doc(grupoContasId).get();
    if (!documentoGrupo.exists) return;

    const membros = documentoGrupo.data().membros || {};

    Object.entries(membros).forEach(([uid, dados]) => {
      if (uid === usuario.uid) return;

      const botao = document.createElement("button");

      botao.type = "button";
      botao.className = "conta-salva";
      botao.dataset.uid = uid;
      botao.textContent = dados.nome || "Conta";
      
      botao.addEventListener("click", () => {
        trocarParaConta({
          uid: uid,
          nome: dados.nome || "Conta",
          email: dados.email || "",
          provedor: dados.provedor || ""
        });
      });

      listaOutrasContas.appendChild(botao);
    });

  } catch (erro) {
    console.error("Erro ao carregar outras contas:", erro);
  }
}

async function criarContaComEmail() {
  const email = campoEmail.value.trim();
  const senha = campoSenha.value;
  const confirmarSenha = campoConfirmarSenha.value;

  erroCriarConta.textContent = "";

  if (!email || !senha || !confirmarSenha) {
    erroCriarConta.textContent = "Preencha todos os campos.";
    return;
  }

  if (senha.length < 6) {
    erroCriarConta.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    return;
  }

  if (senha !== confirmarSenha) {
    erroCriarConta.textContent = "As senhas não são iguais.";
    return;
  }

  botaoConfirmarCriarConta.disabled = true;
  botaoConfirmarCriarConta.textContent = "Criando conta...";

  try {
    const credencial = await auth.createUserWithEmailAndPassword(email, senha);
    
    await salvarUsuarioNoFirestore(credencial.user, "email");
    
    if (adicionandoOutraConta) {
      const vinculada = await vincularContaAoGrupo(credencial.user);
      
      if (!vinculada) {
        erroCriarConta.textContent = "A conta foi criada, mas não foi possível adicioná-la ao grupo de contas.";
        return;
      }
    }

    campoEmail.value = "";
    campoSenha.value = "";
    campoConfirmarSenha.value = "";
    
    fecharTelaCriarConta();

  } catch (erro) {
    console.error("Erro ao criar conta:", erro);

    switch (erro.code) {
      case "auth/email-already-in-use":
        erroCriarConta.textContent = "Este e-mail já possui uma conta.";
        break;

      case "auth/invalid-email":
        erroCriarConta.textContent = "Digite um e-mail válido.";
        break;

      case "auth/weak-password":
        erroCriarConta.textContent = "A senha é muito fraca.";
        break;

      case "auth/network-request-failed":
        erroCriarConta.textContent = "Não foi possível conectar ao servidor.";
        break;

      default:
        erroCriarConta.textContent = "Não foi possível criar a conta.";
        break;
    }

  } finally {
    botaoConfirmarCriarConta.disabled = false;
    botaoConfirmarCriarConta.textContent = "Criar Conta";
  }
}

botaoConfirmarCriarConta.addEventListener("click", criarContaComEmail);

async function criarContaComGoogle() {
  erroCriarConta.textContent = "";

  botaoCriarContaGoogle.disabled = true;
  botaoCriarContaGoogle.textContent = "Abrindo Google...";

  try {
    const provedorGoogle = new firebase.auth.GoogleAuthProvider();
    
    provedorGoogle.setCustomParameters({
      prompt: "select_account"
    });
    
    const resultado = await auth.signInWithPopup(provedorGoogle);
    
    await salvarUsuarioNoFirestore(resultado.user, "google");
    
    if (adicionandoOutraConta) {
      
      const vinculada = await vincularContaAoGrupo(resultado.user);
      
      if (!vinculada) {
        erroCriarConta.textContent = "A conta foi autenticada, mas não foi possível adicioná-la ao grupo de contas.";
        return;
      }
    }
    
    fecharTelaCriarConta();

  } catch (erro) {
    console.error("Erro ao continuar com Google:", erro);

    switch (erro.code) {
      case "auth/popup-closed-by-user":
        erroCriarConta.textContent = "A janela do Google foi fechada.";
        break;

      case "auth/popup-blocked":
        erroCriarConta.textContent = "O navegador bloqueou a janela do Google.";
        break;

      case "auth/account-exists-with-different-credential":
        erroCriarConta.textContent = "Já existe uma conta com este e-mail usando outro método.";
        break;

      default:
        erroCriarConta.textContent = "Não foi possível continuar com o Google.";
        break;
    }

  } finally {
    botaoCriarContaGoogle.disabled = false;
    botaoCriarContaGoogle.textContent = "Continuar com Google";
  }
}

botaoCriarContaGoogle.addEventListener("click", criarContaComGoogle);

function atualizarBotaoUsuario(usuario, dados) {
  let nome = dados?.nome || usuario.displayName || "";

  if (!nome && usuario.email) {
    nome = usuario.email.split("@")[0];
  }

  botaoCriarConta.textContent = nome || "Conta";
}

auth.onAuthStateChanged(async usuario => {
  const trocouDeConta = uidContaAnterior !== null && usuario && uidContaAnterior !== usuario.uid;
  
  if (trocouDeConta) {
    document.querySelectorAll(".tela-site").forEach(tela => tela.classList.remove("ativa"));
    document.getElementById("tela-principal")?.classList.add("ativa");
  }
  
  uidContaAnterior = usuario?.uid || null;
  
  if (!usuario) {
    window.usuarioAtual = null;
    window.dadosUsuarioAtual = null;

    botaoCriarConta.textContent = "Criar Conta";

    return;
  }

  window.usuarioAtual = usuario;

  try {
    const referencia = db.collection("usuarios").doc(usuario.uid);
    let documento = await referencia.get();

    if (!documento.exists) {
      const provedor = usuario.providerData?.[0]?.providerId === "google.com" ? "google" : "email";

      await salvarUsuarioNoFirestore(usuario, provedor);
      documento = await referencia.get();
    }

    window.dadosUsuarioAtual = documento.data();
    
    atualizarBotaoUsuario(usuario, window.dadosUsuarioAtual);
    await atualizarMeuMembroNoGrupo(usuario, window.dadosUsuarioAtual);
    await renderizarMenuContas();
    
    window.dispatchEvent(new CustomEvent("usuario-autenticado", {
      detail: {
        uid: usuario.uid,
        usuario: usuario,
        dados: window.dadosUsuarioAtual
      }
    }));

  } catch (erro) {
    console.error("Erro ao carregar os dados do usuário:", erro);
  }
});
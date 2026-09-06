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
const chaveContasConhecidas = "a-realidade-contas-conhecidas";

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

botaoCriarConta.addEventListener("click", evento => {
  evento.stopPropagation();

  if (!auth.currentUser) {
    abrirTelaCriarConta();
    return;
  }

  renderizarMenuContas();
  menuContas.classList.toggle("ativo");
});

botaoAdicionarOutraConta.addEventListener("click", evento => {
  evento.stopPropagation();
  menuContas.classList.remove("ativo");
  abrirTelaCriarConta();
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
    salvarContaConhecida(usuario, window.dadosUsuarioAtual);
    renderizarMenuContas();
    
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

function obterContasConhecidas() {
  try {
    const contas = JSON.parse(localStorage.getItem(chaveContasConhecidas));
    return Array.isArray(contas) ? contas : [];
  } catch {
    return [];
  }
}

function salvarContaConhecida(usuario, dados) {
  if (!usuario) return;

  const contas = obterContasConhecidas();
  const nome = dados?.nome || usuario.displayName || usuario.email?.split("@")[0] || "Conta";

  const conta = {
    uid: usuario.uid,
    nome: nome,
    email: usuario.email || "",
    foto: usuario.photoURL || ""
  };

  const indiceExistente = contas.findIndex(item => item.uid === usuario.uid);

  if (indiceExistente >= 0) {
    contas[indiceExistente] = conta;
  } else {
    contas.push(conta);
  }

  localStorage.setItem(chaveContasConhecidas, JSON.stringify(contas));
}

function renderizarMenuContas() {
  listaOutrasContas.innerHTML = "";

  if (!auth.currentUser) return;

  const contas = obterContasConhecidas();
  const outrasContas = contas.filter(conta => conta.uid !== auth.currentUser.uid);

  outrasContas.forEach(conta => {
    const item = document.createElement("div");
    item.className = "conta-salva";
    item.textContent = conta.nome || conta.email || "Conta";
    item.title = conta.email || conta.nome || "";
    listaOutrasContas.appendChild(item);
  });
}
/* Elementos da aba Novidades */

const formularioComentario = document.getElementById("fazer-comentario");
const inputComentario = document.getElementById("input-comentario");
const selectEstrelas = document.getElementById("select-estrelas");
const botaoEnviarComentario = document.getElementById("enviar-comentario");
const listaComentarios = document.getElementById("lista-comentarios");

/* Campo de texto expansível */

function ajustarAlturaComentario() {
  inputComentario.style.height = "auto";
  inputComentario.style.height = Math.min(inputComentario.scrollHeight, 260) + "px";
}

inputComentario.addEventListener("input", ajustarAlturaComentario);

/* Envio de comentários */

formularioComentario.addEventListener("submit", async evento => {
  evento.preventDefault();

  const comentario = inputComentario.value.trim();

  if (!comentario) {
    alert("Escreva um comentário antes de enviar.");
    inputComentario.focus();
    return;
  }

  const usuario = auth.currentUser;

  const nome = usuario
    ? (window.dadosUsuarioAtual?.nome || usuario.displayName ||
       usuario.email?.split("@")[0] || "Usuário").slice(0, 80)
    : "Anônimo";

  const nota = selectEstrelas.value === ""
    ? null
    : Number(selectEstrelas.value);

  botaoEnviarComentario.disabled = true;
  botaoEnviarComentario.textContent = "Enviando...";

  try {
    await db.collection("novidades").add({
      comentario: comentario,
      nota: nota,
      nome: nome,
      uid: usuario?.uid || null,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    inputComentario.value = "";
    selectEstrelas.value = "";
    ajustarAlturaComentario();

  } catch (erro) {
    console.error("Erro ao enviar comentário:", erro);
    alert("Não foi possível enviar seu comentário.");

  } finally {
    botaoEnviarComentario.disabled = false;
    botaoEnviarComentario.textContent = "Enviar";
  }
});

/* Montagem dos comentários */

function criarCardComentario(dados, id) {
  const card = document.createElement("article");
  card.className = "card-comentario";

  const cabecalho = document.createElement("div");
  cabecalho.className = "cabecalho-comentario";

  const nome = document.createElement("span");
  nome.className = "nome-comentario";
  nome.textContent = dados.nome || "Anônimo";

  const nota = document.createElement("span");
  nota.className = "nota-comentario";

  nota.textContent =
    Number.isInteger(dados.nota) &&
    dados.nota >= 0 &&
    dados.nota <= 5
      ? "Nota: " +
        "⭐".repeat(dados.nota) +
        "☆".repeat(5 - dados.nota)
      : "Sem nota";

  /* Opções do comentário */

  const acoesComentario = document.createElement("div");
  acoesComentario.className = "acoes-comentario";

  acoesComentario.appendChild(nota);

  if (dados.uid && auth.currentUser?.uid === dados.uid) {
  const botaoApagar = document.createElement("button");

  botaoApagar.type = "button";
  botaoApagar.className = "botao-apagar-comentario";
  botaoApagar.textContent = "✕";
  botaoApagar.title = "Apagar comentário";
  botaoApagar.setAttribute("aria-label", "Apagar comentário");

  botaoApagar.addEventListener("click", async () => {
    if (!confirm("Tem certeza de que deseja apagar seu comentário?")) return;

    botaoApagar.disabled = true;

    try {
      if (auth.currentUser?.uid !== dados.uid) {
        throw new Error("A conta conectada foi alterada.");
      }

      await db.collection("novidades").doc(id).delete();

    } catch (erro) {
      console.error("Erro ao apagar comentário:", erro);
      alert("Não foi possível apagar seu comentário.");

      } finally {
      botaoApagar.disabled = false;
      }
    });

    acoesComentario.appendChild(botaoApagar);
  }

  cabecalho.append(nome, acoesComentario);

  const comentario = document.createElement("p");
  comentario.className = "texto-comentario";
  comentario.textContent = dados.comentario || "";

  const data = document.createElement("div");
  data.className = "data-comentario";

  const instante = dados.criadoEm?.toDate?.();

  data.textContent = instante
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(instante)
    : "Enviando...";

  card.append(cabecalho, comentario, data);

  return card;
}

/* Atualização da lista em tempo real */

let comentariosCarregados = [];

function atualizarListaComentarios() {
  const fragmento = document.createDocumentFragment();

  if (comentariosCarregados.length === 0) {
    const aviso = document.createElement("p");
    aviso.className = "aviso-comentarios";
    aviso.textContent = "Ainda não há comentários. Seja o primeiro!";

    fragmento.appendChild(aviso);

  } else {
    comentariosCarregados.forEach(documento => {
      fragmento.appendChild(
        criarCardComentario(documento.data(), documento.id)
      );
    });
  }

  listaComentarios.replaceChildren(fragmento);
}

db.collection("novidades")
  .orderBy("criadoEm", "desc")
  .onSnapshot(resultado => {
    comentariosCarregados = resultado.docs;
    atualizarListaComentarios();

  }, erro => {
    console.error("Erro ao carregar comentários:", erro);

    const aviso = document.createElement("p");
    aviso.className = "aviso-comentarios";
    aviso.textContent = "Não foi possível carregar os comentários.";

    listaComentarios.replaceChildren(aviso);
  });

/* Atualizar permissões ao trocar de conta */

auth.onAuthStateChanged(() => {
  atualizarListaComentarios();
});
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

function criarCardComentario(dados) {
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

  cabecalho.append(nome, nota);

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

db.collection("novidades")
  .orderBy("criadoEm", "desc")
  .onSnapshot(resultado => {
    const fragmento = document.createDocumentFragment();

    if (resultado.empty) {
      const aviso = document.createElement("p");
      aviso.className = "aviso-comentarios";
      aviso.textContent = "Ainda não há comentários. Seja o primeiro!";
      fragmento.appendChild(aviso);

    } else {
      resultado.forEach(documento => {
        fragmento.appendChild(
          criarCardComentario(documento.data())
        );
      });
    }

    listaComentarios.replaceChildren(fragmento);

  }, erro => {
    console.error("Erro ao carregar comentários:", erro);

    const aviso = document.createElement("p");
    aviso.className = "aviso-comentarios";
    aviso.textContent = "Não foi possível carregar os comentários.";

    listaComentarios.replaceChildren(aviso);
  });
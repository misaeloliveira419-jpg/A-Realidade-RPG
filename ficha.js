const idFicha = new URLSearchParams(window.location.search).get("ficha");

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

    document.title = `${ficha.nome || "Ficha"}: A Realidade RPG`;

  } catch (erro) {
    console.error("Erro ao carregar ficha:",erro);
    window.location.replace("index-suas-fichas.html");
  }
});

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
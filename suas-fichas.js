/* Tela suas fichas */

const listaSuasFichas = document.getElementById("lista-suas-fichas");

/* Dados temporários do layout de fichas */

let fichasUsuario = [];

/*
Exemplo de uso depois:
window.atualizarSuasFichas([
  {
    id: "1",
    nome: "Arthur",
    foto: "",
    criadoEm: "2026-10-02T10:00:00",
    atualizadoEm: "2026-10-02T14:20:00"
  }
]);
*/

function formatarDataFicha(valor) {
  const data = converterParaData(valor);

  if (!data) return "--/--/----";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(data);
}

function formatarTempoDecorridoFicha(valor) {
  const data = converterParaData(valor);

  if (!data) return "agora";

  const diferencaMs = Date.now() - data.getTime();
  const totalMinutos = Math.max(0, Math.floor(diferencaMs / 60000));

  const dias = Math.floor(totalMinutos / 1440);
  const horas = Math.floor((totalMinutos % 1440) / 60);
  const minutos = totalMinutos % 60;

  if (dias > 0 && horas > 0) {
    return `${dias} dia${dias > 1 ? "s" : ""} e ${horas} hora${horas > 1 ? "s" : ""}`;
  }

  if (dias > 0) {
    return `${dias} dia${dias > 1 ? "s" : ""}`;
  }

  if (horas > 0 && minutos > 0) {
    return `${horas} hora${horas > 1 ? "s" : ""} e ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  }

  if (horas > 0) {
    return `${horas} hora${horas > 1 ? "s" : ""}`;
  }

  return `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
}

function converterParaData(valor) {
  if (!valor) return null;

  if (valor instanceof Date) return valor;

  if (typeof valor?.toDate === "function") {
    return valor.toDate();
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function criarCardCriarFicha() {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card-criar-ficha";

  card.innerHTML = `
    <div class="card-criar-ficha-topo">+</div>
    <div class="card-criar-ficha-base">CRIAR FICHA</div>
  `;

  card.addEventListener("click", () => {
    if (!auth.currentUser) {
        alert("Entre em uma conta para criar sua ficha.");
        return;
    }

    window.location.href = "index-criacao-de-ficha.html";
  });

  return card;
}

function criarCardFicha(ficha) {
  const card = document.createElement("article");
  card.className = "card-ficha-usuario";

  const topo = document.createElement("div");
  topo.className = "topo-card-ficha";

  const foto = document.createElement("div");
  foto.className = "foto-card-ficha";

  if (ficha.foto) {
    const imagem = document.createElement("img");
    imagem.src = ficha.foto;
    imagem.alt = `Foto de ${ficha.nome || "personagem"}`;
    foto.appendChild(imagem);
  } else {
    foto.classList.add("sem-foto");
    foto.textContent = "+";
  }

  const infos = document.createElement("div");
  infos.className = "infos-card-ficha";

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao-excluir-ficha";
  botaoExcluir.title = "Deletar ficha";
  botaoExcluir.setAttribute("aria-label", "Deletar ficha");
  botaoExcluir.textContent = "🗑";

  botaoExcluir.addEventListener("click", async evento => {
    evento.stopPropagation();

    if (!auth.currentUser || ficha.donoUid !== auth.currentUser.uid) {
        alert("Você não tem permissão para excluir esta ficha.");
        return;
    }

    if (!confirm(`Deseja excluir definitivamente a ficha "${ficha.nome}"?`)) return;

    botaoExcluir.disabled = true;

    try {
        await db.collection("fichas").doc(ficha.id).delete();

    } catch (erro) {
        console.error("Erro ao excluir ficha:", erro);
        alert("Não foi possível excluir a ficha.");
        botaoExcluir.disabled = false;
    }
  });

  const criadoEm = document.createElement("div");
  criadoEm.className = "info-ficha-linha";
  criadoEm.innerHTML = `
    <span class="rotulo-info-ficha">Criado em:</span>
    ${formatarDataFicha(ficha.criadoEm)}
  `;

  const atualizadoEm = document.createElement("div");
  atualizadoEm.className = "info-ficha-linha";
  atualizadoEm.innerHTML = `
    <span class="rotulo-info-ficha">Atualizado há:</span>
    ${formatarTempoDecorridoFicha(ficha.atualizadoEm)}
  `;

  infos.append(botaoExcluir, criadoEm, atualizadoEm);
  topo.append(foto, infos);

  const base = document.createElement("div");
  base.className = "base-card-ficha";

  const nome = document.createElement("div");
  nome.className = "nome-card-ficha";
  nome.textContent = ficha.nome || "SEM NOME";

  const seta = document.createElement("div");
  seta.className = "seta-card-ficha";
  seta.textContent = "›";

  base.append(nome, seta);
  card.append(topo, base);

  card.addEventListener("click",() => {
    if (ficha.estado === "rascunho") {
      window.location.href = "index-criacao-de-ficha.html?ficha=" + encodeURIComponent(ficha.id);
      return;
    }

    if (ficha.estado === "pronta") {
      window.location.href = "index-ficha.html?ficha=" + encodeURIComponent(ficha.id);
    }
  });

  return card;
}

function renderizarSuasFichas() {
  if (!listaSuasFichas) return;

  listaSuasFichas.innerHTML = "";

  if (!Array.isArray(fichasUsuario) || fichasUsuario.length === 0) {
    listaSuasFichas.appendChild(criarCardCriarFicha());
    return;
  }

  fichasUsuario.forEach(ficha => {
    listaSuasFichas.appendChild(criarCardFicha(ficha));
  });

  listaSuasFichas.appendChild(criarCardCriarFicha());
}

/* Sincronização das fichas com o Firebase */

let cancelarEscutaFichas = null;

auth.onAuthStateChanged(usuario => {
  if (cancelarEscutaFichas) {
    cancelarEscutaFichas();
    cancelarEscutaFichas = null;
  }

  fichasUsuario = [];
  renderizarSuasFichas();

  if (!usuario) return;

  cancelarEscutaFichas = db.collection("fichas")
    .where("donoUid", "==", usuario.uid)
    .onSnapshot(resultado => {
      fichasUsuario = resultado.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
      }));

      fichasUsuario.sort((a, b) => {
        const dataA = a.atualizadoEm?.toMillis?.() || 0;
        const dataB = b.atualizadoEm?.toMillis?.() || 0;
        return dataB - dataA;
      });

      renderizarSuasFichas();

    }, erro => {
      console.error("Erro ao carregar fichas:", erro);
      alert("Não foi possível carregar suas fichas.");
    });
});
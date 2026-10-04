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

function carregarImagemFotoCard(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir a imagem."));
    };

    imagem.src = url;
  });
}

async function prepararFotoCardFicha(arquivo) {
  const imagem = await carregarImagemFotoCard(arquivo);

  let largura = imagem.width;
  let altura = imagem.height;

  const tamanhoMaximo = 500;

  if (largura > tamanhoMaximo || altura > tamanhoMaximo) {
    const escala = Math.min(tamanhoMaximo / largura, tamanhoMaximo / altura);

    largura = Math.round(largura * escala);
    altura = Math.round(altura * escala);
  }

  const canvas = document.createElement("canvas");

  canvas.width = largura;
  canvas.height = altura;

  canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);

  let qualidade = 0.82;
  let foto = canvas.toDataURL("image/jpeg", qualidade);

  while (foto.length > 600000 && qualidade > 0.45) {
    qualidade -= 0.07;
    foto = canvas.toDataURL("image/jpeg", qualidade);
  }

  if (foto.length > 650000) {
    throw new Error("A imagem continua grande demais.");
  }

  return foto;
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
  foto.title = ficha.foto ? "Alterar foto" : "Adicionar foto";
  foto.setAttribute("role", "button");
  foto.setAttribute("aria-label", ficha.foto ? "Alterar foto da ficha" : "Adicionar foto à ficha");
  foto.tabIndex = 0;

  const inputFoto = document.createElement("input");
  inputFoto.type = "file";
  inputFoto.accept = "image/*";
  inputFoto.hidden = true;

  inputFoto.addEventListener("click", evento => {
    evento.stopPropagation();
  });

  if (ficha.foto) {
    const imagem = document.createElement("img");
      imagem.src = ficha.foto;
      imagem.alt = `Foto de ${ficha.nome || "personagem"}`;

      const botaoRemoverFoto = document.createElement("button");
      botaoRemoverFoto.type = "button";
      botaoRemoverFoto.className = "botao-remover-foto-card";
      botaoRemoverFoto.title = "Remover foto";
      botaoRemoverFoto.setAttribute("aria-label", `Remover foto de ${ficha.nome || "personagem"}`);
      botaoRemoverFoto.textContent = "×";

      botaoRemoverFoto.addEventListener("click", async evento => {
        evento.preventDefault();
        evento.stopPropagation();

        if (!auth.currentUser || ficha.donoUid !== auth.currentUser.uid) return;

        if (!confirm(`Remover a foto da ficha "${ficha.nome}"?`)) return;

        botaoRemoverFoto.disabled = true;

        try {
          await db.collection("fichas").doc(ficha.id).update({
            foto: "",
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
          });

        } catch (erro) {
          console.error("Erro ao remover foto:", erro);
          alert("Não foi possível remover a foto.");
          botaoRemoverFoto.disabled = false;
        }
      });

      foto.append(inputFoto, imagem, botaoRemoverFoto);

    } else {
      foto.classList.add("sem-foto");

      const adicionar = document.createElement("span");
      adicionar.textContent = "+";

      foto.append(inputFoto, adicionar);
    }

    foto.addEventListener("click", evento => {
      evento.stopPropagation();

      if (evento.target.closest(".botao-remover-foto-card")) return;

      inputFoto.click();
    });

    foto.addEventListener("keydown", evento => {
      if (evento.key !== "Enter" && evento.key !== " ") return;

      evento.preventDefault();
      evento.stopPropagation();

      inputFoto.click();
    });

    inputFoto.addEventListener("change", async evento => {
      evento.stopPropagation();

      const arquivo = inputFoto.files?.[0];

      if (!arquivo) return;

      if (!auth.currentUser || ficha.donoUid !== auth.currentUser.uid) {
        inputFoto.value = "";
        return;
      }

      foto.classList.add("alterando-foto");

      try {
        const novaFoto = await prepararFotoCardFicha(arquivo);

        await db.collection("fichas").doc(ficha.id).update({
          foto: novaFoto,
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });

      } catch (erro) {
        console.error("Erro ao alterar foto:", erro);
        alert("Não foi possível alterar a foto.");

      } finally {
        inputFoto.value = "";
        foto.classList.remove("alterando-foto");
      }
    });

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
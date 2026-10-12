(() => {
  const MUSICAS = [
    { nome: "Ataque", arquivo: "musicas/Misael Oliveira - Ataque - A Realidade 2026-07-25 13_38.m4a" },
    { nome: "Até", arquivo: "musicas/Misael Oliveira - Até - A Realidade 2026-08-02 13_06.m4a" },
    { nome: "Caos", arquivo: "musicas/Misael Oliveira - Caos - A Realidade 2026-07-31 21_22.m4a" },
    { nome: "Dream", arquivo: "musicas/Misael Oliveira - Dream - A Realidade - 1788016700298 2026-08-29 12_18.m4a" },
    { nome: "Efêmero", arquivo: "musicas/Misael Oliveira - Efêmero - A Realidade 2026-07-31 21_23.m4a" },
    { nome: "Libertados", arquivo: "musicas/Misael Oliveira - Libertados - A Realidade 2026-07-31 21_23.m4a" },
    { nome: "Shopping", arquivo: "musicas/Misael Oliveira - Shopping - A Realidade 2026-06-27 16_36.m4a" },
    { nome: "Tudo é Nada", arquivo: "musicas/Misael Oliveira - Tudo é Nada - A Realidade 2026-07-20 14_31.m4a" }
  ];

  const alvoPlayer = document.getElementById("fichas-campanha") || document.querySelector(".painel-ficha");

  if (!alvoPlayer) {
    window.iniciarMusicaCampanha = () => {};
    window.cancelarMusicaCampanha = () => {};
    return;
  }

  const player = document.createElement("section");
  player.id = "player-musica-campanha";
  player.className = "player-musica-campanha";
  player.hidden = true;

  player.innerHTML = `
    <div class="cabecalho-musica-campanha">
      <span>MÚSICA</span>
      <strong id="nome-musica-campanha">Nenhuma música selecionada</strong>
    </div>

    <div id="controles-musica-mestre" class="controles-musica-mestre" hidden>
      <select id="seletor-musica-campanha" aria-label="Biblioteca de músicas"></select>

      <div class="botoes-musica-campanha">
        <button id="musica-anterior-campanha" type="button">◀ ANTERIOR</button>
        <button id="musica-play-campanha" type="button">▶ PLAY</button>
        <button id="musica-pause-campanha" type="button">Ⅱ PAUSE</button>
        <button id="musica-stop-campanha" type="button">■ STOP</button>
        <button id="musica-proxima-campanha" type="button">PRÓXIMA ▶</button>
      </div>

      <div class="linha-progresso-musica-campanha">
        <input id="progresso-musica-campanha" type="range" min="0" max="0" step="0.1" value="0">
        <span id="tempo-musica-campanha">00:00 / 00:00</span>
      </div>
    </div>

    <label class="volume-musica-campanha">
      <span>VOLUME</span>
      <input id="volume-musica-campanha" type="range" min="0" max="100" step="1" value="70">
    </label>

    <audio id="audio-musica-campanha" preload="metadata"></audio>
  `;

  alvoPlayer.insertAdjacentElement("afterend", player);

  const $ = id => document.getElementById(id);

  const audio = $("audio-musica-campanha");
  const nome = $("nome-musica-campanha");
  const controles = $("controles-musica-mestre");
  const seletor = $("seletor-musica-campanha");

  const anterior = $("musica-anterior-campanha");
  const play = $("musica-play-campanha");
  const pause = $("musica-pause-campanha");
  const stop = $("musica-stop-campanha");
  const proxima = $("musica-proxima-campanha");

  const progresso = $("progresso-musica-campanha");
  const tempo = $("tempo-musica-campanha");
  const volume = $("volume-musica-campanha");

  let campanhaId = null;
  let papel = null;
  let refEstado = null;
  let cancelarEscuta = null;
  let estado = null;

  let intervalo = null;
  let interagiu = false;
  let arrastando = false;
  let animacaoVolume = null;

  const clamp = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

  let volumeLocal = 0.7;

  try {
    const salvo = Number(sessionStorage.getItem("volume-musica-campanha"));

    if (Number.isFinite(salvo)) {
      volumeLocal = clamp(salvo, 0, 1);
    }
  } catch {}

  volume.value = Math.round(volumeLocal * 100);
  audio.volume = volumeLocal;

  function formatarTempo(segundos) {
    segundos = Number(segundos);

    if (!Number.isFinite(segundos) || segundos < 0) {
      segundos = 0;
    }

    const total = Math.floor(segundos);
    const minutos = Math.floor(total / 60);
    const segundosRestantes = total % 60;

    return `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
  }

  function millis(timestamp) {
    if (!timestamp) return null;

    if (typeof timestamp.toMillis === "function") {
      return timestamp.toMillis();
    }

    if (Number.isFinite(timestamp.seconds)) {
      return timestamp.seconds * 1000;
    }

    return null;
  }

  function posicaoEsperada() {
    if (!estado) return 0;

    const base = Math.max(0, Number(estado.pausadoEm) || 0);

    if (!estado.tocando) {
      return base;
    }

    const inicio = millis(estado.iniciadoEm);

    return inicio
      ? Math.max(0, base + (Date.now() - inicio) / 1000)
      : base;
  }

  function indiceAtual() {
    return MUSICAS.findIndex(musica => musica.arquivo === estado?.arquivo);
  }

  function preencherBiblioteca() {
    seletor.innerHTML = "";

    const inicial = document.createElement("option");

    inicial.value = "";
    inicial.textContent = MUSICAS.length
      ? "Escolha uma música..."
      : "Nenhuma música cadastrada";

    seletor.appendChild(inicial);

    MUSICAS.forEach((musica, indice) => {
      const opcao = document.createElement("option");

      opcao.value = indice;
      opcao.textContent = musica.nome;

      seletor.appendChild(opcao);
    });

    seletor.disabled = MUSICAS.length === 0;
  }

  function atualizarPapel() {
    const mestre = papel === "mestre";

    controles.hidden = !mestre;

    player.classList.toggle("player-musica-mestre", mestre);
    player.classList.toggle("player-musica-jogador", !mestre);
  }

  function atualizarBotoes() {
    const mestre = papel === "mestre";
    const temLista = MUSICAS.length > 0;
    const temMusica = Boolean(estado?.arquivo);

    anterior.disabled = !mestre || !temLista;
    proxima.disabled = !mestre || !temLista;

    play.disabled =
      !mestre ||
      !temLista ||
      Boolean(estado?.tocando);

    pause.disabled =
      !mestre ||
      !temMusica ||
      !estado?.tocando;

    stop.disabled =
      !mestre ||
      !temMusica;
  }

  function fadeVolume(alvo, duracao = 260) {
    if (animacaoVolume) {
      cancelAnimationFrame(animacaoVolume);
    }

    const inicio = audio.volume;
    const destino = clamp(alvo, 0, 1);
    const tempoInicial = performance.now();

    const passo = agora => {
      const progressoFade = clamp(
        (agora - tempoInicial) / duracao,
        0,
        1
      );

      audio.volume =
        inicio +
        (destino - inicio) * progressoFade;

      if (progressoFade < 1) {
        animacaoVolume = requestAnimationFrame(passo);
      } else {
        animacaoVolume = null;
      }
    };

    animacaoVolume = requestAnimationFrame(passo);
  }

  function colocarFonte(arquivo) {
    const atual = audio.getAttribute("src") || "";

    if (atual === (arquivo || "")) {
      return false;
    }

    audio.pause();
    audio.removeAttribute("src");

    if (arquivo) {
      audio.src = arquivo;
    }

    audio.volume = arquivo ? 0 : volumeLocal;

    audio.load();

    return true;
  }

  function sincronizarPosicao(forcar = false) {
    if (
      !estado?.arquivo ||
      audio.readyState < 1 ||
      arrastando
    ) return;

    let alvo = posicaoEsperada();

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      alvo = clamp(
        alvo,
        0,
        Math.max(0, audio.duration - 0.05)
      );
    }

    if (
      forcar ||
      Math.abs(audio.currentTime - alvo) > 0.5
    ) {
      try {
        audio.currentTime = alvo;
      } catch {}
    }
  }

  async function tocarLocal(forcar = false) {
    if (
      !estado?.tocando ||
      !estado?.arquivo ||
      (!interagiu && papel !== "mestre")
    ) return;

    sincronizarPosicao(forcar);

    try {
      await audio.play();
      fadeVolume(volumeLocal);
    } catch {}
  }

  function atualizarTempo() {
    const duracao =
      Number.isFinite(audio.duration)
        ? audio.duration
        : 0;

    const posicao =
      arrastando
        ? Number(progresso.value) || 0
        : estado?.tocando
          ? posicaoEsperada()
          : Number(estado?.pausadoEm) ||
            audio.currentTime ||
            0;

    progresso.max = Math.max(0, duracao);

    if (!arrastando) {
      progresso.value =
        duracao
          ? clamp(posicao, 0, duracao)
          : Math.max(0, posicao);
    }

    tempo.textContent =
      `${formatarTempo(posicao)} / ${formatarTempo(duracao)}`;
  }

  async function aplicarEstado(novoEstado) {
    estado = novoEstado || null;

    const arquivo =
      estado?.arquivo || "";

    nome.textContent =
      estado?.nome ||
      MUSICAS.find(musica => musica.arquivo === arquivo)?.nome ||
      "Nenhuma música selecionada";

    const indice = indiceAtual();

    seletor.value =
      indice >= 0
        ? String(indice)
        : "";

    const mudouFonte =
      colocarFonte(arquivo);

    if (!arquivo) {
      progresso.value = 0;
      progresso.max = 0;
      tempo.textContent = "00:00 / 00:00";

      atualizarBotoes();

      return;
    }

    const aplicarDepoisDeCarregar = async () => {
      atualizarTempo();

      if (estado?.tocando) {
        await tocarLocal(true);
      } else {
        sincronizarPosicao(true);
        audio.pause();
        audio.volume = volumeLocal;
      }
    };

    if (
      mudouFonte &&
      audio.readyState < 1
    ) {
      audio.addEventListener(
        "loadedmetadata",
        aplicarDepoisDeCarregar,
        { once: true }
      );
    } else {
      await aplicarDepoisDeCarregar();
    }

    atualizarBotoes();
  }

  async function gravar(dados) {
    if (
      papel !== "mestre" ||
      !refEstado ||
      !auth.currentUser
    ) return;

    try {
      await refEstado.set({
        ...dados,

        versao:
          firebase.firestore.FieldValue.increment(1),

        atualizadoPor:
          auth.currentUser.uid,

        atualizadoEm:
          firebase.firestore.FieldValue.serverTimestamp()
      }, {
        merge: true
      });

    } catch (erro) {
      console.error(
        "Erro ao atualizar a música da campanha:",
        erro
      );
    }
  }

  async function trocarMusica(
    indice,
    continuarTocando = Boolean(estado?.tocando)
    ) {
    const musica = MUSICAS[indice];

    if (
        !musica ||
        papel !== "mestre"
    ) return;

    interagiu = true;

    // Para a faixa anterior imediatamente.
    // O Firestore definirá o instante oficial da nova faixa.
    audio.pause();

    await gravar({
        arquivo: musica.arquivo,
        nome: musica.nome,
        tocando: continuarTocando,

        iniciadoEm:
        firebase.firestore.FieldValue.serverTimestamp(),

        pausadoEm: 0
    });
  }

  async function tocar() {
    if (
        papel !== "mestre" ||
        !MUSICAS.length
    ) return;

    interagiu = true;

    if (!estado?.arquivo) {
        return trocarMusica(0, true);
    }

    const posicao =
        Math.max(
        0,
        Number(audio.currentTime) ||
        Number(estado.pausadoEm) ||
        0
        );

    // O Firestore define quando a reprodução realmente começa.
    await gravar({
        tocando: true,

        iniciadoEm:
        firebase.firestore.FieldValue.serverTimestamp(),

        pausadoEm: posicao
    });
  }

  async function pausar() {
    if (
      papel !== "mestre" ||
      !estado?.arquivo
    ) return;

    const posicao =
      Math.max(
        0,
        Number(audio.currentTime) ||
        posicaoEsperada()
      );

    audio.pause();
    audio.volume = volumeLocal;

    await gravar({
      tocando: false,
      pausadoEm: posicao
    });
  }

  async function parar() {
    if (
      papel !== "mestre" ||
      !estado?.arquivo
    ) return;

    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {}

    audio.volume = volumeLocal;

    await gravar({
      tocando: false,
      pausadoEm: 0
    });
  }

  async function trocarRelativo(direcao) {
    if (
      papel !== "mestre" ||
      !MUSICAS.length
    ) return;

    const atual = indiceAtual();

    const proximoIndice =
      (
        (atual >= 0 ? atual : 0) +
        direcao +
        MUSICAS.length
      ) % MUSICAS.length;

    await trocarMusica(proximoIndice);
  }

  function cancelarMusicaCampanha() {
    if (cancelarEscuta) {
      cancelarEscuta();
    }

    if (intervalo) {
      clearInterval(intervalo);
    }

    if (animacaoVolume) {
      cancelAnimationFrame(animacaoVolume);
    }

    cancelarEscuta = null;
    intervalo = null;
    animacaoVolume = null;

    campanhaId = null;
    papel = null;
    refEstado = null;
    estado = null;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    audio.volume = volumeLocal;

    player.hidden = true;
  }

  function iniciarMusicaCampanha({
    campanhaId: novoId,
    papel: novoPapel
  } = {}) {
    if (
      !novoId ||
      !auth.currentUser
    ) {
      cancelarMusicaCampanha();
      return;
    }

    const mesmaCampanha =
      campanhaId === novoId &&
      Boolean(cancelarEscuta);

    campanhaId = novoId;
    papel = novoPapel || "jogador";

    player.hidden = false;

    atualizarPapel();
    preencherBiblioteca();

    if (mesmaCampanha) {
      atualizarBotoes();
      return;
    }

    if (cancelarEscuta) {
      cancelarEscuta();
    }

    if (intervalo) {
      clearInterval(intervalo);
    }

    refEstado =
      db
        .collection("campanhas")
        .doc(campanhaId)
        .collection("musica")
        .doc("estado");

    cancelarEscuta = refEstado.onSnapshot(documento => {
      if (documento.metadata.hasPendingWrites) return;
      
      aplicarEstado(documento.exists ? documento.data() : null);
      },erro => {
          console.error(
            "Erro ao acompanhar a música da campanha:",
            erro
          );

          if (
            erro?.code === "permission-denied"
          ) {
            cancelarMusicaCampanha();
          }
        }
      );

    intervalo =
      setInterval(() => {
        if (
          estado?.tocando &&
          !audio.paused
        ) {
          sincronizarPosicao(false);
        }

        atualizarTempo();
      }, 1000);
  }

  seletor.addEventListener("change", () => {
    const indice =
      Number(seletor.value);

    if (
      Number.isInteger(indice)
    ) {
      trocarMusica(indice);
    }
  });

  anterior.addEventListener(
    "click",
    () => trocarRelativo(-1)
  );

  play.addEventListener(
    "click",
    tocar
  );

  pause.addEventListener(
    "click",
    pausar
  );

  stop.addEventListener(
    "click",
    parar
  );

  proxima.addEventListener(
    "click",
    () => trocarRelativo(1)
  );

  progresso.addEventListener(
    "pointerdown",
    () => {
      arrastando = true;
    }
  );

  progresso.addEventListener(
    "input",
    () => {
      if (
        papel !== "mestre"
      ) return;

      const posicao =
        Number(progresso.value) || 0;

      try {
        audio.currentTime = posicao;
      } catch {}

      tempo.textContent =
        `${formatarTempo(posicao)} / ${formatarTempo(audio.duration)}`;
    }
  );

  progresso.addEventListener(
    "change",
    async () => {
      if (
        papel !== "mestre" ||
        !estado?.arquivo
      ) return;

      arrastando = false;

      const posicao =
        Math.max(
          0,
          Number(progresso.value) || 0
        );

      await gravar({
        pausadoEm: posicao,

        ...(estado.tocando
          ? {
              iniciadoEm:
                firebase.firestore.FieldValue.serverTimestamp()
            }
          : {})
      });
    }
  );

  progresso.addEventListener(
    "pointerup",
    () => {
      arrastando = false;
    }
  );

  volume.addEventListener(
    "input",
    () => {
      volumeLocal =
        clamp(
          (Number(volume.value) || 0) / 100,
          0,
          1
        );

      try {
        sessionStorage.setItem(
          "volume-musica-campanha",
          String(volumeLocal)
        );
      } catch {}

      if (animacaoVolume) {
        cancelAnimationFrame(animacaoVolume);
      }

      animacaoVolume = null;
      audio.volume = volumeLocal;
    }
  );

  audio.addEventListener(
    "loadedmetadata",
    atualizarTempo
  );

  audio.addEventListener(
    "timeupdate",
    atualizarTempo
  );

  audio.addEventListener(
    "ended",
    () => {
      if (
        papel === "mestre" &&
        estado?.tocando &&
        MUSICAS.length
      ) {
        trocarRelativo(1);
      }
    }
  );

  const habilitarAudio = () => {
    interagiu = true;

    if (estado?.tocando) {
      tocarLocal(true);
    }
  };

  document.addEventListener(
    "pointerdown",
    habilitarAudio,
    {
      once: true,
      capture: true
    }
  );

  document.addEventListener(
    "keydown",
    habilitarAudio,
    {
      once: true,
      capture: true
    }
  );

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && estado?.tocando) {
      tocarLocal(true);
    }
});

  document
    .querySelector("#tela-campanha .botao-voltar")
    ?.addEventListener(
      "click",
      cancelarMusicaCampanha
    );

  window.addEventListener(
    "beforeunload",
    cancelarMusicaCampanha
  );

  auth.onAuthStateChanged(usuario => {
    if (!usuario) {
      cancelarMusicaCampanha();
    }
  });

  window.iniciarMusicaCampanha =
    iniciarMusicaCampanha;

  window.cancelarMusicaCampanha =
    cancelarMusicaCampanha;
})();
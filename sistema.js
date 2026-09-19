/*Tela sistema*/

document.getElementById("mecanicas-basicas").addEventListener("click", () => {
  abrirTelaSite("tela-mecanicas-basicas");
});

document.getElementById("pontos-ficha").addEventListener("click", () => {
  document.body.scrollTop = 0;
  abrirTelaSite("tela-pontos-ficha");
});

document.getElementById("criacao-personagem").addEventListener("click", () => {
  abrirTelaSite("tela-criacao-personagem");
});

document.getElementById("cenas-acoes").addEventListener("click", () => {
  abrirTelaSite("tela-cenas-acoes");
});

document.getElementById("mecanicas-adicionais").addEventListener("click", () => {
  abrirTelaSite("tela-mecanicas-adicionais");
});

document.getElementById("niveis-habilidades").addEventListener("click", () => {
  abrirTelaSite("tela-niveis-habilidades");
});

/*Redirecionamento de subtópicos*/

document.querySelectorAll(".lista-subtopicos-sistema[data-tela][data-alvo]").forEach(subtopico => {
  subtopico.addEventListener("click", evento => {
    evento.stopPropagation();

    abrirTelaSite(subtopico.dataset.tela);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const alvo = document.getElementById(subtopico.dataset.alvo);

        if (!alvo) return;

        alvo.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    });
  });
});
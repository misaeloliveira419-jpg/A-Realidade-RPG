/*Tela sistema*/

document.getElementById("mecanica-testes").addEventListener("click", () => {
  abrirTelaSite("tela-mecanica-testes");
});

document.getElementById("criacao-personagem").addEventListener("click", () => {
  abrirTelaSite("tela-criacao-personagem");
});

document.getElementById("cenas-acoes-mecanicas").addEventListener("click", () => {
  abrirTelaSite("tela-cenas-acoes-mecanicas");
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
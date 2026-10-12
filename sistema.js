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

/* Pesquisa das Habilidades de Ocupação */

const pesquisaHabilidadesOcupacao = document.getElementById("pesquisa-habilidades-ocupacao");
const gruposHabilidadesOcupacao = [...document.querySelectorAll(".grupo-habilidades-ocupacao")];
const semResultadosHabilidadesOcupacao = document.getElementById("sem-resultados-habilidades-ocupacao");

function normalizarPesquisaHabilidadesOcupacao(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function filtrarHabilidadesOcupacao() {
  if (!pesquisaHabilidadesOcupacao) return;

  const termo = normalizarPesquisaHabilidadesOcupacao(
    pesquisaHabilidadesOcupacao.value
  );

  let gruposVisiveis = 0;

  gruposHabilidadesOcupacao.forEach(grupo => {
    const nomeOcupacao =
      normalizarPesquisaHabilidadesOcupacao(
        grupo.dataset.ocupacao
      );

    const linhas =
      [...grupo.querySelectorAll("tbody tr")];

    if (!termo) {
      grupo.hidden = false;
      linhas.forEach(
        linha =>
          linha.hidden = false
      );

      gruposVisiveis++;
      return;
    }

    if (
      nomeOcupacao.includes(termo)
    ) {
      grupo.hidden = false;

      linhas.forEach(
        linha =>
          linha.hidden = false
      );

      gruposVisiveis++;
      return;
    }

    let encontrouLinha = false;

    linhas.forEach(linha => {
      const textoLinha =
        normalizarPesquisaHabilidadesOcupacao(
          linha.textContent
        );

      const corresponde =
        textoLinha.includes(termo);

      linha.hidden =
        !corresponde;

      if (corresponde) {
        encontrouLinha = true;
      }
    });

    grupo.hidden =
      !encontrouLinha;

    if (encontrouLinha) {
      gruposVisiveis++;
    }
  });

  if (
    semResultadosHabilidadesOcupacao
  ) {
    semResultadosHabilidadesOcupacao.hidden =
      gruposVisiveis > 0;
  }
}

if (
  pesquisaHabilidadesOcupacao
) {
  pesquisaHabilidadesOcupacao.addEventListener(
    "input",
    filtrarHabilidadesOcupacao
  );
}


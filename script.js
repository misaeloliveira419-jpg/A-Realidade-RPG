const telaPrincipal = document.getElementById("tela-principal");

/*Botão voltar*/

document.querySelectorAll(".botao-voltar").forEach(botao => {
  botao.addEventListener("click", () => {
    const destino = document.getElementById(botao.dataset.voltar);

    if (!destino) return;

    document.querySelectorAll(".tela-site").forEach(tela => {
      tela.classList.remove("ativa");
    });

    destino.classList.add("ativa");
  });
});

/*Tela campanhas*/

const telaCampanhas = document.getElementById("tela-campanhas");
const botaoAbrirCampanhas = document.getElementById("botao-abrir-campanhas");

function abrirTelaCampanhas() {
  telaPrincipal.classList.remove("ativa");
  telaCampanhas.classList.add("ativa");
}

botaoAbrirCampanhas.addEventListener("click", abrirTelaCampanhas);

/*Tela entrar campanha*/

const telaEntrarCampanha = document.getElementById("tela-entrar-campanha");
const botaoEntrarCampanha = document.getElementById("botao-entrar-campanha");

function abrirTelaEntrarCampanha() {
  telaCampanhas.classList.remove("ativa");
  telaEntrarCampanha.classList.add("ativa");
}

botaoEntrarCampanha.addEventListener("click", abrirTelaEntrarCampanha);
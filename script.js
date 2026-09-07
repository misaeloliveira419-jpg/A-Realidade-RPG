const telaPrincipal = document.getElementById("tela-principal");

/* Tela campanhas */

const telaCampanhas = document.getElementById("tela-campanhas");
const botaoAbrirCampanhas = document.getElementById("botao-abrir-campanhas");

function abrirTelaCampanhas() {
  telaPrincipal.classList.remove("ativa");
  telaCampanhas.classList.add("ativa");
}

botaoAbrirCampanhas.addEventListener("click", abrirTelaCampanhas);

/* Tela criar campanha */

const telaCriarCampanha = document.getElementById("tela-criar-campanha");
const botaoCriarCampanha = document.getElementById("botao-criar-campanha");

function abrirTelaCriarCampanha() {
  telaCampanhas.classList.remove("ativa");
  telaCriarCampanha.classList.add("ativa");
}

botaoCriarCampanha.addEventListener("click", abrirTelaCriarCampanha);
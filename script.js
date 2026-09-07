const telaPrincipal = document.getElementById("tela-principal");

/* Tela campanhas */

const telaCampanhas = document.getElementById("tela-campanhas");
const botaoAbrirCampanhas = document.getElementById("botao-abrir-campanhas");

function abrirTelaCampanhas() {
  telaPrincipal.classList.remove("ativa");
  telaCampanhas.classList.add("ativa");
}

botaoAbrirCampanhas.addEventListener("click", abrirTelaCampanhas);
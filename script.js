const telaPrincipal = document.getElementById("tela-principal");

function abrirTelaSite(id) {
  const destino = document.getElementById(id);
  if (!destino) return;

  document.querySelectorAll(".tela-site").forEach(tela => tela.classList.remove("ativa"));
  destino.classList.add("ativa");
}

window.abrirTelaSite = abrirTelaSite;

document.querySelectorAll(".botao-voltar").forEach(botao => {
  botao.addEventListener("click", () => abrirTelaSite(botao.dataset.voltar));
});

document.getElementById("botao-abrir-campanhas").addEventListener("click", () => {
  abrirTelaSite("tela-selecionar-campanhas");
});

document.getElementById("botao-entrar-campanha").addEventListener("click", () => {
  if (!auth.currentUser) {
    alert("Você precisa estar em uma conta para criar ou entrar em uma campanha.");
    return;
  }

  abrirTelaSite("tela-entrar-campanha");
});
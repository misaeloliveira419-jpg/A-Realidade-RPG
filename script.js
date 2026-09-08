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

/*Tela selecionar campanhas*/

const telaSelecionarCampanhas = document.getElementById("tela-selecionar-campanhas");
const botaoAbrirCampanhas = document.getElementById("botao-abrir-campanhas");

function abrirTelaSelecionarCampanhas() {
  telaPrincipal.classList.remove("ativa");
  telaSelecionarCampanhas.classList.add("ativa");
}

botaoAbrirCampanhas.addEventListener("click", abrirTelaSelecionarCampanhas);

/*Tela entrar campanha*/

const telaEntrarCampanha = document.getElementById("tela-entrar-campanha");
const botaoEntrarCampanha = document.getElementById("botao-entrar-campanha");

function abrirTelaEntrarCampanha() {
  telaSelecionarCampanhas.classList.remove("ativa");
  telaEntrarCampanha.classList.add("ativa");
}

botaoEntrarCampanha.addEventListener("click", abrirTelaEntrarCampanha);
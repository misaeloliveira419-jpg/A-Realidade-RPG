const idFicha = new URLSearchParams(window.location.search).get("ficha");

auth.onAuthStateChanged(async usuario => {
  if (!usuario || !idFicha) {
    window.location.replace("index-suas-fichas.html");
    return;
  }

  try {
    const documento = await db.collection("fichas").doc(idFicha).get();

    if (!documento.exists) {
      window.location.replace("index-suas-fichas.html");
      return;
    }

    const ficha = documento.data();

    if (ficha.donoUid !== usuario.uid) {
      window.location.replace("index-suas-fichas.html");
      return;
    }

    if (ficha.estado !== "pronta") {
      window.location.replace(`index-criacao-de-ficha.html?ficha=${encodeURIComponent(idFicha)}`);
      return;
    }

    document.title = `${ficha.nome || "Ficha"}: A Realidade RPG`;

  } catch (erro) {
    console.error("Erro ao carregar ficha:",erro);
    window.location.replace("index-suas-fichas.html");
  }
});
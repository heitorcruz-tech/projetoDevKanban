export async function carregarTarefas() {
    const resposta = await fetch("./dados.json");

    if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (!dados || !Array.isArray(dados.tarefas)) {
        throw new SyntaxError("Formato de dados inválido.");
    }

    return dados.tarefas;
}
async function iniciar() {
    renderizarEstado("carregando");

    try {
        const tarefas = await carregarTarefas();

        if (tarefas.length === 0) {
            renderizarEstado("vazio");
            return;
        }

        renderizarTarefas(tarefas);
        renderizarEstado("sucesso", tarefas);

    } catch (erro) {

        if (erro.name === "TypeError") {
            renderizarEstado("erro", "Erro de rede.");
        } else if (erro.name === "SyntaxError") {
            renderizarEstado("erro", "Erro no formato dos dados.");
        } else {
            renderizarEstado("erro", "Erro ao carregar as tarefas.");
        }
    }
}

iniciar();
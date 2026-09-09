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


export function renderizarEstado(estado, dados) {

    const status = document.querySelector("#mensagem-status");

    if (estado === "carregando") {
        status.textContent = "Carregando tarefas...";
    }

    if (estado === "sucesso") {
        status.textContent = `${dados.length} tarefas carregadas.`;
    }

    if (estado === "vazio") {
        status.textContent = "Não há tarefas cadastradas.";
    }

    if (estado === "erro") {
        status.textContent = dados;
    }
}


function criarCartao(tarefa) {

    const li = document.createElement("li");

    const article = document.createElement("article");

    article.className = "cartao-tarefa";


    const cabecalho = document.createElement("div");

    cabecalho.className = "cartao-cabecalho";


    const titulo = document.createElement("h3");

    titulo.textContent = tarefa.titulo;


    const prioridade = document.createElement("span");

    prioridade.className = `prioridade prioridade-${tarefa.prioridade}`;

    prioridade.textContent = tarefa.prioridade;


    cabecalho.appendChild(titulo);

    cabecalho.appendChild(prioridade);


    const conteudo = document.createElement("div");

    conteudo.className = "cartao-conteudo";


    const projeto = document.createElement("p");

    projeto.textContent = `Projeto: ${tarefa.projeto}`;


    const responsavel = document.createElement("p");

    responsavel.textContent = `Responsável: ${tarefa.responsavel}`;


    const prazo = document.createElement("p");

    prazo.className = "prazo";

    prazo.textContent = `Prazo: ${tarefa.prazo}`;


    conteudo.appendChild(projeto);

    conteudo.appendChild(responsavel);

    conteudo.appendChild(prazo);


    article.appendChild(cabecalho);

    article.appendChild(conteudo);

    li.appendChild(article);


    return li;
}


export function renderizarTarefas(tarefas) {

    const listas = {

        "a-fazer": document.querySelector("#lista-a-fazer"),

        "em-andamento": document.querySelector("#lista-em-andamento"),

        "em-revisao": document.querySelector("#lista-em-revisao"),

        "concluida": document.querySelector("#lista-concluida")

    };


    const contadores = {

        "a-fazer": document.querySelector("#contador-a-fazer"),

        "em-andamento": document.querySelector("#contador-em-andamento"),

        "em-revisao": document.querySelector("#contador-em-revisao"),

        "concluida": document.querySelector("#contador-concluida")

    };


    Object.values(listas).forEach(lista => {

        lista.replaceChildren();

    });


    Object.values(contadores).forEach(contador => {

        contador.textContent = "0";

    });


    tarefas.forEach(tarefa => {

        const lista = listas[tarefa.status];

        const contador = contadores[tarefa.status];


        if (!lista || !contador) {
            return;
        }


        const cartao = criarCartao(tarefa);

        lista.appendChild(cartao);


        contador.textContent =
            Number(contador.textContent) + 1;

    });
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

            renderizarEstado(
                "erro",
                "Erro de rede."
            );

        } else if (erro.name === "SyntaxError") {

            renderizarEstado(
                "erro",
                "Erro no formato dos dados."
            );

        } else {

            renderizarEstado(
                "erro",
                "Erro ao carregar as tarefas."
            );
        }
    }
}


iniciar();
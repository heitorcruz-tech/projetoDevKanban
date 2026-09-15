const estado = {
    tarefas: [],
    busca: "",
    status: "todos",
    prioridade: "todas",
    ordenacao: "nenhuma",
    carregamento: "idle",
    erro: null
};


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


/*
    DERIVA A LISTA VISÍVEL

    Esta função não altera:
    - estado
    - estado.tarefas

    Ela apenas cria uma nova lista com base
    nos critérios atuais.
*/
export function derivarTarefasVisiveis(estado) {

    let tarefasVisiveis = [...estado.tarefas];


    // BUSCA POR TÍTULO
    if (estado.busca.trim() !== "") {

        const textoBusca = estado.busca
            .trim()
            .toLocaleLowerCase();

        tarefasVisiveis = tarefasVisiveis.filter(tarefa =>
            tarefa.titulo
                .toLocaleLowerCase()
                .includes(textoBusca)
        );
    }


    // FILTRO POR STATUS
    if (estado.status !== "todos") {

        tarefasVisiveis = tarefasVisiveis.filter(tarefa =>
            tarefa.status === estado.status
        );
    }


    // FILTRO POR PRIORIDADE
    if (estado.prioridade !== "todas") {

        tarefasVisiveis = tarefasVisiveis.filter(tarefa =>
            tarefa.prioridade === estado.prioridade
        );
    }


    // ORDENAÇÃO POR PRAZO
    if (estado.ordenacao !== "nenhuma") {

        tarefasVisiveis = [...tarefasVisiveis];

        tarefasVisiveis.sort((a, b) => {

            const dataA = converterPrazoParaData(a.prazo);
            const dataB = converterPrazoParaData(b.prazo);

            if (estado.ordenacao === "crescente") {
                return dataA - dataB;
            }

            return dataB - dataA;
        });
    }


    return tarefasVisiveis;
}


/*
    Converte a data do formato:

    DD/MM/AAAA

    para um objeto Date.
*/
function converterPrazoParaData(prazo) {

    const partes = prazo.split("/");

    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const ano = Number(partes[2]);

    return new Date(ano, mes, dia);
}


/*
    RENDERIZA AS MENSAGENS DE ESTADO
*/
export function renderizarEstado(tipo, dados) {

    const mensagem = document.querySelector("#mensagem-status");

    if (!mensagem) {
        return;
    }


    if (tipo === "carregando") {

        mensagem.textContent = "Carregando tarefas...";

        return;
    }


    if (tipo === "erro") {

        mensagem.textContent = dados;

        return;
    }


    if (tipo === "vazio") {

        mensagem.textContent = "Não há tarefas cadastradas.";

        return;
    }


    if (tipo === "resultado-vazio") {

        mensagem.textContent =
            "Nenhuma tarefa encontrada para os critérios selecionados.";

        return;
    }


    if (tipo === "sucesso") {

        mensagem.textContent =
            `${dados.visiveis} de ${dados.total} tarefas.`;

        return;
    }
}


/*
    CRIA O CARTÃO DE UMA TAREFA
*/
function criarCartao(tarefa) {

    const li = document.createElement("li");

    const article = document.createElement("article");

    article.className = "cartao-tarefa";


    const cabecalho = document.createElement("div");

    cabecalho.className = "cartao-cabecalho";


    const titulo = document.createElement("h3");

    titulo.textContent = tarefa.titulo;


    const prioridade = document.createElement("span");

    prioridade.className =
        `prioridade prioridade-${tarefa.prioridade}`;

    prioridade.textContent = tarefa.prioridade;


    cabecalho.appendChild(titulo);

    cabecalho.appendChild(prioridade);


    const conteudo = document.createElement("div");

    conteudo.className = "cartao-conteudo";


    const projeto = document.createElement("p");

    projeto.textContent =
        `Projeto: ${tarefa.projeto}`;


    const responsavel = document.createElement("p");

    responsavel.textContent =
        `Responsável: ${tarefa.responsavel}`;


    const prazo = document.createElement("p");

    prazo.className = "prazo";

    prazo.textContent =
        `Prazo: ${tarefa.prazo}`;


    conteudo.appendChild(projeto);

    conteudo.appendChild(responsavel);

    conteudo.appendChild(prazo);


    article.appendChild(cabecalho);

    article.appendChild(conteudo);

    li.appendChild(article);


    return li;
}


/*
    RENDERIZA AS TAREFAS NAS COLUNAS
*/
export function renderizarTarefas(tarefas) {

    const listas = {

        "a-fazer":
            document.querySelector("#lista-a-fazer"),

        "em-andamento":
            document.querySelector("#lista-em-andamento"),

        "em-revisao":
            document.querySelector("#lista-em-revisao"),

        "concluida":
            document.querySelector("#lista-concluida")
    };


    const contadores = {

        "a-fazer":
            document.querySelector("#contador-a-fazer"),

        "em-andamento":
            document.querySelector("#contador-em-andamento"),

        "em-revisao":
            document.querySelector("#contador-em-revisao"),

        "concluida":
            document.querySelector("#contador-concluida")
    };


    /*
        Limpa a renderização anterior.
        Isso impede duplicação dos cartões.
    */
    Object.values(listas).forEach(lista => {

        if (lista) {
            lista.replaceChildren();
        }
    });


    /*
        Zera os contadores.
    */
    Object.values(contadores).forEach(contador => {

        if (contador) {
            contador.textContent = "0";
        }
    });


    /*
        Renderiza somente a lista recebida.
    */
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


/*
    CICLO ÚNICO DE ATUALIZAÇÃO DA TELA

    Todos os elementos visuais derivados
    do estado são atualizados aqui.
*/
function atualizarTela() {

    /*
        Se estiver carregando, mostra apenas
        a mensagem correspondente.
    */
    if (estado.carregamento === "carregando") {

        renderizarEstado("carregando");

        return;
    }


    /*
        Se houver erro, mostra a mensagem de erro.
    */
    if (estado.carregamento === "erro") {

        renderizarEstado(
            "erro",
            estado.erro
        );

        return;
    }


    /*
        Deriva a lista visível uma única vez
        neste ciclo.
    */
    const tarefasVisiveis =
        derivarTarefasVisiveis(estado);


    /*
        Renderiza os cartões usando a lista derivada.
    */
    renderizarTarefas(tarefasVisiveis);


    /*
        Se não existem tarefas no arquivo original,
        informa a origem vazia.
    */
    if (estado.tarefas.length === 0) {

        renderizarEstado("vazio");

        return;
    }


    /*
        Se existem tarefas originais, mas nenhuma
        passou pelos filtros, informa resultado vazio.
    */
    if (tarefasVisiveis.length === 0) {

        renderizarEstado("resultado-vazio");

        return;
    }


    /*
        Caso normal.
    */
    renderizarEstado(
        "sucesso",
        {
            visiveis: tarefasVisiveis.length,
            total: estado.tarefas.length
        }
    );
}


/*
    CONFIGURA OS CONTROLES
*/
function configurarControles() {

    const busca =
        document.querySelector("#busca");

    const filtroStatus =
        document.querySelector("#filtro-status");

    const filtroPrioridade =
        document.querySelector("#filtro-prioridade");

    const ordenacao =
        document.querySelector("#ordenacao");

    const limparFiltros =
        document.querySelector("#limpar-filtros");


    /*
        BUSCA

        O estado é alterado a cada input.
    */
    busca.addEventListener("input", evento => {

        estado.busca = evento.target.value;

        atualizarTela();
    });


    /*
        STATUS
    */
    filtroStatus.addEventListener("change", evento => {

        estado.status = evento.target.value;

        atualizarTela();
    });


    /*
        PRIORIDADE
    */
    filtroPrioridade.addEventListener("change", evento => {

        estado.prioridade = evento.target.value;

        atualizarTela();
    });


    /*
        ORDENAÇÃO
    */
    ordenacao.addEventListener("change", evento => {

        estado.ordenacao = evento.target.value;

        atualizarTela();
    });


    /*
        LIMPAR FILTROS

        Restaura o estado inicial dos controles.
    */
    limparFiltros.addEventListener("click", () => {

        estado.busca = "";
        estado.status = "todos";
        estado.prioridade = "todas";
        estado.ordenacao = "nenhuma";


        busca.value = "";

        filtroStatus.value = "todos";

        filtroPrioridade.value = "todas";

        ordenacao.value = "nenhuma";


        atualizarTela();
    });
}


/*
    INICIALIZAÇÃO DA APLICAÇÃO
*/
async function iniciar() {

    /*
        Configura os eventos antes
        de carregar os dados.
    */
    configurarControles();


    /*
        Estado de carregamento.
    */
    estado.carregamento = "carregando";

    estado.erro = null;

    atualizarTela();


    try {

        /*
            carregarTarefas() continua responsável
            somente pela obtenção dos dados.
        */
        const tarefas = await carregarTarefas();


        /*
            O array recebido é armazenado
            diretamente em estado.tarefas.
        */
        estado.tarefas = tarefas;


        /*
            Verifica se a origem está vazia.
        */
        if (tarefas.length === 0) {

            estado.carregamento = "sucesso";

            atualizarTela();

            return;
        }


        /*
            Carregamento concluído.
        */
        estado.carregamento = "sucesso";

        estado.erro = null;


        /*
            Renderiza a aplicação.
        */
        atualizarTela();

    } catch (erro) {

        estado.carregamento = "erro";


        if (erro.name === "TypeError") {

            estado.erro = "Erro de rede.";

        } else if (erro.name === "SyntaxError") {

            estado.erro =
                "Erro no formato dos dados.";

        } else {

            estado.erro =
                "Erro ao carregar as tarefas.";
        }


        atualizarTela();
    }
}


iniciar();
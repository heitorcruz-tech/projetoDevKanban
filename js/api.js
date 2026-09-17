/* =========================================================
   ESTADO REATIVO DA APLICAÇÃO
   ========================================================= */

const estado = {
    tarefas: [],
    busca: "",
    status: "todos",
    prioridade: "todas",
    ordenacao: "nenhuma",
    projeto: "todos",
    carregamento: "idle",
    erro: null
};


/* =========================================================
   OBTENÇÃO DOS DADOS
   ========================================================= */

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


/* =========================================================
   DERIVA A LISTA VISÍVEL (FUNÇÃO PURA)
   ========================================================= */

export function derivarTarefasVisiveis(estado) {
    let tarefasVisiveis = [...estado.tarefas];

    // FILTRO POR PROJETO (CAIXA DE ENTRADA)
    if (estado.projeto !== "todos") {
        tarefasVisiveis = tarefasVisiveis.filter(tarefa =>
            tarefa.projeto === estado.projeto
        );
    }

    // BUSCA POR TÍTULO
    if (estado.busca.trim() !== "") {
        const textoBusca = estado.busca.trim().toLocaleLowerCase();

        tarefasVisiveis = tarefasVisiveis.filter(tarefa =>
            tarefa.titulo.toLocaleLowerCase().includes(textoBusca)
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


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function converterPrazoParaData(prazo) {
    const partes = prazo.split("/");
    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const ano = Number(partes[2]);

    return new Date(ano, mes, dia);
}


/* =========================================================
   RENDERIZAÇÃO DE MENSAGENS E CARTÕES
   ========================================================= */

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
        mensagem.textContent = "Nenhuma tarefa encontrada para os critérios selecionados.";
        return;
    }

    if (tipo === "sucesso") {
        mensagem.textContent = `${dados.visiveis} de ${dados.total} tarefas.`;
        return;
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
        if (lista) {
            lista.replaceChildren();
        }
    });

    Object.values(contadores).forEach(contador => {
        if (contador) {
            contador.textContent = "0";
        }
    });

    tarefas.forEach(tarefa => {
        const lista = listas[tarefa.status];
        const contador = contadores[tarefa.status];

        if (!lista || !contador) {
            return;
        }

        const cartao = criarCartao(tarefa);
        lista.appendChild(cartao);

        contador.textContent = Number(contador.textContent) + 1;
    });
}


/* =========================================================
   RENDERIZAÇÃO DA CAIXA DE ENTRADA (MENU LATERAL)
   ========================================================= */

function renderizarMenuProjetos() {
    const container = document.querySelector("#lista-quadros");

    if (!container) {
        return;
    }

    const projetosUnicos = [...new Set(estado.tarefas.map(t => t.projeto))];

    container.replaceChildren();

    // Botão "Todos os quadros"
    const liTodos = document.createElement("li");
    const btnTodos = document.createElement("button");
    btnTodos.type = "button";
    btnTodos.className = `quadro-item ${estado.projeto === "todos" ? "ativo" : ""}`;
    btnTodos.innerHTML = `<span>▦</span> Todos os quadros`;
    btnTodos.addEventListener("click", () => selecionarProjeto("todos"));

    liTodos.appendChild(btnTodos);
    container.appendChild(liTodos);

    // Botões dos projetos encontrados dinamicamente
    projetosUnicos.forEach(nomeProjeto => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `quadro-item ${estado.projeto === nomeProjeto ? "ativo" : ""}`;
        btn.innerHTML = `<span>📋</span> ${nomeProjeto}`;
        btn.addEventListener("click", () => selecionarProjeto(nomeProjeto));

        li.appendChild(btn);
        container.appendChild(li);
    });
}


function selecionarProjeto(nomeProjeto) {
    estado.projeto = nomeProjeto;
    renderizarMenuProjetos();
    atualizarTela();
}


/* =========================================================
   CICLO DE ATUALIZAÇÃO REATIVO DA TELA
   ========================================================= */

function atualizarTela() {
    if (estado.carregamento === "carregando") {
        renderizarEstado("carregando");
        return;
    }

    if (estado.carregamento === "erro") {
        renderizarEstado("erro", estado.erro);
        return;
    }

    const tarefasVisiveis = derivarTarefasVisiveis(estado);

    renderizarTarefas(tarefasVisiveis);

    if (estado.tarefas.length === 0) {
        renderizarEstado("vazio");
        return;
    }

    if (tarefasVisiveis.length === 0) {
        renderizarEstado("resultado-vazio");
        return;
    }

    renderizarEstado("sucesso", {
        visiveis: tarefasVisiveis.length,
        total: estado.tarefas.length
    });
}


/* =========================================================
   EVENTOS E CONTROLES
   ========================================================= */

function configurarControles() {
    const busca = document.querySelector("#busca");
    const filtroStatus = document.querySelector("#filtro-status");
    const filtroPrioridade = document.querySelector("#filtro-prioridade");
    const ordenacao = document.querySelector("#ordenacao");
    const limparFiltros = document.querySelector("#limpar-filtros");

    busca.addEventListener("input", evento => {
        estado.busca = evento.target.value;
        atualizarTela();
    });

    filtroStatus.addEventListener("change", evento => {
        estado.status = evento.target.value;
        atualizarTela();
    });

    filtroPrioridade.addEventListener("change", evento => {
        estado.prioridade = evento.target.value;
        atualizarTela();
    });

    ordenacao.addEventListener("change", evento => {
        estado.ordenacao = evento.target.value;
        atualizarTela();
    });

    limparFiltros.addEventListener("click", () => {
        estado.busca = "";
        estado.status = "todos";
        estado.prioridade = "todas";
        estado.ordenacao = "nenhuma";
        estado.projeto = "todos";

        busca.value = "";
        filtroStatus.value = "todos";
        filtroPrioridade.value = "todas";
        ordenacao.value = "nenhuma";

        renderizarMenuProjetos();
        atualizarTela();
    });
}


/* =========================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================= */

async function iniciar() {
    configurarControles();

    estado.carregamento = "carregando";
    estado.erro = null;
    atualizarTela();

    try {
        const tarefas = await carregarTarefas();
        estado.tarefas = tarefas;

        if (tarefas.length === 0) {
            estado.carregamento = "sucesso";
            atualizarTela();
            return;
        }

        estado.carregamento = "sucesso";
        estado.erro = null;

        renderizarMenuProjetos();
        atualizarTela();

    } catch (erro) {
        estado.carregamento = "erro";

        if (erro.name === "TypeError") {
            estado.erro = "Erro de rede.";
        } else if (erro.name === "SyntaxError") {
            estado.erro = "Erro no formato dos dados.";
        } else {
            estado.erro = "Erro ao carregar as tarefas.";
        }

        atualizarTela();
    }
}


iniciar();
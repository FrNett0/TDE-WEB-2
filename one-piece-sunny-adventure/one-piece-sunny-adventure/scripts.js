// =====================================================================
// ONE PIECE — SUNNY ADVENTURE
// Todas as posições usam o sistema de coordenadas do jogo (960 x 540).
// A tela é redimensionada só com CSS (scale), então a colisão não muda.
// =====================================================================

// ----- Configurações -----
const LARGURA = 960;
const ALTURA = 540;
const CHAO = 515;              // REQUISITO 2: linha do oceano (igual ao "top" do #chao no CSS)

const GRAVIDADE = 2200;        // px/s²
const FORCA_PULO = 900;        // px/s (altura do pulo ≈ 184 px)
const VEL_TENTACULO = 280;     // px/s (tentáculos e moedas)
const VEL_NUVEM = 50;          // px/s (paralaxe: bem mais lento)

const TEMPO_TOTAL = 70;        // segundos
const META = 15;               // moedas para vencer
const DURACAO_MORTE = 1300;    // ms (igual à duração da animação "morte" no CSS)

const NAVIO_X = 90;
const TAM_NAVIO = 130;
const TAM_TENTACULO = 110;
const TAM_MOEDA = 44;
const DIST_MIN = 560;          // distância mínima entre tentáculos (px)
const DIST_MAX = 800;          // distância máxima entre tentáculos (px)

// Caixas de colisão em frações da imagem (0 a 1), ajustadas à parte
// visível de cada sprite para as margens transparentes não contarem.
const CAIXA_NAVIO       = { x1: 0.22, y1: 0.30, x2: 0.82, y2: 0.85 }; // casco (contra tentáculos)
const CAIXA_NAVIO_MOEDA = { x1: 0.10, y1: 0.08, x2: 0.94, y2: 0.90 }; // navio inteiro (para moedas)
const CAIXA_TENTACULO   = { x1: 0.30, y1: 0.15, x2: 0.68, y2: 1.00 };
const CAIXA_MOEDA       = { x1: 0.05, y1: 0.05, x2: 0.95, y2: 0.95 };

// Posição vertical do navio quando está "boiando" no chão (oceano).
// A parte visível do GIF termina em 90% da altura da imagem.
const NAVIO_Y_CHAO = CHAO - TAM_NAVIO * 0.90;

// ----- Elementos da página -----
const jogoEl = document.getElementById("jogo");
const navioEl = document.getElementById("navio");
const nuvensEl = document.getElementById("nuvens");
const objetosEl = document.getElementById("objetos");
const moedasEl = document.getElementById("moedas");
const tempoEl = document.getElementById("tempo");
const telaInicio = document.getElementById("tela-inicio");
const telaGameOver = document.getElementById("tela-gameover");
const telaVitoria = document.getElementById("tela-vitoria");

// ----- Variáveis do jogo -----
let estado = "inicio";         // inicio | jogando | morrendo | gameover | vitoria
let navioY = NAVIO_Y_CHAO;
let velocidadeY = 0;
let noChao = true;
let moedas = 0;
let tempoRestante = TEMPO_TOTAL;
let distanciaProximo = 0;      // px até o próximo tentáculo aparecer
let tentaculos = [];           // cada item: { el, x, y, tam }
let listaMoedas = [];
let nuvens = [];

// ----- Funções auxiliares -----
function aleatorio(min, max) {
    return min + Math.random() * (max - min);
}

function criarImagem(arquivo, pai, x, y, tam) {
    const el = document.createElement("img");
    el.src = "imagens/" + arquivo;
    el.alt = "";
    el.draggable = false;
    el.style.width = tam + "px";
    el.style.height = tam + "px";
    el.style.left = x + "px";
    el.style.top = y + "px";
    pai.appendChild(el);
    return { el: el, x: x, y: y, tam: tam };
}

// Retângulo de colisão de um objeto, a partir das frações da caixa
function caixa(x, y, tam, c) {
    return { x1: x + tam * c.x1, y1: y + tam * c.y1, x2: x + tam * c.x2, y2: y + tam * c.y2 };
}

function colide(a, b) {
    return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function atualizarHud() {
    moedasEl.textContent = "MOEDAS: " + moedas + " / " + META;
    tempoEl.textContent = "TEMPO: " + Math.ceil(tempoRestante);
}

// ----- REQUISITO 3: nuvens (paralaxe) -----
function criarNuvens() {
    const alturas = [5, 70, 30, 120];
    const tamanhos = [150, 110, 180, 130];
    for (let i = 0; i < alturas.length; i++) {
        nuvens.push(criarImagem("nuvem.png", nuvensEl, 0, alturas[i], tamanhos[i]));
    }
}

function reiniciarNuvens() {
    for (let i = 0; i < nuvens.length; i++) {
        nuvens[i].x = 80 + i * 270;
        nuvens[i].el.style.left = nuvens[i].x + "px";
    }
}

// ----- Iniciar / reiniciar -----
function iniciar() {
    objetosEl.replaceChildren();          // remove tentáculos e moedas antigos
    tentaculos = [];
    listaMoedas = [];
    moedas = 0;
    tempoRestante = TEMPO_TOTAL;
    navioY = NAVIO_Y_CHAO;
    velocidadeY = 0;
    noChao = true;
    distanciaProximo = 300;               // primeiro tentáculo chega em ~4 s
    navioEl.classList.remove("morrendo"); // volta à posição e orientação originais
    navioEl.style.top = navioY + "px";
    reiniciarNuvens();
    atualizarHud();
    telaInicio.hidden = true;
    telaGameOver.hidden = true;
    telaVitoria.hidden = true;
    estado = "jogando";
}

// ----- Pulo -----
function pular() {
    if (estado === "jogando" && noChao) {   // sem pulo duplo
        velocidadeY = -FORCA_PULO;
        noChao = false;
    }
}

// ----- Criação de tentáculos e moedas -----
function criarTentaculoEMoeda() {
    const x = LARGURA + 20;
    // REQUISITO 5: obstáculo, preso ao chão (5% fica "dentro" da água)
    tentaculos.push(criarImagem("tentaculo.png", objetosEl, x, CHAO - TAM_TENTACULO * 0.95, TAM_TENTACULO));

    distanciaProximo = aleatorio(DIST_MIN, DIST_MAX);

    // REQUISITO 6: item colecionável. Sempre no alto (só dá para pegar pulando) e
    // ou exatamente em cima do tentáculo, ou no meio do espaço até o próximo.
    // Assim a moeda nunca fica dentro de um tentáculo nem em posição impossível.
    let moedaX = x + (TAM_TENTACULO - TAM_MOEDA) / 2;
    if (Math.random() < 0.5) {
        moedaX += distanciaProximo / 2;
    }
    const moedaY = CHAO - aleatorio(190, 250);
    listaMoedas.push(criarImagem("moeda.png", objetosEl, moedaX, moedaY, TAM_MOEDA));
}

// ----- Fim de jogo -----
function morrer(motivo) {
    if (estado !== "jogando") return;     // garante que só acontece uma vez
    estado = "morrendo";                  // congela tudo e desliga os controles
    document.getElementById("motivo").textContent = motivo;
    document.getElementById("moedas-finais").textContent = "MOEDAS COLETADAS: " + moedas + " / " + META;
    navioEl.classList.add("morrendo");    // animação de morte (CSS, dura 1,3 s)

    // REQUISITO 9: a placa de Game Over só aparece quando a animação de morte termina.
    // Não dá para reiniciar durante a animação, então este temporizador nunca se repete.
    setTimeout(function () {
        estado = "gameover";
        telaGameOver.hidden = false;
    }, DURACAO_MORTE);
}

function vencer() {
    estado = "vitoria";
    document.getElementById("tempo-restante").textContent =
        "TEMPO RESTANTE: " + Math.ceil(tempoRestante) + " SEGUNDOS";
    telaVitoria.hidden = false;
}

// ----- Atualização de um quadro (dt = segundos desde o quadro anterior) -----
function atualizar(dt) {
    // REQUISITO 8: cronômetro
    tempoRestante = Math.max(0, tempoRestante - dt);

    // Pulo e gravidade
    velocidadeY += GRAVIDADE * dt;
    navioY += velocidadeY * dt;
    if (navioY >= NAVIO_Y_CHAO) {         // tocou o chão (oceano)
        navioY = NAVIO_Y_CHAO;
        velocidadeY = 0;
        noChao = true;
    }
    navioEl.style.top = navioY + "px";

    // Criação contínua de obstáculos
    distanciaProximo -= VEL_TENTACULO * dt;
    if (distanciaProximo <= 0) {
        criarTentaculoEMoeda();
    }

    const caixaNavio = caixa(NAVIO_X, navioY, TAM_NAVIO, CAIXA_NAVIO);
    const caixaNavioMoeda = caixa(NAVIO_X, navioY, TAM_NAVIO, CAIXA_NAVIO_MOEDA);

    // Tentáculos: mover, remover os que saíram da tela, testar colisão
    for (let i = tentaculos.length - 1; i >= 0; i--) {
        const t = tentaculos[i];
        t.x -= VEL_TENTACULO * dt;
        t.el.style.left = t.x + "px";
        if (t.x < -t.tam) {
            t.el.remove();
            tentaculos.splice(i, 1);
        } else if (colide(caixaNavio, caixa(t.x, t.y, t.tam, CAIXA_TENTACULO))) {
            morrer("VOCÊ COLIDIU COM UM TENTÁCULO!");
        }
    }

    // Moedas: mover, remover as que saíram da tela, testar coleta
    for (let i = listaMoedas.length - 1; i >= 0; i--) {
        const m = listaMoedas[i];
        m.x -= VEL_TENTACULO * dt;
        m.el.style.left = m.x + "px";
        if (m.x < -m.tam) {
            m.el.remove();
            listaMoedas.splice(i, 1);
        } else if (estado === "jogando" && colide(caixaNavioMoeda, caixa(m.x, m.y, m.tam, CAIXA_MOEDA))) {
            listaMoedas.splice(i, 1);     // sai da lista: não pode ser coletada de novo
            m.el.classList.add("coletada");
            m.el.addEventListener("animationend", function () { m.el.remove(); });
            moedas++;                     // REQUISITO 7: contador
        }
    }

    // Nuvens: mais lentas que os tentáculos; voltam pela direita
    for (let i = 0; i < nuvens.length; i++) {
        const n = nuvens[i];
        n.x -= VEL_NUVEM * dt;
        if (n.x < -n.tam) {
            n.x = LARGURA + aleatorio(0, 120);
        }
        n.el.style.left = n.x + "px";
    }

    atualizarHud();

    if (estado === "jogando" && moedas >= META) {
        vencer();
    } else if (estado === "jogando" && tempoRestante <= 0) {
        morrer("O TEMPO ACABOU!");
    }
}

// ----- Laço principal: existe um só, criado uma única vez -----
let ultimoTempo = 0;

function laco(agora) {
    const dt = Math.min((agora - ultimoTempo) / 1000, 0.05);  // limite evita "saltos" ao trocar de aba
    ultimoTempo = agora;
    if (estado === "jogando") {
        atualizar(dt);
    }
    requestAnimationFrame(laco);
}

// ----- Controles -----
document.addEventListener("keydown", function (evento) {
    if (evento.code === "Space" || evento.code === "ArrowUp") {
        evento.preventDefault();          // não rola a página
        if (!evento.repeat) pular();
    }
});

// pointerdown funciona para mouse (botão esquerdo) e toque
jogoEl.addEventListener("pointerdown", function (evento) {
    if (evento.button === 0) pular();
});

document.getElementById("botao-jogar").addEventListener("click", iniciar);
document.getElementById("botao-reiniciar").addEventListener("click", iniciar);   // REQUISITO 10
document.getElementById("botao-novamente").addEventListener("click", iniciar);

// ----- Escala responsiva -----
function ajustarEscala() {
    const escala = Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA);
    jogoEl.style.transform = "translate(-50%, -50%) scale(" + escala + ")";
}

window.addEventListener("resize", ajustarEscala);

// ----- Preparação inicial -----
navioEl.style.width = TAM_NAVIO + "px";
navioEl.style.height = TAM_NAVIO + "px";
navioEl.style.left = NAVIO_X + "px";
navioEl.style.top = navioY + "px";
criarNuvens();
reiniciarNuvens();
ajustarEscala();
requestAnimationFrame(laco);

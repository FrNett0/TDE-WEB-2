const LARGURA = 960;
const ALTURA = 540;
const CHAO = 515;              

const GRAVIDADE = 2200;       
const FORCA_PULO = 900;        
const VEL_TENTACULO = 280;     
const VEL_NUVEM = 50;          

const TEMPO_TOTAL = 70;        
const META = 15;               
const DURACAO_MORTE = 1300;    

const NAVIO_X = 90;
const TAM_NAVIO = 130;
const TAM_TENTACULO = 110;
const TAM_MOEDA = 44;
const DIST_MIN = 560;          
const DIST_MAX = 800;          



const CAIXA_NAVIO       = { x1: 0.22, y1: 0.30, x2: 0.82, y2: 0.85 }; 
const CAIXA_NAVIO_MOEDA = { x1: 0.10, y1: 0.08, x2: 0.94, y2: 0.90 }; 
const CAIXA_TENTACULO   = { x1: 0.30, y1: 0.15, x2: 0.68, y2: 1.00 };
const CAIXA_MOEDA       = { x1: 0.05, y1: 0.05, x2: 0.95, y2: 0.95 };

const NAVIO_Y_CHAO = CHAO - TAM_NAVIO * 0.90;


const jogoEl = document.getElementById("jogo");
const navioEl = document.getElementById("navio");
const nuvensEl = document.getElementById("nuvens");
const objetosEl = document.getElementById("objetos");
const moedasEl = document.getElementById("moedas");
const tempoEl = document.getElementById("tempo");
const telaInicio = document.getElementById("tela-inicio");
const telaGameOver = document.getElementById("tela-gameover");
const telaVitoria = document.getElementById("tela-vitoria");


let estado = "inicio";         
let navioY = NAVIO_Y_CHAO;
let velocidadeY = 0;
let noChao = true;
let moedas = 0;
let tempoRestante = TEMPO_TOTAL;
let distanciaProximo = 0;      
let tentaculos = [];           
let listaMoedas = [];
let nuvens = [];


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


function iniciar() {
    objetosEl.replaceChildren();          
    tentaculos = [];
    listaMoedas = [];
    moedas = 0;
    tempoRestante = TEMPO_TOTAL;
    navioY = NAVIO_Y_CHAO;
    velocidadeY = 0;
    noChao = true;
    distanciaProximo = 300;               
    navioEl.classList.remove("morrendo");
    navioEl.style.top = navioY + "px";
    reiniciarNuvens();
    atualizarHud();
    telaInicio.hidden = true;
    telaGameOver.hidden = true;
    telaVitoria.hidden = true;
    estado = "jogando";
}


function pular() {
    if (estado === "jogando" && noChao) {   
        velocidadeY = -FORCA_PULO;
        noChao = false;
    }
}


function criarTentaculoEMoeda() {
    const x = LARGURA + 20;
    tentaculos.push(criarImagem("tentaculo.png", objetosEl, x, CHAO - TAM_TENTACULO * 0.95, TAM_TENTACULO));

    distanciaProximo = aleatorio(DIST_MIN, DIST_MAX);
    let moedaX = x + (TAM_TENTACULO - TAM_MOEDA) / 2;
    if (Math.random() < 0.5) {
        moedaX += distanciaProximo / 2;
    }
    const moedaY = CHAO - aleatorio(190, 250);
    listaMoedas.push(criarImagem("moeda.png", objetosEl, moedaX, moedaY, TAM_MOEDA));
}


function morrer(motivo) {
    if (estado !== "jogando") return;     
    estado = "morrendo";                  
    document.getElementById("motivo").textContent = motivo;
    document.getElementById("moedas-finais").textContent = "MOEDAS COLETADAS: " + moedas + " / " + META;
    navioEl.classList.add("morrendo");   

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


function atualizar(dt) {
    tempoRestante = Math.max(0, tempoRestante - dt);

    velocidadeY += GRAVIDADE * dt;
    navioY += velocidadeY * dt;
    if (navioY >= NAVIO_Y_CHAO) {         
        navioY = NAVIO_Y_CHAO;
        velocidadeY = 0;
        noChao = true;
    }
    navioEl.style.top = navioY + "px";

    distanciaProximo -= VEL_TENTACULO * dt;
    if (distanciaProximo <= 0) {
        criarTentaculoEMoeda();
    }

    const caixaNavio = caixa(NAVIO_X, navioY, TAM_NAVIO, CAIXA_NAVIO);
    const caixaNavioMoeda = caixa(NAVIO_X, navioY, TAM_NAVIO, CAIXA_NAVIO_MOEDA);

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

    for (let i = listaMoedas.length - 1; i >= 0; i--) {
        const m = listaMoedas[i];
        m.x -= VEL_TENTACULO * dt;
        m.el.style.left = m.x + "px";
        if (m.x < -m.tam) {
            m.el.remove();
            listaMoedas.splice(i, 1);
        } else if (estado === "jogando" && colide(caixaNavioMoeda, caixa(m.x, m.y, m.tam, CAIXA_MOEDA))) {
            listaMoedas.splice(i, 1);     
            m.el.classList.add("coletada");
            m.el.addEventListener("animationend", function () { m.el.remove(); });
            moedas++;                     
        }
    }

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

let ultimoTempo = 0;

function laco(agora) {
    const dt = Math.min((agora - ultimoTempo) / 1000, 0.05); 
    ultimoTempo = agora;
    if (estado === "jogando") {
        atualizar(dt);
    }
    requestAnimationFrame(laco);
}

document.addEventListener("keydown", function (evento) {
    if (evento.code === "Space" || evento.code === "ArrowUp") {
        evento.preventDefault();       
        if (!evento.repeat) pular();
    }
});

jogoEl.addEventListener("pointerdown", function (evento) {
    if (evento.button === 0) pular();
});

document.getElementById("botao-jogar").addEventListener("click", iniciar);
document.getElementById("botao-reiniciar").addEventListener("click", iniciar);  
document.getElementById("botao-novamente").addEventListener("click", iniciar);

function ajustarEscala() {
    const escala = Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA);
    jogoEl.style.transform = "translate(-50%, -50%) scale(" + escala + ")";
}

window.addEventListener("resize", ajustarEscala);

navioEl.style.width = TAM_NAVIO + "px";
navioEl.style.height = TAM_NAVIO + "px";
navioEl.style.left = NAVIO_X + "px";
navioEl.style.top = navioY + "px";
criarNuvens();
reiniciarNuvens();
ajustarEscala();
requestAnimationFrame(laco);

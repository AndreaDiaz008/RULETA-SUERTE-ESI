const ruleta = document.getElementById("ruleta");
const botonGirar = document.getElementById("botonGirar");
const botonSuerte = document.getElementById("botonSuerte");
const botonReiniciar = document.getElementById("botonReiniciar");
const dineroTexto = document.getElementById("dinero");
const suerteTexto = document.getElementById("suerte");
const aviso = document.getElementById("aviso");
const titulo = document.getElementById("tituloResultado");
const texto = document.getElementById("textoResultado");
const overlayPremio = document.getElementById("overlayPremio");
const regalo = document.getElementById("regalo");
const instruccionRegalo = document.getElementById("instruccionRegalo");
const carta = document.getElementById("carta");
const cerrarCarta = document.getElementById("cerrarCarta");

const DINERO_INICIAL = 10000;
const COSTO_SUERTE = 1000;
const COSTO_GIRO = 2000;

// La suerte modifica las probabilidades, pero nunca garantiza ganar.
const sectores = [
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$500", tipo: "premio500", color: "#ff7a00" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$500", tipo: "premio500", color: "#ff7a00" },
    { nombre: "$1K", tipo: "premio1000", color: "#fff000" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$500", tipo: "premio500", color: "#ff7a00" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$500", tipo: "premio500", color: "#ff7a00" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$1K", tipo: "premio1000", color: "#fff000" },
    { nombre: "$500", tipo: "premio500", color: "#ff7a00" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "$1K", tipo: "premio1000", color: "#fff000" },
    { nombre: "X", tipo: "nada", color: "#760b12" },
    { nombre: "PREMIO MAYOR", tipo: "mayor", color: "#17f05b" }
];

const mensajes = {
    nada: [
        "No ganaste nada. ¿Valdrá la pena volver a intentarlo?",
        "Esta vez no hubo premio. Seguir jugando tampoco garantiza uno.",
        "La ruleta se llevó el costo del giro. ¿Vale la pena intentarlo otra vez?"
    ],
    premio500: [
        "Ganaste $500, pero el giro costó $2.000. ¿Realmente saliste ganando?",
        "¡Un premio pequeño! A veces ganar un poco nos tienta a seguir arriesgando.",
        "Recibiste $500. Acordate de comparar el premio con lo que gastaste."
    ],
    premio1000: [
        "Ganaste $1.000, pero pagaste $2.000 por girar. Todavía perdiste dinero.",
        "¡Casi recuperás el costo! Esa sensación puede empujarnos a seguir jugando.",
        "Un premio no cambia las probabilidades de la próxima tirada."
    ],
    mayor: [
        "¡El premio mayor! Pero mirá cuánto tuviste que arriesgar para llegar hasta acá."
    ]
};

let dinero = DINERO_INICIAL;
let suerte = 0;
let rotacion = 0;
let girando = false;
let juegoTerminado = false;
let toquesRegalo = 0;
let regaloAbierto = false;

// Sonidos sintetizados en el navegador: no hace falta descargar archivos de audio.
let contextoAudio = null;
function tono(frecuencia, duracion = 0.12, tipo = "sine", volumen = 0.045, retraso = 0) {
    try {
        contextoAudio ||= new (window.AudioContext || window.webkitAudioContext)();
        if (contextoAudio.state === "suspended") contextoAudio.resume();
        const oscilador = contextoAudio.createOscillator();
        const ganancia = contextoAudio.createGain();
        oscilador.type = tipo;
        oscilador.frequency.setValueAtTime(frecuencia, contextoAudio.currentTime + retraso);
        ganancia.gain.setValueAtTime(volumen, contextoAudio.currentTime + retraso);
        ganancia.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + retraso + duracion);
        oscilador.connect(ganancia); ganancia.connect(contextoAudio.destination);
        oscilador.start(contextoAudio.currentTime + retraso);
        oscilador.stop(contextoAudio.currentTime + retraso + duracion);
    } catch (e) { /* El juego funciona igual si el navegador bloquea el audio. */ }
}
function sonidoBoton() { tono(520, .07, "square", .025); tono(760, .08, "sine", .025, .06); }
function sonidoGiro() {
    sonidoBoton();
    // Pequeños clics durante el giro para dar sensación de ruleta mecánica.
    for (let i = 0; i < 18; i++) tono(180 + (i % 3) * 45, .025, "square", .012, i * .19);
}
function sonidoPremio() { [523, 659, 784, 1047].forEach((f, i) => tono(f, .24, "triangle", .055, i * .13)); }
function sonidoPerdida() { tono(240, .18, "sawtooth", .025); tono(170, .24, "sawtooth", .02, .14); }

function formatoPlata(cantidad) {
    return "$" + cantidad.toLocaleString("es-AR");
}

function actualizarPanel() {
    dineroTexto.textContent = formatoPlata(dinero);
    suerteTexto.textContent = "x" + suerte;
    botonSuerte.disabled = girando || juegoTerminado || dinero < COSTO_SUERTE;
    botonGirar.disabled = girando || juegoTerminado || dinero < COSTO_GIRO;
}

function crearSectores() {
    const gradientes = [];
    const angulo = 360 / sectores.length;

    sectores.forEach((sector, indice) => {
        gradientes.push(`${sector.color} ${indice * angulo}deg ${(indice + 1) * angulo}deg`);

        const etiqueta = document.createElement("div");
        etiqueta.className = "etiqueta-sector";
        etiqueta.textContent = sector.nombre;
        etiqueta.style.transform = `rotate(${indice * angulo + angulo / 2}deg) translateX(18px)`;
        ruleta.appendChild(etiqueta);
    });

    ruleta.style.background = `conic-gradient(${gradientes.join(", ")})`;
}

function elegirSector() {
    // Sin suerte: X es lo más probable. Cada compra aumenta la posibilidad
    // de premios pequeños, pero no altera el premio forzado del último giro.
    const opciones = [
        { tipo: "nada", peso: Math.max(18, 60 - suerte * 8) },
        { tipo: "premio500", peso: 20 + suerte * 7 },
        { tipo: "premio1000", peso: 10 + suerte * 4 }
    ];

    const total = opciones.reduce((suma, opcion) => suma + opcion.peso, 0);
    let numero = Math.random() * total;

    for (const opcion of opciones) {
        numero -= opcion.peso;
        if (numero < 0) return opcion.tipo;
    }
    return "nada";
}

function sectorVisualPara(tipo) {
    const indices = sectores
        .map((sector, indice) => ({ sector, indice }))
        .filter(item => item.sector.tipo === tipo);

    return indices[Math.floor(Math.random() * indices.length)].indice;
}

function finalizarJuego() {
    juegoTerminado = true;
    botonSuerte.hidden = true;
    botonGirar.hidden = true;
    botonReiniciar.hidden = false;
    aviso.textContent = "Te quedaste sin dinero para seguir jugando. El juego terminó.";
    actualizarPanel();
}

function comprarSuerte() {
    if (girando || juegoTerminado || dinero < COSTO_SUERTE) return;

    sonidoBoton();
    dinero -= COSTO_SUERTE;
    suerte += 1;
    actualizarPanel();

    titulo.textContent = "Suerte comprada";
    texto.textContent = "Gastaste $1.000 para aumentar la posibilidad de premios pequeños. La suerte no garantiza ganar.";
    aviso.textContent = "¿Sentís que ahora tenés más posibilidades? Esa confianza también puede hacerte arriesgar más.";
    if (dinero < COSTO_GIRO) finalizarJuego();
}

function girarRuleta() {
    if (girando || juegoTerminado || dinero < COSTO_GIRO) return;

    girando = true;
    sonidoGiro();
    dinero -= COSTO_GIRO;

    // El giro que deja menos de $2.000 (o exactamente $0) se fuerza al premio mayor.
    // Esto representa una recompensa inesperada que puede reforzar las ganas de jugar.
    const esUltimoGiro = dinero < COSTO_GIRO;
    const tipoResultado = esUltimoGiro ? "mayor" : elegirSector();
    const indiceVisual = sectorVisualPara(tipoResultado);
    const anguloSector = 360 / sectores.length;
    const centroSector = indiceVisual * anguloSector + anguloSector / 2;
    const anguloObjetivo = (270 - centroSector + 360) % 360;
    const anguloActual = ((rotacion % 360) + 360) % 360;
    const ajuste = (anguloObjetivo - anguloActual + 360) % 360;

    rotacion += 360 * 6 + ajuste;
    ruleta.style.transform = `rotate(${rotacion}deg)`;
    actualizarPanel();

    titulo.textContent = "Girando...";
    texto.textContent = "La expectativa crece mientras esperás el resultado.";
    aviso.textContent = esUltimoGiro
        ? "Último giro… ¿y si esta vez sí llega el premio que esperabas?"
        : "Esperar el resultado puede hacer que quieras seguir intentándolo.";

    window.setTimeout(() => {
        girando = false;

        if (tipoResultado === "premio500") dinero += 500;
        if (tipoResultado === "premio1000") dinero += 1000;

        if (tipoResultado === "mayor") {
            sonidoPremio();
            titulo.textContent = "¡PREMIO MAYOR!";
            texto.textContent = "¡Lo conseguiste! ¿Pero cuánto dinero gastaste para llegar a este momento?";
            aviso.textContent = "Tocá el regalo para descubrir el mensaje final.";
            overlayPremio.hidden = false;
            document.body.classList.add("celebrando");
            juegoTerminado = true;
            botonSuerte.hidden = true;
            botonGirar.hidden = true;
            botonReiniciar.hidden = true;
        } else {
            if (tipoResultado === "nada") sonidoPerdida(); else tono(720, .16, "triangle", .04);
            titulo.textContent = tipoResultado === "nada" ? "NO GANASTE NADA" :
                tipoResultado === "premio500" ? "¡GANASTE $500!" : "¡GANASTE $1.000!";
            const lista = mensajes[tipoResultado];
            texto.textContent = lista[Math.floor(Math.random() * lista.length)];
            aviso.textContent = dinero >= COSTO_GIRO
                ? "¿Vas a parar o vas a arriesgar lo que te queda?"
                : "Ya no te alcanza para otro giro.";
            if (dinero < COSTO_GIRO) finalizarJuego();
        }

        actualizarPanel();
    }, 4100);
}

function tocarRegalo() {
    if (regaloAbierto) return;
    toquesRegalo += 1;
    tono(360 + toquesRegalo * 100, .1, "triangle", .04);

    if (toquesRegalo < 4) {
        regalo.classList.remove("rebote");
        void regalo.offsetWidth;
        regalo.classList.add("rebote");
        instruccionRegalo.textContent = `¡Casi! Tocá ${4 - toquesRegalo} vez/veces más para abrirlo.`;
    } else {
        regaloAbierto = true;
        sonidoPremio();
        regalo.classList.add("abierto");
        instruccionRegalo.textContent = "El premio tenía algo más para decirte…";
        window.setTimeout(() => {
            carta.classList.add("visible");
            carta.setAttribute("aria-hidden", "false");
        }, 650);
    }
}

function reiniciarJuego() {
    dinero = DINERO_INICIAL;
    suerte = 0;
    rotacion = 0;
    girando = false;
    juegoTerminado = false;
    toquesRegalo = 0;
    regaloAbierto = false;

    ruleta.style.transition = "none";
    ruleta.style.transform = "rotate(0deg)";
    void ruleta.offsetWidth;
    ruleta.style.transition = "";
    document.body.classList.remove("celebrando");
    overlayPremio.hidden = true;
    carta.classList.remove("visible");
    carta.setAttribute("aria-hidden", "true");
    regalo.classList.remove("rebote", "abierto");
    instruccionRegalo.textContent = "Tocá el regalo para abrirlo.";
    botonSuerte.hidden = false;
    botonGirar.hidden = false;
    botonReiniciar.hidden = true;
    titulo.textContent = "Elegí tu apuesta";
    texto.textContent = "Comprar suerte cuesta $1.000. Girar cuesta $2.000.";
    aviso.textContent = "Empezás con $10.000. La suerte se puede comprar… ¿pero sirve de algo?";
    actualizarPanel();
}

crearSectores();
actualizarPanel();
botonSuerte.addEventListener("click", comprarSuerte);
botonGirar.addEventListener("click", girarRuleta);
botonReiniciar.addEventListener("click", reiniciarJuego);
regalo.addEventListener("click", tocarRegalo);
regalo.addEventListener("keydown", evento => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        tocarRegalo();
    }
});
cerrarCarta.addEventListener("click", () => {
    carta.classList.remove("visible");
    carta.setAttribute("aria-hidden", "true");
});


const ruleta = document.getElementById("ruleta");
const boton = document.getElementById("botonGirar");
const titulo = document.getElementById("tituloResultado");
const texto = document.getElementById("textoResultado");

const sectores = [
    "WIN",
    "LOSE",
    "WIN",
    "LOSE",
    "WIN",
    "LOSE",
    "WIN",
    "LOSE"
];

const mensajesGanaste = [
    "¿Realmente valió la pena ganar? Una victoria no elimina el riesgo de perderlo todo.",
    "¡Ganaste esta vez! Pero no significa que la próxima tengas la misma suerte.",
    "El premio se siente bien, pero ¿vale la pena arriesgar tu dinero por otro?",
    "Ganar puede hacerte querer seguir jugando. Recordá que también podés perder.",
    "La suerte te acompañó hoy, pero no es una forma segura de ganar dinero."
];

const mensajesPerdiste = [
    "La próxima tendrás más suerte... ¿o eso es lo que te hace creer el juego?",
    "¿Querés intentarlo otra vez? Podrías olvidar cuánto podés perder.",
    "Perder duele, pero apostar más no garantiza recuperar lo perdido.",
    "Siempre parece que la próxima puede ser la ganadora, pero no hay garantías.",
    "A veces, dejar de jugar es la mejor decisión que podés tomar."
];

let rotacion = 0;
let girando = false;
let hayResultado = false;

// Crear las etiquetas de los sectores
sectores.forEach((sector, indice) => {
    const etiqueta = document.createElement("div");

    etiqueta.className = "etiqueta";
    etiqueta.textContent = sector;
    etiqueta.dataset.indice = indice;

    etiqueta.style.transform =
        `rotate(${indice * 45 + 22.5}deg) translateX(18px)`;

    ruleta.appendChild(etiqueta);
});

function elegirMensaje(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function volverAlInicio() {
    document.body.classList.remove("ganaste", "perdiste");

    titulo.textContent = "¿Y si probás?";
    texto.textContent = "Girá la ruleta y descubrí qué pasa.";

    boton.textContent = "GIRAR RULETA";
    hayResultado = false;
}

boton.addEventListener("click", function () {
    if (girando) return;

    if (hayResultado) {
        volverAlInicio();
        return;
    }

    girando = true;
    boton.disabled = true;
    boton.textContent = "GIRANDO...";

    // Elegir un sector al azar
    const indice = Math.floor(Math.random() * sectores.length);
    const resultado = sectores[indice];

    // Calcular la rotación para detener ese sector
    const anguloSector = 360 / sectores.length;
    const centroSector = indice * anguloSector + anguloSector / 2;

    // La flecha está arriba, en 270 grados del círculo.
    const anguloObjetivo = (270 - centroSector + 360) % 360;
    const anguloActual = ((rotacion % 360) + 360) % 360;
    const ajuste = (anguloObjetivo - anguloActual + 360) % 360;

    rotacion += 360 * 6 + ajuste;
    ruleta.style.transform = `rotate(${rotacion}deg)`;

    setTimeout(function () {
        document.body.classList.remove("ganaste", "perdiste");

        if (resultado === "WIN") {
            document.body.classList.add("ganaste");
            titulo.textContent = "¡WIN!";
            texto.textContent = elegirMensaje(mensajesGanaste);
        } else {
            document.body.classList.add("perdiste");
            titulo.textContent = "¡LOSE!";
            texto.textContent = elegirMensaje(mensajesPerdiste);
        }

        boton.disabled = false;
        boton.textContent = "VOLVER A INTENTAR";

        girando = false;
        hayResultado = true;
    }, 4100);
});

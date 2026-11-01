// los niveles se arman por beats, cada numero es un tiempo de la cancion
// dx mueve en bloques desde ese beat, y es la altura en bloques
// reglas para que ningun salto sea injusto
//   despues de caer de un bloque hay al menos 3 bloques libres antes del siguiente pico
//   nunca hay que subir 2 de alto de un solo salto
//   los orbes estan donde pasa el salto normal, no hay que adivinar
const Niveles = (() => {

    function arranque() {
        const n = Motor.Constructor({
            id: 'arranque', nombre: 'Arranque', dificultad: 'Fácil', estrellas: 1,
            bpm: 120, cancion: 'arranque'
        });
        n.color(0, '#0f3fb0', '#62b8ff');

        n.pico(4);
        n.pico(6);
        n.pico(8, 0, 0, 2);
        n.bloque(10, 0, 0, 3, 1);
        n.pico(12);
        n.pad(13, 0, 0);
        n.pico(13, 2, 0, 3);

        // escalera de dos escalones
        n.bloque(15, 0, 0, 3, 1);
        n.bloque(15, 3, 0, 3, 2);
        n.pico(17.5);
        n.pico(18.5);

        // orbe encima de una fila de picos
        n.pico(19.6, 0, 0, 5);
        n.orbe(19.6, 1.3, 2);
        n.moneda(19.6, 5, 4.6);

        n.color(21.5, '#5b19b8', '#ff7cf0');
        n.pico(22);

        // nave tranquila
        n.modo(23, 'nave');
        n.tunel(24, 31.5, [0, 0, 1, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 6.5, 1);
        n.moneda(27.5, 0, 8);
        n.modo(32, 'cubo');

        n.color(32.5, '#0f3fb0', '#62b8ff');
        // plataformas sobre picos
        n.bloque(33.5, 0, 0, 3, 1);
        n.pico(33.5, 3, 0, 2);
        n.bloque(33.5, 5, 0, 3, 1);
        n.pico(33.5, 8, 0, 2);
        n.bloque(33.5, 10, 0, 3, 1);

        n.pico(37.5);
        n.pad(39, 0, 0);
        n.bloque(39, 3.5, 0, 4, 3);
        n.moneda(39, 6, 5.6);
        n.pico(42.5);
        n.pico(43.5, 0, 0, 2);
        n.color(45, '#0b7a5c', '#5dffb8');
        n.pico(45.6, 0, 0, 5);
        n.orbe(45.6, 1.3, 2);
        n.pico(48.5);
        n.pico(49.5, 0, 0, 2);
        return n.terminar(53);
    }

    function pulso() {
        const n = Motor.Constructor({
            id: 'pulso', nombre: 'Pulso Neón', dificultad: 'Normal', estrellas: 3,
            bpm: 140, cancion: 'pulso'
        });
        n.color(0, '#7a0f6b', '#ff5bd6');

        n.pico(4);
        n.pico(5);
        n.pico(6.5, 0, 0, 2);
        n.bloque(8, 0, 0, 3, 1);
        n.pico(8, 3, 0, 2);
        n.bloque(8, 5, 0, 3, 1);

        // gravedad al reves, caminando en el techo
        n.pad(10.5, 0, 0, 'azul');
        n.pico(11.5, 0, 10, 1, true);
        n.pico(12.7, 0, 10, 1, true);
        n.pico(13.9, 0, 10, 2, true);
        n.moneda(12.7, 2, 7.6);
        n.grav(15, 1);

        n.color(15.5, '#0b3f9e', '#4fd2ff');
        n.modo(16, 'bola');
        n.pico(17.5, 0, 0, 2);
        n.pico(19, 0, 10, 2, true);
        n.pico(20.5, 0, 0, 2);
        n.pico(22, 0, 10, 2, true);
        n.pico(23.5, 0, 0, 3);
        n.pico(25, 0, 10, 3, true);
        n.modo(26.5, 'cubo');
        n.grav(26.5, 1);

        // orbes azules, uno para subir al techo y otro para bajar
        n.color(27.5, '#7a0f6b', '#ff5bd6');
        n.pico(28.5, 0, 0, 7);
        n.orbe(28.5, 1, 2, 'azul');
        n.pico(30.5, 0, 10, 2, true);
        n.orbe(30.5, 4, 9.6, 'azul');
        n.pico(30.5, 4, 0, 3);
        n.pico(30.5, 6, 10, 4, true);
        n.pico(33);

        // nave mas rapida
        n.color(34, '#3b0fa0', '#b98bff');
        n.vel(34.5, 1.25);
        n.modo(35, 'nave');
        n.grav(35, 1);
        n.tunel(36, 44, [0, 1, 2, 3, 4, 4, 4, 3, 2, 1, 0, 0, 0, 1, 2, 3, 3, 2, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0], 5.5, 1.2);
        n.moneda(40, 0, 4.8);
        n.modo(44.5, 'cubo');
        n.vel(44.5, 1);

        n.color(45, '#7a0f6b', '#ff5bd6');
        n.pico(46.5);
        n.pad(48, 0, 0);
        n.bloque(48, 3.5, 0, 4, 3);
        n.moneda(48, 6, 5.6);
        n.pico(51);
        n.pico(52, 0, 0, 2);
        n.orbe(53.5, 0.3, 2.2, 'rosa');
        n.pico(53.5, -1, 0, 4);
        n.pico(55.5);
        n.pico(56.5, 0, 0, 2);
        return n.terminar(60);
    }

    function corriente() {
        const n = Motor.Constructor({
            id: 'corriente', nombre: 'Corriente', dificultad: 'Difícil', estrellas: 6,
            bpm: 160, cancion: 'corriente'
        });
        n.color(0, '#0a5a7a', '#3ff5ff');

        // cubo con orbes seguidos
        n.pico(4);
        n.pico(5, 0, 0, 2);
        n.pico(6.5, 0, 0, 6);
        n.orbe(6.5, 1, 2);
        n.orbe(6.5, 4.5, 2.6, 'rosa');
        n.pico(9);

        n.color(10, '#7a1050', '#ff4f9a');
        n.vel(10, 1.25);
        n.modo(10.5, 'bola');
        n.pico(12, 0, 0, 2);
        n.pico(13.2, 0, 10, 2, true);
        n.pico(14.4, 0, 0, 2);
        n.pico(15.6, 0, 10, 2, true);
        n.moneda(16, 1, 5.5);

        n.color(17, '#0a5a7a', '#3ff5ff');
        n.modo(17, 'onda');
        n.grav(17, 1);
        n.tunel(17.6, 26, [3, 3, 3, 3, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 2, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 4, 3, 2, 2, 2], 3.6, 1);
        n.modo(26, 'nave');
        n.grav(26, 1);
        n.color(26, '#4b11a8', '#c08cff');
        n.tunel(26.6, 33, [1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1, 1, 0, 0], 4.6, 1.3);
        n.moneda(30, 0, 2.5);
        n.modo(33.4, 'cubo');
        n.grav(33.4, 1);
        n.vel(33.4, 1);

        // pad azul al techo y orbe azul para regresar
        n.color(34, '#7a1050', '#ff4f9a');
        n.pico(35);
        n.pad(36.2, 0, 0, 'azul');
        n.pico(37.4, 0, 10, 2, true);
        n.orbe(38.8, 0, 9.6, 'azul');
        n.pico(38.8, -1, 0, 5);
        n.pico(40.3);

        n.color(41, '#0a5a7a', '#3ff5ff');
        n.vel(41.3, 1.5);
        n.modo(41.6, 'onda');
        n.grav(41.6, 1);
        n.tunel(42.3, 52, [2, 2, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 2, 3, 4, 5, 5, 4, 3, 3, 3, 4, 5, 6, 6, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0], 4, 1.4);
        n.moneda(47, 0, 6.3);
        n.modo(52.3, 'cubo');
        n.grav(52.3, 1);
        n.vel(52.3, 1.25);

        n.color(53, '#4b11a8', '#c08cff');
        n.pico(54);
        n.pico(55, 0, 0, 2);
        n.bloque(56.3, 0, 0, 3, 1);
        n.pico(56.3, 3, 0, 2);
        n.bloque(56.3, 5, 0, 3, 2);
        n.pico(59.5, 0, 0, 5);
        n.orbe(59.5, 1.4, 2);
        n.pico(61.5);
        n.pico(62.5, 0, 0, 2);
        return n.terminar(66);
    }

    // el mas largo, usa todos los modos y la velocidad doble
    function eclipse() {
        const n = Motor.Constructor({
            id: 'eclipse', nombre: 'Eclipse', dificultad: 'Demonio', estrellas: 10,
            bpm: 170, cancion: 'eclipse'
        });
        n.color(0, '#140a24', '#ffb347');

        // entrada en cubo, picos al ritmo
        n.pico(4);
        n.pico(5);
        n.pico(6.5, 0, 0, 3);
        n.bloque(8, 0, 0, 3, 1);
        n.pico(8, 3, 0, 2);
        n.bloque(8, 5, 0, 3, 2);
        n.pico(8, 8, 0, 3);
        n.pico(11.5, 0, 0, 5);
        n.orbe(11.5, 1.2, 2);
        n.pico(13.5);
        n.pad(14.5, 0, 0);
        n.bloque(14.5, 3.5, 0, 4, 3);
        n.moneda(14.5, 5.5, 5.6);
        n.pico(17.5, 0, 0, 2);

        // ovni entre columnas
        n.color(18.5, '#1c0f3a', '#b98bff');
        n.modo(19, 'ovni');
        n.tunel(19.6, 30, [0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4.6, 1);
        n.moneda(25, 0, 6);
        n.modo(30.5, 'cubo');

        // nave con la gravedad volteada a medio tunel
        n.color(31, '#3a0a12', '#ff4f5e');
        n.pico(31.8, 0, 0, 2);
        n.modo(33, 'nave');
        n.tunel(33.6, 39, [0, 1, 2, 3, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0], 5, 1);
        n.grav(39.3, -1, 4);
        n.tunel(40, 45.5, [0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0], 5, 1);
        n.grav(46, 1, 4);
        n.modo(47, 'cubo');

        // bola mas rapida, piso y techo
        n.color(48, '#0a3a4a', '#3ff5ff');
        n.vel(48, 1.25);
        n.modo(48.5, 'bola');
        n.pico(50, 0, 0, 2);
        n.pico(51.2, 0, 10, 2, true);
        n.pico(52.4, 0, 0, 2);
        n.pico(53.6, 0, 10, 2, true);
        n.pico(54.8, 0, 0, 3);
        n.pico(56, 0, 10, 3, true);
        n.modo(57.5, 'cubo');
        n.grav(57.5, 1);

        // onda a toda velocidad antes del drop
        n.color(58, '#3a0a12', '#ff4f5e');
        n.vel(58.5, 1.5);
        n.modo(59, 'onda');
        n.grav(59, 1);
        n.tunel(59.6, 69, [3, 3, 4, 5, 6, 6, 5, 4, 3, 2, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 2, 2, 2, 2], 4.2, 1.4);

        // el drop, cubo al doble de rapido
        n.color(69.5, '#140a24', '#ffb347');
        n.modo(69.5, 'cubo');
        n.vel(69.5, 2);
        n.pico(71.5);
        n.pico(73, 0, 0, 2);
        n.bloque(74.5, 0, 0, 4, 1);
        n.pico(74.5, 4, 0, 2);
        n.bloque(74.5, 6, 0, 4, 2);
        n.pico(76.5, 0, 0, 6);
        n.orbe(76.5, 2.5, 2.4);
        n.pico(78.5, 0, 0, 2);
        n.pad(80, 0, 0);
        n.pico(80, 2, 0, 8);
        n.moneda(80, 5, 5.2);

        // ovni con la gravedad al reves
        n.color(81.5, '#1c0f3a', '#b98bff');
        n.vel(82, 1.25);
        n.modo(82.5, 'ovni');
        n.tunel(83.2, 89, [0, 1, 2, 2, 3, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0, 0, 0], 4.8, 1.2);
        n.grav(89.4, -1, 4);
        n.tunel(90, 95, [1, 1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 3, 2, 1, 1, 1], 5, 1.2);
        n.grav(95.4, 1, 4);
        n.modo(96, 'cubo');
        n.vel(96, 1);

        // pad azul al techo y orbe azul para regresar
        n.color(96.5, '#140a24', '#ffb347');
        n.pico(98);
        n.pad(99.5, 0, 0, 'azul');
        n.pico(100.7, 0, 10, 2, true);
        n.orbe(102.2, 0, 9.6, 'azul');
        n.pico(102.2, -1, 0, 5);
        n.pico(104);

        // nave final a toda velocidad
        n.color(105, '#3a0a12', '#ff4f5e');
        n.vel(105.5, 1.5);
        n.modo(106, 'nave');
        n.grav(106, 1);
        n.tunel(106.6, 116, [0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0, 0], 5, 1.3);
        n.modo(116.5, 'cubo');
        n.vel(116.5, 1);

        // cierre tranquilo, ya se lo gano
        n.color(117, '#140a24', '#ffb347');
        n.pico(118.5);
        n.pico(120, 0, 0, 2);
        return n.terminar(124);
    }

    return [arranque(), pulso(), corriente(), eclipse()];
})();

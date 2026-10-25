// los niveles se arman por beats, cada numero es un tiempo de la cancion
// dx mueve en bloques desde ese beat, y es la altura en bloques
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
        n.bloque(10, 0, 0, 2, 1);
        n.pico(11, 1);
        n.pad(12, 0, 0);
        n.pico(12, 2, 0, 3);
        n.bloque(14, 0, 0, 2, 1);
        n.bloque(14, 2, 0, 2, 2);
        n.pico(15, 2);
        n.pico(16, 1);
        n.pico(17, 1);

        // orbe encima de una fila de picos
        n.pico(18, 0, 0, 5);
        n.orbe(18, 1.2, 2);
        n.moneda(18, 4.5, 4.6);

        n.color(20, '#5b19b8', '#ff7cf0');
        n.pico(20, 1);
        n.pico(20, 2);

        // nave tranquila
        n.modo(21.5, 'nave');
        n.tunel(22.5, 30, [0, 0, 1, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 0, 0], 6.5, 1);
        n.moneda(26, 0, 8);
        n.modo(30.5, 'cubo');

        n.color(31, '#0f3fb0', '#62b8ff');
        // plataformas sobre picos
        n.bloque(32, 0, 0, 3, 1);
        n.pico(32, 3, 0, 3);
        n.bloque(32, 6, 0, 3, 1);
        n.pico(32, 9, 0, 3);
        n.bloque(32, 12, 0, 3, 1);
        n.pico(32, 15, 0, 2);

        n.pico(37);
        n.pico(38, 0, 0, 2);
        n.pad(39, 0, 0);
        n.bloque(39, 3, 0, 4, 3);
        n.pico(39, 3, 3, 1);
        n.moneda(39, 6.5, 5.5);
        n.pico(41);
        n.pico(42);
        n.pico(43, 0, 0, 3);
        n.orbe(43, 1, 2);
        n.color(45, '#0b7a5c', '#5dffb8');
        n.pico(46);
        n.pico(47);
        n.pico(48, 0, 0, 2);
        return n.terminar(52);
    }

    function pulso() {
        const n = Motor.Constructor({
            id: 'pulso', nombre: 'Pulso Neón', dificultad: 'Normal', estrellas: 3,
            bpm: 140, cancion: 'pulso'
        });
        n.color(0, '#7a0f6b', '#ff5bd6');

        n.pico(4);
        n.pico(5);
        n.pico(6, 0, 0, 2);
        n.bloque(7, 0, 0, 3, 1);
        n.pico(7, 3, 0, 2);
        n.bloque(7, 5, 0, 2, 2);

        // gravedad al reves, caminando en el techo
        n.pad(9, 0, 0, 'azul');
        n.pico(10, 0, 10, 1, true);
        n.pico(11, 0, 10, 1, true);
        n.pico(12, 0, 10, 2, true);
        n.moneda(12, 1, 7.6);
        n.grav(13.2, 1);

        n.color(14, '#0b3f9e', '#4fd2ff');
        n.modo(14.5, 'bola');
        n.pico(16, 0, 0, 2);
        n.pico(17.5, 0, 10, 2, true);
        n.pico(19, 0, 0, 2);
        n.pico(20.5, 0, 10, 2, true);
        n.pico(22, 0, 0, 3);
        n.pico(23.5, 0, 10, 3, true);
        n.modo(25, 'cubo');
        n.grav(25, 1);

        // orbes azules
        n.color(26, '#7a0f6b', '#ff5bd6');
        n.pico(27, 0, 0, 6);
        n.orbe(27, 0.5, 1.8, 'azul');
        n.pico(28.5, 0, 10, 3, true);
        n.orbe(28.5, 4, 8.2, 'azul');
        n.pico(30);

        // nave mas rapida
        n.color(31, '#3b0fa0', '#b98bff');
        n.vel(31.5, 1.25);
        n.modo(32, 'nave');
        n.grav(32, 1);
        n.tunel(33, 41, [0, 1, 2, 3, 4, 4, 4, 3, 2, 1, 0, 0, 0, 1, 2, 3, 3, 2, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0, 0, 1, 2], 5.5, 1.2);
        n.moneda(37, 0, 4.8);
        n.modo(41.5, 'cubo');
        n.vel(42, 1);

        n.color(42, '#7a0f6b', '#ff5bd6');
        n.pico(44);
        n.pad(45, 0, 0);
        n.bloque(45, 3, 0, 3, 3);
        n.pico(45, 6, 0, 3);
        n.moneda(45, 4.5, 5);
        n.bloque(45, 9, 0, 2, 2);
        n.pico(49, 0, 0, 2);
        n.orbe(50, 0, 2.2, 'rosa');
        n.pico(50, -1, 0, 4);
        n.pico(52);
        n.pico(53, 0, 0, 2);
        return n.terminar(57);
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
        n.tunel(26.6, 33, [1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2], 4.6, 1.3);
        n.moneda(30, 0, 2.5);
        n.modo(33.4, 'cubo');
        n.grav(33.4, 1);
        n.vel(33.4, 1);

        n.color(34, '#7a1050', '#ff4f9a');
        n.pico(35);
        n.pad(36, 0, 0, 'azul');
        n.pico(37, 0, 10, 3, true);
        n.orbe(38.2, 0, 8, 'azul');
        n.pico(38.2, -1, 0, 4);
        n.pico(39.5);

        n.color(41, '#0a5a7a', '#3ff5ff');
        n.vel(41, 1.5);
        n.modo(41.3, 'onda');
        n.grav(41.3, 1);
        n.tunel(42, 52, [2, 2, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 2, 3, 4, 5, 5, 4, 3, 3, 3, 4, 5, 6, 6, 6, 5, 4, 3, 2, 1, 1], 4, 1.4);
        n.moneda(47, 0, 6.3);
        n.modo(52.3, 'cubo');
        n.grav(52.3, 1);
        n.vel(52.3, 1.25);

        n.color(53, '#4b11a8', '#c08cff');
        n.pico(54);
        n.pico(55, 0, 0, 2);
        n.bloque(56, 0, 0, 3, 1);
        n.pico(56, 1, 1);
        n.orbe(56, 0.8, 2.6);
        n.bloque(57.5, 0, 0, 2, 2);
        n.pico(58.7, 0, 0, 3);
        n.pico(60);
        n.pico(61, 0, 0, 2);
        return n.terminar(65);
    }

    return [arranque(), pulso(), corriente()];
})();

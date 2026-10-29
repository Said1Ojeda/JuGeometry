"use strict";
// musica hecha en el momento con Web Audio, sin archivos mp3
// cada cancion es un bpm, una escala, acordes y que tan intensa va en cada parte
const Musica = (() => {
    // ctx y maestro existen hasta el primer toque, por eso se revisa listo antes de usarlos
    let ctx;
    let maestro;
    let listo = false;
    let corrida = null;
    let timer = null;
    let volumen = 0.55, apagada = false;
    const CANCIONES = {
        arranque: {
            bpm: 120, raiz: 45, escala: [0, 2, 3, 5, 7, 8, 10],
            acordes: [0, 5, 3, 6], // i VI iv VII
            arpegio: [0, 2, 4, 7, 4, 2, 0, 4],
            partes: [[0, 4, 1], [4, 20, 2], [20, 31, 3], [31, 45, 2], [45, 99, 3]]
        },
        pulso: {
            bpm: 140, raiz: 50, escala: [0, 2, 3, 5, 7, 8, 10],
            acordes: [0, 3, 5, 4],
            arpegio: [0, 4, 7, 4, 9, 7, 4, 2],
            partes: [[0, 4, 1], [4, 14, 2], [14, 26, 3], [26, 31, 2], [31, 42, 3], [42, 99, 3]]
        },
        corriente: {
            bpm: 160, raiz: 47, escala: [0, 2, 3, 5, 7, 8, 10],
            acordes: [0, 5, 2, 6],
            arpegio: [0, 7, 4, 9, 7, 11, 9, 4],
            partes: [[0, 4, 2], [4, 99, 3]]
        }
    };
    function asegurar() {
        if (listo)
            return true;
        const Clase = window.AudioContext || window.webkitAudioContext;
        if (!Clase)
            return false;
        try {
            ctx = new Clase();
            maestro = ctx.createGain();
            maestro.gain.value = apagada ? 0 : volumen;
            const comp = ctx.createDynamicsCompressor();
            maestro.connect(comp).connect(ctx.destination);
            listo = true;
        }
        catch (e) {
            listo = false;
        }
        return listo;
    }
    const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
    // nota de la escala, grado puede pasarse de 7 y sube de octava
    function nota(c, grado, octava = 0) {
        const n = c.escala.length;
        const o = Math.floor(grado / n);
        const g = ((grado % n) + n) % n;
        return c.raiz + c.escala[g] + 12 * (o + octava);
    }
    let ruidoBuf = null;
    function ruido() {
        if (ruidoBuf)
            return ruidoBuf;
        ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = ruidoBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++)
            d[i] = Math.random() * 2 - 1;
        return ruidoBuf;
    }
    function bombo(salida, t) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(42, t + .12);
        g.gain.setValueAtTime(.9, t);
        g.gain.exponentialRampToValueAtTime(.001, t + .28);
        o.connect(g).connect(salida);
        o.start(t);
        o.stop(t + .3);
    }
    function golpe(salida, t, alto, largo, vol) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = ruido();
        f.type = 'highpass';
        f.frequency.value = alto;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.001, t + largo);
        s.connect(f).connect(g).connect(salida);
        s.start(t);
        s.stop(t + largo + .02);
    }
    function tono(salida, t, midi, dur, tipo, vol, corte) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo;
        o.frequency.value = freq(midi);
        let ultimo = o;
        if (corte) {
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(corte * 2.5, t);
            f.frequency.exponentialRampToValueAtTime(corte, t + dur);
            o.connect(f);
            ultimo = f;
        }
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + .008);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        ultimo.connect(g).connect(salida);
        o.start(t);
        o.stop(t + dur + .02);
    }
    function intensidad(c, beat) {
        for (const [a, b, n] of c.partes)
            if (beat >= a && beat < b)
                return n;
        return 3;
    }
    // un dieciseisavo de la cancion
    function tocar(c, salida, i, t) {
        const beat = i / 4;
        const sub = i % 4;
        const nivel = intensidad(c, beat);
        const compas = Math.floor(beat / 4);
        const acorde = c.acordes[compas % c.acordes.length];
        const spb = 60 / c.bpm;
        if (sub === 0)
            bombo(salida, t);
        if (nivel >= 2 && sub === 0 && beat % 2 === 1)
            golpe(salida, t, 1200, .16, .35);
        if (sub === 2 || (nivel >= 3 && sub % 2 === 1))
            golpe(salida, t, 7000, .04, sub === 2 ? .12 : .06);
        // bajo en corcheas siguiendo el acorde
        if (sub % 2 === 0)
            tono(salida, t, nota(c, acorde, -1) - 12 + (sub === 2 && nivel >= 3 ? 12 : 0), spb * .45, 'sawtooth', .16, 380);
        // arpegio
        if (nivel >= 2) {
            const paso = c.arpegio[i % c.arpegio.length];
            tono(salida, t, nota(c, acorde + paso, 1), spb * .22, 'square', nivel >= 3 ? .05 : .035, 2600);
        }
        // acorde largo al inicio de cada compas
        if (nivel >= 2 && beat % 4 === 0 && sub === 0) {
            [0, 2, 4].forEach(g => tono(salida, t, nota(c, acorde + g, 0), spb * 3.8, 'sawtooth', .025, 1400));
        }
    }
    function iniciar(nombre, desdeBeat = 0) {
        detener();
        if (!asegurar() || !CANCIONES[nombre])
            return;
        if (ctx.state === 'suspended')
            ctx.resume();
        const c = CANCIONES[nombre];
        const spb = 60 / c.bpm;
        const salida = ctx.createGain();
        salida.connect(maestro);
        const inicio = ctx.currentTime + .06 - desdeBeat * spb;
        let i = Math.ceil(desdeBeat * 4);
        corrida = { c, salida, inicio, spb };
        const programar = () => {
            const hasta = ctx.currentTime + .15;
            while (inicio + i * spb / 4 < hasta) {
                const t = inicio + i * spb / 4;
                if (t >= ctx.currentTime - .01)
                    tocar(c, salida, i, t);
                i++;
            }
        };
        programar();
        timer = window.setInterval(programar, 25);
    }
    function detener() {
        if (timer)
            clearInterval(timer);
        timer = null;
        if (corrida) {
            const s = corrida.salida;
            s.gain.setTargetAtTime(0, ctx.currentTime, .03);
            setTimeout(() => s.disconnect(), 300);
            corrida = null;
        }
    }
    // en que beat va la cancion, sirve para que el fondo lata con la musica
    function beatActual() {
        if (!corrida)
            return null;
        return (ctx.currentTime - corrida.inicio) / corrida.spb;
    }
    function efecto(cual) {
        if (!asegurar() || apagada)
            return;
        const t = ctx.currentTime;
        try {
            if (cual === 'muerte') {
                golpe(maestro, t, 200, .35, .8);
                tono(maestro, t, 40, .3, 'square', .15, 600);
            }
            else if (cual === 'moneda') {
                tono(maestro, t, 88, .12, 'square', .08);
                tono(maestro, t + .08, 95, .25, 'square', .08);
            }
            else if (cual === 'checkpoint') {
                tono(maestro, t, 84, .15, 'triangle', .1);
            }
            else if (cual === 'ganar') {
                [72, 76, 79, 84].forEach((m, k) => tono(maestro, t + k * .1, m, .5, 'square', .07));
            }
            else if (cual === 'clic') {
                tono(maestro, t, 80, .05, 'triangle', .06);
            }
        }
        catch (e) { }
    }
    function alternar() {
        apagada = !apagada;
        if (asegurar())
            maestro.gain.setTargetAtTime(apagada ? 0 : volumen, ctx.currentTime, .05);
        return !apagada;
    }
    function silencio(valor) {
        apagada = valor;
        if (listo)
            maestro.gain.value = apagada ? 0 : volumen;
    }
    return { iniciar, detener, beatActual, efecto, alternar, silencio, asegurar, CANCIONES, estaApagada: () => apagada };
})();

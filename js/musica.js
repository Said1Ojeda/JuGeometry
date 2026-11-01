"use strict";
// musica hecha en el momento con Web Audio, sin archivos mp3
// cada cancion es un bpm, una escala, acordes y que tan intensa va en cada parte
const Musica = (() => {
    // ctx y maestro existen hasta el primer toque, por eso se revisa listo antes de usarlos
    let ctx;
    let maestro;
    let listo = false;
    let corrida = null;
    // el bombo va directo y lo demas pasa por bomba, que se agacha en cada golpe de bombo
    let directo = null;
    let bomba = null;
    let envioEco = null;
    let finPrevia = 0;
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
        },
        // drum and bass en dorico, las partes siguen los tramos del nivel
        eclipse: {
            bpm: 170, raiz: 43, escala: [0, 2, 3, 5, 7, 9, 10], estilo: 'dnb',
            acordes: [0, 3, 5, 4],
            arpegio: [0, 4, 7, 9, 7, 4, 11, 9],
            partes: [[0, 4, 1], [4, 30, 2], [30, 47, 3], [47, 61, 2], [61, 69, 0], [69, 96, 3], [96, 105, 2], [105, 117, 3], [117, 999, 1]]
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
        // el bombeo, todo lo demas baja un momento y regresa, por eso suena gordo
        if (bomba && directo) {
            salida = directo;
            bomba.gain.setValueAtTime(.5, t);
            bomba.gain.linearRampToValueAtTime(1, t + .22);
        }
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
    function pad(salida, t, c, acorde, dur, vol) {
        for (const g of [0, 2, 4]) {
            const o = ctx.createOscillator(), e = ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = freq(nota(c, acorde + g, 0));
            o.detune.value = g === 2 ? 6 : -4;
            e.gain.setValueAtTime(.0001, t);
            e.gain.linearRampToValueAtTime(vol, t + dur * .3);
            e.gain.linearRampToValueAtTime(.0001, t + dur);
            o.connect(e).connect(salida);
            o.start(t);
            o.stop(t + dur + .02);
        }
    }
    function intensidad(c, beat) {
        return parte(c, beat)[2];
    }
    function parte(c, beat) {
        for (const p of c.partes)
            if (beat >= p[0] && beat < p[1])
                return p;
        return [0, 999, 3];
    }
    // ruido que va subiendo de tono durante toda la calma, avisa que algo viene
    function subida(salida, t, dur) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = ruido();
        s.loop = true;
        f.type = 'bandpass';
        f.Q.value = 3;
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(7000, t + dur);
        g.gain.setValueAtTime(.03, t);
        g.gain.exponentialRampToValueAtTime(.22, t + dur);
        s.connect(f).connect(g).connect(salida);
        s.start(t);
        s.stop(t + dur);
    }
    function platillo(salida, t) {
        golpe(salida, t, 3500, 1.4, .5);
        golpe(salida, t, 9000, .9, .25);
    }
    // bajo reese, dos sierras desafinadas con un filtro que respira
    function reese(salida, t, midi, dur, vol) {
        const f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'lowpass';
        f.Q.value = 6;
        f.frequency.setValueAtTime(220, t);
        f.frequency.linearRampToValueAtTime(900, t + dur * .5);
        f.frequency.linearRampToValueAtTime(260, t + dur);
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + .02);
        g.gain.setValueAtTime(vol, t + dur * .85);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        f.connect(g).connect(salida);
        for (const desafine of [-9, 9]) {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = freq(midi);
            o.detune.value = desafine;
            o.connect(f);
            o.start(t);
            o.stop(t + dur + .02);
        }
    }
    // manda una copia al eco, solo para la caja
    function conEco(t, vol) {
        if (envioEco)
            golpe(envioEco, t, 1800, .12, vol);
    }
    function caja(salida, t, vol) {
        golpe(salida, t, 1800, .18, vol);
        if (vol > .2)
            conEco(t, vol * .5);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(140, t + .08);
        g.gain.setValueAtTime(vol * .6, t);
        g.gain.exponentialRampToValueAtTime(.001, t + .1);
        o.connect(g).connect(salida);
        o.start(t);
        o.stop(t + .12);
    }
    // el ritmo de dos pasos del dnb, bombo en 1 y en el y de 3, caja en 2 y 4
    function tocarDnb(c, salida, i, t) {
        const beat = i / 4;
        const nivel = intensidad(c, beat);
        const en8 = i % 8;
        const compas = Math.floor(beat / 4);
        const acorde = c.acordes[compas % c.acordes.length];
        const spb = 60 / c.bpm;
        // la calma, se quita la bateria y el bajo y solo queda la subida con un redoble al final
        const [desde, hasta] = parte(c, beat);
        if (nivel === 0) {
            if (beat === desde)
                subida(salida, t, (hasta - desde) * spb);
            const falta = hasta - beat;
            if (falta <= 2)
                caja(salida, t, .1 + (2 - falta) * .15);
            else if (falta <= 4 && i % 2 === 0)
                caja(salida, t, .1);
        }
        // el platillo cae justo en el drop
        if (beat === desde && desde > 0 && intensidad(c, desde - .25) === 0)
            platillo(salida, t);
        if (nivel >= 1) {
            if (i % 2 === 0)
                golpe(salida, t, 8000, .03, en8 % 4 === 2 ? .1 : .05);
            if (nivel >= 3 && i % 2 === 1)
                golpe(salida, t, 9000, .02, .035);
        }
        if (nivel >= 2) {
            if (i % 16 === 0 || i % 16 === 10)
                bombo(salida, t);
            if (en8 === 4)
                caja(salida, t, .45);
            // caja fantasma bajita, le da el swing
            if (nivel >= 3 && i % 16 === 7)
                caja(salida, t, .12);
        }
        // bajo, una nota larga cada dos beats siguiendo el acorde
        if (nivel >= 2 && i % 8 === 0) {
            const salto = i % 32 === 24 ? 2 : 0;
            reese(salida, t, nota(c, acorde + salto, -1) - 12, spb * 2, nivel >= 3 ? .13 : .1);
        }
        // arpegio solo en las partes fuertes, una octava arriba en la segunda vuelta
        if (nivel >= 3 && i % 2 === 0) {
            const paso = c.arpegio[(i / 2) % c.arpegio.length];
            const arriba = compas % 2 === 1 ? 1 : 0;
            tono(salida, t, nota(c, acorde + paso, 1 + arriba), spb * .3, 'triangle', .07, 3200);
        }
        // colchon de acorde en cada compas, se oye desde la intro
        // en la calma va cada dos beats y mas fuerte, si no se siente que se corto la musica
        if (nivel === 0 ? i % 8 === 0 : i % 16 === 0) {
            const vol = nivel === 0 ? .045 : nivel >= 2 ? .022 : .03;
            [0, 2, 4].forEach(g => tono(salida, t, nota(c, acorde + g, 0), spb * (nivel === 0 ? 1.95 : 3.9), 'sawtooth', vol, 1100));
        }
    }
    // un dieciseisavo de la cancion
    function tocar(c, salida, i, t) {
        if (c.estilo === 'dnb')
            return tocarDnb(c, salida, i, t);
        const beat = i / 4;
        const sub = i % 4;
        const nivel = intensidad(c, beat);
        const compas = Math.floor(beat / 4);
        const acorde = c.acordes[compas % c.acordes.length];
        const spb = 60 / c.bpm;
        if (sub === 0)
            bombo(salida, t);
        if (nivel >= 2 && sub === 0 && beat % 2 === 1) {
            golpe(salida, t, 1200, .16, .35);
            conEco(t, .18);
        }
        // pad suavecito de fondo, entra lento para que no se sienta el golpe
        if (beat % 4 === 0 && sub === 0)
            pad(salida, t, c, acorde, spb * 4, nivel >= 2 ? .018 : .028);
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
        armarBuses(salida, spb);
        const bus = bomba;
        const inicio = ctx.currentTime + .06 - desdeBeat * spb;
        let i = Math.ceil(desdeBeat * 4);
        corrida = { c, salida, inicio, spb };
        const programar = () => {
            const hasta = ctx.currentTime + .15;
            while (inicio + i * spb / 4 < hasta) {
                const t = inicio + i * spb / 4;
                if (t >= ctx.currentTime - .01)
                    tocar(c, bus, i, t);
                i++;
            }
        };
        programar();
        timer = window.setInterval(programar, 25);
    }
    // eco a tres corcheas del tempo, con algo de vuelta y sin agudos para que no ensucie
    function armarBuses(salida, spb) {
        directo = salida;
        bomba = ctx.createGain();
        bomba.connect(salida);
        envioEco = ctx.createGain();
        envioEco.gain.value = .8;
        const eco = ctx.createDelay(1);
        eco.delayTime.value = Math.min(.95, spb * .75);
        const vuelta = ctx.createGain();
        vuelta.gain.value = .32;
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 2800;
        envioEco.connect(eco).connect(filtro).connect(vuelta).connect(eco);
        filtro.connect(salida);
    }
    // la parte que mas luce de cada cancion, el drop si tiene calma antes y si no la primera parte fuerte
    function destacado(c) {
        const k = c.partes.findIndex(p => p[2] === 0);
        if (k >= 0 && c.partes[k + 1])
            return c.partes[k + 1][0];
        const fuerte = c.partes.find(p => p[2] === 3);
        return fuerte ? fuerte[0] : 0;
    }
    // unos segundos de la cancion en el menu, entra y sale despacio
    function previa(nombre) {
        if (apagada || !CANCIONES[nombre])
            return;
        iniciar(nombre, destacado(CANCIONES[nombre]));
        if (!corrida)
            return;
        const g = corrida.salida.gain, t = ctx.currentTime;
        g.setValueAtTime(0, t);
        g.linearRampToValueAtTime(.6, t + .4);
        g.setValueAtTime(.6, t + 6);
        g.linearRampToValueAtTime(0, t + 7.5);
        finPrevia = window.setTimeout(detener, 7600);
    }
    function detener() {
        clearTimeout(finPrevia);
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
            else if (cual === 'aleta') {
                // bajito, si suena fuerte tapa la cancion porque se toca seguido
                tono(maestro, t, 76, .07, 'triangle', .035);
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
    return { iniciar, previa, detener, beatActual, efecto, alternar, silencio, asegurar, CANCIONES, estaApagada: () => apagada };
})();

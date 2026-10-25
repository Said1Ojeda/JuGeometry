(() => {
    const $ = (id) => document.getElementById(id);
    const lienzo = $('lienzo');
    const ctx = lienzo.getContext('2d');
    const escenario = $('escenario');

    const ALTO_VISTO = 13;      // bloques que se ven de alto
    const SUELO_PANTALLA = 1.4; // bloques entre el suelo y el borde de abajo
    const JUGADOR_X = 8;        // a cuantos bloques del borde izquierdo va el jugador

    const COLORES = ['#ffe14d', '#3ff5ff', '#ff5bd6', '#5dff7a', '#ff8a3d', '#b98bff', '#ffffff', '#ff4f5e', '#2f7bff', '#1c1c28'];
    const CARAS = 6;

    // ---------- datos guardados ----------

    const datos = (() => {
        let d = { niveles: {}, icono: { c1: 0, c2: 1, cara: 0 }, saltos: 0, intentos: 0 };
        try { Object.assign(d, JSON.parse(localStorage.getItem('jugeometry') || '{}')); } catch (e) {}
        return d;
    })();
    function guardar() {
        try { localStorage.setItem('jugeometry', JSON.stringify(datos)); } catch (e) {}
    }
    function datosNivel(id) {
        if (!datos.niveles[id]) datos.niveles[id] = { mejor: 0, practica: 0, monedas: 0, intentos: 0 };
        return datos.niveles[id];
    }

    // ---------- estado ----------

    let pantalla = 'menu';
    let elegido = 0;
    let nivel = Niveles[0];
    let s = null;
    let practica = false;
    let checkpoints = [];
    let intento = 0;
    let saltosAntes = 0;
    let mantener = false;
    let muertoDesde = 0;
    let ganadoDesde = 0;
    let tiempoIntento = 0;
    let particulas = [];
    let temblor = 0;
    let estela = [];
    let rot = 0;
    let acumulado = 0, ultimo = 0;
    let camMenu = 0;
    let W = 0, H = 0, E = 1;

    // ---------- pantalla ----------

    function medir() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = escenario.clientWidth;
        H = escenario.clientHeight;
        lienzo.width = Math.round(W * dpr);
        lienzo.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        E = H / ALTO_VISTO;
    }

    const sx = (x, cam) => (x - cam) * E;
    const sy = (y) => H - (y + SUELO_PANTALLA) * E;

    // ---------- partida ----------

    function empezar(desdeCheckpoint) {
        const cp = desdeCheckpoint && checkpoints.length ? checkpoints[checkpoints.length - 1] : null;
        s = cp ? Motor.clonar(cp.s) : Motor.estadoInicial(nivel);
        if (cp) rot = cp.rot;
        else rot = 0;
        if (!cp) { intento++; tiempoIntento = 0; }
        saltosAntes = s.saltos;
        estela = [];
        acumulado = 0;
        muertoDesde = 0;
        ganadoDesde = 0;

        const d = datosNivel(nivel.id);
        d.intentos++;
        datos.intentos++;
        guardar();

        if (practica) Musica.iniciar(nivel.cancion, nivel.beatEn(s.x));
        else Musica.iniciar(nivel.cancion, 0);
        mostrarCapa(null);
        $('hud').hidden = false;
        $('btns-practica').hidden = !practica;
        pantalla = 'jugando';
    }

    function abrirNivel(i, enPractica) {
        nivel = Niveles[i];
        practica = enPractica;
        checkpoints = [];
        intento = 0;
        empezar(false);
    }

    function morir() {
        muertoDesde = performance.now();
        temblor = .5;
        Musica.detener();
        Musica.efecto('muerte');
        explotar(s.x + .5, s.y + .5, colorJugador(0), 40);
        explotar(s.x + .5, s.y + .5, colorJugador(1), 20);
        if (navigator.vibrate) navigator.vibrate(60);

        const d = datosNivel(nivel.id);
        const pct = Math.floor(100 * Math.min(s.x / nivel.fin, 1));
        datos.saltos += s.saltos - saltosAntes;
        if (practica) {
            if (pct > d.practica) d.practica = pct;
        } else if (pct > d.mejor) {
            d.mejor = pct;
            aviso('¡Nuevo récord! ' + pct + '%');
        }
        guardar();
    }

    function ganar() {
        ganadoDesde = performance.now();
        Musica.detener();
        Musica.efecto('ganar');
        for (let i = 0; i < 6; i++) setTimeout(() => {
            explotar(s.x + 2 + Math.random() * 8, 3 + Math.random() * 6, COLORES[Math.floor(Math.random() * 8)], 30);
        }, i * 180);

        const d = datosNivel(nivel.id);
        datos.saltos += s.saltos - saltosAntes;
        if (practica) d.practica = 100;
        else {
            d.mejor = 100;
            d.completado = true;
            d.monedas |= s.monedas;
        }
        guardar();

        setTimeout(() => {
            $('fin-nivel').textContent = nivel.nombre;
            $('fin-modo').textContent = practica ? 'en modo práctica' : '';
            $('fin-intentos').textContent = practica ? '-' : intento;
            $('fin-saltos').textContent = s.saltos;
            $('fin-tiempo').textContent = tiempoIntento.toFixed(1) + ' s';
            $('fin-monedas').innerHTML = monedasHtml(practica ? 0 : s.monedas, nivel.monedasTotal);
            mostrarCapa('capa-ganar');
            pantalla = 'ganado';
        }, 1300);
    }

    function ponerCheckpoint() {
        if (!practica || pantalla !== 'jugando' || !s || s.muerto) return;
        checkpoints.push({ s: Motor.clonar(s), rot });
        Musica.efecto('checkpoint');
    }

    function quitarCheckpoint() {
        if (!practica) return;
        checkpoints.pop();
    }

    function pausar() {
        if (pantalla === 'jugando' && !muertoDesde && !ganadoDesde) {
            pantalla = 'pausa';
            Musica.detener();
            $('pausa-nivel').textContent = nivel.nombre + (practica ? ' · práctica' : '');
            $('pausa-pct').textContent = Math.floor(100 * s.x / nivel.fin) + '%';
            mostrarCapa('capa-pausa');
        }
    }

    function seguir() {
        if (pantalla !== 'pausa') return;
        pantalla = 'jugando';
        mostrarCapa(null);
        ultimo = performance.now();
        Musica.iniciar(nivel.cancion, nivel.beatEn(s.x));
    }

    function alMenu() {
        Musica.detener();
        pantalla = 'menu';
        $('hud').hidden = true;
        $('btns-practica').hidden = true;
        mostrarCapa('capa-menu');
        pintarTarjeta();
    }

    // ---------- fisica en el ciclo ----------

    function actualizar(dt) {
        if (pantalla !== 'jugando') return;

        if (muertoDesde) {
            if (performance.now() - muertoDesde > 750) empezar(practica);
            return;
        }
        if (ganadoDesde) return;

        tiempoIntento += dt;
        acumulado += dt;
        while (acumulado >= Motor.PASO) {
            acumulado -= Motor.PASO;
            Motor.paso(s, nivel, mantener, Motor.PASO);
            if (s.evento === 'moneda') {
                Musica.efecto('moneda');
                explotar(s.x + .5, s.y + .5, '#ffd84d', 18);
            }
            if (s.evento === 'orbe' || s.evento === 'pad' || s.evento === 'portal') explotar(s.x + .5, s.y + .5, '#ffffff', 10);
            if (s.muerto) { morir(); return; }
            if (s.ganado) { ganar(); return; }
        }

        // giro del cubo, media vuelta por salto y se acomoda al caer
        if (s.modo === 'cubo') {
            if (s.enSuelo) {
                const objetivo = Math.round(rot / 90) * 90;
                rot += (objetivo - rot) * Math.min(1, dt * 25);
            } else rot += s.grav * 440 * dt;
        } else if (s.modo === 'bola') {
            rot += s.grav * 600 * dt * s.mult;
        } else if (s.modo === 'nave') {
            rot = -Math.atan2(s.vy, Motor.BASE * s.mult) * 180 / Math.PI * .8;
        } else rot = s.vy > 0 ? -45 : 45;

        estela.push({ x: s.x + .5, y: s.y + .5 });
        if (estela.length > 60) estela.shift();

        if (s.modo === 'cubo' && s.enSuelo && Math.random() < .5)
            particulas.push({ x: s.x, y: s.grav > 0 ? s.y + .05 : s.y + .95, vx: -2 - Math.random() * 2, vy: s.grav * Math.random() * 1.5, vida: .5, color: colorJugador(1), r: .08 });
        if (s.modo === 'nave' && Math.random() < .8)
            particulas.push({ x: s.x + .1, y: s.y + .35, vx: -4 - Math.random() * 3, vy: (Math.random() - .5) * 2, vida: .45, color: '#ff9a3d', r: .1 + Math.random() * .08 });
    }

    // ---------- dibujo ----------

    function hexRgb(h) {
        const n = parseInt(h.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function mezclar(a, b, t) {
        const A = hexRgb(a), B = hexRgb(b);
        return A.map((v, i) => Math.round(v + (B[i] - v) * t));
    }
    const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    // el color cambia de a poco en 3 bloques al pasar cada marca de color
    function coloresEn(x) {
        const lista = nivel.colores;
        let k = 0;
        while (k + 1 < lista.length && lista[k + 1].x <= x) k++;
        const actual = lista[k], ant = lista[Math.max(0, k - 1)];
        const t = Math.min(Math.max((x - actual.x) / 3, 0), 1);
        return { fondo: mezclar(ant.fondo, actual.fondo, t), linea: mezclar(ant.linea, actual.linea, t) };
    }

    function latido(x) {
        let b = Musica.beatActual();
        if (b === null) b = nivel.beatEn(x);
        const f = b - Math.floor(b);
        return Math.exp(-f * 5);
    }

    function colorJugador(i) {
        return COLORES[i === 0 ? datos.icono.c1 : datos.icono.c2];
    }

    function dibujar(dt) {
        const enJuego = pantalla !== 'menu' && s;
        const px = enJuego ? s.x : camMenu;
        const cam = px - JUGADOR_X;
        const col = coloresEn(px);
        const lat = latido(px);

        ctx.save();
        if (temblor > 0) {
            ctx.translate((Math.random() - .5) * temblor * E, (Math.random() - .5) * temblor * E);
            temblor = Math.max(0, temblor - dt * 1.2);
        }

        // fondo
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgb(col.fondo.map(v => v * .35)));
        g.addColorStop(1, rgb(col.fondo.map(v => Math.min(255, v * (.9 + lat * .15)))));
        ctx.fillStyle = g;
        ctx.fillRect(-20, -20, W + 40, H + 40);

        // cuadros grandes al fondo que se mueven mas lento, da profundidad
        ctx.strokeStyle = rgb(col.linea, .07 + lat * .05);
        ctx.lineWidth = 2;
        const tam = E * 3.2;
        const desf = (cam * E * .15) % (tam * 2);
        for (let i = -1; i < W / tam + 2; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 3) continue;
                ctx.strokeRect(i * tam * 2 - desf + (j % 2) * tam, j * tam * .9 + 6, tam * .8, tam * .8);
            }
        }

        // techo cuando no es cubo
        const conTecho = enJuego && s.modo !== 'cubo';
        if (conTecho) {
            ctx.fillStyle = rgb(col.fondo.map(v => v * .25));
            ctx.fillRect(0, 0, W, sy(Motor.TECHO));
            linea(0, sy(Motor.TECHO), W, col, lat);
        }

        if (enJuego) dibujarObjetos(cam, col, lat);

        // suelo
        const ys = sy(0);
        ctx.fillStyle = rgb(col.fondo.map(v => v * .3));
        ctx.fillRect(0, ys, W, H - ys + 20);
        ctx.strokeStyle = rgb(col.linea, .12);
        const paso = E * 4;
        for (let i = -1; i < W / paso + 1; i++) {
            const xx = i * paso - (cam * E) % paso;
            ctx.strokeRect(xx, ys + 4, paso, H);
        }
        linea(0, ys, W, col, lat);

        if (enJuego) {
            for (const cp of checkpoints) dibujarCheckpoint(sx(cp.s.x + .5, cam), sy(cp.s.y + .5));
            if (!practica && s.x < 30) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - s.x / 30);
                ctx.fillStyle = '#fff';
                ctx.font = `800 ${E * .9}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('Intento ' + intento, sx(14, cam), sy(6));
                ctx.restore();
            }
            if (!s.muerto) dibujarJugador(cam);
        } else {
            // en el menu un cubito brincando solo
            const t = performance.now() / 1000;
            const brinco = Math.abs(Math.sin(t * 2.6)) * 2;
            dibujarCubo(E * 2.5, sy(brinco + .5), E, (t * 2.6 % Math.PI) / Math.PI * 180, 1, datos.icono);
        }

        dibujarParticulas(cam, dt);
        ctx.restore();
    }

    function linea(x, y, w, col, lat) {
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, rgb(col.linea, 0));
        g.addColorStop(.5, rgb(col.linea, .7 + lat * .3));
        g.addColorStop(1, rgb(col.linea, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x, y - 1.5, w, 3);
    }

    function primerVisible(cam) {
        const objs = nivel.objs;
        let lo = 0, hi = objs.length;
        while (lo < hi) {
            const m = (lo + hi) >> 1;
            if (objs[m].x < cam - 4) lo = m + 1; else hi = m;
        }
        return lo;
    }

    function dibujarObjetos(cam, col, lat) {
        const objs = nivel.objs;
        const fin = cam + W / E + 2;
        const t = performance.now() / 1000;

        // primero bloques y picos, luego lo que brilla encima
        for (let pasada = 0; pasada < 2; pasada++) {
            for (let i = primerVisible(cam); i < objs.length && objs[i].x < fin; i++) {
                const o = objs[i];
                if (o.x2 < cam - 1) continue;
                const solido = o.t === 'bloque' || o.t === 'pico';
                if ((pasada === 0) !== solido) continue;
                if (s && s.usados[i] && o.t === 'moneda') continue;

                const x = sx(o.x, cam);
                if (o.t === 'bloque') {
                    const y = sy(o.y + o.h), w = o.w * E, h = o.h * E;
                    ctx.fillStyle = 'rgba(0,0,0,.55)';
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeStyle = rgb(col.linea, .9);
                    ctx.lineWidth = Math.max(1.5, E * .06);
                    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
                    ctx.strokeStyle = rgb(col.linea, .18);
                    for (let k = 1; k < o.w; k++) { ctx.beginPath(); ctx.moveTo(x + k * E, y); ctx.lineTo(x + k * E, y + h); ctx.stroke(); }
                    for (let k = 1; k < o.h; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * E); ctx.lineTo(x + w, y + k * E); ctx.stroke(); }
                } else if (o.t === 'pico') {
                    const alto = o.mini ? .45 : 1;
                    const base = o.abajo ? sy(o.y + 1) : sy(o.y);
                    const punta = o.abajo ? base + alto * E : base - alto * E;
                    ctx.beginPath();
                    ctx.moveTo(x + E * .06, base);
                    ctx.lineTo(x + E * .5, punta);
                    ctx.lineTo(x + E * .94, base);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(0,0,0,.7)';
                    ctx.fill();
                    ctx.strokeStyle = rgb(col.linea);
                    ctx.lineWidth = Math.max(1.5, E * .06);
                    ctx.stroke();
                } else if (o.t === 'orbe') {
                    const c = { amarillo: '#ffe14d', rosa: '#ff5bd6', azul: '#3fd0ff' }[o.tipo];
                    const usado = s && s.usados[i];
                    const cx = x + E / 2, cy = sy(o.y + .5);
                    brillo(cx, cy, c, E * (1.2 + lat * .3), usado ? .15 : .5);
                    ctx.globalAlpha = usado ? .35 : 1;
                    ctx.strokeStyle = c;
                    ctx.lineWidth = E * .08;
                    ctx.beginPath(); ctx.arc(cx, cy, E * (.42 + lat * .05), 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = c;
                    ctx.beginPath(); ctx.arc(cx, cy, E * .26, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1;
                } else if (o.t === 'pad') {
                    const c = { amarillo: '#ffe14d', rosa: '#ff5bd6', azul: '#3fd0ff' }[o.tipo];
                    const cx = x + E / 2, base = sy(o.y);
                    brillo(cx, base - E * .2, c, E * .9, .5);
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    ctx.ellipse(cx, base, E * .45, E * .22, 0, Math.PI, 0);
                    ctx.fill();
                } else if (o.t === 'portal') {
                    dibujarPortal(o, x, cam, t);
                } else if (o.t === 'moneda') {
                    const cx = x + E / 2, cy = sy(o.y + .5);
                    brillo(cx, cy, '#ffd84d', E * 1.3, .5);
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.scale(Math.abs(Math.cos(t * 2.5)) * .8 + .2, 1);
                    ctx.fillStyle = '#ffd84d';
                    ctx.beginPath(); ctx.arc(0, 0, E * .42, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#a8740a';
                    ctx.lineWidth = E * .07;
                    ctx.beginPath(); ctx.arc(0, 0, E * .3, 0, Math.PI * 2); ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // linea de meta
        const xf = sx(nivel.fin, cam);
        if (xf < W + 20) {
            const g = ctx.createLinearGradient(xf, 0, xf + E * 3, 0);
            g.addColorStop(0, 'rgba(255,255,255,.5)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(xf, 0, E * 3, sy(0));
        }
    }

    const PORTAL = {
        cubo: '#5dff7a', nave: '#ff5bd6', bola: '#ff8a3d', onda: '#3ff5ff',
        '1': '#3fd0ff', '-1': '#ffe14d'
    };

    function dibujarPortal(o, x, cam, t) {
        const cx = x + E / 2;
        if (o.tipo === 'vel') {
            const n = { 0.8: 1, 1: 2, 1.25: 3, 1.5: 4 }[o.valor] || 2;
            const c = { 0.8: '#ff8a3d', 1: '#3fd0ff', 1.25: '#5dff7a', 1.5: '#ff5bd6' }[o.valor] || '#fff';
            const cy = sy(o.y + 1.5);
            brillo(cx, cy, c, E * 1.6, .4);
            ctx.strokeStyle = c;
            ctx.lineWidth = E * .14;
            ctx.lineJoin = 'round';
            for (let k = 0; k < n; k++) {
                const ox = cx - (n - 1) * E * .22 + k * E * .44;
                ctx.beginPath();
                ctx.moveTo(ox - E * .2, cy - E * .55);
                ctx.lineTo(ox + E * .15, cy);
                ctx.lineTo(ox - E * .2, cy + E * .55);
                ctx.stroke();
            }
            return;
        }
        const c = PORTAL[o.valor] || '#fff';
        const cy = sy(o.y + 1.5);
        brillo(cx, cy, c, E * 2, .35);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = c;
        ctx.lineWidth = E * .16;
        ctx.beginPath();
        ctx.ellipse(0, 0, E * .45, E * 1.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = .5;
        ctx.lineWidth = E * .06;
        ctx.beginPath();
        ctx.ellipse(0, 0, E * .28 + Math.sin(t * 6) * E * .04, E * 1.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // icono chiquito arriba para saber que portal es
        ctx.translate(0, -E * 2.1);
        ctx.fillStyle = c;
        ctx.font = `800 ${E * .55}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icono = { cubo: '■', nave: '▲', bola: '●', onda: '◆', '1': '▼', '-1': '▲' }[o.valor];
        if (icono) ctx.fillText(icono, 0, 0);
        ctx.restore();
    }

    function brillo(x, y, color, radio, fuerza) {
        const c = hexRgb(color);
        const g = ctx.createRadialGradient(x, y, 0, x, y, radio);
        g.addColorStop(0, rgb(c, fuerza));
        g.addColorStop(1, rgb(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.fill();
    }

    function dibujarCheckpoint(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'rgba(93,255,122,.85)';
        ctx.fillRect(-E * .22, -E * .22, E * .44, E * .44);
        ctx.restore();
    }

    function dibujarJugador(cam) {
        const x = sx(s.x + .5, cam), y = sy(s.y + .5);
        const icono = datos.icono;
        const c1 = colorJugador(0), c2 = colorJugador(1);

        if (s.modo === 'onda' && estela.length > 1) {
            ctx.strokeStyle = c2;
            ctx.lineWidth = E * .22;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = .7;
            ctx.beginPath();
            estela.forEach((p, k) => {
                const ex = sx(p.x, cam), ey = sy(p.y);
                if (k) ctx.lineTo(ex, ey); else ctx.moveTo(ex, ey);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        brillo(x, y, c1, E * 1.3, .25);

        if (s.modo === 'cubo') {
            dibujarCubo(x, y, E, rot, s.grav, icono);
        } else if (s.modo === 'nave') {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * Math.PI / 180);
            if (s.grav < 0) ctx.scale(1, -1);
            dibujarCubo(-E * .05, -E * .22, E * .55, 0, 1, icono);
            ctx.beginPath();
            ctx.moveTo(-E * .62, E * .05);
            ctx.lineTo(E * .62, E * .05);
            ctx.lineTo(E * .3, E * .42);
            ctx.lineTo(-E * .5, E * .42);
            ctx.closePath();
            ctx.fillStyle = c1;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = E * .06;
            ctx.stroke();
            ctx.fillStyle = c2;
            ctx.fillRect(-E * .35, E * .15, E * .55, E * .12);
            ctx.restore();
        } else if (s.modo === 'bola') {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * Math.PI / 180);
            ctx.fillStyle = c1;
            ctx.beginPath(); ctx.arc(0, 0, E * .48, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = E * .06;
            ctx.stroke();
            ctx.fillStyle = c2;
            for (let k = 0; k < 4; k++) {
                ctx.rotate(Math.PI / 2);
                ctx.fillRect(-E * .07, E * .12, E * .14, E * .3);
            }
            ctx.beginPath(); ctx.arc(0, 0, E * .14, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(E * .45, 0);
            ctx.lineTo(-E * .35, -E * .32);
            ctx.lineTo(-E * .2, 0);
            ctx.lineTo(-E * .35, E * .32);
            ctx.closePath();
            ctx.fillStyle = c1;
            ctx.fill();
            ctx.strokeStyle = c2;
            ctx.lineWidth = E * .07;
            ctx.stroke();
            ctx.restore();
        }
    }

    // el cubo con su cara, se usa en el juego y en el menu de iconos
    function dibujarCubo(x, y, tam, giro, grav, icono, c = ctx) {
        const c1 = COLORES[icono.c1], c2 = COLORES[icono.c2];
        const m = tam / 2;
        c.save();
        c.translate(x, y);
        c.rotate(giro * Math.PI / 180);
        if (grav < 0) c.scale(1, -1);
        c.fillStyle = c1;
        c.fillRect(-m, -m, tam, tam);
        c.strokeStyle = '#000';
        c.lineWidth = tam * .07;
        c.strokeRect(-m, -m, tam, tam);
        c.fillStyle = c2;
        c.strokeStyle = '#000';
        c.lineWidth = tam * .05;

        const r = (x1, y1, w, h) => { c.fillRect(x1 * tam, y1 * tam, w * tam, h * tam); c.strokeRect(x1 * tam, y1 * tam, w * tam, h * tam); };
        switch (icono.cara) {
            case 0: r(-.3, -.22, .18, .18); r(.12, -.22, .18, .18); r(-.25, .12, .5, .12); break;
            case 1: r(-.32, -.32, .64, .64); c.fillStyle = c1; r(-.14, -.14, .28, .28); break;
            case 2: r(-.32, -.18, .64, .16); r(-.12, .1, .24, .22); break;
            case 3: r(-.3, -.3, .22, .22); r(.08, -.3, .22, .22); r(-.3, .08, .22, .22); r(.08, .08, .22, .22); break;
            case 4: c.beginPath(); c.moveTo(-.3 * tam, .25 * tam); c.lineTo(0, -.3 * tam); c.lineTo(.3 * tam, .25 * tam); c.closePath(); c.fill(); c.stroke(); break;
            case 5: r(-.34, -.1, .68, .2); r(-.1, -.34, .2, .68); break;
        }
        c.restore();
    }

    function explotar(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 9;
            particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: .6 + Math.random() * .5, color, r: .07 + Math.random() * .14, cuadro: true });
        }
        if (particulas.length > 600) particulas.splice(0, particulas.length - 600);
    }

    function dibujarParticulas(cam, dt) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = particulas.length - 1; i >= 0; i--) {
            const p = particulas[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 1 - dt * 2;
            p.vy *= 1 - dt * 2;
            p.vida -= dt;
            if (p.vida <= 0) { particulas.splice(i, 1); continue; }
            ctx.globalAlpha = Math.min(1, p.vida * 2);
            ctx.fillStyle = p.color;
            const r = p.r * E;
            if (p.cuadro) ctx.fillRect(sx(p.x, cam) - r, sy(p.y) - r, r * 2, r * 2);
            else { ctx.beginPath(); ctx.arc(sx(p.x, cam), sy(p.y), r, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // ---------- hud ----------

    function actualizarHud() {
        if (!s || pantalla === 'menu') return;
        const pct = Math.min(100, Math.floor(100 * s.x / nivel.fin));
        $('barra-relleno').style.width = pct + '%';
        $('pct').textContent = pct + '%';
    }

    let avisoTimer = null;
    function aviso(texto) {
        const a = $('aviso');
        a.textContent = texto;
        a.classList.add('visible');
        clearTimeout(avisoTimer);
        avisoTimer = setTimeout(() => a.classList.remove('visible'), 1400);
    }

    function mostrarCapa(id) {
        document.querySelectorAll('.capa').forEach(c => c.classList.toggle('activa', c.id === id));
    }

    function monedasHtml(mask, total) {
        let h = '';
        for (let i = 0; i < total; i++) h += `<span class="moneda ${mask & (1 << i) ? 'llena' : ''}"></span>`;
        return h;
    }

    // ---------- menu ----------

    function pintarTarjeta() {
        const n = Niveles[elegido];
        const d = datosNivel(n.id);
        $('tarjeta-nombre').textContent = n.nombre;
        $('tarjeta-dificultad').textContent = n.dificultad;
        $('tarjeta-dificultad').className = 'dificultad ' + n.id;
        $('tarjeta-estrellas').textContent = '★ ' + n.estrellas;
        $('tarjeta-monedas').innerHTML = monedasHtml(d.monedas, n.monedasTotal);
        $('barra-normal').style.width = d.mejor + '%';
        $('txt-normal').textContent = d.mejor + '%';
        $('barra-practica').style.width = d.practica + '%';
        $('txt-practica').textContent = d.practica + '%';
        $('tarjeta-intentos').textContent = d.intentos ? d.intentos + ' intentos' : 'Sin jugar todavía';
        $('puntos-nivel').innerHTML = Niveles.map((_, i) => `<span class="${i === elegido ? 'activo' : ''}"></span>`).join('');
        nivel = n;
        camMenu = 0;
    }

    function cambiarNivel(d) {
        elegido = (elegido + d + Niveles.length) % Niveles.length;
        Musica.efecto('clic');
        pintarTarjeta();
    }

    function pintarIconos() {
        const fila = (id, clave) => {
            $(id).innerHTML = '';
            COLORES.forEach((c, i) => {
                const b = document.createElement('button');
                b.className = 'color' + (datos.icono[clave] === i ? ' activo' : '');
                b.style.background = c;
                b.setAttribute('aria-label', 'Color ' + (i + 1));
                b.onclick = () => { datos.icono[clave] = i; guardar(); pintarIconos(); };
                $(id).appendChild(b);
            });
        };
        fila('colores-1', 'c1');
        fila('colores-2', 'c2');

        $('caras').innerHTML = '';
        for (let k = 0; k < CARAS; k++) {
            const b = document.createElement('button');
            b.className = 'cara' + (datos.icono.cara === k ? ' activo' : '');
            const cv = document.createElement('canvas');
            cv.width = cv.height = 96;
            dibujarCubo(48, 48, 64, 0, 1, { ...datos.icono, cara: k }, cv.getContext('2d'));
            b.appendChild(cv);
            b.setAttribute('aria-label', 'Cara ' + (k + 1));
            b.onclick = () => { datos.icono.cara = k; guardar(); pintarIconos(); };
            $('caras').appendChild(b);
        }

        const v = $('vista-icono');
        const vc = v.getContext('2d');
        vc.clearRect(0, 0, v.width, v.height);
        dibujarCubo(v.width / 2, v.height / 2, v.width * .6, 0, 1, datos.icono, vc);
        $('stats').textContent = `${datos.intentos} intentos · ${datos.saltos} saltos en total`;
    }

    // ---------- controles ----------

    function presionar() {
        Musica.asegurar();
        if (pantalla === 'jugando' && s && !s.muerto) {
            if (!mantener) s.buffer = Motor.BUFFER;
            mantener = true;
        }
    }
    function soltar() { mantener = false; }

    const SALTAR = ['Space', 'ArrowUp', 'KeyW'];
    document.addEventListener('keydown', (e) => {
        if (SALTAR.includes(e.code)) {
            if (e.target.tagName === 'BUTTON' && pantalla !== 'jugando') return;
            e.preventDefault();
            if (e.repeat) return;
            if (pantalla === 'ganado') return;
            presionar();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
            if (pantalla === 'jugando') pausar();
            else if (pantalla === 'pausa') seguir();
        } else if (e.code === 'KeyR' && (pantalla === 'jugando' || pantalla === 'pausa')) {
            checkpoints = practica ? checkpoints : [];
            empezar(practica);
        } else if (e.code === 'KeyZ') ponerCheckpoint();
        else if (e.code === 'KeyX') quitarCheckpoint();
        else if (e.code === 'KeyM') pintarSonido(Musica.alternar());
        else if (pantalla === 'menu' && e.code === 'ArrowRight') cambiarNivel(1);
        else if (pantalla === 'menu' && e.code === 'ArrowLeft') cambiarNivel(-1);
    });
    document.addEventListener('keyup', (e) => { if (SALTAR.includes(e.code)) soltar(); });

    escenario.addEventListener('pointerdown', (e) => {
        if (e.target !== lienzo) return;
        e.preventDefault();
        presionar();
    });
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    window.addEventListener('blur', () => { soltar(); pausar(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

    function pintarSonido(prendido) {
        document.querySelectorAll('.btn-sonido').forEach(b => b.textContent = prendido ? '🔊' : '🔇');
    }

    const clic = (id, fn) => $(id).addEventListener('click', (e) => { e.stopPropagation(); Musica.asegurar(); fn(); });
    clic('btn-jugar', () => abrirNivel(elegido, false));
    clic('btn-practica', () => abrirNivel(elegido, true));
    clic('btn-ant', () => cambiarNivel(-1));
    clic('btn-sig', () => cambiarNivel(1));
    clic('btn-iconos', () => { pintarIconos(); mostrarCapa('capa-iconos'); });
    clic('btn-cerrar-iconos', () => { mostrarCapa('capa-menu'); });
    clic('btn-pausa', pausar);
    clic('btn-seguir', seguir);
    clic('btn-reiniciar', () => { if (!practica) checkpoints = []; empezar(practica); });
    clic('btn-salir', alMenu);
    clic('btn-otra', () => { checkpoints = []; intento = 0; empezar(false); });
    clic('btn-menu-fin', alMenu);
    clic('btn-cp-poner', ponerCheckpoint);
    clic('btn-cp-quitar', quitarCheckpoint);
    document.querySelectorAll('.btn-sonido').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); pintarSonido(Musica.alternar()); }));

    // ---------- ciclo ----------

    function ciclo(ahora) {
        const dt = Math.min((ahora - (ultimo || ahora)) / 1000, .05);
        ultimo = ahora;
        if (pantalla === 'menu') camMenu += dt * 4;
        actualizar(dt);
        dibujar(dt);
        actualizarHud();
        requestAnimationFrame(ciclo);
    }

    window.addEventListener('resize', medir);
    medir();
    pintarTarjeta();
    mostrarCapa('capa-menu');
    requestAnimationFrame(ciclo);
})();

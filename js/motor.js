// fisica del juego, sin nada de dibujo para poder probar los niveles con un bot
// unidades en bloques, y hacia arriba, el suelo esta en y = 0
const Motor = (() => {
    const BASE = 10.4;          // bloques por segundo a velocidad normal
    const TECHO = 11;
    const G_CUBO = 105;
    const SALTO = 21.5;
    const CAIDA_MAX = 28;
    const G_BOLA = 88;
    const NAVE_ACC = 52;
    const NAVE_MAX = 10.5;
    const BUFFER = 0.12;        // cuanto dura un toque para los orbes y la bola
    const PASO = 1 / 240;

    const ORBE = { amarillo: 1, rosa: 0.72 };
    const PAD = { amarillo: 1.42, rosa: 1.02 };

    function estadoInicial(nivel) {
        return {
            x: 0, y: 0, vy: 0,
            modo: nivel.modoInicial || 'cubo',
            grav: 1,
            mult: 1,
            enSuelo: true,
            buffer: 0,
            i0: 0,
            usados: new Uint8Array(nivel.objs.length),
            monedas: 0,
            muerto: false,
            ganado: false,
            saltos: 0,
            evento: null
        };
    }

    function clonar(s) {
        const c = Object.assign({}, s);
        c.usados = s.usados.slice();
        return c;
    }

    function choca(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    // avanza un pasito fijo de fisica
    function paso(s, nivel, mantener, dt) {
        if (s.muerto || s.ganado) return;
        s.evento = null;
        const vel = BASE * s.mult;
        s.x += vel * dt;
        if (s.buffer > 0) s.buffer -= dt;

        const g = s.grav;

        if (s.modo === 'cubo') {
            if (s.enSuelo && mantener) {
                s.vy = g * SALTO;
                s.enSuelo = false;
                s.saltos++;
            }
            s.vy -= g * G_CUBO * dt;
            if (s.vy * g < -CAIDA_MAX) s.vy = -g * CAIDA_MAX;
        } else if (s.modo === 'bola') {
            if (s.enSuelo && s.buffer > 0) {
                s.grav = -s.grav;
                s.vy = -s.grav * 6;
                s.buffer = 0;
                s.enSuelo = false;
                s.saltos++;
            } else {
                s.vy -= g * G_BOLA * dt;
                if (s.vy * g < -CAIDA_MAX) s.vy = -g * CAIDA_MAX;
            }
        } else if (s.modo === 'nave') {
            s.vy += (mantener ? 1 : -0.9) * g * NAVE_ACC * dt;
            if (s.vy > NAVE_MAX) s.vy = NAVE_MAX;
            if (s.vy < -NAVE_MAX) s.vy = -NAVE_MAX;
        } else if (s.modo === 'onda') {
            s.vy = (mantener ? 1 : -1) * g * vel;
        }

        s.y += s.vy * dt;
        s.enSuelo = false;

        // suelo y techo
        if (s.y < 0) {
            s.y = 0;
            if (s.vy < 0) s.vy = 0;
            if (s.grav === 1) s.enSuelo = true;
        }
        if (s.y + 1 > TECHO) {
            s.y = TECHO - 1;
            if (s.vy > 0) s.vy = 0;
            if (s.grav === -1) s.enSuelo = true;
        }

        const objs = nivel.objs;
        while (s.i0 < objs.length && objs[s.i0].x2 < s.x - 1) s.i0++;

        for (let i = s.i0; i < objs.length; i++) {
            const o = objs[i];
            if (o.x > s.x + 2) break;
            if (s.usados[i] && o.unaVez) continue;

            switch (o.t) {
                case 'bloque': chocarBloque(s, o); break;
                case 'pico': if (choca(s.x + .15, s.y + .15, .7, .7, o.hx, o.hy, o.hw, o.hh)) morir(s); break;
                case 'orbe':
                    if (s.modo !== 'onda' && s.buffer > 0 && dist(s, o) < .95) {
                        s.usados[i] = 1;
                        s.buffer = 0;
                        usarOrbe(s, o.tipo);
                    }
                    break;
                case 'pad':
                    if (choca(s.x, s.y, 1, 1, o.x, o.y, 1, .4)) {
                        s.usados[i] = 1;
                        usarPad(s, o.tipo);
                    }
                    break;
                case 'portal':
                    if (s.x + .5 >= o.x + .5) {
                        s.usados[i] = 1;
                        usarPortal(s, o);
                    }
                    break;
                case 'moneda':
                    if (dist(s, o) < 1) {
                        s.usados[i] = 1;
                        s.monedas |= 1 << o.n;
                        s.evento = 'moneda';
                    }
                    break;
            }
            if (s.muerto) return;
        }

        if (s.x >= nivel.fin) s.ganado = true;
    }

    function dist(s, o) {
        const dx = s.x + .5 - (o.x + .5), dy = s.y + .5 - (o.y + .5);
        return Math.sqrt(dx * dx + dy * dy);
    }

    function morir(s) {
        s.muerto = true;
    }

    function chocarBloque(s, b) {
        if (!choca(s.x, s.y, 1, 1, b.x, b.y, b.w, b.h)) return;

        // la onda muere con cualquier bloque, pero con hitbox chiquito
        if (s.modo === 'onda') {
            if (choca(s.x + .32, s.y + .32, .36, .36, b.x, b.y, b.w, b.h)) morir(s);
            return;
        }

        const arriba = b.y + b.h - s.y;     // cuanto se metio desde arriba
        const abajo = s.y + 1 - b.y;        // cuanto se metio desde abajo

        if (arriba <= .45 && s.vy <= 0) {
            s.y = b.y + b.h;
            s.vy = 0;
            if (s.grav === 1) s.enSuelo = true;
            else if (s.modo !== 'nave') return morir(s);
            return;
        }
        if (abajo <= .45 && s.vy >= 0) {
            s.y = b.y - 1;
            s.vy = 0;
            if (s.grav === -1) s.enSuelo = true;
            else if (s.modo !== 'nave') return morir(s);
            return;
        }
        // de lado, solo cuenta si el centro ya se metio
        if (choca(s.x + .3, s.y + .3, .4, .4, b.x, b.y, b.w, b.h)) morir(s);
    }

    function usarOrbe(s, tipo) {
        if (tipo === 'azul') {
            s.grav = -s.grav;
            s.vy = -s.grav * 8;
        } else {
            const f = s.modo === 'nave' ? .55 : 1;
            s.vy = s.grav * SALTO * ORBE[tipo] * f;
        }
        s.enSuelo = false;
        s.saltos++;
        s.evento = 'orbe';
    }

    function usarPad(s, tipo) {
        if (tipo === 'azul') {
            s.grav = -s.grav;
            s.vy = -s.grav * 16;
        } else {
            const f = s.modo === 'nave' ? .6 : 1;
            s.vy = s.grav * SALTO * PAD[tipo] * f;
        }
        s.enSuelo = false;
        s.evento = 'pad';
    }

    function usarPortal(s, p) {
        if (p.tipo === 'modo') {
            if (s.modo !== p.valor) {
                s.modo = p.valor;
                if (p.valor === 'nave' || p.valor === 'onda') s.vy *= .4;
                s.evento = 'portal';
            }
        } else if (p.tipo === 'grav') {
            if (s.grav !== p.valor) {
                s.grav = p.valor;
                s.vy *= .5;
                s.enSuelo = false;
                s.evento = 'portal';
            }
        } else if (p.tipo === 'vel') {
            s.mult = p.valor;
        }
    }

    // ---------- armado de niveles ----------
    // los objetos se ponen por tiempo musical (beats), asi los obstaculos caen con el ritmo

    function Constructor(def) {
        const objs = [];
        const tramos = [{ beat: 0, x: 0, mult: 1 }];
        const colores = [];
        const bloquesPorBeat = (mult) => BASE * mult * 60 / def.bpm;
        let monedas = 0;

        const x = (beat) => {
            let t = tramos[0];
            for (const tr of tramos) if (tr.beat <= beat) t = tr;
            return t.x + (beat - t.beat) * bloquesPorBeat(t.mult);
        };

        const api = {
            x,
            vel(beat, mult) {
                const px = x(beat);
                tramos.push({ beat, x: px, mult });
                objs.push({ t: 'portal', tipo: 'vel', valor: mult, x: px, y: 1, unaVez: true });
            },
            modo(beat, modo, y = 1) { objs.push({ t: 'portal', tipo: 'modo', valor: modo, x: x(beat), y, unaVez: true }); },
            grav(beat, g, y = 1) { objs.push({ t: 'portal', tipo: 'grav', valor: g, x: x(beat), y, unaVez: true }); },
            bloque(beat, dx, y, w = 1, h = 1) { objs.push({ t: 'bloque', x: x(beat) + dx, y, w, h }); },
            pico(beat, dx = 0, y = 0, n = 1, abajo = false, mini = false) {
                for (let i = 0; i < n; i++) {
                    const px = x(beat) + dx + i;
                    const alto = mini ? .3 : .5;
                    const hy = abajo ? y + 1 - .1 - alto : y + .1;
                    objs.push({ t: 'pico', x: px, y, abajo, mini, hx: px + .35, hy, hw: .3, hh: alto });
                }
            },
            orbe(beat, dx, y, tipo = 'amarillo') { objs.push({ t: 'orbe', tipo, x: x(beat) + dx, y, unaVez: true }); },
            pad(beat, dx, y, tipo = 'amarillo') { objs.push({ t: 'pad', tipo, x: x(beat) + dx, y, unaVez: true }); },
            moneda(beat, dx, y) { objs.push({ t: 'moneda', n: monedas++, x: x(beat) + dx, y, unaVez: true }); },
            color(beat, fondo, linea) { colores.push({ x: x(beat), fondo, linea }); },
            // tunel para nave u onda, piso y techo con un hueco que se mueve
            tunel(beatIni, beatFin, alturas, hueco, cada = 1) {
                const ini = x(beatIni), fin = x(beatFin);
                let k = 0;
                for (let px = ini; px < fin; px += cada, k++) {
                    const piso = alturas[k % alturas.length];
                    if (piso > 0) objs.push({ t: 'bloque', x: px, y: 0, w: cada, h: piso });
                    const techo = piso + hueco;
                    if (techo < TECHO) objs.push({ t: 'bloque', x: px, y: techo, w: cada, h: TECHO - techo });
                }
            },
            terminar(beat) {
                objs.forEach(o => { o.x2 = o.x + (o.w || 1); });
                objs.sort((a, b) => a.x - b.x);
                colores.sort((a, b) => a.x - b.x);
                const tramosBeat = tramos.slice();
                return {
                    ...def,
                    objs,
                    colores,
                    fin: x(beat),
                    monedasTotal: monedas,
                    // para la musica, de posicion a tiempo
                    beatEn(px) {
                        let t = tramosBeat[0];
                        for (const tr of tramosBeat) if (tr.x <= px) t = tr;
                        return t.beat + (px - t.x) / bloquesPorBeat(t.mult);
                    }
                };
            }
        };
        return api;
    }

    return { BASE, TECHO, PASO, BUFFER, estadoInicial, clonar, paso, Constructor };
})();

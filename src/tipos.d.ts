// tipos que comparten todos los archivos del juego

type Modo = 'cubo' | 'nave' | 'bola' | 'onda';
type Gravedad = 1 | -1;
type TipoOrbe = 'amarillo' | 'rosa' | 'azul';
type Evento = 'moneda' | 'orbe' | 'pad' | 'portal' | null;

interface Estado {
    x: number;
    y: number;
    vy: number;
    modo: Modo;
    grav: Gravedad;
    mult: number;
    enSuelo: boolean;
    buffer: number;
    i0: number;
    usados: Uint8Array;
    monedas: number;
    muerto: boolean;
    ganado: boolean;
    saltos: number;
    evento: Evento;
}

// todo objeto del nivel trae donde empieza y donde termina
interface ObjBase {
    x: number;
    y: number;
    x2: number;
    unaVez?: boolean;
    w?: number;
}

interface Bloque extends ObjBase { t: 'bloque'; w: number; h: number; }
interface Pico extends ObjBase { t: 'pico'; abajo: boolean; mini: boolean; hx: number; hy: number; hw: number; hh: number; }
interface Orbe extends ObjBase { t: 'orbe'; tipo: TipoOrbe; }
interface Pad extends ObjBase { t: 'pad'; tipo: TipoOrbe; }
interface Moneda extends ObjBase { t: 'moneda'; n: number; }
interface PortalModo extends ObjBase { t: 'portal'; tipo: 'modo'; valor: Modo; }
interface PortalGrav extends ObjBase { t: 'portal'; tipo: 'grav'; valor: Gravedad; }
interface PortalVel extends ObjBase { t: 'portal'; tipo: 'vel'; valor: number; }

type Portal = PortalModo | PortalGrav | PortalVel;
type Obj = Bloque | Pico | Orbe | Pad | Moneda | Portal;

// mientras se arma el nivel todavia no tienen x2
type ObjNuevo = Obj extends infer O ? (O extends Obj ? Omit<O, 'x2'> & { x2?: number } : never) : never;

interface Color {
    x: number;
    fondo: string;
    linea: string;
}

interface DefNivel {
    id: string;
    nombre: string;
    dificultad: string;
    estrellas: number;
    bpm: number;
    cancion: string;
    modoInicial?: Modo;
}

interface Nivel extends DefNivel {
    objs: Obj[];
    colores: Color[];
    fin: number;
    monedasTotal: number;
    beatEn(px: number): number;
}

interface Cancion {
    bpm: number;
    raiz: number;
    escala: number[];
    acordes: number[];
    arpegio: number[];
    // desde que beat, hasta que beat y que tan fuerte va
    partes: [number, number, number][];
}

type Efecto = 'muerte' | 'moneda' | 'checkpoint' | 'ganar' | 'clic';

// safari viejito todavia lo trae con otro nombre
interface Window {
    webkitAudioContext?: typeof AudioContext;
}

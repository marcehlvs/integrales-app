import { useState } from "react";
import { M, Soft, Q, R, fm, Pasos, Practica } from "./shared.jsx";

/* ---------- Gráfico genérico: curvas, zonas sombreadas, rectángulos y marcas ---------- */
const W = 640, H = 340, L = 46, Rr = 14, T = 16, B = 30;
const fmt = (t) => String(+t.toFixed(2)).replace(".", ",");
const nice = (span) => {
  const raw = span / 5, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
};
const ticksOf = (lo, hi) => {
  const s = nice(hi - lo), out = [];
  for (let k = Math.ceil(lo / s - 1e-9); k * s <= hi + 1e-9; k++) out.push(+(k * s).toFixed(6));
  return out;
};

/*
  xr: [xmin, xmax]
  curves: [{ fn, color }]
  shades: [{ t, u?, from, to, color, op }]  zona entre t(x) y u(x) (u = 0 si falta)
  rects:  { t, u?, from, to, n }            n franjas verticales, altura = t − u en el punto medio
  marks:  [{ x, text }]                     líneas verticales punteadas
*/
function Plot({ xr, curves = [], shades = [], rects = null, marks = [], label }) {
  const [x0, x1] = xr;
  const N = 240;
  const grid = Array.from({ length: N + 1 }, (_, i) => x0 + ((x1 - x0) * i) / N);
  let lo = 0, hi = 0;
  const fns = [...curves.map((c) => c.fn), ...shades.flatMap((s) => [s.t, s.u].filter(Boolean))];
  fns.forEach((fn) => grid.forEach((x) => {
    const y = fn(x);
    if (Number.isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  }));
  const span = hi - lo || 1;
  const ylo = lo - 0.06 * span, yhi = hi + 0.08 * span;
  const sx = (x) => L + ((x - x0) / (x1 - x0)) * (W - L - Rr);
  const sy = (y) => H - B - ((y - ylo) / (yhi - ylo)) * (H - B - T);

  const path = (fn) => {
    let d = "", pen = false;
    for (let i = 0; i <= 200; i++) {
      const x = x0 + ((x1 - x0) * i) / 200, y = fn(x);
      if (!Number.isFinite(y)) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const poly = (s) => {
    const n = 120, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const x = s.from + ((s.to - s.from) * i) / n;
      top.push(`${sx(x).toFixed(1)},${sy(s.t(x)).toFixed(1)}`);
      bot.push(`${sx(x).toFixed(1)},${sy(s.u ? s.u(x) : 0).toFixed(1)}`);
    }
    return [...top, ...bot.reverse()].join(" ");
  };
  const strips = [];
  if (rects && rects.n > 0) {
    const dx = (rects.to - rects.from) / rects.n;
    for (let i = 0; i < rects.n; i++) {
      const xm = rects.from + (i + 0.5) * dx;
      const yt = rects.t(xm), yb = rects.u ? rects.u(xm) : 0;
      strips.push({ x: sx(rects.from + i * dx), w: sx(rects.from + (i + 1) * dx) - sx(rects.from + i * dx), y: sy(Math.max(yt, yb)), h: Math.abs(sy(yt) - sy(yb)) });
    }
  }
  const xt = ticksOf(x0, x1), yt = ticksOf(ylo, yhi);
  return (
    <svg className="g" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {yt.map((t) => (
        <g key={"y" + t}>
          <line x1={L} x2={W - Rr} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
          <text x={L - 6} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="var(--fg)">{fmt(t)}</text>
        </g>
      ))}
      {xt.map((t) => (
        <g key={"x" + t}>
          <line x1={sx(t)} x2={sx(t)} y1={T} y2={H - B} stroke="var(--line)" />
          <text x={sx(t)} y={H - B + 17} textAnchor="middle" fontSize="12" fill="var(--fg)">{fmt(t)}</text>
        </g>
      ))}
      {shades.map((s, i) => <polygon key={i} points={poly(s)} fill={s.color} fillOpacity={s.op ?? 0.4} />)}
      {strips.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill="var(--bar)" fillOpacity=".35" stroke="var(--bar)" strokeWidth={rects.n <= 40 ? 1 : 0} />
      ))}
      <line x1={L} x2={W - Rr} y1={sy(0)} y2={sy(0)} stroke="var(--fg)" strokeWidth="2" />
      <line x1={x0 <= 0 && x1 >= 0 ? sx(0) : L} x2={x0 <= 0 && x1 >= 0 ? sx(0) : L} y1={T} y2={H - B} stroke="var(--fg)" strokeWidth="2" />
      {marks.map((m) => (
        <g key={m.x}>
          <line x1={sx(m.x)} x2={sx(m.x)} y1={T} y2={H - B} stroke="var(--fg)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={sx(m.x)} y={T + 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg)">{m.text}</text>
        </g>
      ))}
      {curves.map((c, i) => <path key={i} d={path(c.fn)} fill="none" stroke={c.color} strokeWidth="3" />)}
    </svg>
  );
}

const Ley = ({ items }) => (
  <div className="leyenda">
    {items.map((q) => <span key={q.t}><i style={{ background: q.c }} />{q.t}</span>)}
  </div>
);

const CF = "var(--curve)", CG = "var(--g)", CH = "var(--fg)";

/* ---------- Ejemplos resueltos ---------- */
const EJEMPLOS = [
  {
    fs: "f(x) = −x² + 4x", gs: "g(x) = x", f: (x) => -x * x + 4 * x, g: (x) => x, a: 0, b: 3, xr: [-0.5, 4.2], A: 4.5,
    cf: R`\int_0^3 (-x^2+4x)\,dx=9`, cg: R`\int_0^3 x\,dx=\tfrac{9}{2}`, ce: R`9-\tfrac{9}{2}=\tfrac{9}{2}=4{,}5`,
    enun: R`Calculá el área encerrada entre $f(x)=-x^2+4x$ y $g(x)=x$.`,
    pasos: [
      { t: "Hallar los puntos de corte: igualamos $f(x)=g(x)$.", m: R`$$-x^2+4x=x\;\Rightarrow\;-x^2+3x=0\;\Rightarrow\;x(3-x)=0\;\Rightarrow\;x=0\ \text{ó}\ x=3$$` },
      { t: "Ver cuál función va arriba entre los cortes (probamos un punto, por ejemplo $x=1$).", m: R`$$f(1)=3\qquad g(1)=1\qquad\Rightarrow\ f\text{ está arriba}$$` },
      { t: "Restar: arriba − abajo.", m: R`$$h(x)=f(x)-g(x)=-x^2+4x-x=-x^2+3x$$` },
      { t: "Integrar $h$ entre los cortes con la regla de Barrow.", m: R`$$\int_0^3(-x^2+3x)\,dx=\Big[-\tfrac{x^3}{3}+\tfrac{3x^2}{2}\Big]_0^3=\Big(-9+\tfrac{27}{2}\Big)-0=\tfrac{9}{2}$$` },
    ],
  },
  {
    fs: "f(x) = √x", gs: "g(x) = x²", f: Math.sqrt, g: (x) => x * x, a: 0, b: 1, xr: [-0.2, 1.4], A: 1 / 3,
    cf: R`\int_0^1 \sqrt{x}\,dx=\tfrac{2}{3}`, cg: R`\int_0^1 x^2\,dx=\tfrac{1}{3}`, ce: R`\tfrac{2}{3}-\tfrac{1}{3}=\tfrac{1}{3}\approx 0{,}333`,
    enun: R`Calculá el área encerrada entre $f(x)=\sqrt{x}$ y $g(x)=x^2$.`,
    pasos: [
      { t: "Hallar los puntos de corte: igualamos $f(x)=g(x)$.", m: R`$$\sqrt{x}=x^2\;\Rightarrow\;x=x^4\;\Rightarrow\;x(1-x^3)=0\;\Rightarrow\;x=0\ \text{ó}\ x=1$$` },
      { t: "Ver cuál función va arriba (probamos $x=\\tfrac12$).", m: R`$$f(\tfrac12)\approx 0{,}71\qquad g(\tfrac12)=0{,}25\qquad\Rightarrow\ f\text{ está arriba}$$` },
      { t: "Restar: arriba − abajo.", m: R`$$h(x)=\sqrt{x}-x^2=x^{1/2}-x^2$$` },
      { t: "Integrar $h$ entre los cortes.", m: R`$$\int_0^1\big(x^{1/2}-x^2\big)\,dx=\Big[\tfrac{2}{3}x^{3/2}-\tfrac{x^3}{3}\Big]_0^1=\tfrac{2}{3}-\tfrac{1}{3}=\tfrac{1}{3}$$` },
    ],
  },
];

const VISTAS = [
  ["curvas", "Las dos curvas"],
  ["bajoF", "Área bajo f"],
  ["bajoG", "Área bajo g"],
  ["entre", "Área entre las curvas"],
  ["dif", "Diferencia f − g"],
];

function Ejemplo() {
  const [k, setK] = useState(0);
  const [vista, setVista] = useState("curvas");
  const [n, setN] = useState(0);
  const e = EJEMPLOS[k];
  const h = (x) => e.f(x) - e.g(x);
  const curves = [{ fn: e.f, color: CF }, { fn: e.g, color: CG }];
  const shades = [];
  if (vista === "bajoF") shades.push({ t: e.f, from: e.a, to: e.b, color: CF, op: 0.28 });
  if (vista === "bajoG") shades.push({ t: e.g, from: e.a, to: e.b, color: CG, op: 0.28 });
  if (vista === "entre" || vista === "dif") shades.push({ t: e.f, u: e.g, from: e.a, to: e.b, color: "var(--bar)", op: 0.45 });
  const verRects = (vista === "entre" || vista === "dif") && n > 0;
  const sum = (() => {
    const dx = (e.b - e.a) / n;
    let s = 0;
    for (let i = 0; i < n; i++) s += h(e.a + (i + 0.5) * dx) * dx;
    return s;
  })();
  const marks = vista === "curvas" ? [] : [{ x: e.a, text: "a" }, { x: e.b, text: "b" }];
  const caption = { bajoF: e.cf, bajoG: e.cg, entre: e.ce, dif: e.ce }[vista];
  return (
    <div>
      <div className="row">
        {EJEMPLOS.map((q, i) => (
          <button key={i} className={"chip" + (i === k ? " on" : "")} onClick={() => { setK(i); setN(0); }}>Ejemplo {i + 1}</button>
        ))}
      </div>
      <p><M t={e.enun} /></p>
      <div className="row">
        {VISTAS.map(([id, t]) => (
          <button key={id} className={"chip" + (id === vista ? " on" : "")} onClick={() => setVista(id)}>{t}</button>
        ))}
      </div>
      <Plot xr={e.xr} curves={curves} shades={shades} marks={marks}
        rects={verRects ? { t: e.f, u: e.g, from: e.a, to: e.b, n } : null}
        label={`Gráfico de ${e.fs} y ${e.gs}`} />
      <Ley items={[{ t: e.fs, c: CF }, { t: e.gs, c: CG }]} />
      {caption && <Soft t={`$$${caption}$$`} />}
      {vista === "dif" && (
        <>
          <p><M t={R`Si restamos las dos funciones, $h(x)=f(x)-g(x)$, el <b>área entre las curvas</b> es exactamente el <b>área bajo $h$</b>:`} /></p>
          <Plot xr={e.xr} curves={[{ fn: h, color: CH }]} shades={[{ t: h, from: e.a, to: e.b, color: "var(--bar)", op: 0.45 }]}
            rects={verRects ? { t: h, from: e.a, to: e.b, n } : null} marks={marks} label="Gráfico de la diferencia f menos g" />
          <Ley items={[{ t: "h(x) = f(x) − g(x)", c: CH }]} />
        </>
      )}
      {(vista === "entre" || vista === "dif") && (
        <>
          <label>Franjas verticales de altura f(x) − g(x): <b>{n === 0 ? "ninguna" : n}</b>
            <input type="range" min="0" max="40" value={n} onChange={(ev) => setN(+ev.target.value)} />
          </label>
          {n > 0 && (
            <div className="stats">
              <div><small>Suma de franjas</small><b>{fm(sum)}</b></div>
              <div><small>Área exacta</small><b>{fm(e.A)}</b></div>
              <div><small>Error</small><b>{fm(Math.abs(sum - e.A))}</b></div>
            </div>
          )}
        </>
      )}
      <h3>Paso a paso</h3>
      <Pasos items={e.pasos} />
    </div>
  );
}

/* ---------- Ejercicios con gráficos opcionales ---------- */
const EJ = [
  {
    fs: "f(x) = x + 2", gs: "g(x) = x²", f: (x) => x + 2, g: (x) => x * x, xr: [-1.8, 2.6], cortes: [-1, 2],
    enun: R`Calculá el área encerrada entre $f(x)=x+2$ y $g(x)=x^2$ (se cortan en dos puntos).`,
    arriba: 0,
    h: [R`h(x)=x+2-x^2`, R`h(x)=x^2-x-2`, R`h(x)=x^2+x+2`], hOk: 0,
    H: [R`H(x)=\tfrac{x^2}{2}+2x+\tfrac{x^3}{3}`, R`H(x)=1-2x`, R`H(x)=\tfrac{x^2}{2}+2x-\tfrac{x^3}{3}`], HOk: 2,
    r: 4.5,
    pista: R`Los cortes salen de $x+2=x^2$, o sea $x^2-x-2=0$.`,
    sol: [
      R`$$x+2=x^2\Rightarrow x^2-x-2=0\Rightarrow x=-1\ \text{ó}\ x=2\qquad f(0)=2>g(0)=0\Rightarrow f\text{ arriba}$$`,
      R`$$h(x)=x+2-x^2\qquad H(x)=\tfrac{x^2}{2}+2x-\tfrac{x^3}{3}$$`,
      R`$$H(2)=2+4-\tfrac{8}{3}=\tfrac{10}{3}\qquad H(-1)=\tfrac12-2+\tfrac13=-\tfrac76\qquad A=\tfrac{10}{3}+\tfrac{7}{6}=\tfrac{9}{2}=4{,}5$$`,
    ],
  },
  {
    fs: "f(x) = 4 − x²", gs: "g(x) = x² − 4", f: (x) => 4 - x * x, g: (x) => x * x - 4, xr: [-2.8, 2.8], cortes: [-2, 2],
    enun: R`Calculá el área encerrada entre $f(x)=4-x^2$ y $g(x)=x^2-4$.`,
    arriba: 0,
    h: [R`h(x)=8-2x^2`, R`h(x)=-2x^2`, R`h(x)=2x^2-8`], hOk: 0,
    H: [R`H(x)=8-4x`, R`H(x)=8x+\tfrac{2x^3}{3}`, R`H(x)=8x-\tfrac{2x^3}{3}`], HOk: 2,
    r: 64 / 3,
    pista: R`Cuidado al restar: $g$ tiene un $-4$, y $f-g$ lo cambia de signo.`,
    sol: [
      R`$$4-x^2=x^2-4\Rightarrow 8=2x^2\Rightarrow x=\pm 2\qquad f(0)=4>g(0)=-4\Rightarrow f\text{ arriba}$$`,
      R`$$h(x)=(4-x^2)-(x^2-4)=8-2x^2\qquad H(x)=8x-\tfrac{2x^3}{3}$$`,
      R`$$H(2)=16-\tfrac{16}{3}=\tfrac{32}{3}\qquad H(-2)=-\tfrac{32}{3}\qquad A=\tfrac{64}{3}\approx 21{,}33$$`,
    ],
  },
  {
    fs: "f(x) = x²", gs: "g(x) = x³", f: (x) => x * x, g: (x) => x ** 3, xr: [-0.3, 1.3], cortes: [0, 1],
    enun: R`Calculá el área encerrada entre $f(x)=x^2$ y $g(x)=x^3$.`,
    arriba: 0,
    h: [R`h(x)=x^3-x^2`, R`h(x)=x^2-x^3`, R`h(x)=x^2+x^3`], hOk: 1,
    H: [R`H(x)=\tfrac{x^3}{3}+\tfrac{x^4}{4}`, R`H(x)=2x-3x^2`, R`H(x)=\tfrac{x^3}{3}-\tfrac{x^4}{4}`], HOk: 2,
    r: 1 / 12,
    pista: R`Entre 0 y 1, una potencia mayor da un número más chico: $x^3<x^2$.`,
    sol: [
      R`$$x^2=x^3\Rightarrow x^2(1-x)=0\Rightarrow x=0\ \text{ó}\ x=1\qquad f(0{,}5)=0{,}25>g(0{,}5)=0{,}125\Rightarrow f\text{ arriba}$$`,
      R`$$h(x)=x^2-x^3\qquad H(x)=\tfrac{x^3}{3}-\tfrac{x^4}{4}$$`,
      R`$$A=H(1)-H(0)=\tfrac13-\tfrac14=\tfrac{1}{12}\approx 0{,}0833$$`,
    ],
  },
  {
    fs: "f(x) = x² + 2", gs: "g(x) = x", f: (x) => x * x + 2, g: (x) => x, xr: [-0.6, 3.4], limites: [0, 3],
    enun: R`Calculá el área entre $f(x)=x^2+2$ y $g(x)=x$, desde $x=0$ hasta $x=3$ (los límites ya vienen dados).`,
    arriba: 0,
    h: [R`h(x)=x-x^2-2`, R`h(x)=x^2+x+2`, R`h(x)=x^2-x+2`], hOk: 2,
    H: [R`H(x)=\tfrac{x^3}{3}-\tfrac{x^2}{2}+2x`, R`H(x)=2x-1`, R`H(x)=\tfrac{x^3}{3}+\tfrac{x^2}{2}+2x`], HOk: 0,
    r: 10.5,
    pista: R`Mirá el gráfico: ¿las curvas se cortan entre $0$ y $3$? Si no se cortan, no hay que partir la integral.`,
    sol: [
      R`$$f(1)=3>g(1)=1\Rightarrow f\text{ arriba (y }x^2-x+2>0\text{ siempre, no se cortan)}$$`,
      R`$$h(x)=x^2+2-x=x^2-x+2\qquad H(x)=\tfrac{x^3}{3}-\tfrac{x^2}{2}+2x$$`,
      R`$$H(3)=9-\tfrac92+6=\tfrac{21}{2}\qquad H(0)=0\qquad A=\tfrac{21}{2}=10{,}5$$`,
    ],
  },
];

function EjArea({ e, i }) {
  const [verC, setVerC] = useState(true);
  const [verR, setVerR] = useState(false);
  const [verD, setVerD] = useState(false);
  const [a, b] = e.cortes || e.limites;
  const h = (x) => e.f(x) - e.g(x);
  const marks = verR ? [{ x: a, text: "a" }, { x: b, text: "b" }] : [];
  const campos = [];
  if (e.cortes) {
    campos.push({ k: "a", tipo: "num", legend: R`Punto de corte de la izquierda, $a$`, ok: a });
    campos.push({ k: "b", tipo: "num", legend: R`Punto de corte de la derecha, $b$`, ok: b });
  }
  campos.push(
    { k: "top", tipo: "op", legend: "¿Qué función va arriba entre $a$ y $b$?", ops: ["f(x)", "g(x)"], ok: e.arriba },
    { k: "h", tipo: "op", legend: "Diferencia (arriba − abajo)", ops: e.h, ok: e.hOk },
    { k: "H", tipo: "op", legend: R`Primitiva de $h$`, ops: e.H, ok: e.HOk },
    { k: "r", tipo: "num", legend: R`Área: $H(b)-H(a)$`, ok: e.r },
  );
  return (
    <Practica i={i} enun={e.enun} campos={campos} sol={e.sol} pista={e.pista}>
      <div className="row">
        <button className={"chip" + (verC ? " on" : "")} aria-pressed={verC} onClick={() => setVerC(!verC)}>Gráficas de f y g</button>
        <button className={"chip" + (verR ? " on" : "")} aria-pressed={verR} onClick={() => setVerR(!verR)}>Marcar la región</button>
        <button className={"chip" + (verD ? " on" : "")} aria-pressed={verD} onClick={() => setVerD(!verD)}>Ver f − g</button>
      </div>
      {(verC || verR) && (
        <>
          <Plot xr={e.xr} curves={[{ fn: e.f, color: CF }, { fn: e.g, color: CG }]}
            shades={verR ? [{ t: (x) => Math.max(e.f(x), e.g(x)), u: (x) => Math.min(e.f(x), e.g(x)), from: a, to: b, color: "var(--bar)", op: 0.45 }] : []}
            marks={marks} label={`Gráfico de ${e.fs} y ${e.gs}`} />
          <Ley items={[{ t: e.fs, c: CF }, { t: e.gs, c: CG }]} />
        </>
      )}
      {verD && (
        <>
          <p><M t={R`Esta es la diferencia $h(x)=f(x)-g(x)$. Su área bajo la curva (entre $a$ y $b$) es el área que buscás:`} /></p>
          <Plot xr={e.xr} curves={[{ fn: h, color: CH }]} shades={[{ t: h, from: a, to: b, color: "var(--bar)", op: 0.45 }]}
            marks={[{ x: a, text: "a" }, { x: b, text: "b" }]} label="Gráfico de f menos g" />
          <Ley items={[{ t: "h(x) = f(x) − g(x)", c: CH }]} />
        </>
      )}
    </Practica>
  );
}

/* Curvas que se cruzan dentro del intervalo */
const cruz = { f: (x) => x, g: (x) => x * x };

export default function AreaEntreCurvas() {
  return (
    <>
      <h1>Área entre dos curvas</h1>

      <section className="card">
        <h2>La idea</h2>
        <p><M t={R`Hasta acá calculamos el área entre una curva y el eje $x$. Ahora queremos el área que queda <b>encerrada entre dos curvas</b>, $f$ y $g$, con $f$ arriba de $g$.`} /></p>
        <p>Pensalo como una resta de áreas: al área que hay debajo de la curva de arriba le sacamos el área que hay debajo de la curva de abajo. Lo que sobra es la región entre las dos.</p>
        <Soft t={R`$$A=\int_a^b f(x)\,dx-\int_a^b g(x)\,dx=\int_a^b\big(f(x)-g(x)\big)\,dx$$`} />
        <p>Elegí una vista en el gráfico para ver cada pieza. Con «Diferencia f − g» se ve el truco: restar las funciones primero y calcular una sola integral.</p>
        <Ejemplo />
        <Q>¿qué relación hay entre el área entre las curvas y las dos áreas «bajo f» y «bajo g»? ¿Qué pasaría si se intercambian f y g en la resta?</Q>
        <details><summary>Ver respuesta</summary>
          <p>El área entre las curvas es la resta (área bajo f) − (área bajo g). Si se intercambian, la integral da el mismo número pero con signo negativo: un área nunca es negativa, por eso siempre se resta <b>arriba − abajo</b>.</p>
        </details>
        <details>
          <summary>Ojo: ¿y si las curvas se cruzan?</summary>
          <p><M t={R`Si $f$ y $g$ se cruzan adentro del intervalo, arriba y abajo se intercambian. Hay que partir la integral en cada cruce y restar siempre «la de arriba − la de abajo» en cada tramo. Ejemplo: $f(x)=x$ y $g(x)=x^2$ entre $0$ y $2$ se cruzan en $x=1$.`} /></p>
          <Plot xr={[-0.2, 2.2]} curves={[{ fn: cruz.f, color: CF }, { fn: cruz.g, color: CG }]}
            shades={[{ t: (x) => Math.max(cruz.f(x), cruz.g(x)), u: (x) => Math.min(cruz.f(x), cruz.g(x)), from: 0, to: 2, color: "var(--bar)", op: 0.45 }]}
            marks={[{ x: 1, text: "corte" }]} label="Curvas que se cruzan en x = 1" />
          <Ley items={[{ t: "f(x) = x", c: CF }, { t: "g(x) = x²", c: CG }]} />
          <Soft t={R`$$A=\int_0^1(x-x^2)\,dx+\int_1^2(x^2-x)\,dx=\tfrac16+\tfrac56=1$$`} />
        </details>
      </section>

      <section className="card">
        <h2>Ejercicios</h2>
        <p>Seguí los pasos de los ejemplos: cortes, quién va arriba, restar, integrar. Podés mirar las gráficas, marcar la región y ver la diferencia f − g cuando lo necesites. Podés escribir decimales con coma o fracciones como 9/2.</p>
        {EJ.map((e, i) => <EjArea key={i} e={e} i={i} />)}
      </section>
    </>
  );
}

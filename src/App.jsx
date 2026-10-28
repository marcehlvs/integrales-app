import { useMemo, useRef, useState } from "react";
import katex from "katex";

const R = String.raw;
const fm = (v, d = 4) => v.toFixed(d).replace(".", ",");

/* Renderiza HTML con fórmulas LaTeX: $...$ en línea y $$...$$ en bloque */
const toHtml = (t) =>
  t
    .replace(/\$\$([^$]+)\$\$/g, (_, x) => katex.renderToString(x, { displayMode: true, throwOnError: false }))
    .replace(/\$([^$]+)\$/g, (_, x) => katex.renderToString(x, { throwOnError: false }));
const M = ({ t, as: Tag = "span" }) => <Tag dangerouslySetInnerHTML={{ __html: toHtml(t) }} />;
const Soft = ({ t }) => <div className="soft"><M t={t} /></div>;

const FUNS = {
  x2: { l: "f(x) = x²", f: (x) => x * x, P: (x) => x ** 3 / 3, a: 0, b: 3, y: 9,
    pr: R`F(x)=\frac{x^3}{3}`, eb: R`F(3)=\frac{3^3}{3}=\frac{27}{3}=9`, ea: R`F(0)=\frac{0^3}{3}=0`,
    rs: R`\int_0^3 x^2\,dx=F(3)-F(0)=9-0=9` },
  x3: { l: "f(x) = x³", f: (x) => x ** 3, P: (x) => x ** 4 / 4, a: 0, b: 2, y: 8,
    pr: R`F(x)=\frac{x^4}{4}`, eb: R`F(2)=\frac{2^4}{4}=\frac{16}{4}=4`, ea: R`F(0)=\frac{0^4}{4}=0`,
    rs: R`\int_0^2 x^3\,dx=F(2)-F(0)=4-0=4` },
  sen: { l: "f(x) = sen(x)", f: Math.sin, P: (x) => -Math.cos(x), a: 0, b: Math.PI, y: 1,
    pr: R`F(x)=-\cos x`, eb: R`F(\pi)=-\cos\pi=-(-1)=1`, ea: R`F(0)=-\cos 0=-1`,
    rs: R`\int_0^{\pi}\operatorname{sen}x\,dx=F(\pi)-F(0)=1-(-1)=2` },
  raiz: { l: "f(x) = √x", f: Math.sqrt, P: (x) => (2 / 3) * x ** 1.5, a: 0, b: 4, y: 2,
    pr: R`F(x)=\tfrac{2}{3}x^{3/2}`, eb: R`F(4)=\tfrac{2}{3}\cdot 4^{3/2}=\tfrac{2}{3}\cdot 8=\tfrac{16}{3}`, ea: R`F(0)=\tfrac{2}{3}\cdot 0=0`,
    rs: R`\int_0^4\sqrt{x}\,dx=F(4)-F(0)=\tfrac{16}{3}-0\approx 5{,}333` },
};

/* Tabla del paso 4: suma por derecha de x² entre 0 y 3 con n creciente */
const LIM = [1, 10, 100, 1000].map((k) => ({ k, dx: 3 / k, s: calc(FUNS.x2, k, "d").s }));

/* Ejercicios de Barrow: primitiva (opción correcta = ok), F(b), F(a) y resultado */
const EJ = [
  { f: R`\int_1^3 2x\,dx`, ops: ["2x²", "x²", "2"], ok: 1, fb: 9, fa: 1, r: 8,
    sol: R`$$F(x)=x^2\qquad F(3)=9\qquad F(1)=1\qquad \int_1^3 2x\,dx=9-1=8$$` },
  { f: R`\int_1^2 3x^2\,dx`, ops: ["x³", "3x³", "6x"], ok: 0, fb: 8, fa: 1, r: 7,
    sol: R`$$F(x)=x^3\qquad F(2)=8\qquad F(1)=1\qquad \int_1^2 3x^2\,dx=8-1=7$$` },
  { f: R`\int_1^3 (x+1)\,dx`, ops: ["x² + x", "1", "x²/2 + x"], ok: 2, fb: 7.5, fa: 1.5, r: 6,
    sol: R`$$F(x)=\tfrac{x^2}{2}+x\qquad F(3)=\tfrac{9}{2}+3=7{,}5\qquad F(1)=\tfrac{1}{2}+1=1{,}5\qquad \int_1^3 (x+1)\,dx=7{,}5-1{,}5=6$$` },
];

/* Convierte lo que escribe el alumno: admite coma decimal y fracciones a/b */
function num(s) {
  const t = s.trim().replace(",", ".").replace("−", "-");
  if (!t) return NaN;
  const f = t.split("/");
  if (f.length === 2) return Number(f[0]) / Number(f[1]);
  return f.length === 1 ? Number(t) : NaN;
}

function calc(c, n, m) {
  const dx = (c.b - c.a) / n;
  const r = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x0 = c.a + i * dx;
    const xs = m === "i" ? x0 : m === "d" ? x0 + dx : x0 + dx / 2;
    const h = c.f(xs);
    r.push([x0, dx, h]);
    s += h * dx;
  }
  return { s, r };
}
function minN(c, m, t) {
  const e = c.P(c.b) - c.P(c.a);
  for (let n = 1; n <= 500; n++) if (Math.abs(calc(c, n, m).s - e) < t) return n;
  return null;
}

function Chart({ c, r, n }) {
  const W = 640, H = 340, L = 44, Rr = 16, T = 14, B = 32, top = c.y * 1.1;
  const sx = (x) => L + ((x - c.a) / (c.b - c.a)) * (W - L - Rr);
  const sy = (y) => H - B - (y / top) * (H - T - B);
  /* Con pocos rectángulos, el eje y marca la altura de cada uno (sin pisar rótulos vecinos) */
  let ticks = [0, c.y / 2, c.y];
  if (n <= 10) {
    ticks = [0];
    [...new Set(r.map((q) => +q[2].toFixed(9)))].sort((p, q) => p - q).forEach((h) => {
      if (sy(ticks[ticks.length - 1]) - sy(h) >= 14) ticks.push(h);
    });
  }
  const path = Array.from({ length: 161 }, (_, i) => {
    const x = c.a + ((c.b - c.a) * i) / 160;
    return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(c.f(x)).toFixed(1)}`;
  }).join("");
  return (
    <svg className="g" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico con rectángulos bajo la curva">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - Rr} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
          <text x={L - 6} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="var(--fg)">{String(+t.toFixed(2)).replace(".", ",")}</text>
        </g>
      ))}
      {r.map((q, i) => (
        <rect key={i} x={sx(q[0])} y={sy(q[2])} width={sx(q[0] + q[1]) - sx(q[0])} height={sy(0) - sy(q[2])}
          fill="var(--bar)" fillOpacity=".45" stroke="var(--bar)" strokeWidth={n <= 60 ? 1 : 0} />
      ))}
      <line x1={L} x2={W - Rr} y1={sy(0)} y2={sy(0)} stroke="var(--fg)" strokeWidth="2" />
      <line x1={L} x2={L} y1={T} y2={sy(0)} stroke="var(--fg)" strokeWidth="2" />
      <path d={path} fill="none" stroke="var(--curve)" strokeWidth="3" />
      <text x={sx(c.a)} y={H - 10} textAnchor="middle" fontSize="12" fill="var(--fg)">a = {c.a}</text>
      <text x={sx(c.b)} y={H - 10} textAnchor="end" fontSize="12" fill="var(--fg)">b = {c.b === Math.PI ? "π" : c.b}</text>
    </svg>
  );
}

const Q = ({ children }) => <div className="q"><b>Anotá:</b> {children}</div>;

/* Ejercicio de Barrow con campos para completar y corrección automática */
function Ejercicio({ e, i }) {
  const [v, setV] = useState({ p: "", b: "", a: "", r: "" });
  const [chk, setChk] = useState(false);
  const set = (k) => (ev) => { setV({ ...v, [k]: ev.target.value }); setChk(false); };
  const good = {
    p: v.p !== "" && +v.p === e.ok,
    b: Math.abs(num(v.b) - e.fb) < 0.01,
    a: Math.abs(num(v.a) - e.fa) < 0.01,
    r: Math.abs(num(v.r) - e.r) < 0.01,
  };
  const all = good.p && good.b && good.a && good.r;
  const cls = (k) => (chk ? (good[k] ? "ok" : "bad") : "");
  const mark = (k) => (chk ? (good[k] ? " ✓" : " ✗") : "");
  return (
    <div className="ej">
      <p><b>Ejercicio {i + 1}.</b> Calculá <M t={`$${e.f}$`} /></p>
      <div className="row">
        <label>1. Primitiva{mark("p")}
          <select className={cls("p")} value={v.p} onChange={set("p")}>
            <option value="">Elegí una opción…</option>
            {e.ops.map((o, j) => <option key={j} value={j}>F(x) = {o}</option>)}
          </select>
        </label>
        <label>2. F(b), en el extremo superior{mark("b")}
          <input className={cls("b")} type="text" inputMode="decimal" autoComplete="off" value={v.b} onChange={set("b")} />
        </label>
        <label>2. F(a), en el extremo inferior{mark("a")}
          <input className={cls("a")} type="text" inputMode="decimal" autoComplete="off" value={v.a} onChange={set("a")} />
        </label>
        <label>3. Resultado: F(b) − F(a){mark("r")}
          <input className={cls("r")} type="text" inputMode="decimal" autoComplete="off" value={v.r} onChange={set("r")} />
        </label>
      </div>
      <button onClick={() => setChk(true)}>Comprobar</button>{" "}
      <b className={all && chk ? "good" : ""} aria-live="polite">
        {chk && (all ? "¡Correcto!" : "Revisá los campos marcados con ✗.")}
      </b>
      <details><summary>Ver solución</summary><M as="div" t={`<div class="soft">${e.sol}</div>`} /></details>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [n, setN] = useState(3);
  const [m, setM] = useState("d");
  const [key, setKey] = useState("x2");
  const [tol, setTol] = useState(0.1);
  const [rev, setRev] = useState(false);
  const [rev4, setRev4] = useState(false);
  const top = useRef(null);

  const c = FUNS[key];
  const { s, r } = useMemo(() => calc(c, n, m), [c, n, m]);
  const e = c.P(c.b) - c.P(c.a);
  const er = Math.abs(s - e);
  const ok = er < tol;
  const best = useMemo(() => (step === 7 ? minN(c, m, tol) : null), [c, m, tol, step]);

  const go = (v) => {
    setStep(v);
    if (v === 1) setN(3);
    if (v < 5) setM("d");
    if (v < 6) setKey("x2");
  };
  const next = () => { go(step + 1); top.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const hideExact = (step === 1 && !rev) || (step === 4 && !rev4);

  return (
    <main>
      <h1>Aproximá el área bajo la curva</h1>

      <section className="card">
        <Chart c={c} r={r} n={n} />
        {step >= 2 && (
          <label style={{ marginTop: 8 }}>Cantidad de rectángulos: <b>{n}</b>
            <input type="range" min="1" max="200" value={n} onChange={(ev) => setN(+ev.target.value)} />
          </label>
        )}
        <div className="row">
          {step >= 6 && (
            <label>Función
              <select value={key} onChange={(ev) => setKey(ev.target.value)}>
                {Object.entries(FUNS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
              </select>
            </label>
          )}
          {step >= 5 && (
            <label>Método
              <select value={m} onChange={(ev) => setM(ev.target.value)}>
                <option value="i">Por izquierda</option><option value="d">Por derecha</option><option value="m">Punto medio</option>
              </select>
            </label>
          )}
        </div>
        <div className="stats">
          <div><small>Suma de rectángulos</small><b>{fm(s)}</b></div>
          {!hideExact && <div><small>Área exacta</small><b>{fm(e)}</b></div>}
          {!hideExact && <div><small>Error</small><b className={ok && step === 7 ? "good" : ""}>{fm(er)}</b></div>}
        </div>
      </section>

      <section className="card">
        <div className="progress"><i style={{ width: `${(step / 8) * 100}%` }} /></div>
        <small ref={top}>Paso {step} de 8</small>

        {step === 1 && (<div>
          <h2>Estimá el área</h2>
          <p><M t={R`La curva roja es $f(x)=x^2$. Queremos el área que queda debajo de ella, entre $x=0$ y $x=3$. Como no sabemos calcularla directamente, la <b>estimamos con 3 rectángulos</b> de base 1 (la altura de cada uno es el valor de la función en su borde derecho).`} /></p>
          <Q>calculá el área de cada rectángulo y sumalas. ¿El área real será mayor o menor que esa suma? ¿Por qué?</Q>
          <details onToggle={(ev) => ev.currentTarget.open && setRev(true)}>
            <summary>Ver respuesta</summary>
            <p><M t={R`Alturas: $f(1)=1$, $f(2)=4$, $f(3)=9$. Suma: $1+4+9=14$. El área real es <b>menor</b> (vale 9): como la función crece, cada rectángulo por derecha sobresale de la curva.`} /></p>
          </details>
        </div>)}

        {step === 2 && (<div>
          <h2>Más rectángulos</h2>
          <p>Ahora podés mover el deslizador y cambiar la cantidad de rectángulos.</p>
          <Q>¿qué le pasa a la suma cuando aumenta la cantidad de rectángulos? ¿Hacia qué número parece acercarse? ¿Cuántos rectángulos hacen falta para que el error sea menor que 0,1?</Q>
          <details><summary>Ver respuesta</summary>
            <p>La suma baja y se acerca a 9, el área exacta. El error disminuye cada vez más. Por derecha hacen falta unos 136 rectángulos para bajar de 0,1.</p>
          </details>
        </div>)}

        {step === 3 && (<div>
          <h2>Lo que hiciste se llama integral</h2>
          <p>Estimaste el área con rectángulos cada vez más finos. El valor al que se acerca la suma se llama <b>integral definida</b> y se escribe así:</p>
          <Soft t={R`$$\int_0^3 x^2\,dx = 9$$`} />
          <p><M t={R`Se lee «integral de 0 a 3 de $x^2$ diferencial de $x$». Cada parte tiene un significado:`} /></p>
          <p><M t={R`• $\int$: una «S» alargada, de «suma». • $0$ y $3$: dónde empieza y termina el área. • $x^2$: la función. • $dx$: el ancho, muy pequeño, de cada rectángulo.`} /></p>
          <p><M t={R`En general, con $n$ rectángulos de ancho $\Delta x=\frac{b-a}{n}$:`} /></p>
          <Soft t={R`$$\int_a^b f(x)\,dx=\lim_{n\to\infty}\sum_{i=1}^{n} f(x_i)\,\Delta x$$`} />
          <Q><M t={R`con tus palabras, ¿qué significa $\int_0^3 x^2\,dx$?`} /></Q>
        </div>)}

        {step === 4 && (<div>
          <h2>¿Qué pasa con el límite?</h2>
          <p><M t={R`En el paso 3 apareció $\lim_{n\to\infty}$. Veámoslo funcionar con $f(x)=x^2$ entre $0$ y $3$, con rectángulos por derecha. Mirá cómo cambia la suma cuando $n$ crece:`} /></p>
          <table className="tabla">
            <thead><tr><th>Rectángulos (n)</th><th>Ancho de cada uno</th><th>Suma</th></tr></thead>
            <tbody>
              {LIM.map((q) => <tr key={q.k}><td>{q.k}</td><td>{fm(q.dx, 3)}</td><td><b>{fm(q.s)}</b></td></tr>)}
            </tbody>
          </table>
          <Q><M t={R`mirá la columna «Suma». ¿A qué número tiende cuando $n$ crece? ¿Alguna fila llega a valer exactamente ese número?`} /></Q>
          <details onToggle={(ev) => ev.currentTarget.open && setRev4(true)}>
            <summary>Ver respuesta</summary>
            <p>La suma se acerca cada vez más a 9, pero por derecha nunca llega a valer 9: siempre queda un poquito por encima. Ese número al que se acerca es el <b>límite</b>, y es el valor de la integral.</p>
            <Soft t={R`$$\lim_{n\to\infty}\sum_{i=1}^{n} f(x_i)\,\Delta x=9=\int_0^3 x^2\,dx$$`} />
          </details>
        </div>)}

        {step === 5 && (<div>
          <h2>Comparar métodos</h2>
          <p>Ahora podés elegir de dónde sale la altura de cada rectángulo: del borde izquierdo, del derecho o del punto medio.</p>
          <Q>con 5 rectángulos, ¿qué método da el menor error? ¿Cuál da la suma más grande que el área real y cuál más chica? ¿Por qué?</Q>
          <details><summary>Ver respuesta</summary>
            <p>El punto medio es el más preciso. Con una función creciente, la izquierda queda por debajo del área real y la derecha por encima. El punto medio compensa: lo que sobra de un lado casi tapa lo que falta del otro.</p>
          </details>
        </div>)}

        {step === 6 && (<div>
          <h2>El atajo: regla de Barrow</h2>
          <p><M t={R`Hacer rectángulos sirve para entender, pero hay una forma exacta. Si $F$ es una <b>primitiva</b> de $f$ (es decir $F'(x)=f(x)$), entonces:`} /></p>
          <Soft t={R`$$\int_a^b f(x)\,dx=F(b)-F(a)$$`} />
          <p>Elegí una función arriba. El cálculo siempre tiene tres pasos:</p>
          <ol className="pasos">
            <li><b>Hallar la primitiva.</b><Soft t={`$$${c.pr}$$`} /></li>
            <li><b>Evaluar en <M t="$b$" /> y en <M t="$a$" />.</b><Soft t={`$$${c.eb}$$`} /><Soft t={`$$${c.ea}$$`} /></li>
            <li><b>Restar.</b><Soft t={`$$${c.rs}$$`} /></li>
          </ol>
          <Q>para cada función, verificá que el resultado de Barrow coincide con el «Área exacta» del panel. ¿Cuál es la primitiva de cada una?</Q>
          <h3>Ahora probá vos</h3>
          <p>Seguí los tres pasos en cada ejercicio y tocá «Comprobar». Podés escribir decimales con coma o fracciones como 7/2.</p>
          {EJ.map((e, i) => <Ejercicio key={i} e={e} i={i} />)}
        </div>)}

        {step === 7 && (<div>
          <h2>Desafío</h2>
          <p>Lográ un error menor a{" "}
            {[0.5, 0.1, 0.01].map((t) => (
              <button key={t} className={"chip" + (t === tol ? " on" : "")} onClick={() => setTol(t)}>{fm(t, t < 0.1 ? 2 : 1)}</button>
            ))}{" "}
            usando la menor cantidad de rectángulos. Podés cambiar función y método.</p>
          <p><b className={ok ? "good" : ""} aria-live="polite">
            {ok
              ? n <= best ? `¡Lo lograste con ${n} rectángulos! Es el mínimo posible con este método.` : `Lo lograste con ${n}, pero se puede con menos. Probá bajando el deslizador.`
              : `Todavía no: el error es ${fm(er)} y tiene que ser menor a ${fm(tol, 2)}.`}
          </b></p>
          <p>Pista: cambiá el método y fijate si necesitás menos rectángulos.</p>
        </div>)}

        {step === 8 && (<div>
          <h2>Para profundizar</h2>
          <M as="div" t={R`
<details><summary>Velocidad y distancia</summary><p>Si $v(t)$ es la velocidad de un auto, el área bajo $v$ entre $t=a$ y $t=b$ es la distancia recorrida: $\int_a^b v(t)\,dt$. Con velocidad constante es un solo rectángulo; si cambia, se suman muchos.</p></details>
<details><summary>Propiedades</summary><div class="soft">$$\int_a^b k\,f\,dx=k\int_a^b f\,dx\qquad \int_a^b (f+g)\,dx=\int_a^b f\,dx+\int_a^b g\,dx$$ $$\int_a^c f\,dx=\int_a^b f\,dx+\int_b^c f\,dx\qquad \int_a^a f\,dx=0\qquad \int_b^a f\,dx=-\int_a^b f\,dx$$</div></details>
<details><summary>Área con signo</summary><p>Si $f$ es negativa en algún tramo, la integral resta esa parte. Por eso $\int_0^{2\pi}\operatorname{sen}x\,dx=0$: el área de arriba y la de abajo se cancelan.</p></details>
<details><summary>Ejemplos resueltos</summary><div class="soft">$$\int_0^{\pi}\operatorname{sen}x\,dx=\big[-\cos x\big]_0^{\pi}=1+1=2$$</div><div class="soft">$$\int_0^2 (3x^2+1)\,dx=\big[x^3+x\big]_0^2=8+2=10$$</div></details>
<details><summary>Para practicar</summary><p>Calculá $\int_1^4 2x\,dx$, $\int_0^2 x^3\,dx$ y $\int_0^4\sqrt{x}\,dx$. Respuestas: 15, 4 y $\frac{16}{3}$.</p></details>`} />
        </div>)}

        <div className="nav">
          <button disabled={step === 1} onClick={() => go(step - 1)}>Anterior</button>
          {step < 8 && <button className="primary" onClick={next}>Siguiente</button>}
        </div>
      </section>
    </main>
  );
}
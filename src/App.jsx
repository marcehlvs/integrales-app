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
    t: R`$$F(x)=\frac{x^3}{3}\;\Rightarrow\;\int_0^3 x^2\,dx=\frac{27}{3}-0=9$$` },
  x3: { l: "f(x) = x³", f: (x) => x ** 3, P: (x) => x ** 4 / 4, a: 0, b: 2, y: 8,
    t: R`$$F(x)=\frac{x^4}{4}\;\Rightarrow\;\int_0^2 x^3\,dx=\frac{16}{4}-0=4$$` },
  sen: { l: "f(x) = sen(x)", f: Math.sin, P: (x) => -Math.cos(x), a: 0, b: Math.PI, y: 1,
    t: R`$$F(x)=-\cos x\;\Rightarrow\;\int_0^{\pi}\operatorname{sen}x\,dx=1+1=2$$` },
  raiz: { l: "f(x) = √x", f: Math.sqrt, P: (x) => (2 / 3) * x ** 1.5, a: 0, b: 4, y: 2,
    t: R`$$F(x)=\tfrac{2}{3}x^{3/2}\;\Rightarrow\;\int_0^4\sqrt{x}\,dx=\frac{16}{3}\approx 5{,}333$$` },
};

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
  const path = Array.from({ length: 161 }, (_, i) => {
    const x = c.a + ((c.b - c.a) * i) / 160;
    return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(c.f(x)).toFixed(1)}`;
  }).join("");
  return (
    <svg className="g" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico con rectángulos bajo la curva">
      {[0, c.y / 2, c.y].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - Rr} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
          <text x={L - 6} y={sy(t) + 4} textAnchor="end" fontSize="12" fill="var(--fg)">{Number.isInteger(t) ? t : fm(t, 1)}</text>
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

export default function App() {
  const [step, setStep] = useState(1);
  const [n, setN] = useState(3);
  const [m, setM] = useState("d");
  const [key, setKey] = useState("x2");
  const [tol, setTol] = useState(0.1);
  const [rev, setRev] = useState(false);
  const top = useRef(null);

  const c = FUNS[key];
  const { s, r } = useMemo(() => calc(c, n, m), [c, n, m]);
  const e = c.P(c.b) - c.P(c.a);
  const er = Math.abs(s - e);
  const ok = er < tol;
  const best = useMemo(() => (step === 6 ? minN(c, m, tol) : null), [c, m, tol, step]);

  const go = (v) => {
    setStep(v);
    if (v === 1) { setN(3); setM("d"); }
    if (v < 5) setKey("x2");
  };
  const next = () => { go(step + 1); top.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const hideExact = step === 1 && !rev;

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
          {step >= 5 && (
            <label>Función
              <select value={key} onChange={(ev) => setKey(ev.target.value)}>
                {Object.entries(FUNS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
              </select>
            </label>
          )}
          {step >= 4 && (
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
          {!hideExact && <div><small>Error</small><b className={ok && step === 6 ? "good" : ""}>{fm(er)}</b></div>}
        </div>
      </section>

      <section className="card">
        <div className="progress"><i style={{ width: `${(step / 7) * 100}%` }} /></div>
        <small ref={top}>Paso {step} de 7</small>

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
          <h2>Comparar métodos</h2>
          <p>Ahora podés elegir de dónde sale la altura de cada rectángulo: del borde izquierdo, del derecho o del punto medio.</p>
          <Q>con 5 rectángulos, ¿qué método da el menor error? ¿Cuál da la suma más grande que el área real y cuál más chica? ¿Por qué?</Q>
          <details><summary>Ver respuesta</summary>
            <p>El punto medio es el más preciso. Con una función creciente, la izquierda queda por debajo del área real y la derecha por encima. El punto medio compensa: lo que sobra de un lado casi tapa lo que falta del otro.</p>
          </details>
        </div>)}

        {step === 5 && (<div>
          <h2>El atajo: regla de Barrow</h2>
          <p><M t={R`Hacer rectángulos sirve para entender, pero hay una forma exacta. Si $F$ es una <b>primitiva</b> de $f$ (es decir $F'(x)=f(x)$), entonces:`} /></p>
          <Soft t={R`$$\int_a^b f(x)\,dx=F(b)-F(a)$$`} />
          <p>Elegí una función arriba y mirá el cálculo:</p>
          <Soft t={c.t} />
          <Q>para cada función, verificá que el resultado de Barrow coincide con el «Área exacta» del panel. ¿Cuál es la primitiva de cada una?</Q>
        </div>)}

        {step === 6 && (<div>
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

        {step === 7 && (<div>
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
          {step < 7 && <button className="primary" onClick={next}>Siguiente</button>}
        </div>
      </section>
    </main>
  );
}

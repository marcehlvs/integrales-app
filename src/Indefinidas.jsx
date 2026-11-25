import { useState } from "react";
import { M, Soft, Q, R, Pasos, Practica } from "./shared.jsx";

const sen = R`\operatorname{sen}`;

/* ======================= SUSTITUCIÓN ======================= */
const S_EJEMPLOS = [
  {
    f: R`\int 2x\,(x^2+1)^4\,dx`,
    pasos: [
      { t: "Elegimos $u$: lo de adentro del paréntesis.", m: R`$$u=x^2+1$$` },
      { t: "Derivamos $u$ para obtener $du$.", m: R`$$du=2x\,dx\qquad\text{(justo aparece }2x\,dx\text{ en la integral)}$$` },
      { t: "Reescribimos todo en términos de $u$.", m: R`$$\int u^4\,du$$` },
      { t: "Integramos con la tabla.", m: R`$$\frac{u^5}{5}+C$$` },
      { t: "Volvemos a $x$.", m: R`$$\frac{(x^2+1)^5}{5}+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\frac{(x^2+1)^5}{5}=\frac{5\,(x^2+1)^4\cdot 2x}{5}=2x\,(x^2+1)^4\ \checkmark$$`,
  },
  {
    f: R`\int \cos(3x)\,dx`,
    pasos: [
      { t: "Elegimos $u$: lo de adentro del coseno.", m: R`$$u=3x$$` },
      { t: "Derivamos. Como en la integral no está el $3$, despejamos $dx$.", m: R`$$du=3\,dx\ \Rightarrow\ dx=\frac{du}{3}$$` },
      { t: "Reescribimos. El $\\tfrac13$ sale fuera de la integral.", m: R`$$\int\cos u\cdot\frac{du}{3}=\frac13\int\cos u\,du$$` },
      { t: "Integramos.", m: R`$$\frac13\,\operatorname{sen}u+C$$` },
      { t: "Volvemos a $x$.", m: R`$$\frac{\operatorname{sen}(3x)}{3}+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\frac{\operatorname{sen}(3x)}{3}=\frac{\cos(3x)\cdot 3}{3}=\cos(3x)\ \checkmark$$`,
  },
  {
    f: R`\int x\,e^{x^2}\,dx`,
    pasos: [
      { t: "Elegimos $u$: el exponente.", m: R`$$u=x^2$$` },
      { t: "Derivamos y despejamos lo que sobra: en la integral hay $x\\,dx$ pero no $2x\\,dx$.", m: R`$$du=2x\,dx\ \Rightarrow\ x\,dx=\frac{du}{2}$$` },
      { t: "Reescribimos.", m: R`$$\int e^u\cdot\frac{du}{2}=\frac12\int e^u\,du$$` },
      { t: "Integramos.", m: R`$$\frac12\,e^u+C$$` },
      { t: "Volvemos a $x$.", m: R`$$\frac{e^{x^2}}{2}+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\frac{e^{x^2}}{2}=\frac{e^{x^2}\cdot 2x}{2}=x\,e^{x^2}\ \checkmark$$`,
  },
];

const S_EJ = [
  {
    enun: R`Calculá $\int 3x^2\,(x^3+5)^2\,dx$.`,
    pista: R`Probá con lo de adentro del paréntesis. ¿Su derivada aparece multiplicando?`,
    u: [R`u=3x^2`, R`u=x^3+5`, R`u=(x^3+5)^2`], uOk: 1,
    du: [R`du=x^3\,dx`, R`du=3x^2\,dx`, R`du=(3x^2+5)\,dx`], duOk: 1,
    r: [R`(x^3+5)^3+C`, R`\frac{(x^3+5)^3}{9}+C`, R`\frac{(x^3+5)^3}{3}+C`, R`\frac{(x^3+5)^2}{2}+C`], rOk: 2,
    sol: [
      R`$$u=x^3+5\qquad du=3x^2\,dx\qquad\int u^2\,du=\frac{u^3}{3}+C=\frac{(x^3+5)^3}{3}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\frac{(x^3+5)^3}{3}=\frac{3(x^3+5)^2\cdot 3x^2}{3}=3x^2(x^3+5)^2\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int ${sen}(2x)\,dx$.`,
    pista: R`Es como el ejemplo del $\cos(3x)$: falta una constante y hay que despejar $dx$.`,
    u: [R`u=${sen}\,x`, R`u=2x`, R`u=x`], uOk: 1,
    du: [R`du=\cos(2x)\,dx`, R`du=\tfrac12\,dx`, R`du=2\,dx`], duOk: 2,
    r: [R`-\cos(2x)+C`, R`-\frac{\cos(2x)}{2}+C`, R`\frac{\cos(2x)}{2}+C`, R`2\cos(2x)+C`], rOk: 1,
    sol: [
      R`$$u=2x\qquad du=2\,dx\Rightarrow dx=\tfrac{du}{2}\qquad\int${sen}\,u\cdot\tfrac{du}{2}=-\tfrac12\cos u+C=-\frac{\cos(2x)}{2}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\Big(-\frac{\cos(2x)}{2}\Big)=\frac{${sen}(2x)\cdot 2}{2}=${sen}(2x)\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int x\sqrt{x^2+1}\,dx$.`,
    pista: R`Elegí lo que está adentro de la raíz. Va a sobrar un factor $\tfrac12$.`,
    u: [R`u=x`, R`u=x^2+1`, R`u=x\sqrt{x^2+1}`], uOk: 1,
    du: [R`du=x\,dx`, R`du=2x\,dx`, R`du=\frac{x}{\sqrt{x^2+1}}\,dx`], duOk: 1,
    r: [R`\frac{2}{3}(x^2+1)^{3/2}+C`, R`\frac{1}{3}(x^2+1)^{3/2}+C`, R`\frac{(x^2+1)^{3/2}}{2}+C`, R`\frac{x^2}{3}\sqrt{x^2+1}+C`], rOk: 1,
    sol: [
      R`$$u=x^2+1\qquad du=2x\,dx\Rightarrow x\,dx=\tfrac{du}{2}\qquad\int\sqrt{u}\,\tfrac{du}{2}=\tfrac12\cdot\tfrac23\,u^{3/2}+C=\tfrac13(x^2+1)^{3/2}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\tfrac13(x^2+1)^{3/2}=\tfrac13\cdot\tfrac32(x^2+1)^{1/2}\cdot 2x=x\sqrt{x^2+1}\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int \dfrac{2x}{x^2+1}\,dx$.`,
    pista: R`Con la tabla: $\int \tfrac{1}{u}\,du=\ln|u|+C$. Acá $x^2+1$ siempre es positivo.`,
    u: [R`u=2x`, R`u=x^2+1`, R`u=\frac{2x}{x^2+1}`], uOk: 1,
    du: [R`du=2x\,dx`, R`du=x^2\,dx`, R`du=\frac{1}{x^2+1}\,dx`], duOk: 0,
    r: [R`\frac{\ln(x^2+1)}{2}+C`, R`2x\ln(x^2+1)+C`, R`\ln(x^2+1)+C`, R`-\frac{1}{x^2+1}+C`], rOk: 2,
    sol: [
      R`$$u=x^2+1\qquad du=2x\,dx\qquad\int\frac{du}{u}=\ln|u|+C=\ln(x^2+1)+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\ln(x^2+1)=\frac{2x}{x^2+1}\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int \cos x\,${sen}^3x\,dx$.`,
    pista: R`Mirá cuál de las dos funciones es la derivada de la otra.`,
    u: [R`u=${sen}\,x`, R`u=\cos x`, R`u=${sen}^3x`], uOk: 0,
    du: [R`du=-${sen}\,x\,dx`, R`du=\cos x\,dx`, R`du=3\,${sen}^2x\,dx`], duOk: 1,
    r: [R`\frac{${sen}^4x}{4}+C`, R`\frac{\cos^4x}{4}+C`, R`${sen}^4x+C`, R`-\frac{${sen}^4x}{4}+C`], rOk: 0,
    sol: [
      R`$$u=${sen}\,x\qquad du=\cos x\,dx\qquad\int u^3\,du=\frac{u^4}{4}+C=\frac{${sen}^4x}{4}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\frac{${sen}^4x}{4}=\frac{4\,${sen}^3x\cos x}{4}=\cos x\,${sen}^3x\ \checkmark$$`,
    ],
  },
];

/* ======================= POR PARTES ======================= */
const P_EJEMPLOS = [
  {
    f: R`\int x\,e^x\,dx`,
    pasos: [
      { t: "Elegimos $u$ (se simplifica al derivar) y $dv$ (sabemos integrarlo).", m: R`$$u=x\qquad dv=e^x\,dx$$` },
      { t: "Derivamos $u$ e integramos $dv$.", m: R`$$du=dx\qquad v=e^x$$` },
      { t: "Aplicamos la fórmula $\\int u\\,dv=uv-\\int v\\,du$.", m: R`$$\int x\,e^x\,dx=x\,e^x-\int e^x\,dx$$` },
      { t: "Resolvemos la integral que quedó (ya es de tabla).", m: R`$$=x\,e^x-e^x+C=e^x(x-1)+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\big[e^x(x-1)\big]=e^x(x-1)+e^x=x\,e^x\ \checkmark$$`,
  },
  {
    f: R`\int x\cos x\,dx`,
    pasos: [
      { t: "Elegimos $u$ y $dv$.", m: R`$$u=x\qquad dv=\cos x\,dx$$` },
      { t: "Derivamos $u$ e integramos $dv$.", m: R`$$du=dx\qquad v=${sen}\,x$$` },
      { t: "Aplicamos la fórmula.", m: R`$$\int x\cos x\,dx=x\,${sen}\,x-\int ${sen}\,x\,dx$$` },
      { t: "Resolvemos la integral que quedó.", m: R`$$=x\,${sen}\,x+\cos x+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\big[x\,${sen}\,x+\cos x\big]=${sen}\,x+x\cos x-${sen}\,x=x\cos x\ \checkmark$$`,
  },
  {
    f: R`\int \ln x\,dx`,
    pasos: [
      { t: "No parece un producto, pero lo es: $\\ln x\\cdot 1$. Elegimos $u=\\ln x$ porque no sabemos integrarlo, pero sí derivarlo.", m: R`$$u=\ln x\qquad dv=dx$$` },
      { t: "Derivamos $u$ e integramos $dv$.", m: R`$$du=\frac{1}{x}\,dx\qquad v=x$$` },
      { t: "Aplicamos la fórmula.", m: R`$$\int\ln x\,dx=x\ln x-\int x\cdot\frac1x\,dx=x\ln x-\int 1\,dx$$` },
      { t: "Resolvemos.", m: R`$$=x\ln x-x+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\big[x\ln x-x\big]=\ln x+x\cdot\frac1x-1=\ln x\ \checkmark$$`,
  },
  {
    f: R`\int x^2 e^x\,dx`,
    pasos: [
      { t: "Elegimos $u$ y $dv$. Ahora $u=x^2$ tiene que bajar de grado dos veces.", m: R`$$u=x^2\qquad dv=e^x\,dx$$` },
      { t: "Derivamos $u$ e integramos $dv$.", m: R`$$du=2x\,dx\qquad v=e^x$$` },
      { t: "Aplicamos la fórmula. Queda una integral más simple, pero todavía con producto.", m: R`$$\int x^2e^x\,dx=x^2e^x-2\int x\,e^x\,dx$$` },
      { t: "Esa integral es el Ejemplo 1: la resolvemos otra vez por partes.", m: R`$$\int x\,e^x\,dx=e^x(x-1)+C$$` },
      { t: "Reemplazamos.", m: R`$$=x^2e^x-2e^x(x-1)+C=e^x(x^2-2x+2)+C$$` },
    ],
    ver: R`$$\frac{d}{dx}\big[e^x(x^2-2x+2)\big]=e^x(x^2-2x+2)+e^x(2x-2)=x^2e^x\ \checkmark$$`,
  },
];

const P_EJ = [
  {
    enun: R`Calculá $\int x\,${sen}\,x\,dx$.`,
    pista: R`Elegí como $u$ la parte que se simplifica al derivar.`,
    u: [R`u=${sen}\,x`, R`u=x`, R`u=x\,${sen}\,x`], uOk: 1,
    dv: [R`dv=x\,dx`, R`dv=dx`, R`dv=${sen}\,x\,dx`], dvOk: 2,
    du: [R`du=\cos x\,dx`, R`du=dx`, R`du=x\,dx`], duOk: 1,
    v: [R`v=\cos x`, R`v=-\cos x`, R`v=${sen}\,x`], vOk: 1,
    r: [R`x\cos x-${sen}\,x+C`, R`-x\cos x-${sen}\,x+C`, R`-x\cos x+${sen}\,x+C`, R`x\,${sen}\,x+\cos x+C`], rOk: 2,
    sol: [
      R`$$u=x\quad dv=${sen}\,x\,dx\quad du=dx\quad v=-\cos x$$`,
      R`$$\int x\,${sen}\,x\,dx=-x\cos x-\int(-\cos x)\,dx=-x\cos x+${sen}\,x+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\big[-x\cos x+${sen}\,x\big]=-\cos x+x\,${sen}\,x+\cos x=x\,${sen}\,x\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int x\,e^{2x}\,dx$.`,
    pista: R`Al integrar $e^{2x}$ aparece un $\tfrac12$ (es como la sustitución $u=2x$).`,
    u: [R`u=e^{2x}`, R`u=x\,e^{2x}`, R`u=x`], uOk: 2,
    dv: [R`dv=e^{2x}\,dx`, R`dv=x\,dx`, R`dv=2e^{2x}\,dx`], dvOk: 0,
    du: [R`du=x\,dx`, R`du=dx`, R`du=2\,dx`], duOk: 1,
    v: [R`v=e^{2x}`, R`v=2e^{2x}`, R`v=\frac{e^{2x}}{2}`], vOk: 2,
    r: [R`x\,e^{2x}-e^{2x}+C`, R`\frac{x\,e^{2x}}{2}-\frac{e^{2x}}{4}+C`, R`\frac{x\,e^{2x}}{2}-\frac{e^{2x}}{2}+C`, R`2x\,e^{2x}-2e^{2x}+C`], rOk: 1,
    sol: [
      R`$$u=x\quad dv=e^{2x}\,dx\quad du=dx\quad v=\tfrac{e^{2x}}{2}$$`,
      R`$$\int x\,e^{2x}\,dx=\frac{x\,e^{2x}}{2}-\int\frac{e^{2x}}{2}\,dx=\frac{x\,e^{2x}}{2}-\frac{e^{2x}}{4}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\Big[\frac{x\,e^{2x}}{2}-\frac{e^{2x}}{4}\Big]=\frac{e^{2x}}{2}+x\,e^{2x}-\frac{e^{2x}}{2}=x\,e^{2x}\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int x\ln x\,dx$.`,
    pista: R`El logaritmo no se integra fácil, pero sí se deriva: ponelo como $u$.`,
    u: [R`u=x`, R`u=\ln x`, R`u=x\ln x`], uOk: 1,
    dv: [R`dv=\ln x\,dx`, R`dv=dx`, R`dv=x\,dx`], dvOk: 2,
    du: [R`du=dx`, R`du=\frac{1}{x}\,dx`, R`du=x\,dx`], duOk: 1,
    v: [R`v=\frac{x^2}{2}`, R`v=1`, R`v=x^2`], vOk: 0,
    r: [R`\frac{x^2}{2}\ln x+\frac{x^2}{4}+C`, R`\frac{x^2}{2}\ln x-\frac{x^2}{2}+C`, R`x\ln x-x+C`, R`\frac{x^2}{2}\ln x-\frac{x^2}{4}+C`], rOk: 3,
    sol: [
      R`$$u=\ln x\quad dv=x\,dx\quad du=\tfrac1x\,dx\quad v=\tfrac{x^2}{2}$$`,
      R`$$\int x\ln x\,dx=\frac{x^2}{2}\ln x-\int\frac{x^2}{2}\cdot\frac1x\,dx=\frac{x^2}{2}\ln x-\int\frac{x}{2}\,dx=\frac{x^2}{2}\ln x-\frac{x^2}{4}+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\Big[\frac{x^2}{2}\ln x-\frac{x^2}{4}\Big]=x\ln x+\frac{x}{2}-\frac{x}{2}=x\ln x\ \checkmark$$`,
    ],
  },
  {
    enun: R`Calculá $\int (2x+1)\,e^x\,dx$.`,
    pista: R`Ahora $u$ es todo el factor lineal; al derivarlo queda una constante.`,
    u: [R`u=e^x`, R`u=(2x+1)e^x`, R`u=2x+1`], uOk: 2,
    dv: [R`dv=(2x+1)\,dx`, R`dv=e^x\,dx`, R`dv=dx`], dvOk: 1,
    du: [R`du=e^x\,dx`, R`du=2\,dx`, R`du=(2x+1)\,dx`], duOk: 1,
    v: [R`v=e^x`, R`v=\frac{e^x}{2}`, R`v=2e^x`], vOk: 0,
    r: [R`(2x+1)e^x+C`, R`(2x+3)e^x+C`, R`(2x-1)e^x+C`, R`2e^x+C`], rOk: 2,
    sol: [
      R`$$u=2x+1\quad dv=e^x\,dx\quad du=2\,dx\quad v=e^x$$`,
      R`$$\int(2x+1)e^x\,dx=(2x+1)e^x-\int 2e^x\,dx=(2x+1)e^x-2e^x+C=(2x-1)e^x+C$$`,
      R`$$\text{Verificación: }\ \frac{d}{dx}\big[(2x-1)e^x\big]=2e^x+(2x-1)e^x=(2x+1)e^x\ \checkmark$$`,
    ],
  },
];

/* ======================= Piezas ======================= */
function Ejemplos({ lista }) {
  const [k, setK] = useState(0);
  const e = lista[k];
  return (
    <div>
      <div className="row">
        {lista.map((_, i) => (
          <button key={i} className={"chip" + (i === k ? " on" : "")} onClick={() => setK(i)}>Ejemplo {i + 1}</button>
        ))}
      </div>
      <Soft t={`$$${e.f}$$`} />
      <Pasos items={e.pasos} />
      <p><b>Verificamos derivando el resultado:</b></p>
      <Soft t={e.ver} />
    </div>
  );
}

const TABLA = R`$$\int x^n\,dx=\frac{x^{n+1}}{n+1}+C\ (n\neq-1)\qquad\int\frac1x\,dx=\ln|x|+C\qquad\int e^x\,dx=e^x+C$$ $$\int${sen}\,x\,dx=-\cos x+C\qquad\int\cos x\,dx=${sen}\,x+C$$`;

function Sustitucion() {
  return (
    <>
      <section className="card">
        <h2>Método de sustitución</h2>
        <p><M t={R`La integral indefinida $\int f(x)\,dx=F(x)+C$ es la familia de <b>todas</b> las primitivas de $f$ (la $C$ es una constante cualquiera). Muchas integrales no están en la tabla tal cual, pero se pueden transformar en una que sí.`} /></p>
        <details><summary>Tabla de primitivas básicas</summary><Soft t={TABLA} /></details>
        <p><M t={R`La <b>sustitución</b> es la regla de la cadena al revés. Sirve cuando en la integral hay una función «adentro» de otra y, multiplicando, aparece (casi) su derivada:`} /></p>
        <Soft t={R`$$\int f\big(g(x)\big)\,g'(x)\,dx\;\overset{u=g(x)}{=}\;\int f(u)\,du$$`} />
        <p>Siempre se hacen los mismos cinco pasos:</p>
        <ol className="pasos">
          <li><b>Elegir <M t="$u$" />:</b> lo de adentro (de un paréntesis, una raíz, un exponente, un seno…).</li>
          <li><b>Calcular <M t="$du$" />:</b> <M t={R`$du=u'\,dx$`} />.</li>
          <li><b>Reescribir</b> toda la integral con <M t="$u$" /> y <M t="$du$" />. No debe quedar ninguna <M t="$x$" />.</li>
          <li><b>Integrar</b> en <M t="$u$" />.</li>
          <li><b>Volver a <M t="$x$" /></b> y no olvidarse de la <M t="$+C$" />.</li>
        </ol>
        <Q>si al reescribir queda una <M t="$x$" /> suelta que no se puede cambiar por <M t="$u$" />, ¿qué conviene probar?</Q>
        <details><summary>Ver respuesta</summary>
          <p>Probablemente elegiste mal la <M t="$u$" />: probá con otra parte de la expresión. Si ninguna sirve, quizás el ejercicio no se resuelve por sustitución.</p>
        </details>
      </section>

      <section className="card">
        <h2>Ejemplos resueltos</h2>
        <Ejemplos lista={S_EJEMPLOS} />
      </section>

      <section className="card">
        <h2>Ejercicios</h2>
        <p>En cada uno elegí la <M t="$u$" />, su <M t="$du$" /> y el resultado final. Si una opción no te convence, derivá el resultado: tiene que dar la función original.</p>
        {S_EJ.map((e, i) => (
          <Practica key={i} i={i} enun={e.enun} pista={e.pista} sol={e.sol} campos={[
            { k: "u", tipo: "op", legend: "Elegí $u$", ops: e.u, ok: e.uOk },
            { k: "du", tipo: "op", legend: "Calculá $du$", ops: e.du, ok: e.duOk },
            { k: "r", tipo: "op", legend: "Resultado final", ops: e.r, ok: e.rOk },
          ]} />
        ))}
      </section>
    </>
  );
}

function Partes() {
  return (
    <>
      <section className="card">
        <h2>Integración por partes</h2>
        <p><M t={R`Cuando la integral es un <b>producto</b> de dos funciones distintas (como $x\,e^x$ o $x\cos x$) y no hay una sustitución que lo arregle, se usa la regla del producto al revés. Como $(u\,v)'=u'v+u\,v'$, integrando se llega a:`} /></p>
        <Soft t={R`$$\int u\,dv=u\,v-\int v\,du$$`} />
        <p>Cada ejercicio sigue estos pasos:</p>
        <ol className="pasos">
          <li><b>Elegir <M t="$u$" /> y <M t="$dv$" />.</b> <M t="$dv$" /> tiene que ser algo que sepamos integrar.</li>
          <li><b>Derivar <M t="$u$" /></b> para obtener <M t="$du$" />, e <b>integrar <M t="$dv$" /></b> para obtener <M t="$v$" />.</li>
          <li><b>Aplicar la fórmula</b> <M t={R`$u\,v-\int v\,du$`} />.</li>
          <li><b>Resolver</b> la integral que queda (tiene que ser más fácil que la original) y sumar <M t="$C$" />.</li>
        </ol>
        <h3>¿Cómo elegir u?</h3>
        <p><M t={R`Elegí como $u$ lo que <b>se simplifica al derivar</b>: un $x$ (pasa a $1$) o un $\ln x$ (pasa a $\tfrac1x$). Una ayuda para ordenar es la regla <b>LIATE</b>: la primera de esta lista que aparezca es $u$.`} /></p>
        <Soft t={R`$$\textbf{L}\text{ogarítmicas}\ \to\ \textbf{I}\text{nversas trig.}\ \to\ \textbf{A}\text{lgebraicas }(x,\,x^2)\ \to\ \textbf{T}\text{rigonométricas}\ \to\ \textbf{E}\text{xponenciales}$$`} />
        <Q>en <M t={R`$\int x\,e^x\,dx$`} />, ¿qué pasaría si eligieras <M t={R`$u=e^x$`} /> y <M t={R`$dv=x\,dx$`} />?</Q>
        <details><summary>Ver respuesta</summary>
          <p><M t={R`Daría $v=\tfrac{x^2}{2}$ y la integral nueva sería $\int \tfrac{x^2}{2}e^x\,dx$: <b>más difícil</b> que la original, porque subió el grado de $x$. Si la integral que queda es peor, hay que cambiar la elección.`} /></p>
        </details>
      </section>

      <section className="card">
        <h2>Ejemplos resueltos</h2>
        <Ejemplos lista={P_EJEMPLOS} />
      </section>

      <section className="card">
        <h2>Ejercicios</h2>
        <p>Completá cada paso: <M t="$u$" />, <M t="$dv$" />, <M t="$du$" />, <M t="$v$" /> y el resultado final.</p>
        {P_EJ.map((e, i) => (
          <Practica key={i} i={i} enun={e.enun} pista={e.pista} sol={e.sol} campos={[
            { k: "u", tipo: "op", legend: "Elegí $u$", ops: e.u, ok: e.uOk },
            { k: "dv", tipo: "op", legend: "Elegí $dv$", ops: e.dv, ok: e.dvOk },
            { k: "du", tipo: "op", legend: "Calculá $du$", ops: e.du, ok: e.duOk },
            { k: "v", tipo: "op", legend: "Calculá $v$", ops: e.v, ok: e.vOk },
            { k: "r", tipo: "op", legend: "Resultado final", ops: e.r, ok: e.rOk },
          ]} />
        ))}
      </section>
    </>
  );
}

export default function Indefinidas() {
  const [t, setT] = useState("sust");
  return (
    <>
      <h1>Integrales indefinidas</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={"chip" + (t === "sust" ? " on" : "")} onClick={() => setT("sust")}>Sustitución</button>
        <button className={"chip" + (t === "partes" ? " on" : "")} onClick={() => setT("partes")}>Por partes</button>
      </div>
      {t === "sust" ? <Sustitucion /> : <Partes />}
    </>
  );
}

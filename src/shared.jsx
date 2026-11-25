import { useId, useState } from "react";
import katex from "katex";

export const R = String.raw;
export const fm = (v, d = 4) => v.toFixed(d).replace(".", ",");

/* Renderiza HTML con fórmulas LaTeX: $...$ en línea y $$...$$ en bloque */
export const toHtml = (t) =>
  t
    .replace(/\$\$([^$]+)\$\$/g, (_, x) => katex.renderToString(x, { displayMode: true, throwOnError: false }))
    .replace(/\$([^$]+)\$/g, (_, x) => katex.renderToString(x, { throwOnError: false }));
export const M = ({ t, as: Tag = "span" }) => <Tag dangerouslySetInnerHTML={{ __html: toHtml(t) }} />;
export const Soft = ({ t }) => <div className="soft"><M t={t} /></div>;
export const Q = ({ children }) => <div className="q"><b>Anotá:</b> {children}</div>;

/* Convierte lo que escribe el alumno: admite coma decimal y fracciones a/b */
export function num(s) {
  const t = s.trim().replace(",", ".").replace("−", "-");
  if (!t) return NaN;
  const f = t.split("/");
  if (f.length === 2) return Number(f[0]) / Number(f[1]);
  return f.length === 1 ? Number(t) : NaN;
}

/* Lista numerada con título y fórmula en cada paso: [{ t, m }] */
export const Pasos = ({ items }) => (
  <ol className="pasos">
    {items.map((p, i) => (
      <li key={i}>
        <b><M t={p.t} /></b>
        {p.m && <Soft t={p.m} />}
      </li>
    ))}
  </ol>
);

/* Opciones con fórmulas renderizadas (botones de radio) */
export function Opciones({ legend, ops, value, onChange, estado, mark }) {
  const name = useId();
  return (
    <fieldset className={"opts " + (estado || "")}>
      <legend><M t={legend} />{mark}</legend>
      <div className="row">
        {ops.map((o, j) => (
          <label key={j} className="op">
            <input type="radio" name={name} value={j} checked={value === String(j)} onChange={() => onChange(String(j))} />
            <M t={`$${o}$`} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/*
  Ejercicio con corrección automática.
  campos: [{ k, tipo: "op", legend, ops, ok }]  → elegir una opción (ok = índice correcto)
          [{ k, tipo: "num", legend, ok }]      → escribir un número (admite coma y a/b)
  sol: texto con LaTeX ($$...$$) para «Ver solución»; pista: texto opcional.
  children: contenido extra entre el enunciado y los campos (por ejemplo, un gráfico).
*/
export function Practica({ i, enun, campos, sol, pista, children }) {
  const [v, setV] = useState({});
  const [chk, setChk] = useState(false);
  const set = (k, x) => { setV((p) => ({ ...p, [k]: x })); setChk(false); };
  const good = {};
  campos.forEach((c) => {
    good[c.k] = c.tipo === "num"
      ? Math.abs(num(v[c.k] ?? "") - c.ok) < (c.tol ?? Math.max(0.01, 0.002 * Math.abs(c.ok)))
      : v[c.k] === String(c.ok);
  });
  const all = Object.values(good).every(Boolean);
  const st = (k) => (chk ? (good[k] ? "ok" : "bad") : "");
  const mk = (k) => (chk ? (good[k] ? " ✓" : " ✗") : "");
  return (
    <div className="ej">
      <p><b>Ejercicio {i + 1}.</b> <M t={enun} /></p>
      {children}
      {campos.map((c) =>
        c.tipo === "num" ? (
          <label key={c.k} className="nlabel"><span><M t={c.legend} />{mk(c.k)}</span>
            <input className={st(c.k)} type="text" inputMode="decimal" autoComplete="off" value={v[c.k] ?? ""} onChange={(ev) => set(c.k, ev.target.value)} />
          </label>
        ) : (
          <Opciones key={c.k} legend={c.legend} ops={c.ops} value={v[c.k]} onChange={(x) => set(c.k, x)} estado={st(c.k)} mark={mk(c.k)} />
        )
      )}
      <button onClick={() => setChk(true)}>Comprobar</button>{" "}
      <b className={all && chk ? "good" : ""} aria-live="polite">
        {chk && (all ? "¡Correcto!" : "Revisá los campos marcados con ✗.")}
      </b>
      {pista && <details><summary>Pista</summary><p><M t={pista} /></p></details>}
      <details><summary>Ver solución</summary>
        {[].concat(sol).map((s, j) => <Soft key={j} t={s} />)}
      </details>
    </div>
  );
}

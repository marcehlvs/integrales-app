# integrales-app · «Aproximá el área bajo la curva»

App interactiva (React + Vite + KaTeX) para introducir la **integral definida** en 6.º año de secundaria. Va de lo concreto a lo abstracto, en 8 pasos con botón «Siguiente».

## Recorrido didáctico

1. **Estimá el área:** 3 rectángulos sobre x² entre 0 y 3. El alumno suma a mano y predice si el área real es mayor o menor.
2. **Más rectángulos:** aparece el deslizador y se ve cómo baja el error.
3. **Lo que hiciste se llama integral:** primera aparición de la notación ∫ y del límite de la suma.
4. **¿Qué pasa con el límite?:** tabla con n = 1, 10, 100 y 1000 rectángulos; la suma se acerca a 9 y el alumno dice a qué número tiende.
5. **Comparar métodos:** izquierda, derecha y punto medio.
6. **Regla de Barrow:** tres pasos marcados (primitiva, evaluar en b y en a, restar) para cuatro funciones, y tres ejercicios con campos para completar y corrección automática.
7. **Desafío:** lograr un error menor al pedido con la menor cantidad de rectángulos.
8. **Para profundizar:** velocidad y distancia, propiedades, área con signo, ejemplos y práctica (desplegables).

Cada paso tiene una pregunta para anotar en la carpeta y la respuesta oculta en un desplegable.

## Puesta en marcha

1. Crear el repo `integrales-app` en GitHub y clonarlo.
2. Copiar todos los archivos de este proyecto en la carpeta.
3. `npm install`
4. `npm run dev` y abrir la URL que muestra la terminal.
5. `npm run build` genera la carpeta `dist/`.
6. Publicar: en Vercel o Netlify importar el repo (build `npm run build`, salida `dist`). En GitHub Pages, subir el contenido de `dist/` (`vite.config.js` ya usa `base: "./"`).
7. `git add . && git commit -m "App de integrales" && git push`

## Estructura

```
integrales-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx     # entrada; importa el CSS de KaTeX
    ├── App.jsx      # pasos, gráfico SVG y cálculo de sumas de Riemann
    └── styles.css   # estilos (modo claro y oscuro)
```

## Fórmulas en LaTeX

Se escriben dentro de los textos con `$...$` (en línea) y `$$...$$` (en bloque); el componente `M` las convierte con KaTeX. Dentro de `String.raw` no hace falta duplicar las barras invertidas.

## Ideas para ampliar

- [x] Paso sobre el límite: tabla con n = 1, 10, 100, 1000 y la suma acercándose al área.
- [x] Barrow paso a paso (primitiva, evaluar, restar) con ejercicios para completar.
- [ ] Área con signo y funciones negativas.
- [ ] Área entre dos curvas.

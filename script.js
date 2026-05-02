const tools = {
  derivative: {
    eyebrow: "Prioridad principal",
    title: "Derivada de una funcion vectorial",
    example: { vector: "<t^3, sin(t), e^t>", variable: "t", order: "1" },
    fields: [
      { id: "vector", label: "Funcion vectorial r(t)", value: "<t^2, sin(t), e^t>", full: true },
      { id: "variable", label: "Variable", value: "t" },
      { id: "order", label: "Orden", type: "select", value: "1", options: ["1", "2"] },
    ],
  },
  integral: {
    eyebrow: "Prioridad principal",
    title: "Integral de una funcion vectorial",
    example: { vector: "<2t, cos(t), e^t>", variable: "t", constant: "C" },
    fields: [
      { id: "vector", label: "Funcion vectorial r(t)", value: "<2t, cos(t), e^t>", full: true },
      { id: "variable", label: "Variable", value: "t" },
      { id: "constant", label: "Constante vectorial", value: "C" },
    ],
  },
  operations: {
    eyebrow: "Herramienta relacionada",
    title: "Operaciones entre vectores",
    example: { a: "<t, t^2, 1>", b: "<sin(t), 3, t>", operation: "dot" },
    fields: [
      { id: "a", label: "Vector A", value: "<t, t^2, 1>", full: true },
      { id: "b", label: "Vector B", value: "<sin(t), 3, t>", full: true },
      { id: "operation", label: "Operacion", type: "select", value: "dot", options: ["dot", "cross", "norm"] },
    ],
  },
  fields: {
    eyebrow: "Herramienta relacionada",
    title: "Campos escalares y vectoriales",
    example: { mode: "curl", scalar: "x^2*y + z", vector: "<y*z, x*z, x*y>" },
    fields: [
      { id: "mode", label: "Calculo", type: "select", value: "gradient", options: ["gradient", "divergence", "curl"] },
      { id: "scalar", label: "Campo escalar f(x,y,z)", value: "x^2*y + z", full: true },
      { id: "vector", label: "Campo vectorial F(x,y,z)", value: "<x^2, y^2, z^2>", full: true },
    ],
  },
  arc: {
    eyebrow: "Herramienta relacionada",
    title: "Longitud de arco aproximada",
    example: { vector: "<cos(t), sin(t), t>", variable: "t", a: "0", b: "6.283" },
    fields: [
      { id: "vector", label: "Funcion vectorial r(t)", value: "<cos(t), sin(t), t>", full: true },
      { id: "variable", label: "Variable", value: "t" },
      { id: "a", label: "Inicio a", value: "0" },
      { id: "b", label: "Fin b", value: "6.283" },
    ],
  },
};

const state = { tool: "derivative" };
const dynamicFields = document.querySelector("#dynamic-fields");
const form = document.querySelector("#solver-form");
const resultArea = document.querySelector("#result-area");
const modeTitle = document.querySelector("#mode-title");
const modeEyebrow = document.querySelector("#mode-eyebrow");
const exampleButton = document.querySelector("#load-example");
const splash = document.querySelector("#splash");
const enterButton = document.querySelector("#enter-app");

if (enterButton && splash) {
  enterButton.addEventListener("click", () => {
    splash.classList.add("hidden");
    document.body.classList.remove("intro-active");
  });
}

document.querySelectorAll(".tool-card").forEach((button) => {
  button.addEventListener("click", () => {
    state.tool = button.dataset.tool;
    document.querySelectorAll(".tool-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderFields();
    clearResult();
  });
});

exampleButton.addEventListener("click", () => {
  const values = tools[state.tool].example;
  Object.entries(values).forEach(([key, value]) => {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = value;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const result = solve(state.tool, data);
    renderResult(result);
  } catch (error) {
    resultArea.innerHTML = `<div class="warning-card"><strong>No pude resolver esa entrada.</strong><p>${escapeHtml(error.message)}</p><p>Tip: usa funciones como <code>t^2</code>, <code>sin(t)</code>, <code>cos(t)</code>, <code>e^t</code>, <code>ln(t)</code> y separa vectores con comas.</p></div>`;
  }
});

renderFields();

function renderFields() {
  const config = tools[state.tool];
  modeTitle.textContent = config.title;
  modeEyebrow.textContent = config.eyebrow;
  dynamicFields.innerHTML = config.fields
    .map((field) => {
      const className = field.full ? "field full" : "field";
      if (field.type === "select") {
        return `<div class="${className}"><label for="${field.id}">${field.label}</label><select id="${field.id}" name="${field.id}">${field.options
          .map((option) => `<option value="${option}" ${option === field.value ? "selected" : ""}>${labelOption(option)}</option>`)
          .join("")}</select></div>`;
      }
      return `<div class="${className}"><label for="${field.id}">${field.label}</label><input id="${field.id}" name="${field.id}" value="${field.value}" autocomplete="off" /></div>`;
    })
    .join("");
}

function clearResult() {
  resultArea.innerHTML = `<div class="empty-state"><strong>Listo para calcular.</strong><span>Escribe los datos y presiona resolver.</span></div>`;
}

function solve(tool, data) {
  if (tool === "derivative") return solveDerivative(data);
  if (tool === "integral") return solveIntegral(data);
  if (tool === "operations") return solveOperations(data);
  if (tool === "fields") return solveFields(data);
  return solveArcLength(data);
}

function solveDerivative({ vector, variable, order }) {
  const components = parseVector(vector);
  const first = components.map((component) => derivative(component, variable));
  const second = first.map((component) => derivative(component, variable));
  const finalVector = order === "2" ? second : first;
  const steps = [
    `Identificamos la funcion vectorial: <span class="formula">r(${variable}) = ${formatVector(components)}</span>.`,
    `Usamos la propiedad clave: la derivada de un vector se calcula componente a componente, es decir <span class="formula">r'(${variable}) = &lt;f'(${variable}), g'(${variable}), h'(${variable})&gt;</span>.`,
    ...components.map((component, index) => {
      const prime = first[index];
      return `Componente ${index + 1}: <span class="formula">d/d${variable} [${component}] = ${prime}</span>. ${ruleHint(component, variable, "derivative")}`;
    }),
  ];
  if (order === "2") {
    steps.push(
      `Como pediste orden 2, volvemos a derivar. En fisica, si r(t) es posicion, <span class="formula">r'(t)</span> es velocidad y <span class="formula">r''(t)</span> es aceleracion.`,
      ...first.map((component, index) => `Componente ${index + 1}: <span class="formula">d/d${variable} [${component}] = ${second[index]}</span>.`),
    );
  }
  return {
    title: order === "2" ? "Aceleracion o segunda derivada" : "Derivada vectorial",
    answer: `${order === "2" ? "r''" : "r'"}(${variable}) = ${formatVector(finalVector)}`,
    steps,
    tip: "Tip: si la funcion vectorial tiene tres componentes, no las mezcles. Trabaja como si fueran tres problemas de una variable y junta el resultado al final.",
  };
}

function solveIntegral({ vector, variable, constant }) {
  const components = parseVector(vector);
  const integrated = components.map((component) => integral(component, variable));
  const steps = [
    `Identificamos la funcion vectorial: <span class="formula">r(${variable}) = ${formatVector(components)}</span>.`,
    `Usamos la propiedad de linealidad: <span class="formula">int &lt;f,g,h&gt; d${variable} = &lt;int f d${variable}, int g d${variable}, int h d${variable}&gt; + ${constant}</span>.`,
    ...components.map((component, index) => `Componente ${index + 1}: <span class="formula">int [${component}] d${variable} = ${integrated[index]}</span>. ${ruleHint(component, variable, "integral")}`),
    `Agregamos la constante vectorial porque una integral indefinida representa una familia de funciones vectoriales.`,
  ];
  return {
    title: "Integral vectorial",
    answer: `int r(${variable}) d${variable} = ${formatVector(integrated)} + ${constant}`,
    steps,
    tip: "Tip: la constante no es solo un numero; en vectores suele pensarse como un vector constante, por ejemplo <C1, C2, C3>.",
  };
}

function solveOperations({ a, b, operation }) {
  const va = parseVector(a);
  const vb = parseVector(b);
  if (operation === "norm") {
    const squares = va.map((component) => `(${component})^2`);
    return {
      title: "Norma del vector A",
      answer: `||A|| = sqrt(${squares.join(" + ")})`,
      steps: [
        `Tomamos <span class="formula">A = ${formatVector(va)}</span>.`,
        `Aplicamos la formula de magnitud: <span class="formula">||A|| = sqrt(a1^2 + a2^2 + a3^2)</span>.`,
        `Sustituimos cada componente: <span class="formula">||A|| = sqrt(${squares.join(" + ")})</span>.`,
      ],
      tip: "Tip: la norma mide longitud. Si A depende de t, la longitud tambien puede depender de t.",
    };
  }
  ensureSameLength(va, vb);
  if (operation === "cross") {
    if (va.length !== 3) throw new Error("El producto cruz necesita exactamente 3 componentes en cada vector.");
    const cross = [
      simplify(`${va[1]}*${vb[2]} - ${va[2]}*${vb[1]}`),
      simplify(`${va[2]}*${vb[0]} - ${va[0]}*${vb[2]}`),
      simplify(`${va[0]}*${vb[1]} - ${va[1]}*${vb[0]}`),
    ];
    return {
      title: "Producto cruz",
      answer: `A x B = ${formatVector(cross)}`,
      steps: [
        `Usamos <span class="formula">A x B = &lt;a2b3-a3b2, a3b1-a1b3, a1b2-a2b1&gt;</span>.`,
        `Sustituimos las componentes de <span class="formula">A = ${formatVector(va)}</span> y <span class="formula">B = ${formatVector(vb)}</span>.`,
        `El resultado es <span class="formula">${formatVector(cross)}</span>.`,
      ],
      tip: "Tip: el producto cruz produce un vector perpendicular a A y B cuando ambos son vectores en R3.",
    };
  }
  const terms = va.map((component, index) => `(${component})(${vb[index]})`);
  return {
    title: "Producto punto",
    answer: `A dot B = ${terms.join(" + ")}`,
    steps: [
      `Usamos la formula <span class="formula">A dot B = a1b1 + a2b2 + a3b3</span>.`,
      `Multiplicamos componentes correspondientes: <span class="formula">${terms.join(" + ")}</span>.`,
      "El producto punto devuelve un escalar, no un vector.",
    ],
    tip: "Tip: si el producto punto vale 0, los vectores son ortogonales en ese valor de la variable.",
  };
}

function solveFields({ mode, scalar, vector }) {
  if (mode === "gradient") {
    const grad = ["x", "y", "z"].map((variable) => derivative(scalar, variable));
    return {
      title: "Gradiente",
      answer: `grad f = ${formatVector(grad)}`,
      steps: [
        `Para un campo escalar <span class="formula">f(x,y,z) = ${scalar}</span>, el gradiente es <span class="formula">nabla f = &lt;fx, fy, fz&gt;</span>.`,
        `Derivamos parcialmente respecto a x: <span class="formula">${grad[0]}</span>.`,
        `Derivamos parcialmente respecto a y: <span class="formula">${grad[1]}</span>.`,
        `Derivamos parcialmente respecto a z: <span class="formula">${grad[2]}</span>.`,
      ],
      tip: "Tip: en una derivada parcial, las otras variables se tratan como constantes.",
    };
  }
  const parts = parseVector(vector);
  if (parts.length !== 3) throw new Error("Divergencia y rotacional necesitan un campo vectorial con 3 componentes.");
  if (mode === "divergence") {
    const div = [derivative(parts[0], "x"), derivative(parts[1], "y"), derivative(parts[2], "z")];
    return {
      title: "Divergencia",
      answer: `nabla dot F = ${div.join(" + ")}`,
      steps: [
        `Para <span class="formula">F = &lt;P,Q,R&gt;</span>, usamos <span class="formula">nabla dot F = Px + Qy + Rz</span>.`,
        `Calculamos: <span class="formula">Px=${div[0]}</span>, <span class="formula">Qy=${div[1]}</span>, <span class="formula">Rz=${div[2]}</span>.`,
        "Sumamos esos tres resultados para obtener un escalar.",
      ],
      tip: "Tip: la divergencia describe fuente o sumidero local del campo.",
    };
  }
  const curl = [
    simplify(`${derivative(parts[2], "y")} - ${derivative(parts[1], "z")}`),
    simplify(`${derivative(parts[0], "z")} - ${derivative(parts[2], "x")}`),
    simplify(`${derivative(parts[1], "x")} - ${derivative(parts[0], "y")}`),
  ];
  return {
    title: "Rotacional",
    answer: `nabla x F = ${formatVector(curl)}`,
    steps: [
      `Para <span class="formula">F=&lt;P,Q,R&gt;</span>, usamos <span class="formula">nabla x F = &lt;Ry-Qz, Pz-Rx, Qx-Py&gt;</span>.`,
      `Calculamos cada derivada parcial correspondiente y sustituimos en la formula.`,
      `El resultado vectorial es <span class="formula">${formatVector(curl)}</span>.`,
    ],
    tip: "Tip: el rotacional mide tendencia local a girar alrededor de un eje.",
  };
}

function solveArcLength({ vector, variable, a, b }) {
  const components = parseVector(vector);
  const velocity = components.map((component) => derivative(component, variable));
  const speed = (t) => {
    const values = velocity.map((component) => evaluateExpression(component, variable, t));
    return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  };
  const start = Number(a);
  const end = Number(b);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error("Los limites deben ser numeros.");
  const length = simpson(speed, start, end, 240);
  return {
    title: "Longitud de arco aproximada",
    answer: `L ~= ${round(length, 6)}`,
    steps: [
      `La formula es <span class="formula">L = int_a^b ||r'(${variable})|| d${variable}</span>.`,
      `Primero derivamos por componentes: <span class="formula">r'(${variable}) = ${formatVector(velocity)}</span>.`,
      `Luego formamos la rapidez: <span class="formula">||r'(${variable})|| = sqrt(${velocity.map((item) => `(${item})^2`).join(" + ")})</span>.`,
      `Integramos numericamente desde <span class="formula">${start}</span> hasta <span class="formula">${end}</span> con la regla de Simpson.`,
    ],
    tip: "Tip: longitud de arco suele requerir una integral dificil. La aproximacion numerica es una forma practica de estimarla.",
  };
}

function derivative(expression, variable) {
  const terms = splitTopLevel(normalize(expression), "+");
  if (terms.length > 1) return simplify(terms.map((term) => derivative(term, variable)).join(" + "));
  const minusTerms = splitTopLevel(expression, "-");
  if (minusTerms.length > 1) return simplify(minusTerms.map((term, index) => (index === 0 ? derivative(term, variable) : `-${derivative(term, variable)}`)).join(" + "));
  return derivativeSingle(stripOuter(expression.trim()), variable);
}

function derivativeSingle(expression, variable) {
  const x = escapeRegExp(variable);
  if (expression === variable) return "1";
  if (isNumeric(expression)) return "0";
  if (!containsVariable(expression, variable)) return "0";
  let match = expression.match(new RegExp(`^([+-]?\\d*\\.?\\d*)${x}$`));
  if (match) return cleanCoeff(match[1] || "1");
  match = expression.match(new RegExp(`^${x}\\^([+-]?\\d*\\.?\\d+)$`));
  if (match) {
    const n = Number(match[1]);
    return simplify(`${round(n, 8)}${variable}^${round(n - 1, 8)}`);
  }
  match = expression.match(new RegExp(`^([+-]?\\d*\\.?\\d*)${x}\\^([+-]?\\d*\\.?\\d+)$`));
  if (match) {
    const coeff = Number(cleanCoeff(match[1] || "1"));
    const n = Number(match[2]);
    return simplify(`${round(coeff * n, 8)}${variable}^${round(n - 1, 8)}`);
  }
  match = expression.match(/^([a-z]+)\((.+)\)$/);
  if (match) {
    const [, fn, inside] = match;
    if (inside === variable) {
      if (fn === "sin") return `cos(${variable})`;
      if (fn === "cos") return `-sin(${variable})`;
      if (fn === "tan") return `sec(${variable})^2`;
      if (fn === "ln") return `1/${variable}`;
      if (fn === "sqrt") return `1/(2sqrt(${variable}))`;
    }
    const innerPrime = derivative(inside, variable);
    const outer = derivativeSingle(`${fn}(u)`, "u");
    return simplify(`(${outer.replaceAll("u", `(${inside})`)})*(${innerPrime})`);
  }
  match = expression.match(new RegExp(`^e\\^${x}$`));
  if (match) return `e^${variable}`;
  match = expression.match(/^e\^\((.+)\)$/);
  if (match) return simplify(`e^(${match[1]})*(${derivative(match[1], variable)})`);
  const product = splitTopLevel(expression, "*");
  if (product.length === 2) {
    const [u, v] = product;
    return simplify(`(${derivative(u, variable)})*(${v}) + (${u})*(${derivative(v, variable)})`);
  }
  return `d/d${variable}(${expression})`;
}

function integral(expression, variable) {
  const terms = splitTopLevel(normalize(expression), "+");
  if (terms.length > 1) return simplify(terms.map((term) => integral(term, variable)).join(" + "));
  const minusTerms = splitTopLevel(expression, "-");
  if (minusTerms.length > 1) return simplify(minusTerms.map((term, index) => (index === 0 ? integral(term, variable) : `-${integral(term, variable)}`)).join(" + "));
  return integralSingle(stripOuter(expression.trim()), variable);
}

function integralSingle(expression, variable) {
  const x = escapeRegExp(variable);
  if (isNumeric(expression)) return `${expression}${variable}`;
  if (!containsVariable(expression, variable)) return `${expression}${variable}`;
  if (expression === variable) return `${variable}^2/2`;
  let match = expression.match(new RegExp(`^([+-]?\\d*\\.?\\d*)${x}$`));
  if (match) return powerIntegral(cleanCoeff(match[1] || "1"), variable, 1);
  match = expression.match(new RegExp(`^${x}\\^([+-]?\\d*\\.?\\d+)$`));
  if (match) {
    const n = Number(match[1]);
    if (n === -1) return `ln(abs(${variable}))`;
    return simplify(`${variable}^${round(n + 1, 8)}/${round(n + 1, 8)}`);
  }
  match = expression.match(new RegExp(`^([+-]?\\d*\\.?\\d*)${x}\\^([+-]?\\d*\\.?\\d+)$`));
  if (match) {
    const coeff = Number(cleanCoeff(match[1] || "1"));
    const n = Number(match[2]);
    if (n === -1) return `${round(coeff, 8)}ln(abs(${variable}))`;
    return powerIntegral(coeff, variable, n);
  }
  if (expression === `sin(${variable})`) return `-cos(${variable})`;
  if (expression === `cos(${variable})`) return `sin(${variable})`;
  if (expression === `e^${variable}`) return `e^${variable}`;
  if (expression === `1/${variable}`) return `ln(abs(${variable}))`;
  return `int(${expression}) d${variable}`;
}

function parseVector(input) {
  const clean = input.trim().replace(/^[<([]/, "").replace(/[>\])]$/, "");
  const parts = splitTopLevel(clean, ",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) throw new Error("Escribe al menos dos componentes separadas por comas.");
  return parts;
}

function splitTopLevel(input, separator) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "(" || char === "<" || char === "[") depth += 1;
    if (char === ")" || char === ">" || char === "]") depth -= 1;
    if (char === separator && depth === 0 && !(separator === "-" && i === 0)) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts.filter(Boolean);
}

function normalize(expression) {
  return expression.replace(/\s+/g, "").replaceAll("-", "-");
}

function simplify(expression) {
  return normalize(expression)
    .replaceAll("+-", "-")
    .replaceAll("--", "+")
    .replaceAll("(0)", "0")
    .replaceAll("(1)", "1")
    .replace(/\b0\*[^+,-]+/g, "0")
    .replace(/([^+,-]+)\*0\b/g, "0")
    .replace(/\b1\*/g, "")
    .replace(/\*1\b/g, "")
    .replace(/\+0(?![.\d])/g, "")
    .replace(/0\+/g, "")
    .replace(/^0\+/, "")
    .replace(/\^1\b/g, "")
    .replace(/\b1([a-zA-Z])/g, "$1")
    .replace(/\(([^()]+)\)/g, "$1")
    .trim() || "0";
}

function stripOuter(expression) {
  if (expression.startsWith("(") && expression.endsWith(")")) return expression.slice(1, -1);
  return expression;
}

function containsVariable(expression, variable) {
  return new RegExp(`(^|[^A-Za-z])${escapeRegExp(variable)}([^A-Za-z]|$)`).test(expression);
}

function isNumeric(value) {
  return /^[-+]?\d*\.?\d+$/.test(value);
}

function cleanCoeff(value) {
  if (value === "" || value === "+") return "1";
  if (value === "-") return "-1";
  return value;
}

function powerIntegral(coeff, variable, exponent) {
  const nextExponent = exponent + 1;
  const newCoeff = Number(coeff) / nextExponent;
  const coeffText = formatCoefficient(newCoeff);
  const powerText = nextExponent === 1 ? variable : `${variable}^${round(nextExponent, 8)}`;
  return `${coeffText}${powerText}`;
}

function formatCoefficient(value) {
  const rounded = round(value, 8);
  if (rounded === 1) return "";
  if (rounded === -1) return "-";
  return String(rounded);
}

function ensureSameLength(a, b) {
  if (a.length !== b.length) throw new Error("Los vectores deben tener la misma cantidad de componentes.");
}

function formatVector(parts) {
  return `&lt;${parts.join(", ")}&gt;`;
}

function labelOption(option) {
  const labels = {
    dot: "Producto punto",
    cross: "Producto cruz",
    norm: "Norma de A",
    gradient: "Gradiente",
    divergence: "Divergencia",
    curl: "Rotacional",
  };
  return labels[option] || option;
}

function ruleHint(expression, variable, type) {
  if (expression.includes(`e^${variable}`)) return "Propiedad usada: la exponencial natural conserva su forma.";
  if (expression.includes("^")) return type === "derivative" ? "Propiedad usada: regla de la potencia." : "Propiedad usada: regla de potencia inversa, aumentando el exponente en 1.";
  if (expression.includes("sin") || expression.includes("cos")) return "Propiedad usada: derivadas e integrales trigonometricas basicas.";
  return "Propiedad usada: linealidad y tratamiento por componentes.";
}

function renderResult(result) {
  resultArea.innerHTML = `
    <article class="answer-card">
      <div>
        <span class="badge">${escapeHtml(result.title)}</span>
      </div>
      <div class="answer-line">${result.answer}</div>
      <h3>Procedimiento</h3>
      <ol class="step-list">${result.steps.map((step) => `<li><span>${step}</span></li>`).join("")}</ol>
    </article>
    <aside class="tip-card"><strong>Tip para entenderlo mejor:</strong> ${result.tip.replace(/^Tip:\s*/, "")}</aside>
  `;
}

function evaluateExpression(expression, variable, value) {
  const normalized = normalize(expression)
    .replace(new RegExp(`(\\d)${escapeRegExp(variable)}\\b`, "g"), `$1*${variable}`)
    .replace(new RegExp(`\\)${escapeRegExp(variable)}\\b`, "g"), `)*${variable}`)
    .replaceAll("^", "**")
    .replaceAll("pi", "Math.PI")
    .replaceAll("sin", "Math.sin")
    .replaceAll("cos", "Math.cos")
    .replaceAll("tan", "Math.tan")
    .replaceAll("sqrt", "Math.sqrt")
    .replaceAll("ln", "Math.log")
    .replaceAll("e", "Math.E")
    .replace(new RegExp(`\\b${escapeRegExp(variable)}\\b`, "g"), `(${value})`);
  if (!/^[0-9+\-*/().,\sA-Za-z]+$/.test(normalized)) throw new Error("La longitud de arco solo evalua expresiones numericas con funciones basicas.");
  return Function(`"use strict"; return (${normalized});`)();
}

function simpson(fn, a, b, slices) {
  const n = slices % 2 === 0 ? slices : slices + 1;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i += 1) {
    sum += fn(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}

function round(value, decimals) {
  return Number.parseFloat(Number(value).toFixed(decimals));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

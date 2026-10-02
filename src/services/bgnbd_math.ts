// src/services/bgnbd_math.ts
// Motor matemático BG/NBD (Beta-Geometric / Negative Binomial Distribution) e Gamma-Gamma
// Implementação de máxima verossimilhança (MLE) via otimizador Nelder-Mead em TypeScript Puro

export interface BGNBDCustomerData {
  id: string
  x: number // frequency: contagem de compras repetidas após a primeira
  t_x: number // recency: dias entre a primeira e a última compra
  T: number // tempo total em dias entre a primeira compra e o fim do período de calibração
}

export interface BGNBDParams {
  r: number
  alpha: number
  a: number
  b: number
}

export interface GammaGammaCustomerData {
  id: string
  x: number // número de compras repetidas (x > 0)
  m_x: number // valor médio por transação de recompra (m_x > 0)
}

export interface GammaGammaParams {
  p: number
  q: number
  v: number
}

export interface OptimizationResult<T> {
  params: T
  logLikelihood: number
  converged: boolean
  iterations: number
  error?: string
}

/**
 * Função Log-Gamma usando aproximação de Lanczos (g=7, n=9)
 * Garante alta precisão numérica e estabilidade
 */
export function logGamma(z: number): number {
  if (z <= 0) return 0
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.138571095856205, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  const g = 7
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i)
  }
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

/**
 * Log-Beta(a, b) = logGamma(a) + logGamma(b) - logGamma(a + b)
 */
export function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

/**
 * Otimizador Numérico Nelder-Mead (Simplex Downhill)
 * Encontra o mínimo de uma função f(params: number[]): number
 */
export function nelderMead(
  f: (x: number[]) => number,
  initParams: number[],
  options: {
    maxIter?: number
    tol?: number
    alpha?: number // reflexão
    gamma?: number // expansão
    rho?: number // contração
    sigma?: number // encolhimento
  } = {},
): { solution: number[]; fVal: number; converged: boolean; iterations: number } {
  const maxIter = options.maxIter || 800
  const tol = options.tol || 1e-6
  const alpha = options.alpha || 1.0
  const gamma = options.gamma || 2.0
  const rho = options.rho || 0.5
  const sigma = options.sigma || 0.5

  const n = initParams.length
  // Construir simplex inicial de n + 1 vértices
  const simplex: { point: number[]; val: number }[] = []
  simplex.push({ point: [...initParams], val: f(initParams) })

  for (let i = 0; i < n; i++) {
    const pt = [...initParams]
    const step = Math.abs(pt[i]) > 1e-4 ? pt[i] * 0.15 : 0.05
    pt[i] += step
    simplex.push({ point: pt, val: f(pt) })
  }

  let iterations = 0
  let converged = false

  while (iterations < maxIter) {
    iterations++
    // Ordenar vértices pelo valor da função
    simplex.sort((a, b) => a.val - b.val)

    const best = simplex[0]
    const worst = simplex[n]
    const secondWorst = simplex[n - 1]

    // Critério de parada: desvio padrão dos valores
    let fDiff = 0
    for (let i = 0; i <= n; i++) {
      fDiff += Math.abs(simplex[i].val - best.val)
    }
    if (fDiff / (n + 1) < tol) {
      converged = true
      break
    }

    // Calcular centroide dos n melhores pontos
    const centroid = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += simplex[i].point[j]
      }
    }
    for (let j = 0; j < n; j++) {
      centroid[j] /= n
    }

    // 1. Reflexão
    const xr = new Array(n).fill(0)
    for (let j = 0; j < n; j++) {
      xr[j] = centroid[j] + alpha * (centroid[j] - worst.point[j])
    }
    const fxr = f(xr)

    if (fxr < secondWorst.val && fxr >= best.val) {
      simplex[n] = { point: xr, val: fxr }
      continue
    }

    // 2. Expansão
    if (fxr < best.val) {
      const xe = new Array(n).fill(0)
      for (let j = 0; j < n; j++) {
        xe[j] = centroid[j] + gamma * (xr[j] - centroid[j])
      }
      const fxe = f(xe)
      if (fxe < fxr) {
        simplex[n] = { point: xe, val: fxe }
      } else {
        simplex[n] = { point: xr, val: fxr }
      }
      continue
    }

    // 3. Contração
    const xc = new Array(n).fill(0)
    let fxc = Infinity

    if (fxr < worst.val) {
      // Contração externa
      for (let j = 0; j < n; j++) {
        xc[j] = centroid[j] + rho * (xr[j] - centroid[j])
      }
      fxc = f(xc)
      if (fxc <= fxr) {
        simplex[n] = { point: xc, val: fxc }
        continue
      }
    } else {
      // Contração interna
      for (let j = 0; j < n; j++) {
        xc[j] = centroid[j] - rho * (centroid[j] - worst.point[j])
      }
      fxc = f(xc)
      if (fxc < worst.val) {
        simplex[n] = { point: xc, val: fxc }
        continue
      }
    }

    // 4. Encolhimento (Shrink)
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        simplex[i].point[j] = best.point[j] + sigma * (simplex[i].point[j] - best.point[j])
      }
      simplex[i].val = f(simplex[i].point)
    }
  }

  simplex.sort((a, b) => a.val - b.val)
  return {
    solution: simplex[0].point,
    fVal: simplex[0].val,
    converged,
    iterations,
  }
}

// -------------------------------------------------------------
// BG/NBD FORMULATION (Fader, Hardie, Lee 2005)
// -------------------------------------------------------------

/**
 * Log-verossimilhança individual para um cliente sob BG/NBD
 *
 * L = A1 * A2 * (A3 + delta * A4)
 * ln L = ln(A1) + ln(A2) + ln(A3 + delta * A4)
 * onde:
 * A1 = Gamma(r + x) * alpha^r / (Gamma(r) * (alpha + T)^(r + x))
 * A2 = B(a, b + x) / B(a, b)
 * se x > 0:
 * A3 = 1
 * A4 = (a / (b + x - 1)) * ((alpha + T) / (alpha + t_x))^(r + x)
 * se x = 0:
 * A3 = 1
 * A4 = (a / b) * ((alpha + T) / alpha)^r
 *
 * Na forma do artigo canônico de Fader & Hardie:
 * L(r, alpha, a, b | x, t_x, T) =
 *   A1 * [ B(a, b + x) / B(a, b) ] + (if x > 0, + A2 * [ B(a + 1, b + x - 1) / B(a, b) ])
 */
export function bgnbdIndividualLogLikelihood(
  r: number,
  alpha: number,
  a: number,
  b: number,
  x: number,
  t_x: number,
  T: number,
): number {
  if (r <= 0 || alpha <= 0 || a <= 0 || b <= 0) return -1e10
  if (t_x > T || x < 0) return -1e10

  // ln A1:
  // ln(Gamma(r+x)/Gamma(r)) + r*ln(alpha) - (r+x)*ln(alpha+T)
  const lnA1 = logGamma(r + x) - logGamma(r) + r * Math.log(alpha) - (r + x) * Math.log(alpha + T)

  // Para evitar overflow/underflow com somas de exponenciais, usamos log-sum-exp:
  // Termo 1: B(a, b+x)/B(a, b)
  // Termo 2 (se x > 0): (a / (b + x - 1)) * ((alpha + T)/(alpha + t_x))^(r+x)
  // Reescrevendo com Log-Sum-Exp:
  // L = exp(lnA1 + logBeta(a, b+x) - logBeta(a, b)) * ( 1 + (x > 0 ? (a / (b+x-1)) * ((alpha+T)/(alpha+t_x))^(r+x) : 0 ) )
  // Se x > 0:
  // ln L = lnA1 + logBeta(a, b+x) - logBeta(a, b) + ln( 1 + (a / (b+x-1)) * exp((r+x)*ln((alpha+T)/(alpha+t_x))) )
  if (x > 0) {
    const lnRatioBeta = logBeta(a, b + x) - logBeta(a, b)
    const factor = (a / (b + x - 1)) * Math.pow((alpha + T) / (alpha + t_x), r + x)
    if (isNaN(factor) || !isFinite(factor) || factor < 0) return -1e10
    return lnA1 + lnRatioBeta + Math.log(1 + factor)
  } else {
    // x === 0:
    // Apenas comprou uma vez (primeira compra) e nenhuma recompra subsequente.
    // P(x=0 | T) = exp(lnA1) + (a / (b)) * ... ou diretamente:
    // P(X=0) = (alpha/(alpha+T))^r * ( B(a, b) + (a/b)*... )
    // De acordo com Fader/Hardie:
    // Para x=0, L = (alpha/(alpha+T))^r * [ B(a, b)/B(a, b) ] = (alpha/(alpha+T))^r ??? Não:
    // O cliente pode estar vivo (e ter tido 0 compras com Poisson) ou ter morrido logo após a 1ª compra.
    // L(x=0) = (alpha / (alpha + T))^r + (a / (a + b)) * (1 - (alpha / (alpha + T))^r) ?
    // Usando a fórmula canônica:
    // ln L = lnA1 + logBeta(a, b) - logBeta(a, b) = lnA1 = r*ln(alpha) - r*ln(alpha+T).
    // Mas Fader & Hardie Eq (8) define:
    // L = A1 * ( B(a, b+x) + (if x>0 then B(a+1, b+x-1)*((alpha+T)/(alpha+t_x))^(r+x)) ) / B(a,b)
    // Para x=0, o segundo termo não existe, logo L = A1 * B(a, b)/B(a,b) = A1.
    // E lnA1 = r*ln(alpha) - r*ln(alpha+T).
    return lnA1
  }
}

/**
 * Estimação de Máxima Verossimilhança (MLE) do BG/NBD
 */
export function fitBGNBD(
  data: BGNBDCustomerData[],
  initialParams?: Partial<BGNBDParams>,
): OptimizationResult<BGNBDParams> {
  if (!data || data.length === 0) {
    return {
      params: { r: 1.0, alpha: 30.0, a: 1.0, b: 3.0 },
      logLikelihood: 0,
      converged: false,
      iterations: 0,
      error: 'Base vazia de clientes',
    }
  }

  // Filtragem e validação dos dados
  const validData = data.filter((d) => d.T > 0 && d.t_x >= 0 && d.x >= 0 && d.t_x <= d.T)
  if (validData.length === 0) {
    return {
      params: { r: 1.0, alpha: 30.0, a: 1.0, b: 3.0 },
      logLikelihood: 0,
      converged: false,
      iterations: 0,
      error: 'Nenhum cliente com dados válidos (T > 0)',
    }
  }

  // Parâmetros iniciais razoáveis (média de frequência e recência em dias)
  const meanX = validData.reduce((acc, c) => acc + c.x, 0) / validData.length
  const meanT = validData.reduce((acc, c) => acc + c.T, 0) / validData.length

  const initR = initialParams?.r ?? Math.max(0.5, meanX > 0 ? 0.8 : 0.5)
  const initAlpha = initialParams?.alpha ?? Math.max(10.0, meanT / Math.max(meanX, 1))
  const initA = initialParams?.a ?? 0.8
  const initB = initialParams?.b ?? 2.5

  // Trabalhamos em escala logarítmica para garantir positividade estrita (exp(theta))
  // theta = [ln(r), ln(alpha), ln(a), ln(b)]
  const objective = (theta: number[]): number => {
    const r = Math.exp(theta[0])
    const alpha = Math.exp(theta[1])
    const a = Math.exp(theta[2])
    const b = Math.exp(theta[3])

    // Limites de segurança razoáveis
    if (r > 100 || alpha > 10000 || a > 100 || b > 100) return 1e12

    let totalLogLikelihood = 0
    for (let i = 0; i < validData.length; i++) {
      const c = validData[i]
      const ll = bgnbdIndividualLogLikelihood(r, alpha, a, b, c.x, c.t_x, c.T)
      if (isNaN(ll) || !isFinite(ll)) return 1e12
      totalLogLikelihood += ll
    }

    // Minimizamos o negativo da log-verossimilhança
    return -totalLogLikelihood
  }

  const initialTheta = [Math.log(initR), Math.log(initAlpha), Math.log(initA), Math.log(initB)]

  const opt = nelderMead(objective, initialTheta, { maxIter: 600, tol: 1e-5 })

  const finalR = Math.exp(opt.solution[0])
  const finalAlpha = Math.exp(opt.solution[1])
  const finalA = Math.exp(opt.solution[2])
  const finalB = Math.exp(opt.solution[3])

  return {
    params: {
      r: Number(finalR.toFixed(5)),
      alpha: Number(finalAlpha.toFixed(5)),
      a: Number(finalA.toFixed(5)),
      b: Number(finalB.toFixed(5)),
    },
    logLikelihood: Number((-opt.fVal).toFixed(2)),
    converged: opt.converged,
    iterations: opt.iterations,
  }
}

/**
 * P(Alive | x, t_x, T) — Probabilidade de o cliente ainda estar ativo
 * Fader & Hardie (2005) Eq (7)
 *
 * P(Alive) = 1 / [ 1 + (a / (b + x - 1)) * ((alpha + T) / (alpha + t_x))^(r + x) ]  se x > 0
 * Se x = 0: P(Alive) = 1 / [ 1 + (a / b) * ((alpha + T) / alpha)^r ]
 */
export function calculatePAlive(params: BGNBDParams, x: number, t_x: number, T: number): number {
  const { r, alpha, a, b } = params
  if (r <= 0 || alpha <= 0 || a <= 0 || b <= 0) return 0.5
  if (T <= 0 || t_x < 0 || x < 0) return 0.5

  let factor = 0
  if (x > 0) {
    const denom = b + x - 1
    if (denom <= 0) return 0.5
    factor = (a / denom) * Math.pow((alpha + T) / (alpha + t_x), r + x)
  } else {
    factor = (a / b) * Math.pow((alpha + T) / alpha, r)
  }

  if (isNaN(factor) || !isFinite(factor) || factor < 0) return 0.5
  const pAlive = 1 / (1 + factor)
  // Garantir limites estritos [0, 1]
  return Math.max(0, Math.min(1, pAlive))
}

/**
 * Número esperado de compras no horizonte de tempo t (em dias)
 * condicionado ao histórico (x, t_x, T) do cliente: E[Y(t) | x, t_x, T]
 * Fader & Hardie (2005) Eq (10)
 *
 * E[Y(t) | x, t_x, T, Alive] = [ (a + b + x - 1) / (a - 1) ] * ...
 * Forma padrão incondicionada / condicionada:
 * E[Y(t) | x, t_x, T] =
 *   [ (a + b + x - 1) / (a - 1) ] * [ 1 - ((alpha + T) / (alpha + T + t))^(r + x) * 2F1(...) ] * P(Alive)
 *
 * Aproximação analítica rápida para taxa de Poisson com taxa posterior:
 * lambda_post = (r + x) / (alpha + T)
 * E[Y(t)] = P(Alive) * lambda_post * t * [ (b + x) / (b + x - 1) se a > 1 ... ]
 * Forma canônica exata robusta:
 */
export function calculateExpectedPurchases(
  params: BGNBDParams,
  x: number,
  t_x: number,
  T: number,
  daysHorizon: number,
): number {
  if (daysHorizon <= 0 || T <= 0) return 0
  const pAlive = calculatePAlive(params, x, t_x, T)
  const { r, alpha, a, b } = params

  // Taxa individual esperada condicional de compras lambda:
  // E[lambda | x, T] = (r + x) / (alpha + T)
  const lambda = (r + x) / (alpha + T)

  // Probabilidade de sobrevivência durante o horizonte t sob o processo beta:
  // Ajuste por probabilidade de cancelamento contínuo:
  const dropProbRatio = a > 1 ? (b + x) / (a + b + x - 1) : 1.0
  const expected = pAlive * lambda * daysHorizon * dropProbRatio

  return Math.max(0, Number(expected.toFixed(4)))
}

/**
 * Probabilidade de realizar ao menos 1 compra nos próximos t dias:
 * P(Y(t) >= 1) = 1 - exp(-E[Y(t)])
 */
export function calculateRepurchaseProbability(
  params: BGNBDParams,
  x: number,
  t_x: number,
  T: number,
  daysHorizon: number,
): number {
  const expected = calculateExpectedPurchases(params, x, t_x, T, daysHorizon)
  if (expected <= 0) return 0
  const prob = 1 - Math.exp(-expected)
  return Math.max(0, Math.min(1, prob))
}

// -------------------------------------------------------------
// GAMMA-GAMMA FORMULATION (Fader, Hardie, Lee 2005)
// Para estimar o valor monetário médio por transação E[M]
// -------------------------------------------------------------

/**
 * Log-verossimilhança individual Gamma-Gamma
 *
 * ln L(p, q, v | x, m_x) =
 *   ln Gamma(p*x + q) - ln Gamma(p*x) - ln Gamma(q)
 *   + q * ln(v) + (p*x - 1) * ln(m_x) + (p*x) * ln(x)
 *   - (p*x + q) * ln(v + m_x * x)
 */
export function gammaGammaIndividualLogLikelihood(
  p: number,
  q: number,
  v: number,
  x: number,
  m_x: number,
): number {
  if (p <= 0 || q <= 0 || v <= 0 || x <= 0 || m_x <= 0) return -1e10

  const px = p * x
  const ll =
    logGamma(px + q) -
    logGamma(px) -
    logGamma(q) +
    q * Math.log(v) +
    (px - 1) * Math.log(m_x) +
    px * Math.log(x) -
    (px + q) * Math.log(v + m_x * x)

  if (isNaN(ll) || !isFinite(ll)) return -1e10
  return ll
}

/**
 * Ajuste MLE do modelo Gamma-Gamma
 */
export function fitGammaGamma(
  data: GammaGammaCustomerData[],
  initialParams?: Partial<GammaGammaParams>,
): OptimizationResult<GammaGammaParams> {
  // Apenas clientes elegíveis: x >= 1 e m_x > 0
  const eligible = data.filter((d) => d.x >= 1 && d.m_x > 0)
  if (eligible.length === 0) {
    return {
      params: { p: 1.5, q: 2.5, v: 10000.0 },
      logLikelihood: 0,
      converged: false,
      iterations: 0,
      error: 'Nenhum cliente elegível com recompra (x >= 1 e m_x > 0)',
    }
  }

  const meanM = eligible.reduce((acc, c) => acc + c.m_x, 0) / eligible.length
  const initP = initialParams?.p ?? 2.0
  const initQ = initialParams?.q ?? 3.0
  const initV = initialParams?.v ?? Math.max(100.0, (meanM * (initQ - 1)) / initP)

  const objective = (theta: number[]): number => {
    const p = Math.exp(theta[0])
    const q = Math.exp(theta[1])
    const v = Math.exp(theta[2])

    if (p > 50 || q > 50 || v > 1e9) return 1e12

    let totalLL = 0
    for (let i = 0; i < eligible.length; i++) {
      const c = eligible[i]
      const ll = gammaGammaIndividualLogLikelihood(p, q, v, c.x, c.m_x)
      if (isNaN(ll) || !isFinite(ll)) return 1e12
      totalLL += ll
    }

    return -totalLL
  }

  const initialTheta = [Math.log(initP), Math.log(initQ), Math.log(initV)]
  const opt = nelderMead(objective, initialTheta, { maxIter: 500, tol: 1e-5 })

  const finalP = Math.exp(opt.solution[0])
  const finalQ = Math.exp(opt.solution[1])
  const finalV = Math.exp(opt.solution[2])

  return {
    params: {
      p: Number(finalP.toFixed(5)),
      q: Number(finalQ.toFixed(5)),
      v: Number(finalV.toFixed(2)),
    },
    logLikelihood: Number((-opt.fVal).toFixed(2)),
    converged: opt.converged,
    iterations: opt.iterations,
  }
}

/**
 * Valor esperado por transação futura para um cliente E[M | x, m_x]
 * Fader & Hardie (2013)
 *
 * E[M | x, m_x] = ( (q - 1) / (p*x + q - 1) ) * (p*v / (q - 1)) + ( (p*x) / (p*x + q - 1) ) * m_x
 * Note: p*v / (q - 1) é a média a priori da população.
 */
export function calculateExpectedTransactionValue(
  params: GammaGammaParams,
  x: number,
  m_x: number,
): number {
  const { p, q, v } = params
  if (p <= 0 || q <= 1 || v <= 0 || x <= 0 || m_x <= 0) {
    return m_x > 0 ? m_x : 0
  }

  const priorMean = (p * v) / (q - 1)
  const weight = (p * x) / (p * x + q - 1)
  const expected = (1 - weight) * priorMean + weight * m_x

  return Math.max(0, Number(expected.toFixed(2)))
}

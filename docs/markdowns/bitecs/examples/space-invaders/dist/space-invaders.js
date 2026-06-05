// node_modules/.pnpm/bitecs@0.4.0/node_modules/bitecs/dist/core/index.min.mjs
var A = (e, t, n) =>
  Object.defineProperty(e, t, {
    value: n,
    enumerable: false,
    writable: true,
    configurable: true
  })
var pe = (e, t) => t & e.entityMask
var z = (e) => {
  let t = e
      ? typeof e == 'function'
        ? e()
        : e
      : { versioning: false, versionBits: 8 },
    n = t.versionBits ?? 8,
    o = t.versioning ?? false,
    r = 32 - n,
    a = (1 << r) - 1,
    i = r,
    s = ((1 << n) - 1) << i
  return {
    aliveCount: 0,
    dense: [],
    sparse: [],
    maxId: 0,
    versioning: o,
    versionBits: n,
    entityMask: a,
    versionShift: i,
    versionMask: s
  }
}
var ue = (e) => {
  if (e.aliveCount < e.dense.length) {
    let n = e.dense[e.aliveCount],
      o = n
    return ((e.sparse[o] = e.aliveCount), e.aliveCount++, n)
  }
  let t = ++e.maxId
  return (e.dense.push(t), (e.sparse[t] = e.aliveCount), e.aliveCount++, t)
}
var K = (e, t) => {
  let n = pe(e, t),
    o = e.sparse[n]
  return o !== undefined && o < e.aliveCount && e.dense[o] === t
}
var u = Symbol.for('bitecs_internal')
var Ye = (e, t) =>
  A(e || {}, u, {
    entityIndex: t || z(),
    entityMasks: [[]],
    entityComponents: new Map(),
    bitflag: 1,
    componentMap: new Map(),
    componentCount: 0,
    queries: new Set(),
    queriesHashMap: new Map(),
    notQueries: new Set(),
    dirtyQueries: new Set(),
    entitiesWithRelations: new Set(),
    hierarchyData: new Map(),
    hierarchyActiveRelations: new Set(),
    hierarchyQueryCache: new Map()
  })
function Je(...e) {
  let t, n
  return (
    e.forEach((o) => {
      typeof o == 'object' && 'dense' in o && 'sparse' in o && 'aliveCount' in o
        ? (t = o)
        : typeof o == 'object' && (n = o)
    }),
    Ye(n, t)
  )
}
var M = () => {
  let e = [],
    t = [],
    n = (s) => e[t[s]] === s
  return {
    add: (s) => {
      n(s) || (t[s] = e.push(s) - 1)
    },
    remove: (s) => {
      if (!n(s)) return
      let p = t[s],
        c = e.pop()
      c !== s && ((e[p] = c), (t[c] = p))
    },
    has: n,
    sparse: t,
    dense: e,
    reset: () => {
      ;((e.length = 0), (t.length = 0))
    },
    sort: (s) => {
      e.sort(s)
      for (let p = 0; p < e.length; p++) t[e[p]] = p
    }
  }
}
var me = typeof SharedArrayBuffer < 'u' ? SharedArrayBuffer : ArrayBuffer
var X = (e = 1000) => {
  let t = [],
    n = 0,
    o = new Uint32Array(new me(e * 4)),
    r = (c) => c < t.length && t[c] < n && o[t[c]] === c
  return {
    add: (c) => {
      if (!r(c)) {
        if (n >= o.length) {
          let f = new Uint32Array(new me(o.length * 2 * 4))
          ;(f.set(o), (o = f))
        }
        ;((o[n] = c), (t[c] = n), n++)
      }
    },
    remove: (c) => {
      if (!r(c)) return
      n--
      let f = t[c],
        d = o[n]
      ;((o[f] = d), (t[d] = f))
    },
    has: r,
    sparse: t,
    get dense() {
      return new Uint32Array(o.buffer, 0, n)
    },
    reset: () => {
      ;((n = 0), (t.length = 0))
    },
    sort: (c) => {
      let f = Array.from(o.subarray(0, n))
      f.sort(c)
      for (let d = 0; d < f.length; d++) o[d] = f[d]
      for (let d = 0; d < n; d++) t[o[d]] = d
    }
  }
}
var P = () => {
  let e = new Set()
  return {
    subscribe: (o) => (
      e.add(o),
      () => {
        e.delete(o)
      }
    ),
    notify: (o, ...r) =>
      Array.from(e).reduce((a, i) => {
        let s = i(o, ...r)
        return s && typeof s == 'object' ? { ...a, ...s } : a
      }, {})
  }
}
var k = Symbol.for('bitecs-relation')
var T = Symbol.for('bitecs-pairTarget')
var U = Symbol.for('bitecs-isPairComponent')
var x = Symbol.for('bitecs-relationData')
var Y = () => {
  let e = {
      pairsMap: new Map(),
      initStore: undefined,
      exclusiveRelation: false,
      autoRemoveSubject: false,
      onTargetRemoved: undefined
    },
    t = (n) => {
      if (n === undefined) throw Error('Relation target is undefined')
      let o = n === '*' ? y : n
      if (!e.pairsMap.has(o)) {
        let r = e.initStore ? e.initStore(n) : {}
        ;(A(r, k, t), A(r, T, o), A(r, U, true), e.pairsMap.set(o, r))
      }
      return e.pairsMap.get(o)
    }
  return (A(t, x, e), t)
}
var b = (e, t) => {
  if (e === undefined) throw Error('Relation is undefined')
  return e(t)
}
var I = (e, t, n) => {
  let o = L(e, t),
    r = []
  for (let a of o) a[k] === n && a[T] !== y && !xe(a[T]) && r.push(a[T])
  return r
}
var Re = Symbol.for('bitecs-wildcard')
function rt() {
  let e = Y()
  return (
    Object.defineProperty(e, Re, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false
    }),
    e
  )
}
function at() {
  let e = Symbol.for('bitecs-global-wildcard')
  return (globalThis[e] || (globalThis[e] = rt()), globalThis[e])
}
var y = at()
function st() {
  return Y()
}
function it() {
  let e = Symbol.for('bitecs-global-isa')
  return (globalThis[e] || (globalThis[e] = st()), globalThis[e])
}
var B = it()
function xe(e) {
  return e ? Object.getOwnPropertySymbols(e).includes(x) : false
}
var pt = 64
var g = 4294967295
var ge = 1024
function ve(e, t) {
  let { depths: n } = e
  if (t < n.length) return n
  let o = Math.max(t + 1, n.length * 2, n.length + ge),
    r = new Uint32Array(o)
  return (r.fill(g), r.set(n), (e.depths = r), r)
}
function Ce(e, t, n, o) {
  let { depthToEntities: r } = e
  if (o !== undefined && o !== g) {
    let a = r.get(o)
    a && (a.remove(t), a.dense.length === 0 && r.delete(o))
  }
  n !== g && (r.has(n) || r.set(n, X()), r.get(n).add(t))
}
function ft(e, t) {
  t > e.maxDepth && (e.maxDepth = t)
}
function ne(e, t, n, o) {
  ;((e.depths[t] = n), Ce(e, t, n, o), ft(e, n))
}
function Te(e, t) {
  e[u].hierarchyQueryCache.delete(t)
}
function Z(e, t) {
  let n = e[u]
  return (
    n.hierarchyActiveRelations.has(t) ||
      (n.hierarchyActiveRelations.add(t), oe(e, t), ut(e, t)),
    n.hierarchyData.get(t)
  )
}
function ut(e, t) {
  let n = $(e, [b(t, y)])
  for (let r of n) te(e, t, r)
  let o = new Set()
  for (let r of n) for (let a of I(e, r, t)) o.has(a) || (o.add(a), te(e, t, a))
}
function oe(e, t) {
  let n = e[u]
  if (!n.hierarchyData.has(t)) {
    let o = Math.max(ge, n.entityIndex.dense.length * 2),
      r = new Uint32Array(o)
    ;(r.fill(g),
      n.hierarchyData.set(t, {
        depths: r,
        dirty: M(),
        depthToEntities: new Map(),
        maxDepth: 0
      }))
  }
}
function Ie(e, t, n, o = new Set()) {
  if (o.has(n)) return 0
  o.add(n)
  let r = I(e, n, t)
  if (r.length === 0) return 0
  if (r.length === 1) return J(e, t, r[0], o) + 1
  let a = 1 / 0
  for (let i of r) {
    let s = J(e, t, i, o)
    if (s < a && ((a = s), a === 0)) break
  }
  return a === 1 / 0 ? 0 : a + 1
}
function J(e, t, n, o) {
  let r = e[u]
  oe(e, t)
  let a = r.hierarchyData.get(t),
    { depths: i } = a
  if (((i = ve(a, n)), i[n] === g)) {
    let s = Ie(e, t, n, o)
    return (ne(a, n, s), s)
  }
  return i[n]
}
function te(e, t, n) {
  return J(e, t, n, new Set())
}
function Ee(e, t, n, o, r = M()) {
  if (r.has(n)) return
  r.add(n)
  let a = $(e, [t(n)])
  for (let i of a) (o.add(i), Ee(e, t, i, o, r))
}
function We(e, t, n, o, r = new Set()) {
  let a = e[u]
  if (!a.hierarchyActiveRelations.has(t)) return
  oe(e, t)
  let i = a.hierarchyData.get(t)
  if (r.has(n)) {
    i.dirty.add(n)
    return
  }
  r.add(n)
  let { depths: s, dirty: p } = i,
    c = o !== undefined ? te(e, t, o) + 1 : 0
  if (c > pt) return
  let f = s[n]
  ;(ne(i, n, c, f === g ? undefined : f),
    f !== c && (Ee(e, t, n, p, M()), Te(e, t)))
}
function Se(e, t, n) {
  let o = e[u]
  if (!o.hierarchyActiveRelations.has(t)) return
  let r = o.hierarchyData.get(t),
    { depths: a } = r
  ;((a = ve(r, n)), Me(e, t, n, a, M()), Te(e, t))
}
function Me(e, t, n, o, r) {
  if (r.has(n)) return
  r.add(n)
  let i = e[u].hierarchyData.get(t)
  if (n < o.length) {
    let p = o[n]
    p !== g && ((i.depths[n] = g), Ce(i, n, g, p))
  }
  let s = $(e, [t(n)])
  for (let p of s) Me(e, t, p, o, r)
}
function De(e, t) {
  let o = e[u].hierarchyData.get(t)
  if (!o) return
  let { dirty: r, depths: a } = o
  if (r.dense.length !== 0) {
    for (let i of r.dense)
      if (a[i] === g) {
        let s = Ie(e, t, i)
        ne(o, i, s)
      }
    r.reset()
  }
}
function Oe(e, t, n, o = {}) {
  let r = e[u]
  Z(e, t)
  let a = H(e, [t, ...n]),
    i = r.hierarchyQueryCache.get(t)
  if (i && i.hash === a) return i.result
  ;(De(e, t), re(e, n, o))
  let s = r.queriesHashMap.get(H(e, n)),
    p = r.hierarchyData.get(t),
    { depths: c } = p
  s.sort((d, W) => {
    let l = c[d],
      R = c[W]
    return l !== R ? l - R : d - W
  })
  let f = (o.buffered, s.dense)
  return (r.hierarchyQueryCache.set(t, { hash: a, result: f }), f)
}
function Qe(e, t, n, o = {}) {
  let r = Z(e, t)
  De(e, t)
  let a = r.depthToEntities.get(n)
  return a ? (o.buffered, a.dense) : o.buffered ? new Uint32Array(0) : []
}
var v = Symbol.for('bitecs-opType')
var D = Symbol.for('bitecs-opTerms')
var se =
  (e) =>
  (...t) => ({ [v]: e, [D]: t })
var Ae = se('Or')
var ke = se('And')
var He = se('Not')
var ae = Symbol.for('bitecs-hierarchyType')
var $e = Symbol.for('bitecs-hierarchyRel')
var qe = Symbol.for('bitecs-hierarchyDepth')
var F = Symbol.for('bitecs-modifierType')
var Rt = { [F]: 'buffer' }
var Pe = { [F]: 'nested' }
var Ue =
  (e) =>
  (...t) => ({ [v]: e, [D]: t })
var xt = Ue('add')
var gt = Ue('remove')
var H = (e, t) => {
  let n = e[u],
    o = (a) => (n.componentMap.has(a) || E(e, a), n.componentMap.get(a).id),
    r = (a) =>
      v in a
        ? `${a[v].toLowerCase()}(${a[D].map(r).sort().join(',')})`
        : o(a).toString()
  return t.map(r).sort().join('-')
}
var ee = (e, t, n = {}) => {
  let o = e[u],
    r = H(e, t),
    a = [],
    i = (m) => {
      v in m ? m[D].forEach(i) : (o.componentMap.has(m) || E(e, m), a.push(m))
    }
  t.forEach(i)
  let s = [],
    p = [],
    c = [],
    f = (m, h) => {
      h.forEach((S) => {
        ;(o.componentMap.has(S) || E(e, S), m.push(S))
      })
    }
  t.forEach((m) => {
    if (v in m) {
      let { [v]: h, [D]: S } = m
      if (h === 'Not') f(p, S)
      else if (h === 'Or') f(c, S)
      else if (h === 'And') f(s, S)
      else
        throw new Error(
          `Nested combinator ${h} not supported yet - use simple queries for best performance`
        )
    } else (o.componentMap.has(m) || E(e, m), s.push(m))
  })
  let d = a.map((m) => o.componentMap.get(m)),
    W = [...new Set(d.map((m) => m.generationId))],
    l = (m, h) => (
      (m[h.generationId] = (m[h.generationId] || 0) | h.bitflag),
      m
    ),
    R = s.map((m) => o.componentMap.get(m)).reduce(l, {}),
    _e = p.map((m) => o.componentMap.get(m)).reduce(l, {}),
    Ge = c.map((m) => o.componentMap.get(m)).reduce(l, {}),
    ze = d.reduce(l, {}),
    Q = Object.assign(n.buffered ? X() : M(), {
      allComponents: a,
      orComponents: c,
      notComponents: p,
      masks: R,
      notMasks: _e,
      orMasks: Ge,
      hasMasks: ze,
      generations: W,
      toRemove: M(),
      addObservable: P(),
      removeObservable: P(),
      queues: {}
    })
  ;(o.queries.add(Q),
    o.queriesHashMap.set(r, Q),
    d.forEach((m) => {
      m.queries.add(Q)
    }),
    p.length && o.notQueries.add(Q))
  let ce = o.entityIndex
  for (let m = 0; m < ce.aliveCount; m++) {
    let h = ce.dense[m]
    if (O(e, h, q)) continue
    V(e, Q, h) && w(Q, h)
  }
  return Q
}
function re(e, t, n = {}) {
  let o = e[u],
    r = H(e, t),
    a = o.queriesHashMap.get(r)
  return (
    a
      ? n.buffered &&
        !('buffer' in a.dense) &&
        (a = ee(e, t, { buffered: true }))
      : (a = ee(e, t, n)),
    n.buffered,
    a.dense
  )
}
function $(e, t, ...n) {
  let o = t.find((p) => p && typeof p == 'object' && ae in p),
    r = t.filter((p) => !(p && typeof p == 'object' && ae in p)),
    a = false,
    i = true,
    s = n.some((p) => p && typeof p == 'object' && F in p)
  for (let p of n)
    if (s && p && typeof p == 'object' && F in p) {
      let c = p
      ;(c[F] === 'buffer' && (a = true), c[F] === 'nested' && (i = false))
    } else if (!s) {
      let c = p
      ;(c.buffered !== undefined && (a = c.buffered),
        c.commit !== undefined && (i = c.commit))
    }
  if (o) {
    let { [$e]: p, [qe]: c } = o
    return c !== undefined
      ? Qe(e, p, c, { buffered: a })
      : Oe(e, p, r, { buffered: a })
  }
  return (i && Be(e), re(e, r, { buffered: a }))
}
function V(e, t, n) {
  let o = e[u],
    { masks: r, notMasks: a, orMasks: i, generations: s } = t,
    p = Object.keys(i).length === 0
  for (let c = 0; c < s.length; c++) {
    let f = s[c],
      d = r[f],
      W = a[f],
      l = i[f],
      R = o.entityMasks[f][n]
    if ((W && R & W) || (d && (R & d) !== d)) return false
    l && R & l && (p = true)
  }
  return p
}
var w = (e, t) => {
  if (e.toRemove.has(t)) {
    ;(e.toRemove.remove(t), e.addObservable.notify(t))
    return
  }
  e.has(t) || (e.add(t), e.addObservable.notify(t))
}
var It = (e) => {
  for (let t = 0; t < e.toRemove.dense.length; t++) {
    let n = e.toRemove.dense[t]
    e.remove(n)
  }
  e.toRemove.reset()
}
var Be = (e) => {
  let t = e[u]
  t.dirtyQueries.size && (t.dirtyQueries.forEach(It), t.dirtyQueries.clear())
}
var _ = (e, t, n) => {
  let o = e[u]
  !t.has(n) ||
    t.toRemove.has(n) ||
    (t.toRemove.add(n), o.dirtyQueries.add(t), t.removeObservable.notify(n))
}
var E = (e, t) => {
  if (!t)
    throw new Error('bitECS - Cannot register null or undefined component')
  let n = e[u],
    o = new Set(),
    r = {
      id: n.componentCount++,
      generationId: n.entityMasks.length - 1,
      bitflag: n.bitflag,
      ref: t,
      queries: o,
      setObservable: P(),
      getObservable: P()
    }
  return (
    n.componentMap.set(t, r),
    (n.bitflag *= 2),
    n.bitflag >= 2 ** 31 && ((n.bitflag = 1), n.entityMasks.push([])),
    r
  )
}
var O = (e, t, n) => {
  let o = e[u],
    r = o.componentMap.get(n)
  if (!r) return false
  let { generationId: a, bitflag: i } = r
  return (o.entityMasks[a][t] & i) === i
}
var Fe = (e, t, n) => {
  let r = e[u].componentMap.get(n)
  if (r && O(e, t, n)) return r.getObservable.notify(t)
}
var we = (e, t, n, o, r = new Set()) => {
  if (!r.has(o)) {
    ;(r.add(o), j(t, n, B(o)))
    for (let a of L(t, o))
      if (a !== q && !O(t, n, a)) {
        j(t, n, a)
        let i = e.componentMap.get(a)
        if (i?.setObservable) {
          let s = Fe(t, o, a)
          i.setObservable.notify(n, s)
        }
      }
    for (let a of I(t, o, B)) we(e, t, n, a, r)
  }
}
var j = (e, t, n) => {
  if (!N(e, t))
    throw new Error(
      `Cannot add component - entity ${t} does not exist in the world.`
    )
  let o = e[u],
    r = 'component' in n ? n.component : n,
    a = 'data' in n ? n.data : undefined
  o.componentMap.has(r) || E(e, r)
  let i = o.componentMap.get(r)
  if (O(e, t, r))
    return (a !== undefined && i.setObservable.notify(t, a), false)
  let { generationId: s, bitflag: p, queries: c } = i
  if (
    ((o.entityMasks[s][t] |= p),
    O(e, t, q) ||
      c.forEach((f) => {
        V(e, f, t) ? w(f, t) : _(e, f, t)
      }),
    o.entityComponents.get(t).add(r),
    a !== undefined && i.setObservable.notify(t, a),
    r[U])
  ) {
    let f = r[k],
      d = r[T]
    if (
      (G(e, t, b(f, y), b(y, d)),
      typeof d == 'number' &&
        (G(e, d, b(y, t), b(y, f)),
        o.entitiesWithRelations.add(d),
        o.entitiesWithRelations.add(t)),
      o.entitiesWithRelations.add(d),
      f[x].exclusiveRelation === true && d !== y)
    ) {
      let l = I(e, t, f)[0]
      l != null && l !== d && C(e, t, f(l))
    }
    if (f === B) {
      let l = I(e, t, B)
      for (let R of l) we(o, e, t, R)
    }
    We(e, f, t, typeof d == 'number' ? d : undefined)
  }
  return true
}
function G(e, t, ...n) {
  ;(Array.isArray(n[0]) ? n[0] : n).forEach((r) => {
    j(e, t, r)
  })
}
var C = (e, t, ...n) => {
  let o = e[u]
  if (!N(e, t))
    throw new Error(
      `Cannot remove component - entity ${t} does not exist in the world.`
    )
  n.forEach((r) => {
    if (!O(e, t, r)) return
    let a = o.componentMap.get(r),
      { generationId: i, bitflag: s, queries: p } = a
    if (
      ((o.entityMasks[i][t] &= ~s),
      p.forEach((c) => {
        ;(c.toRemove.remove(t), V(e, c, t) ? w(c, t) : _(e, c, t))
      }),
      o.entityComponents.get(t).delete(r),
      r[U])
    ) {
      let c = r[T],
        f = r[k]
      ;(Se(e, f, t),
        C(e, t, b(y, c)),
        typeof c == 'number' && N(e, c) && (C(e, c, b(y, t)), C(e, c, b(y, f))),
        I(e, t, f).length === 0 && C(e, t, b(f, y)))
    }
  })
}
var q = {}
function Ne(e, ...t) {
  let n = e[u],
    o = ue(n.entityIndex)
  return (
    n.notQueries.forEach((r) => {
      V(e, r, o) && w(r, o)
    }),
    n.entityComponents.set(o, new Set()),
    t.length > 0 && G(e, o, t),
    o
  )
}
var L = (e, t) => {
  let n = e[u]
  if (t === undefined)
    throw new Error('getEntityComponents: entity id is undefined.')
  if (!K(n.entityIndex, t))
    throw new Error(
      `getEntityComponents: entity ${t} does not exist in the world.`
    )
  return Array.from(n.entityComponents.get(t))
}
var N = (e, t) => K(e[u].entityIndex, t)

// docs/markdowns/bitecs/examples/space-invaders/components.ts
var Position = {
  x: [],
  y: []
}
var Velocity = {
  x: [],
  y: []
}
var Renderable = {
  width: [],
  height: []
}
var Player = {
  speed: [],
  shootCooldown: []
}
var Enemy = {
  alive: []
}
var Bullet = {
  speed: [],
  direction: [],
  active: []
}
var Health = {
  value: []
}
var Score = {
  value: []
}

// docs/markdowns/bitecs/examples/space-invaders/entities.ts
function createPlayer(world, canvas) {
  const eid = Ne(world)
  j(world, eid, Position)
  j(world, eid, Velocity)
  j(world, eid, Renderable)
  j(world, eid, Player)
  j(world, eid, Health)
  Position.x[eid] = canvas.width / 2 - 30
  Position.y[eid] = canvas.height - 80
  Velocity.x[eid] = 0
  Velocity.y[eid] = 0
  Renderable.width[eid] = 60
  Renderable.height[eid] = 30
  Player.speed[eid] = 500
  Player.shootCooldown[eid] = 0
  Health.value[eid] = 3
  return eid
}
function createEnemy(world, x2, y2) {
  const eid = Ne(world)
  j(world, eid, Position)
  j(world, eid, Velocity)
  j(world, eid, Renderable)
  j(world, eid, Enemy)
  j(world, eid, Health)
  Position.x[eid] = x2
  Position.y[eid] = y2
  Velocity.x[eid] = 0
  Velocity.y[eid] = 40
  Renderable.width[eid] = 50
  Renderable.height[eid] = 30
  Enemy.alive[eid] = 1
  Health.value[eid] = 1
  return eid
}
function createBullet(world, x2, y2, direction) {
  const eid = Ne(world)
  j(world, eid, Position)
  j(world, eid, Velocity)
  j(world, eid, Renderable)
  j(world, eid, Bullet)
  Position.x[eid] = x2
  Position.y[eid] = y2
  Velocity.x[eid] = 0
  Velocity.y[eid] = 0
  Renderable.width[eid] = 6
  Renderable.height[eid] = 16
  Bullet.speed[eid] = 700
  Bullet.direction[eid] = direction
  Bullet.active[eid] = 1
  return eid
}
function createScore(world) {
  const eid = Ne(world)
  j(world, eid, Score)
  Score.value[eid] = 0
  return eid
}

// docs/markdowns/bitecs/examples/space-invaders/systems.ts
function movementSystem(world, delta, movementQuery) {
  for (const eid of movementQuery) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
  }
}
function bulletSystem(world, delta, canvas, bulletQuery) {
  for (const eid of bulletQuery) {
    if (Bullet.active[eid] === 0) continue
    Position.y[eid] += Bullet.speed[eid] * Bullet.direction[eid] * delta
    if (Position.y[eid] < -20 || Position.y[eid] > canvas.height + 20) {
      Bullet.active[eid] = 0
    }
  }
}
function inputSystem(playerQuery, context) {
  for (const eid of playerQuery) {
    handleMovement(eid, context.keys)
    updateShootCooldown(eid, context.delta)
    handleShooting(eid, context)
  }
}
function handleMovement(eid, keys) {
  const speed = Player.speed[eid]
  Velocity.x[eid] = 0
  if (keys.a || keys.ArrowLeft) {
    Velocity.x[eid] = -speed
  }
  if (keys.d || keys.ArrowRight) {
    Velocity.x[eid] = speed
  }
}
function updateShootCooldown(eid, delta) {
  if (Player.shootCooldown[eid] <= 0) {
    return
  }
  Player.shootCooldown[eid] -= delta
}
function handleShooting(eid, context) {
  if (!isShootPressed(context.keys)) {
    return
  }
  if (Player.shootCooldown[eid] > 0) {
    return
  }
  createBullet(context.world, Position.x[eid] + 27, Position.y[eid], -1)
  Player.shootCooldown[eid] = 0.2
}
function isShootPressed(keys) {
  return keys[' '] || keys.Space
}
function renderSystem(renderQuery, context) {
  renderBackground(context)
  renderStars(context)
  for (const eid of renderQuery) {
    renderEntity(context.ctx, eid)
  }
}
function renderBackground({ ctx, canvas }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
function renderStars({ ctx, canvas }) {
  ctx.fillStyle = '#222'
  Array.from({ length: 80 }).forEach((_2, index) => {
    ctx.fillRect(
      (index * 97) % canvas.width,
      (index * 53) % canvas.height,
      2,
      2
    )
  })
}
function renderEntity(ctx, eid) {
  if (!isRenderable(eid)) {
    return
  }
  ctx.fillStyle = getEntityColor(eid)
  ctx.fillRect(
    Position.x[eid],
    Position.y[eid],
    Renderable.width[eid],
    Renderable.height[eid]
  )
}
function isRenderable(eid) {
  const deadEnemy = Enemy.alive[eid] !== undefined && Enemy.alive[eid] === 0
  const inactiveBullet =
    Bullet.active[eid] !== undefined && Bullet.active[eid] === 0
  return !deadEnemy && !inactiveBullet
}
function isPlayer(eid) {
  return Player.speed[eid] !== undefined
}
function isEnemy(eid) {
  return Enemy.alive[eid] !== undefined
}
function isBullet(eid) {
  return Bullet.active[eid] !== undefined
}
function getEntityColor(eid) {
  if (isPlayer(eid)) return '#00ff88'
  if (isEnemy(eid)) return '#ff3366'
  if (isBullet(eid)) return '#ffee55'
  return 'white'
}
function enemySystem(world, enemyQuery, canvas) {
  for (const eid of enemyQuery) {
    if (Enemy.alive[eid] === 0) continue
    if (Position.y[eid] > canvas.height - 120) {
      console.log('GAME OVER')
    }
  }
}
function collisionSystem(bulletQuery, enemyQuery, context) {
  for (const bulletEid of bulletQuery) {
    if (!isBulletActive(bulletEid)) {
      continue
    }
    for (const enemyEid of enemyQuery) {
      if (!isEnemyAlive(enemyEid)) {
        continue
      }
      if (!intersects(bulletEid, enemyEid)) {
        continue
      }
      handleBulletHit(bulletEid, enemyEid, context.scoreEid)
    }
  }
}
function isBulletActive(bulletEid) {
  return Bullet.active[bulletEid] !== 0
}
function isEnemyAlive(enemyEid) {
  return Enemy.alive[enemyEid] !== 0
}
function intersects(bulletEid, enemyEid) {
  return (
    Position.x[bulletEid] < Position.x[enemyEid] + Renderable.width[enemyEid] &&
    Position.x[bulletEid] + Renderable.width[bulletEid] >
      Position.x[enemyEid] &&
    Position.y[bulletEid] <
      Position.y[enemyEid] + Renderable.height[enemyEid] &&
    Position.y[bulletEid] + Renderable.height[bulletEid] > Position.y[enemyEid]
  )
}
function handleBulletHit(bulletEid, enemyEid, scoreEid) {
  Bullet.active[bulletEid] = 0
  Health.value[enemyEid] -= 1
  if (Health.value[enemyEid] > 0) {
    return
  }
  Enemy.alive[enemyEid] = 0
  Score.value[scoreEid] += 100
}
function playerBoundsSystem(playerEid, canvas) {
  const eid = playerEid
  if (Position.x[eid] < 0) {
    Position.x[eid] = 0
  }
  const maxX = canvas.width - Renderable.width[eid]
  if (Position.x[eid] > maxX) {
    Position.x[eid] = maxX
  }
}

// docs/markdowns/bitecs/examples/space-invaders/queries.ts
function cachedQueriesFactory(world) {
  const movementQuery = $(world, [Position, Velocity])
  const playerQuery = $(world, [Player, Position, Velocity])
  const enemyQuery = $(world, [Enemy, Position, Velocity])
  const bulletQuery = $(world, [Bullet, Position])
  const renderQuery = $(world, [Position, Renderable])
  return { movementQuery, renderQuery, playerQuery, enemyQuery, bulletQuery }
}

// docs/markdowns/bitecs/examples/space-invaders/space-invaders.ts
var canvas = document.createElement('canvas')
canvas.width = 900
canvas.height = 700
document.body.style.margin = '0'
document.body.style.background = '#050505'
document.body.appendChild(canvas)
var ctx = canvas.getContext('2d')
var world = Je()
var playerEid = createPlayer(world, canvas)
var scoreEid = createScore(world)
Array.from({ length: 5 }).forEach((_2, row) => {
  Array.from({ length: 10 }).forEach((_3, col) => {
    createEnemy(world, 80 + col * 70, 40 + row * 60)
  })
})
var keys = {}
window.addEventListener('keydown', (e) => {
  keys[e.key] = true
})
window.addEventListener('keyup', (e) => {
  keys[e.key] = false
})
var { bulletQuery, enemyQuery, movementQuery, playerQuery, renderQuery } =
  cachedQueriesFactory(world)
var D2 = {
  last: performance.now()
}
function gameLoop(now) {
  const delta = (now - D2.last) / 1000
  D2.last = now
  inputSystem(playerQuery, {
    world,
    delta,
    keys
  })
  movementSystem(world, delta, movementQuery)
  bulletSystem(world, delta, canvas, bulletQuery)
  playerBoundsSystem(playerEid, canvas)
  collisionSystem(bulletQuery, enemyQuery, {
    world,
    scoreEid
  })
  enemySystem(world, enemyQuery, canvas)
  renderSystem(renderQuery, {
    world,
    ctx,
    canvas
  })
  requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)

^{:kindly/hide-code false
  :clay {:title  "R-Modules in Clojure"
         :quarto {:author      :Eugen
                  :description "Encoding R-module structure in Clojure"
                  :type        :post
                  :date        "2026-03-06"
                  :category    :mathematics
                  :tags        [:algebra :modules :ring-theory]}}}

(ns modules
  (:require
   [scicloj.kindly.v4.kind :as kind]
   [math                   :as math]
   [text                   :as text]
   [clojure.set            :as set]
   [clojure.string         :as str]))


;; # R-Modules in Clojure

;; Modules are the natural generalisation of vector spaces: instead of scalars
;; drawn from a *field*, we allow them from an arbitrary *ring*.  A vector space
;; over $\mathbb{R}$ is simply an $\mathbb{R}$-module.  Group algebras,
;; ideals, and representations all live naturally in this language.

;; ## Definition

(math/definition
 "module"
 "Let $R$ be a ring with unity $1_R$. A **left $R$-module** is an abelian group
$(M, +)$ together with a scalar multiplication $\\cdot : R \\times M \\to M$ satisfying,
for all $r, s \\in R$ and $x, y \\in M$:

1. $r \\cdot (x + y) = r \\cdot x + r \\cdot y$ &emsp; *(distributivity over $M$)*
2. $(r + s) \\cdot x = r \\cdot x + s \\cdot x$ &emsp; *(distributivity over $R$)*
3. $(rs) \\cdot x = r \\cdot (s \\cdot x)$ &emsp; *(compatibility with ring multiplication)*
4. $1_R \\cdot x = x$ &emsp; *(unitality)*"
 :name "R-Module")

;; ## Encoding Rings

;; Before we can talk about modules we need rings.
;; We capture the ring structure in a Clojure protocol.

(kind/md "<div class=\"show-code\">")
(defprotocol Ring
  "An associative, unital ring."
  (ring-add   [r a b] "Addition a + b in R")
  (ring-mult  [r a b] "Multiplication a · b in R")
  (ring-zero  [r]     "Additive identity 0_R")
  (ring-one   [r]     "Multiplicative identity 1_R")
  (ring-neg   [r a]   "Additive inverse -a in R")
  (ring-elems [r]     "Finite element set of R (nil for infinite rings)"))

;; ### $\mathbb{Z}/n\mathbb{Z}$

;; The integers mod $n$ form the simplest family of finite rings.

(defrecord ZnRing [n]
  Ring
  (ring-add   [_ a b] (mod (+ a b) n))
  (ring-mult  [_ a b] (mod (* a b) n))
  (ring-zero  [_]     0)
  (ring-one   [_]     1)
  (ring-neg   [_ a]   (mod (- n a) n))
  (ring-elems [_]     (vec (range n))))

(defn zn-ring
  "Construct the ring ℤ/nℤ."
  [n] (->ZnRing n))

;; Quick sanity-check on $\mathbb{Z}/6\mathbb{Z}$:
(let [r (zn-ring 6)]
  {:elements (ring-elems r)
   :3+4      (ring-add  r 3 4)   ; 1
   :3*4      (ring-mult r 3 4)   ; 0
   :-5       (ring-neg  r 5)})   ; 1

;; ## Encoding Modules

(defprotocol RModule
  "A left R-module."
  (base-ring   [m]     "The ring R acting on M")
  (mod-add     [m x y] "Addition x + y in M")
  (mod-zero    [m]     "Zero element 0_M")
  (mod-neg     [m x]   "Additive inverse -x in M")
  (scalar-mult [m r x] "Scalar multiplication r · x, r ∈ R, x ∈ M")
  (mod-elems   [m]     "All elements of M (nil for infinite modules)"))

;; ### A ring is a module over itself

;; Every ring $R$ is a left $R$-module via ring multiplication.

(defrecord SelfModule [ring]
  RModule
  (base-ring   [_]     ring)
  (mod-add     [_ x y] (ring-add  ring x y))
  (mod-zero    [_]     (ring-zero ring))
  (mod-neg     [_ x]   (ring-neg  ring x))
  (scalar-mult [_ r x] (ring-mult ring r x))
  (mod-elems   [_]     (ring-elems ring)))

(defn self-module
  "Construct R as a module over itself."
  [ring] (->SelfModule ring))

;; ### Free module $R^k$

;; The free module $R^k$ has elements that are $k$-tuples over $R$,
;; with componentwise addition and scalar multiplication.

(defn- cartesian-power
  "All k-tuples drawn from coll."
  [coll k]
  (if (zero? k)
    [[]]
    (for [rest (cartesian-power coll (dec k))
          x    coll]
      (conj rest x))))

(defrecord FreeModule [ring k]
  RModule
  (base-ring   [_]     ring)
  (mod-add     [_ x y] (mapv #(ring-add  ring %1 %2) x y))
  (mod-zero    [_]     (vec (repeat k (ring-zero ring))))
  (mod-neg     [_ x]   (mapv #(ring-neg  ring %) x))
  (scalar-mult [_ r x] (mapv #(ring-mult ring r %) x))
  (mod-elems   [_]
    (when-let [es (ring-elems ring)]
      (vec (cartesian-power es k)))))

(defn free-module
  "Construct the free module R^k."
  [ring k] (->FreeModule ring k))

;; Example: $(\mathbb{Z}/3\mathbb{Z})^2$ has $9$ elements.

(let [m (free-module (zn-ring 3) 2)]
  {:element-count (count (mod-elems m))
   :zero          (mod-zero m)
   :2*[1,2]       (scalar-mult m 2 [1 2])   ; [2 1] mod 3
   :neg-[1,2]     (mod-neg     m   [1 2])}) ; [2 1] mod 3

;; ## Axiom Verification

;; We can check all four module axioms exhaustively for any finite module.

(defn check-module-axioms
  "Verify the four R-module axioms for a finite module m.
   Returns a map of axiom-name → boolean."
  [m]
  (let [r  (base-ring m)
        rs (ring-elems r)
        xs (mod-elems  m)]
    {:distributive-over-M
     (every? (fn [[rv xv yv]]
               (= (scalar-mult m rv (mod-add m xv yv))
                  (mod-add m (scalar-mult m rv xv)
                             (scalar-mult m rv yv))))
             (for [rv rs xv xs yv xs] [rv xv yv]))

     :distributive-over-R
     (every? (fn [[rv sv xv]]
               (= (scalar-mult m (ring-add r rv sv) xv)
                  (mod-add m (scalar-mult m rv xv)
                             (scalar-mult m sv xv))))
             (for [rv rs sv rs xv xs] [rv sv xv]))

     :compatible-with-ring-mult
     (every? (fn [[rv sv xv]]
               (= (scalar-mult m (ring-mult r rv sv) xv)
                  (scalar-mult m rv (scalar-mult m sv xv))))
             (for [rv rs sv rs xv xs] [rv sv xv]))

     :unital
     (every? (fn [xv]
               (= (scalar-mult m (ring-one r) xv) xv))
             xs)}))

;; ### $\mathbb{Z}/5\mathbb{Z}$ as a module over itself

(check-module-axioms (self-module (zn-ring 5)))

;; ### The free module $(\mathbb{Z}/4\mathbb{Z})^2$

(check-module-axioms (free-module (zn-ring 4) 2))

;; ## Submodules

(math/definition
 "submodule"
 "A subset $N \\subseteq M$ is a **submodule** if:

1. $0_M \\in N$
2. $x, y \\in N \\Rightarrow x + y \\in N$
3. $r \\in R,\\ x \\in N \\Rightarrow r \\cdot x \\in N$"
 :name "Submodule")

(defn submodule?
  "Test whether subset (a set) is a submodule of m."
  [m subset]
  (let [r  (base-ring m)
        rs (ring-elems r)]
    (and (contains? subset (mod-zero m))
         (every? (fn [[x y]] (contains? subset (mod-add m x y)))
                 (for [x subset y subset] [x y]))
         (every? (fn [[rv x]] (contains? subset (scalar-mult m rv x)))
                 (for [rv rs x subset] [rv x])))))

;; The even elements $\{0, 2, 4\}$ form a submodule of $\mathbb{Z}/6\mathbb{Z}$,
;; since $2\mathbb{Z}/6\mathbb{Z} \cong \mathbb{Z}/3\mathbb{Z}$.

(let [m (self-module (zn-ring 6))]
  {:even-submodule? (submodule? m #{0 2 4})
   :odd-not-sub?    (submodule? m #{1 3 5})})

;; ## Module Homomorphisms

(math/definition
 "module-hom"
 "A **module homomorphism** $f : M \\to N$ between $R$-modules is a map satisfying:

1. $f(x + y) = f(x) + f(y)$ &emsp; *(additive)*
2. $f(r \\cdot x) = r \\cdot f(x)$ &emsp; *($R$-linear)*"
 :name "Module Homomorphism")

(defn module-hom?
  "Test whether f (a function) is a module homomorphism from m to n."
  [m n f]
  (let [r  (base-ring m)
        rs (ring-elems r)
        xs (mod-elems  m)]
    (and (every? (fn [[x y]]
                   (= (f (mod-add m x y))
                      (mod-add n (f x) (f y))))
                 (for [x xs y xs] [x y]))
         (every? (fn [[rv x]]
                   (= (f (scalar-mult m rv x))
                      (scalar-mult n rv (f x))))
                 (for [rv rs x xs] [rv x])))))

;; Multiplication-by-2 is a $\mathbb{Z}/6\mathbb{Z}$-module endomorphism:

(let [r (zn-ring 6)
      m (self-module r)
      f #(ring-mult r 2 %)]
  {:hom? (module-hom? m m f)})

;; The map $x \mapsto x + 1$ is not (fails additivity):

(let [r (zn-ring 6)
      m (self-module r)
      f #(ring-add r % 1)]
  {:hom? (module-hom? m m f)})

^{:kindly/hide-code true
  :clay {:title  "Visualizing Random Walks on GL₂(𝔽ₚ)"
         :quarto {:author      :Eugen
                  :description "Simulating and visualising random walks on GL₂(𝔽ₚ): generating sets, empirical convergence to uniform, total-variation distance, and the spectral gap."
                  :type        :post
                  :date        "2026-02-25"
                  :category    :mathematics
                  :tags        [:algebra :probability :representation-theory :visualization]}}}
(ns visualizing-random-walks
  (:require
   [tablecloth.api                  :as tc]
   [scicloj.tableplot.v1.plotly     :as plotly]
   [scicloj.kindly.v4.kind          :as kind]
   [math                            :as math]
   [text                            :as text]
   [group-theory.gl2                :as gl2]
   [group-theory.protocols          :as p]
   [clojure.string                  :as str]))

;; ## Introduction
;;
;; A **random walk** on a finite group $G$ is defined by a probability measure
;; $\mu$ on $G$.  At each step the current position is multiplied on the right
;; by an element drawn from $\mu$:
;;
;; $$X_0 = e, \qquad X_{t+1} = X_t \cdot S_t, \quad S_t \overset{\text{iid}}{\sim} \mu.$$
;;
;; After $t$ steps the position has law $\mu^{*t}$ — the $t$-fold convolution of
;; $\mu$ with itself.  A central question in this area is:
;;
;; > *How many steps does it take for $\mu^{*t}$ to be close to the uniform
;; > distribution $U$?*
;;
;; Closeness is measured by the **total variation distance**
;;
;; $$\|\mu^{*t} - U\|_{\mathrm{TV}} = \frac{1}{2}\sum_{g \in G}|\mu^{*t}(g) - U(g)|.$$
;;
;; We study this question for $G = \GL_2(\mathbb{F}_p)$.

;; ## The group $\GL_2(\mathbb{F}_p)$

(math/definition
  "gl2fp"
  "$\\GL_2(\\mathbb{F}_p)$ is the group of $2\\times 2$ invertible matrices
   with entries in the finite field $\\mathbb{F}_p = \\mathbb{Z}/p\\mathbb{Z}$,
   under matrix multiplication taken modulo $p$."
  :name "$\\GL_2(\\mathbb{F}_p)$")

(math/lemma
  "gl2-order"
  "$$|\\GL_2(\\mathbb{F}_p)| = (p^2-1)(p^2-p).$$
   *Proof.* The first column may be any non-zero vector in $\\mathbb{F}_p^2$
   ($p^2-1$ choices).  The second column must be linearly independent of the
   first, excluding its $p$ scalar multiples, giving $p^2-p$ choices.
   $\\square$"
  :name "Order of $\\GL_2(\\mathbb{F}_p)$")

(defn gl2-order [p] (* (dec (* p p)) (- (* p p) p)))

(defn prime? [n]
  (and (> n 1)
       (not-any? #(zero? (mod n %))
                 (range 2 (inc (long (Math/sqrt n)))))))

(defn primes-up-to [n] (filter prime? (range 2 (inc n))))

;; The order grows roughly as $p^4$, making large-$p$ computations expensive:

(-> (tc/dataset {:p (primes-up-to 30)})
    (tc/map-columns :order [:p] gl2-order)
    (plotly/base {:=title "Order of GL₂(𝔽ₚ) for small primes p"})
    (plotly/layer-line {:=x :p :=y :order})
    (plotly/layer-point {:=x :p :=y :order}))

;; ## Generating sets
;;
;; We use **symmetric** generating sets $S = S^{-1}$ and take $\mu$ to be
;; uniform on $S$.  Two natural choices:
;;
;; 1. **Transvections only** —
;;    $T_{12} = \bigl[\begin{smallmatrix}1&1\\0&1\end{smallmatrix}\bigr]$,
;;    $T_{12}^{-1}$,
;;    $T_{21} = \bigl[\begin{smallmatrix}1&0\\1&1\end{smallmatrix}\bigr]$,
;;    $T_{21}^{-1}$.
;;
;; 2. **Transvections + swap** — the above plus
;;    $P = \bigl[\begin{smallmatrix}0&1\\1&0\end{smallmatrix}\bigr]$ (self-inverse).
;;
;; Transvections generate $\SL_2(\mathbb{F}_p)$ (determinant 1 matrices), so
;; the walk with only transvections is confined to that subgroup.  Adding $P$
;; (whose determinant is $-1$) allows the walk to reach all of
;; $\GL_2(\mathbb{F}_p)$.

(math/remark
 "The transvection walk actually lives on $\\SL_2(\\mathbb{F}_p)$ since all
  transvections have determinant 1 and the subgroup is closed.
  We compare both walks by restricting the TVD computation to the relevant
  subgroup in each case.")

(defn transvection-generators
  "T12, T12⁻¹, T21, T21⁻¹ as flat [a b c d] vectors mod p.
   For p=2 the inverses equal the originals (order 2), so the
   generating multi-set has repeated elements — callers that
   need a lazy walk should call `lazy-generators` instead."
  [p]
  [[1 1 0 1]
   [1 (mod -1 p) 0 1]
   [1 0 1 1]
   [1 0 (mod -1 p) 1]])

(defn lazy-generators
  "Add the identity to `generators` to make the walk lazy (aperiodic).
   Each step: with prob 1/(|S|+1) hold, otherwise apply a generator."
  [G generators]
  (conj generators (p/id G)))

(defn transvection+swap-generators
  "Transvection generators plus the swap P = [[0 1][1 0]]."
  [p]
  (conj (transvection-generators p) [0 1 1 0]))

;; ## Random walk machinery

(defn random-step
  "Multiply position g on the right by a uniformly random generator."
  [G generators g]
  (p/op G g (rand-nth generators)))

(defn simulate-walk
  "Lazy sequence of group elements visited by the walk,
   starting at the identity."
  [G generators n-steps]
  (take (inc n-steps)
        (iterate (partial random-step G generators)
                 (p/id G))))

(defn empirical-distribution
  "Estimate μ^{*t} from `n-samples` independent walks of length `t`.
   Returns a map {element → empirical-probability}."
  [G generators t n-samples]
  (let [elts      (vec (p/elements G))
        elt-index (into {} (map-indexed (fn [i e] [e i]) elts))
        counts    (long-array (count elts))]
    (dotimes [_ n-samples]
      (let [pos (volatile! (p/id G))]
        (dotimes [_ t]
          (vswap! pos (partial random-step G generators)))
        (when-let [idx (elt-index @pos)]
          (aset counts idx (inc (aget counts idx))))))
    (into {} (map-indexed (fn [i e] [e (/ (double (aget counts i)) n-samples)])
                          elts))))

(defn exact-walk-distribution
  "Compute μ^{*t} exactly by iterative convolution.
   Only feasible for small groups (e.g. p = 2 or 3)."
  [G generators t]
  (let [elts    (vec (p/elements G))
        mu-mass (/ 1.0 (count generators))
        init    (assoc (zipmap elts (repeat 0.0)) (p/id G) 1.0)]
    (loop [dist init step 0]
      (if (= step t)
        dist
        (recur
         (reduce (fn [acc [g prob]]
                   (if (zero? prob)
                     acc
                     (reduce (fn [a s]
                               (update a (p/op G g s)
                                       (fnil + 0.0) (* prob mu-mass)))
                             acc generators)))
                 (zipmap elts (repeat 0.0))
                 dist)
         (inc step))))))

(defn total-variation-distance
  "TVD between probability map `p-dist` and uniform distribution on G."
  [G p-dist]
  (let [u (/ 1.0 (p/order G))]
    (/ (apply + (map (fn [[_g prob]] (Math/abs (- (double prob) u)))
                     p-dist))
       2.0)))

;; ## Case study: $\GL_2(\mathbb{F}_2)$
;;
;; With $p = 2$ we have $|\GL_2(\mathbb{F}_2)| = 3 \cdot 2 = 6$.
;; This group is isomorphic to the symmetric group $S_3$ — the smallest
;; non-abelian group.
;;
;; **Periodicity.** Over $\mathbb{F}_2$, $-1 \equiv 1$, so each transvection
;; is its own inverse: $T_{12}^2 = I$ and $T_{21}^2 = I$.
;; The Cayley graph is **bipartite** — the walk alternates between the
;; two parts at every step, and TVD never decays below $1/2$.
;;
;; The standard fix is a **lazy walk**: add the identity to the generating
;; multi-set.  At each step the walk stays put with probability $1/(|S|+1)$,
;; breaking the bipartite structure and making the chain aperiodic.

(def G2    (gl2/gl2 2))
(def gens2 (lazy-generators G2 (transvection-generators 2)))

;; ### Exact distribution at each step

(def dist-G2-by-step
  (for [t (range 0 14)]
    (assoc (exact-walk-distribution G2 gens2 t) :t t)))

;; ### Exact TVD convergence

(def tvd-exact-G2
  (for [t (range 0 14)]
    {:t t :tvd (total-variation-distance
                G2 (exact-walk-distribution G2 gens2 t))}))

(-> (tc/dataset tvd-exact-G2)
    (plotly/base {:=title   "Exact TVD to uniform — GL₂(𝔽₂), transvection generators"
                  :=x-title "Steps t"
                  :=y-title "‖μ^t − U‖_TV"})
    (plotly/layer-line {:=x :t :=y :tvd})
    (plotly/layer-point {:=x :t :=y :tvd}))

;; ### Distribution across conjugacy-class types
;;
;; Each element of $\GL_2(\mathbb{F}_2)$ falls into one of four conjugacy-class
;; types (scalar, Jordan, split-semisimple, non-split-semisimple).
;; We track the total probability on each type.

(def class-type-tvd-G2
  (let [classes   (p/conjugacy-classes G2)
        elt->type (into {} (mapcat (fn [{:keys [type elements]}]
                                    (map (fn [e] [e (name type)]) elements))
                                  classes))]
    (for [t (range 0 14)]
      (let [dist (exact-walk-distribution G2 gens2 t)]
        (reduce (fn [row [elt prob]]
                  (update row (elt->type elt) (fnil + 0.0) prob))
                {:t t}
                dist)))))

(-> (tc/dataset class-type-tvd-G2)
    (tc/pivot->longer (complement #{:t})
                      {:target-columns   :type
                       :value-column-name :prob})
    (plotly/base {:=title   "Probability by conjugacy-class type — GL₂(𝔽₂)"
                  :=x-title "Steps t"
                  :=y-title "Total probability"})
    (plotly/layer-line {:=x :t :=y :prob :=color :type}))

;; ## Spectral gap — $\GL_2(\mathbb{F}_2)$
;;
;; The **spectral gap** of the random walk operator governs convergence.
;; For a symmetric measure $\mu$ on $G$, the operator $T f(g) = \sum_s \mu(s) f(gs)$
;; has eigenvalues $1 = \lambda_1 \geq \lambda_2 \geq \cdots$ and the mixing is
;; controlled by $\gamma = 1 - \lambda_2$:
;;
;; $$\|\mu^{*t} - U\|_{\mathrm{TV}} \leq \frac{\sqrt{|G|}}{2}\,(1-\gamma)^t.$$

(defn transition-matrix
  "Build the |G|×|G| row-stochastic transition matrix of the random walk."
  [G generators]
  (let [elts    (vec (p/elements G))
        n       (count elts)
        elt-idx (into {} (map-indexed (fn [i e] [e i]) elts))
        w       (/ 1.0 (count generators))]
    (reduce
     (fn [M i]
       (reduce (fn [M2 s]
                 (let [j (elt-idx (p/op G (elts i) s))]
                   (update-in M2 [i j] + w)))
               M generators))
     (vec (repeat n (vec (repeat n 0.0))))
     (range n))))

(defn eigenvalues-desc
  "Real eigenvalues of a square matrix (2-D vec of doubles), sorted descending."
  [M]
  (let [eig (org.apache.commons.math3.linear.EigenDecomposition.
             (org.apache.commons.math3.linear.Array2DRowRealMatrix.
              (into-array (map double-array M))))]
    (sort > (map #(.getRealEigenvalue eig %) (range (count M))))))

;; We use the same lazy generators so the matrix matches our walk:
(def evals2 (eigenvalues-desc (transition-matrix G2 gens2)))
(def lambda2-G2 (second evals2))
(def gamma-G2 (- 1.0 lambda2-G2))

(kind/md
 (str "**Eigenvalues:** " (str/join ", " (map #(format "%.4f" %) evals2))
      "\n\n**Spectral gap:** γ = 1 − λ₂ = " (format "%.4f" gamma-G2)))

;; Comparing the spectral upper bound to the exact TVD:

(-> (tc/dataset
     (concat
      (map (fn [{:keys [t tvd]}]
             {:t t :value tvd :series "TVD (exact)"})
           tvd-exact-G2)
      (for [t (range 0 14)]
        {:t t
         :value (* (/ (Math/sqrt 6.0) 2.0)
                   (Math/pow (- 1.0 lambda2-G2) t))
         :series "Spectral bound √|G|/2 · (1−γ)ᵗ"})))
    (plotly/base {:=title   "Spectral bound vs exact TVD — GL₂(𝔽₂)"
                  :=x-title "Steps t"
                  :=y-title "Value"})
    (plotly/layer-line {:=x :t :=y :value :=color :series}))

;; ## Case study: $\GL_2(\mathbb{F}_3)$
;;
;; With $p = 3$: $|G| = 8 \cdot 6 = 48$.
;; Now the transvection walk lives on $\SL_2(\mathbb{F}_3)$ (order 24),
;; while adding the swap $P$ (det $= -1 \equiv 2$) lets the walk reach all 48
;; elements.

(def G3       (gl2/gl2 3))
(def gens3-tv (transvection-generators 3))
(def gens3-ts (transvection+swap-generators 3))

;; ### TVD comparison — transvections vs transvections+swap
;;
;; The transvection walk stays on $\SL_2(\mathbb{F}_3)$ (24 elements).
;; Computing TVD against the full $\GL_2(\mathbb{F}_3)$ uniform measure
;; always yields $\geq 0.5$ (the other 24 elements are never visited).
;; To compare fairly, we compute each walk's TVD against uniform on its
;; own support: $\SL_2$ for transvections and $\GL_2$ for the swap walk.

(defn sl2-elements
  "Elements of SL₂(𝔽ₚ) — the determinant-1 subgroup."
  [G p]
  (filter (fn [[a b c d]] (= 1 (mod (- (* a d) (* b c)) p)))
          (p/elements G)))

(defn tvd-on-support
  "TVD of the walk distribution against uniform on the given element set."
  [G generators t n-samples support-elts]
  (let [n-support (count support-elts)
        u         (/ 1.0 n-support)
        dist      (empirical-distribution G generators t n-samples)
        ;; only sum over elements in the support
        sum       (reduce (fn [acc e]
                            (+ acc (Math/abs (- (double (get dist e 0.0)) u))))
                          0.0 support-elts)]
    (/ sum 2.0)))

(defn tvd-series
  "Compute [{:t t :tvd tvd :label label} ...] for steps in `ts`."
  [G generators label ts n-samples]
  (for [t ts]
    {:t t
     :tvd (total-variation-distance
           G (empirical-distribution G generators t n-samples))
     :label label}))

(defn tvd-series-support
  "Like tvd-series but measures TVD against uniform on `support-elts`."
  [G generators label ts n-samples support-elts]
  (for [t ts]
    {:t t
     :tvd (tvd-on-support G generators t n-samples support-elts)
     :label label}))

(def sl2-G3 (sl2-elements G3 3))

(def tvd-G3
  (concat
   (tvd-series-support G3 gens3-tv "transvections (SL₂, 24 elts)"
                       (range 0 71 2) 3000 sl2-G3)
   (tvd-series G3 gens3-ts "transvections+swap (GL₂, 48 elts)"
               (range 0 71 2) 3000)))

(-> (tc/dataset tvd-G3)
    (plotly/base {:=title   "TVD to uniform — GL₂(𝔽₃)"
                  :=x-title "Steps t"
                  :=y-title "‖μ^t − U‖_TV"})
    (plotly/layer-line {:=x :t :=y :tvd :=color :label}))

;; ### Trace distribution over time ($p = 3$)
;;
;; The trace $\mathrm{tr}(g) = (a+d) \bmod 3$ is a class function.
;; At stationarity each value in $\{0, 1, 2\}$ should appear with frequency
;; proportional to the number of elements with that trace.

(defn sample-final-positions
  "Return `n` independent positions at time `t` from walks on G."
  [G generators t n]
  (repeatedly n #(nth (simulate-walk G generators t) t)))

(def trace-data-G3
  (mapcat
   (fn [t]
     (map (fn [[a _ _ d]]
            {:step (str "t=" t) :trace (mod (+ a d) 3)})
          (sample-final-positions G3 gens3-tv t 2000)))
   [1 5 15 50]))

(-> (tc/dataset trace-data-G3)
    (tc/group-by [:step :trace])
    (tc/aggregate {:count tc/row-count})
    (plotly/base {:=title   "Trace distribution — GL₂(𝔽₃), transvection walk"
                  :=x-title "tr(g) mod 3"
                  :=y-title "Count (out of 2000)"})
    (plotly/layer-bar {:=x :trace :=y :count :=color :step
                       :=bar-mode "group"}))

;; ## Case study: $\GL_2(\mathbb{F}_5)$
;;
;; With $p = 5$: $|G| = 24 \cdot 20 = 480$.  Exact convolution is expensive
;; so we rely entirely on sampling.

(def G5       (gl2/gl2 5))
(def gens5-tv (transvection-generators 5))
(def gens5-ts (transvection+swap-generators 5))

(def sl2-G5 (sl2-elements G5 5))

(def tvd-G5
  (concat
   (tvd-series-support G5 gens5-tv "transvections (SL₂, 240 elts)"
                       (range 0 201 10) 2000 sl2-G5)
   (tvd-series G5 gens5-ts "transvections+swap (GL₂, 480 elts)"
               (range 0 201 10) 2000)))

(-> (tc/dataset tvd-G5)
    (plotly/base {:=title   "TVD to uniform — GL₂(𝔽₅)"
                  :=x-title "Steps t"
                  :=y-title "‖μ^t − U‖_TV"})
    (plotly/layer-line {:=x :t :=y :tvd :=color :label}))

;; ### Determinant distribution over time ($p = 5$)
;;
;; The determinant $\det(g) \in \mathbb{F}_5^\times = \{1,2,3,4\}$.
;; The transvection walk always has $\det = 1$ (it lives on $\SL_2$).
;; With the swap generator, the walk can reach all determinants.
;; At stationarity each of the four values should appear equally often.

(def det-data-G5
  (mapcat
   (fn [t]
     (map (fn [[a b c d]]
            {:step (str "t=" t)
             :det  (mod (- (* a d) (* b c)) 5)})
          (sample-final-positions G5 gens5-ts t 2000)))
   [1 10 40 150]))

(-> (tc/dataset det-data-G5)
    (tc/group-by [:step :det])
    (tc/aggregate {:count tc/row-count})
    (plotly/base {:=title   "Determinant distribution — GL₂(𝔽₅), transvections+swap"
                  :=x-title "det(g) mod 5"
                  :=y-title "Count (out of 2000)"})
    (plotly/layer-bar {:=x :det :=y :count :=color :step
                       :=bar-mode "group"}))

;; ## Convergence speed across primes
;;
;; How does the mixing time scale with $p$?  We sample TVD at the same
;; relative checkpoints for $p \in \{2, 3, 5, 7\}$ using the
;; transvections+swap generating set.

(def convergence-across-p
  (mapcat
   (fn [p]
     (let [G    (gl2/gl2 p)
           gens (transvection+swap-generators p)
           ord  (p/order G)
           ;; sample at a logarithmically spaced grid scaled to group order
           ts   (map #(int (* ord %)) [0.001 0.005 0.01 0.02 0.05
                                        0.1   0.2   0.5  1.0])]
       (for [t (distinct (sort ts))]
         {:t     t
          :p     (str "p=" p)
          :order ord
          :tvd   (total-variation-distance
                  G (empirical-distribution G gens t 1000))})))
   [2 3 5 7]))

(-> (tc/dataset convergence-across-p)
    (plotly/base {:=title   "TVD to uniform — transvections+swap, various p"
                  :=x-title "Steps t"
                  :=y-title "‖μ^t − U‖_TV"})
    (plotly/layer-line {:=x :t :=y :tvd :=color :p}))

;; ### Normalised convergence
;;
;; Plotting TVD against $t / |G|$ collapses the curves and reveals whether
;; mixing happens at a fixed fraction of the group order.

(-> (tc/dataset convergence-across-p)
    (tc/map-columns :t-norm [:t :order] (fn [t ord] (/ (double t) ord)))
    (plotly/base {:=title   "Normalised convergence (t / |G|) — transvections+swap"
                  :=x-title "t / |GL₂(𝔽ₚ)|"
                  :=y-title "‖μ^t − U‖_TV"})
    (plotly/layer-line {:=x :t-norm :=y :tvd :=color :p}))

;; ## Summary
;;
;; A few take-aways from these experiments:
;;
;; - **Generating set matters greatly.** The transvection walk on
;;   $\GL_2(\mathbb{F}_p)$ is actually confined to the index-$(p-1)$ subgroup
;;   $\SL_2(\mathbb{F}_p)$.  Adding the swap matrix makes the walk
;;   ergodic on the full group and typically speeds up mixing.
;;
;; - **Spectral gap controls convergence.** The exact calculation for $p=2$
;;   shows the TVD decays geometrically at the rate $(1-\gamma)^t$, where
;;   $\gamma$ is the spectral gap of the random walk operator.
;;
;; - **Mixing time grows with $p$.** The normalised plot $t/|G|$ suggests
;;   the mixing time grows sub-linearly relative to the group order.
;;
;; The deeper theory (Diaconis–Shahshahani, Kassabov) uses the full
;; representation theory of $\GL_2(\mathbb{F}_p)$ — character tables,
;; Fourier transforms on non-abelian groups, to give sharp asymptotic
;; bounds.  That is a story for a future post.
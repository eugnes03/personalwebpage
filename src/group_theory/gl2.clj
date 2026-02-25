(ns group-theory.gl2
  "GL(2, F_p): the group of 2x2 invertible matrices over the field of p elements.

   A matrix [[a b] [c d]] is represented as the flat vector [a b c d]
   (row-major order). All arithmetic is done modulo p.

   Order: |GL(2, F_p)| = (p² - 1)(p² - p) = p(p-1)²(p+1)"
  (:require [group-theory.protocols :as p]))

;;; ── Internal arithmetic ─────────────────────────────────────────────────────

(defn- pow-mod
  "Fast modular exponentiation: base^exp mod m."
  [base exp m]
  (loop [result 1 b (mod base m) e exp]
    (cond
      (zero? e) result
      (odd? e)  (recur (mod (* result b) m) (mod (* b b) m) (quot e 2))
      :else     (recur result               (mod (* b b) m) (quot e 2)))))

(defn- mod-inv
  "Multiplicative inverse of a mod p, where p is prime (Fermat's little theorem).
   Returns nil if a ≡ 0."
  [a p]
  (let [a' (mod a p)]
    (when (pos? a')
      (pow-mod a' (- p 2) p))))

;;; ── Matrix operations ───────────────────────────────────────────────────────
;;
;; Matrix [a b c d] represents:
;;   | a  b |
;;   | c  d |

(defn mat-det
  "Determinant of matrix m mod p."
  [[a b c d] p]
  (mod (- (* a d) (* b c)) p))

(defn mat-mul
  "Product of matrices m1 and m2 in GL(2, F_p)."
  [[a b c d] [e f g h] p]
  [(mod (+ (* a e) (* b g)) p)
   (mod (+ (* a f) (* b h)) p)
   (mod (+ (* c e) (* d g)) p)
   (mod (+ (* c f) (* d h)) p)])

(defn mat-inv
  "Inverse of matrix m in GL(2, F_p).
   Uses the closed-form 2×2 inverse: det⁻¹ · [[d -b][-c a]]."
  [[a b c d :as m] p]
  (let [det  (mat-det m p)
        dinv (or (mod-inv det p)
                 (throw (ex-info "Matrix is not invertible" {:matrix m :p p})))]
    [(mod (* dinv d)    p)
     (mod (* dinv (- b)) p)
     (mod (* dinv (- c)) p)
     (mod (* dinv a)    p)]))

(defn mat-str
  "Pretty-print a matrix as a string."
  [[a b c d]]
  (format "| %d  %d |\n| %d  %d |" a b c d))

(defn invertible?
  "True iff matrix m is invertible over F_p."
  [m p]
  (pos? (mat-det m p)))

;;; ── Element enumeration ─────────────────────────────────────────────────────

(defn- all-gl2-elements
  "Lazily enumerate all invertible 2×2 matrices over F_p."
  [p]
  (for [a (range p) b (range p)
        c (range p) d (range p)
        :when (pos? (mod (- (* a d) (* b c)) p))]
    [a b c d]))

(defn- gl2-order
  "Closed-form order of GL(2, F_p)."
  [p]
  (let [p2 (* p p)]
    (* (- p2 1) (- p2 p))))

;;; ── Closed-form conjugacy class classification ──────────────────────────────
;;
;; Every element of GL(2, F_p) is conjugate to exactly one of four canonical
;; forms, determined by its rational canonical / Jordan form over F_p:
;;
;;  Type                   Representative       # classes     Class size
;;  ──────────────────────────────────────────────────────────────────────
;;  Scalar        λI       [λ  0  0  λ]          p−1               1
;;  Jordan        J(λ)     [λ  1  0  λ]          p−1           p²−1
;;  Split SS      D(λ,μ)   [λ  0  0  μ]  λ<μ   (p−1)(p−2)/2   p(p+1)
;;  Non-split SS  C(t,n)   [0 −n  1  t]          p(p−1)/2      p(p−1)
;;
;;  Total classes : (p−1)+(p−1)+(p−1)(p−2)/2+p(p−1)/2 = p²−1
;;  Total elements: sum of (#classes × size)             = (p²−1)(p²−p)  ✓
;;
;; Key for the non-split case:
;;   x²−tx+n is irreducible over F_p  ⟺  disc = t²−4n is a QNR mod p.
;;   The companion matrix [[0 −n][1 t]] has characteristic polynomial x²−tx+n.

(defn- qr?
  "True iff a is a non-zero quadratic residue mod p (i.e. a ≡ x² for some x ≢ 0)."
  [a p]
  (and (pos? (mod a p))
       (= 1 (pow-mod (mod a p) (quot (dec p) 2) p))))

(defn- irreducible-quadratics
  "All [t n] pairs such that x²−tx+n is irreducible over F_p.
   Condition: discriminant t²−4n is a quadratic non-residue (nonzero, not a square)."
  [p]
  (for [t (range p)
        n (range 1 p)           ; n=0 ⟹ 0 is a root ⟹ reducible
        :let  [disc (mod (- (* t t) (* 4 n)) p)]
        :when (and (pos? disc) (not (qr? disc p)))]
    [t n]))

(defn- class-elements
  "Compute the full conjugacy class of representative g in G.
   Enumerates {x·g·x⁻¹ : x ∈ G}.  O(|G|) per class."
  [G g]
  (into #{} (map #(p/op G % (p/op G g (p/inv G %)))
                 (p/elements G))))

(defn- conjugacy-class-reps
  "Returns seq of {:type :representative :size} for every conjugacy class
   of GL(2, F_p) via the closed-form classification."
  [p]
  (let [p2 (* p p)]
    (concat
     ;; ── Type 1: Scalar matrices λI ──────────────────────────────────────────
     (for [lam (range 1 p)]
       {:type           :scalar
        :representative [lam 0 0 lam]
        :size           1})

     ;; ── Type 2: Non-scalar Jordan blocks [[λ 1][0 λ]] ──────────────────────
     (for [lam (range 1 p)]
       {:type           :jordan
        :representative [lam 1 0 lam]
        :size           (dec p2)})

     ;; ── Type 3: Split semisimple diag(λ,μ), λ < μ ──────────────────────────
     (for [lam (range 1 p)
           mu  (range (inc lam) p)]
       {:type           :split-semisimple
        :representative [lam 0 0 mu]
        :size           (* p (inc p))})

     ;; ── Type 4: Non-split semisimple ─────────────────────────────────────────
     ;; Companion matrix of x²−tx+n:  [[0  −n][1  t]]
     ;; Stored as [a b c d] = [0  (p−n)%p  1  t]
     (for [[t n] (irreducible-quadratics p)]
       {:type           :non-split-semisimple
        :representative [0 (mod (- p n) p) 1 t]
        :size           (* p (dec p))}))))

;;; ── Record / protocol implementations ──────────────────────────────────────

(defrecord GL2 [p]

  p/Group
  (op  [_ g h] (mat-mul g h p))
  (inv [_ g]   (mat-inv g p))
  (id  [_]     [1 0 0 1])

  p/FiniteGroup
  (elements [_]   (all-gl2-elements p))
  (order    [_]   (gl2-order p))

  p/GroupStructure
  (conjugacy-classes [G]
    ;; Use the closed-form classification to get one representative per class,
    ;; then compute each class's element set by conjugating that representative
    ;; with every group element.  Complexity: O(p²·|G|) vs O(|G|²) brute-force.
    (mapv (fn [{:keys [representative] :as cls}]
            (let [elts (class-elements G representative)]
              (assoc cls :elements elts :size (count elts))))
          (conjugacy-class-reps p)))

  p/GroupType
  (group-type [_] :gl2))

;;; ── Public constructor ──────────────────────────────────────────────────────

(defn- prime?
  "Simple trial-division primality check."
  [n]
  (and (> n 1)
       (not-any? #(zero? (mod n %))
                 (range 2 (inc (long (Math/sqrt n)))))))

(defn gl2
  "Create the group GL(2, F_p) of 2×2 invertible matrices over the field F_p.

   p must be a prime ≥ 2.

   Example:
     (def G (gl2 3))
     (p/order G)      ;=> 48
     (p/id G)         ;=> [1 0 0 1]
     (p/op G [1 1 0 1] [1 0 1 1])   ;=> matrix product mod 3"
  [p]
  {:pre [(prime? p)]}
  (->GL2 p))
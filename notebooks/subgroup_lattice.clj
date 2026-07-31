^{:kindly/hide-code true
  :clay {:title  "Subgroup Lattices of Finite Groups"
         :quarto {:author      "Eugen Nesbakken"
                  :description "Enumerating all subgroups of a finite group and visualising their inclusion relations as a Hasse diagram, demonstrated on cyclic, dihedral, and symmetric groups."
                  :type        :post
                  :date        "2026-02-26"
                  :category    :mathematics
                  :tags        [:algebra :group-theory :visualization]}}}
(ns subgroup-lattice
  (:require
   [scicloj.harmonica           :as h]
   [scicloj.harmonica.protocols :as hp]
   [scicloj.kindly.v4.kind      :as kind]
   [scicloj.kindly.v4.api       :as kindly]
   [math                        :as math]
   [text                        :as text]
   [clojure.set                 :as set]
   [clojure.string              :as str]))

(kindly/set-options! {:kindly/hide-code true})

;; ## Introduction
;;
;; Every finite group $G$ contains a rich family of **subgroups**, subsets
;; closed under the group operation and inverse.  The inclusion relationships
;; among subgroups are captured by the **subgroup lattice**, a partially ordered
;; set in which $H \leq K$ whenever $H \subseteq K$.
;;
;; A particularly clean way to draw a lattice is a **Hasse diagram**:
;; nodes are subgroups, and we draw an edge from $H$ up to $K$ precisely when
;; $H \subsetneq K$ and no subgroup sits strictly in between.  These minimal
;; covering steps are called **covering relations**.
;;
;; In this post we build the subgroup lattice entirely from first principles
;; using the harmonica group library, then visualize each lattice as an
;; interactive SVG.
;; Great thanks to Daniel Slutsky for his Harmonica library: https://scicloj.github.io/harmonica/
(math/definition
  "subgroup"
  "A subset $H \\subseteq G$ of a group $(G, \\cdot)$ is a **subgroup**,
   written $H \\leq G$, if:

   1. $e \\in H$ (identity),
   2. $a, b \\in H \\Rightarrow ab \\in H$ (closure),
   3. $a \\in H \\Rightarrow a^{-1} \\in H$ (inverses).

   By Lagrange's theorem, $|H|$ must divide $|G|$."
  :name "Subgroup")

(math/definition
  "hasse"
  "The **Hasse diagram** of a finite partially-ordered set $(P, \\leq)$ is a
   directed graph whose vertices are the elements of $P$ and whose edges are
   the **covering relations**: $x \\lessdot y$ (read *$x$ is covered by $y$*)
   if $x < y$ and there is no $z$ with $x < z < y$.

   For the subgroup lattice we draw $H \\lessdot K$ when $H \\subsetneq K$
   and no subgroup lies strictly between them."
  :name "Hasse Diagram")

;; Thanks to Harmonica, group structure is encoded very smoothly, and can therefore compute results easily.

;; ## Subgroup enumeration
;;
;; Given a group $G$ and a seed set $S \subseteq G$, the **subgroup generated
;; by $S$**, written $\langle S \rangle$, is the smallest subgroup containing
;; every element of $S$.  We compute it by a simple BFS closure: start with
;; $S \cup \{e\}$ and keep applying the group operation and inverses until no
;; new elements appear.

(defn generate-subgroup
  [G seeds]
  (let [e (hp/id G)]
    (loop [subgp (into #{e} seeds)]
      (let [next-subgp
            (reduce (fn [acc a]
                      (reduce (fn [acc2 b]
                                (-> acc2
                                    (conj (hp/op G a b))
                                    (conj (hp/inv G a))
                                    (conj (hp/inv G b))))
                              acc
                              subgp))
                    subgp
                    subgp)]
        (if (= next-subgp subgp)
          subgp
          (recur next-subgp))))))

(kind/md
"```clojure
(defn generate-subgroup [G seeds]
  (let [e (hp/id G)]
    (loop [subgp (into #{e} seeds)]
      (let [next-subgp
            (reduce (fn [acc a]
                      (reduce (fn [acc2 b]
                                (-> acc2
                                    (conj (hp/op G a b))
                                    (conj (hp/inv G a))
                                    (conj (hp/inv G b))))
                              acc
                              subgp))
                    subgp
                    subgp)]
        (if (= next-subgp subgp)
          subgp
          (recur next-subgp))))))
```")

;; With `generate-subgroup` in hand, we enumerate **all** subgroups by:
;; 1. Computing the cyclic subgroup $\langle g \rangle$ for every $g \in G$.
;; 2. Repeatedly taking pairwise joins $\langle H_1 \cup H_2 \rangle$ of known
;;    subgroups until the collection stabilises.

(defn all-subgroups
  "Find every distinct subgroup of G.
   Works well for |G| ≤ ~50 (Z/n, dihedral D_n for n ≤ 12, S₄).
   Returns a set of sorted sets of group elements."
  [G]
  (let [elts (hp/elements G)
        ;; Step 1: cyclic subgroups ⟨g⟩ for each element
        cyclic (into #{} (map #(generate-subgroup G [%]) elts))]
    ;; Step 2: close under pairwise joins
    (loop [known cyclic]
      (let [pairs (for [h1 known h2 known
                        :when (not= h1 h2)]
                    (generate-subgroup G (set/union h1 h2)))
            next-known (into known pairs)]
        (if (= next-known known)
          known
          (recur next-known))))))

;; ## Covering relations
;;
;; A pair $(H, K)$ with $H \subsetneq K$ is a **covering relation** iff
;; there is no subgroup $L$ with $H \subsetneq L \subsetneq K$.
;; We check this directly: iterate over all known subgroups and verify
;; none sits strictly between $H$ and $K$.

(defn covering-pairs
  "Return the set of [H K] pairs where H ⊊ K and H is covered by K
   (no subgroup lies strictly between them)."
  [subgroups]
  (let [sg-vec (vec subgroups)]
    (into #{}
          (for [h sg-vec k sg-vec
                :when (and (set/subset? h k)
                           (not= h k)
                           (not-any? (fn [m]
                                       (and (set/subset? h m)
                                            (set/subset? m k)
                                            (not= m h)
                                            (not= m k)))
                                     sg-vec))]
            [h k]))))

;; ## Normality test
;;
;; A subgroup $H \leq G$ is **normal** ($H \trianglelefteq G$) when
;; $gHg^{-1} = H$ for all $g \in G$.  We test this directly.

(defn normal?
  "Return true iff H is a normal subgroup of G."
  [G H]
  (let [elts (hp/elements G)]
    (every? (fn [g]
              (= H (into #{}
                         (map (fn [h]
                                (hp/op G g (hp/op G h (hp/inv G g))))
                              H))))
            elts)))

;; ## SVG Lattice Visualisation
;;
;; We lay out the Hasse diagram by grouping subgroups into **levels** by order,
;; spacing nodes evenly within each level, and drawing edges as SVG lines.

(def ^:private level-colors
  ["#4e79a7" "#f28e2b" "#e15759" "#76b7b2"
   "#59a14f" "#edc948" "#b07aa1" "#ff9da7"
   "#9c755f" "#bab0ac"])

(defn- subgroup-label
  "Short label for a subgroup node: its order, optionally with a name."
  [H total-order]
  (let [n (count H)]
    (cond
      (= n 1)           "e"
      (= n total-order) "G"
      :else             (str "|H|=" n))))

(defn lattice-svg
  "Return a hiccup SVG Hasse diagram for the subgroup lattice.

   G         - the group
   subgroups - set of sorted-set subgroups (from all-subgroups)
   pairs     - set of [H K] covering pairs
   opts      - map of :width :height :node-r :font-size"
  [G subgroups pairs & {:keys [width height node-r font-size]
                         :or   {width 700 height 500
                                node-r 22 font-size 11}}]
  (let [total-order (hp/order G)
        ;; Group by order, sort levels bottom (small) to top (large)
        by-order    (->> subgroups
                         (group-by count)
                         (sort-by key))
        levels      (mapv second by-order)
        n-levels    (count levels)
        ;; Assign (x, y) coordinates: level index → y, position-in-level → x
        margin-x    60
        margin-y    50
        usable-w    (- width (* 2 margin-x))
        usable-h    (- height (* 2 margin-y))
        coords      (into {}
                          (mapcat
                           (fn [li level-nodes]
                             (let [n  (count level-nodes)
                                   ;; level 0 at top (whole group), last at bottom
                                   y  (double (+ margin-y
                                                 (* usable-h
                                                    (/ (- n-levels 1 li)
                                                       (max 1.0 (dec n-levels))))))]
                               (map-indexed
                                (fn [ni node]
                                  [node {:x (+ margin-x
                                               (* usable-w
                                                  (/ (+ ni 0.5) n)))
                                         :y y
                                         :level li}])
                                level-nodes)))
                           (range)
                           levels))
        ;; Color by level
        node-color  (fn [H]
                      (let [li (:level (coords H) 0)]
                        (nth level-colors (mod li (count level-colors)))))]
    (kind/hiccup
     [:svg {:xmlns   "http://www.w3.org/2000/svg"
            :width   width
            :height  height
            :style   "font-family: sans-serif; background: transparent;"}
      ;; Edges first (behind nodes)
      [:g {:stroke "#aaa" :stroke-width 1.5}
       (for [[h k] pairs
             :let  [ch (coords h) ck (coords k)]
             :when (and ch ck)]
         [:line {:x1 (:x ch) :y1 (:y ch)
                 :x2 (:x ck) :y2 (:y ck)}])]
      ;; Nodes
      [:g
       (for [H subgroups
             :let [{:keys [x y]} (coords H)
                   label  (subgroup-label H total-order)
                   color  (node-color H)
                   norm   (normal? G H)
                   stroke (if norm "#222" "#c00")]]
         [:g {:transform (str "translate(" x "," y ")")}
          [:circle {:r node-r :fill color :stroke stroke
                    :stroke-width (if norm 1.5 2.5)
                    :opacity 0.9}]
          [:text {:text-anchor "middle"
                  :dominant-baseline "middle"
                  :fill "white"
                  :font-size font-size
                  :font-weight "bold"}
           label]])]])))

;; **Legend:** nodes with a thin dark border are **normal** subgroups;
;; nodes with a thick red border are **non-normal**.

;; ## Example 1 — $\mathbb{Z}/12\mathbb{Z}$
;;
;; The cyclic group of order 12 is abelian, so **every** subgroup is normal.
;; By the classification of cyclic groups, the subgroups correspond bijectively
;; to divisors of 12: we get subgroups of orders 1, 2, 3, 4, 6, and 12.

(text/title "Example 1 — $\\mathbb{Z}/12\\mathbb{Z}$" 2)

(def Z12 (h/cyclic-group 12))

(def Z12-subgroups (all-subgroups Z12))
(def Z12-pairs     (covering-pairs Z12-subgroups))

(kind/md (str "**|G| = " (hp/order Z12) "** — found **"
              (count Z12-subgroups) " subgroups** with **"
              (count Z12-pairs) " covering relations**."))

(lattice-svg Z12 Z12-subgroups Z12-pairs :height 420)

;; Subgroup counts by order:

(kind/md
 (str "| Order | # subgroups | Normal? |\n"
      "|------:|:-----------:|:-------:|\n"
      (str/join "\n"
                (for [[ord sgs] (->> Z12-subgroups
                                     (group-by count)
                                     (sort-by key))]
                  (str "| " ord " | " (count sgs)
                       " | " (if (every? #(normal? Z12 %) sgs) "✓" "✗") " |")))))

;; As expected: the lattice of $\mathbb{Z}/12\mathbb{Z}$ is isomorphic to the
;; divisibility poset of 12, with the trivial group at the bottom and $G$ at
;; the top.

;; ## Example 2 — Dihedral group $D_4$
;;
;; The dihedral group $D_4$ of order 8 (symmetries of the square) has a
;; much richer lattice than the cyclic group of the same order.  Crucially,
;; $D_4$ has **non-normal** subgroups — the two "reflection" subgroups of order 2
;; generated by diagonal reflections are not normal, because they are conjugate
;; to each other but not equal.

(text/title "Example 2 — Dihedral group $D_4$" 2)

(math/remark
  "$D_4$ (order 8) has 10 subgroups: 1 trivial, 1 of order 8, 3 of order 4, and 5
   of order 2 (the identity generates the trivial subgroup of order 1, plus there
   are distinct elements of order 2).  Among the order-2 subgroups, two are
   non-normal (conjugate diagonal reflections), giving red-bordered nodes in
   the diagram.")

(def D4 (h/dihedral-group 4))

(def D4-subgroups (all-subgroups D4))
(def D4-pairs     (covering-pairs D4-subgroups))

(kind/md (str "**|G| = " (hp/order D4) "** — found **"
              (count D4-subgroups) " subgroups** with **"
              (count D4-pairs) " covering relations**."))

(lattice-svg D4 D4-subgroups D4-pairs :height 480)

(kind/md
 (str "| Order | # subgroups | Normal? |\n"
      "|------:|:-----------:|:-------:|\n"
      (str/join "\n"
                (for [[ord sgs] (->> D4-subgroups
                                     (group-by count)
                                     (sort-by key))]
                  (str "| " ord " | " (count sgs)
                       " | " (str/join ", "
                                       (map #(if (normal? D4 %) "✓" "✗") sgs))
                       " |")))))

;; ## Example 3 — Symmetric group $S_4$
;;
;; $S_4$ (permutations of 4 elements, order 24) showcases several famous
;; subgroups: the alternating group $A_4$ (order 12), the Klein four-group
;; $V_4$ (order 4), cyclic subgroups, and dihedral subgroups.
;; The lattice is substantially larger and non-abelian structure abounds.

(text/title "Example 3 — Symmetric group $S_4$" 2)

(math/remark
  "Notable subgroups of $S_4$ include:
   $A_4$ (index-2, hence normal, order 12),
   the Klein four-group $V_4 = \\{e,(12)(34),(13)(24),(14)(23)\\}$
   (normal in $S_4$, order 4),
   three copies of $S_3$ (order 6, non-normal),
   and four copies of $\\mathbb{Z}/3\\mathbb{Z}$ generated by 3-cycles.")

(def S4 (h/symmetric-group 4))

(def S4-subgroups (all-subgroups S4))
(def S4-pairs     (covering-pairs S4-subgroups))

(kind/md (str "**|G| = " (hp/order S4) "** — found **"
              (count S4-subgroups) " subgroups** with **"
              (count S4-pairs) " covering relations**."))

(lattice-svg S4 S4-subgroups S4-pairs :width 800 :height 560 :node-r 20 :font-size 10)

(kind/md
 (str "| Order | # subgroups | Normal? |\n"
      "|------:|:-----------:|:-------:|\n"
      (str/join "\n"
                (for [[ord sgs] (->> S4-subgroups
                                     (group-by count)
                                     (sort-by key))]
                  (str "| " ord " | " (count sgs)
                       " | " (str/join ", "
                                       (map #(if (normal? S4 %) "✓" "✗") sgs))
                       " |")))))

;; ## Summary
;;
;; We have seen three illustrations of the subgroup lattice:
;;
;; - **$\mathbb{Z}/12\mathbb{Z}$:** the lattice is the divisibility poset of
;;   12 — six nodes, all normal, no red borders.
;;
;; - **$D_4$:** order-2 subgroups generated by diagonal reflections are
;;   non-normal (red borders); the three order-4 subgroups include two cyclic
;;   and one Klein four-group, all normal.
;;
;; - **$S_4$:** richest lattice,  30 subgroups across six levels.  The unique
;;   normal subgroups are $\{e\}$, $V_4$, $A_4$, and $S_4$ itself, matching
;;   the classical result that $S_4$ has exactly four normal subgroups.
;;
;; The algorithms here, BFS closure for $\langle S \rangle$ and pairwise
;; joins for $\text{all-subgroups}$, work comfortably for $|G| \leq 50$ or
;; so.  For larger groups (e.g.\ $S_5$, order 120), more sophisticated methods
;; are needed.
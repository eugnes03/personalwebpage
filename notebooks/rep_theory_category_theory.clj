^{:kindly/hide-code true
  :clay {:title  "A Categorical View of Representation Theory"
         :quarto {:author      "Eugen Nesbakken"
                  :description "Category Theory in Representation Theory"
                  :type        :post
                  :date        "2026-02-07"
                  :category    :mathematics
                  :tags        [:algebra :category-theory :representation-theory]}}}


(ns rep-theory-category-theory
  (:require [scicloj.kindly.v4.kind :as kind]
            [math :as math]))

;; # Categorical View of Representation Theory

;; As an exposition to my recent motivation to studying category theory, and the inherent importance of category theory in algebraic studies,
;; I would like to give my understanding of how the story of representation theory fits into the language of categories.
;; Firstly, some definitions.

;; ## Algebraic Preliminaries

(math/definition
  "group" "A **group** is a set $G$ together with a binary operation $\\cdot : G \\times G \\to G$ satisfying:

1. **Associativity**: $(a \\cdot b) \\cdot c = a \\cdot (b \\cdot c)$ for all $a, b, c \\in G$
2. **Identity**: There exists $e \\in G$ such that $e \\cdot a = a \\cdot e = a$ for all $a \\in G$
3. **Inverses**: For each $a \\in G$, there exists $a^{-1} \\in G$ such that $a \\cdot a^{-1} = a^{-1} \\cdot a = e$"
  :name "Group")

(math/definition
  "representation" "A **representation** of a group $G$ over a field $k$ is a pair $(V, \\rho)$ where $V$ is a $k$-vector space and
$$\\rho : G \\to \\mathrm{GL}(V)$$
is a group homomorphism. Equivalently, it is a $k[G]$-module structure on $V$."
  :name "Representation")

;; A representation is *faithful* if $\\rho$ is injective, and *irreducible* (or *simple*) if $V$ has no proper nonzero $G$-invariant subspaces.

(math/definition
  "intertwiner" "Let $(V, \\rho)$ and $(W, \\sigma)$ be representations of $G$. An **intertwining operator** (or $G$-map) is a $k$-linear map $\\varphi : V \\to W$ such that
$$\\varphi \\circ \\rho(g) = \\sigma(g) \\circ \\varphi \\quad \\text{for all } g \\in G.$$
We write $\\mathrm{Hom}_G(V, W)$ for the space of all such maps."
  :name "Intertwining Operator")

;; ## The Category $\\mathrm{Rep}_k(G)$

;; With these definitions, we can now organise representations into a category.

(math/definition
  "rep-category" "The **category of representations** $\\mathrm{Rep}_k(G)$ has:

- **Objects**: Finite-dimensional $k$-representations $(V, \\rho)$ of $G$
- **Morphisms**: $\\mathrm{Hom}_{\\mathrm{Rep}_k(G)}((V, \\rho), (W, \\sigma)) = \\mathrm{Hom}_G(V, W)$, the intertwining operators
- **Composition**: Ordinary composition of linear maps
- **Identity**: The identity map $\\mathrm{id}_V$ on each representation"
  :name "Category of Representations")

;; This is in fact an *abelian category* — it has kernels, cokernels, direct sums, and every monomorphism is a kernel. The abelian structure
;; is what makes the homological machinery of representation theory work.

(math/remark "The equivalence $\\mathrm{Rep}_k(G) \\simeq k[G]\\text{-mod}$ (the category of finite-dimensional left $k[G]$-modules) is an equivalence of abelian categories. This lets us freely use module-theoretic language: subrepresentations are submodules, irreducibles are simple modules, etc.")

;; ## Maschke's Theorem

;; The central structural result in the semisimple case:

(math/theorem
 "maschke" "Let $G$ be a finite group and $k$ a field with $\\mathrm{char}(k) \\nmid |G|$. Then every finite-dimensional representation of $G$ over $k$ is completely reducible: every subrepresentation has a complement.

Equivalently, $k[G]$ is a semisimple ring, and $\\mathrm{Rep}_k(G)$ is a **semisimple abelian category**."
 :name "Maschke's Theorem")

(math/proof "Let $W \\subseteq V$ be a $G$-invariant subspace. Choose any linear projection $\\pi_0 : V \\to W$ (not necessarily $G$-equivariant). Define
$$\\pi(v) = \\frac{1}{|G|} \\sum_{g \\in G} \\rho(g) \\, \\pi_0 \\bigl(\\rho(g^{-1}) v\\bigr).$$
Since $\\mathrm{char}(k) \\nmid |G|$, the scalar $|G|^{-1}$ exists in $k$. One verifies that $\\pi$ is a $G$-equivariant projection onto $W$, so $V = W \\oplus \\ker(\\pi)$.")

;; In categorical language, Maschke's theorem says that every short exact sequence in $\mathrm{Rep}_k(G)$ splits.

(math/remark "When $\\mathrm{char}(k)$ divides $|G|$, the category $\\mathrm{Rep}_k(G)$ is no longer semisimple. This is the domain of **modular representation theory**, where the homological algebra becomes much richer — one studies projective covers, blocks, and cohomology of groups.")

;; ## Schur's Lemma

(math/lemma
 "schur" "Let $V$ and $W$ be irreducible representations of $G$ over an algebraically closed field $k$. Then:

1. If $V \\not\\cong W$, then $\\mathrm{Hom}_G(V, W) = 0$.
2. If $V \\cong W$, then $\\mathrm{Hom}_G(V, V) = k \\cdot \\mathrm{id}_V$."
 :name "Schur's Lemma")

(math/proof "Let $\\varphi : V \\to W$ be a $G$-map. Then $\\ker(\\varphi)$ is a $G$-invariant subspace of $V$, and $\\mathrm{im}(\\varphi)$ is a $G$-invariant subspace of $W$. By irreducibility, $\\ker(\\varphi)$ is either $0$ or $V$, and $\\mathrm{im}(\\varphi)$ is either $0$ or $W$. Thus $\\varphi$ is either zero or an isomorphism, giving (1).

For (2), since $k$ is algebraically closed, any $\\varphi \\in \\mathrm{End}_G(V)$ has an eigenvalue $\\lambda$. Then $\\varphi - \\lambda \\, \\mathrm{id}_V$ is a $G$-endomorphism with nontrivial kernel, hence is zero by the argument above.")

;; ## Functoriality

;; The categorical perspective reveals natural operations on representations as functors.

(math/definition
  "res-ind" "Let $H \\leq G$ be a subgroup.

- **Restriction** $\\mathrm{Res}^G_H : \\mathrm{Rep}_k(G) \\to \\mathrm{Rep}_k(H)$ sends $(V, \\rho)$ to $(V, \\rho|_H)$, simply forgetting the action of elements outside $H$.
- **Induction** $\\mathrm{Ind}^G_H : \\mathrm{Rep}_k(H) \\to \\mathrm{Rep}_k(G)$ sends $(W, \\sigma)$ to $k[G] \\otimes_{k[H]} W$."
  :name "Restriction and Induction")

(math/theorem
 "frobenius" "*(Frobenius reciprocity)* The functors $\\mathrm{Ind}^G_H$ and $\\mathrm{Res}^G_H$ are adjoint:
$$\\mathrm{Hom}_G(\\mathrm{Ind}^G_H(W), V) \\cong \\mathrm{Hom}_H(W, \\mathrm{Res}^G_H(V))$$
naturally in $V \\in \\mathrm{Rep}_k(G)$ and $W \\in \\mathrm{Rep}_k(H)$."
 :name "Frobenius Reciprocity")

(math/remark "Frobenius reciprocity is the statement that induction is *left adjoint* to restriction. In fact, in the semisimple case, induction is also right adjoint to restriction (since $\\mathrm{Ind}^G_H \\cong \\mathrm{CoInd}^G_H$ for finite groups over fields of good characteristic). This makes restriction a **Frobenius functor**.")

;; ## Outlook

;; The categorical viewpoint opens the door to deeper structural results: the Grothendieck group $K_0(\\mathrm{Rep}_k(G))$
;; recovers the character ring, tensor products give $\mathrm{Rep}_k(G)$ the structure of a monoidal category,
;; and Tannaka duality tells us the group $G$ can be *reconstructed* from the monoidal category $\\mathrm{Rep}_k(G)$
;; together with the forgetful (fiber) functor to $\mathrm{Vect}_k$.

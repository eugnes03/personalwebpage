^{:kindly/hide-code true
  :clay {:title  "Week 1: Random Walks on the General Linear Group of Fp"
         :quarto {:author      :Eugen
                  :description "Research Project"
                  :type        :post
                  :date        "2026-02-17"
                  :category    :mathematics
                  :tags        [:algebra :probability :representation-theory]}}}


(ns week1
  (:require [scicloj.kindly.v4.kind :as kind]
            [math :as math]
            [text :as text]
            [group-theory.gl2 :as grp]
            [group-theory.protocols :as p]
            [tablecloth.api :as tc]
            [scicloj.tableplot.v1.plotly :as plotly]))

;;## Introduction
(text/title "The General Linear Group and Representations" 3)


;; I am currently taking MA742, taught by Professor Duque Rosero of Boston University. In this latest homework, she has tasked the class to find the irreducible representations of $\GL{2}(\mathbb{F}_p)$.
;; From this, I was inspired to look more into this group and connect it to other areas that I am studying. This week I want to familiarize myself with some notions of random walks and representations of random walks on finite groups.  
;; Note, I will be assuming some elementary notions of group theory and probability theory. It is just outside the reach of someone just introduced to the topic. 
(text/title "Preliminary Definitions" 3)

;; Firstly, we need some preliminary definitions just to get a sense of the tools and vocabulary we are going to be working with. 

(math/definition
  "representation" "A **representation** of a group is a group homomorphism 
                    $$
                    \\rho : G \\to \\GL (V)
                    $$
                    where $\\GL (V)$ is the general linear group with entries from the vector space $V$.
                    "
  :name "Representation")

;; This is a map of maps. $\rho$ is applied to an element $g \in G$, and then to a vector $v \in V$. A good way of thinking about a representation is it is just a matrix that is purely determined by the elements of a group (finite or not).

(math/remark
 "We usually denote 
                   $$
                   \\rho_g = \\rho(g)
                   $$
                   as $\\rho$ applied to an element in $G$.")

;; Just shorthand notation. Now for some definitions of random walks, and the associated operators needed for random walks on groups. 

(math/definition
  "random-walk" "Let $(X, \\mathcal{X})$ be a measurable state space. A **random walk** on $X$ is a discrete time Markov process such that:

1. $\\P(X_{n+1} \\in A \\mid X_n, X_{n-1}, \\dots, X_0) = \\P(X_{n+1} \\in A \\mid X_n)$"
  :name "Random Walk")

;; Now to define our group of interest: 

(math/definition 
  "glfp" "The group $\\GL_2 (\\F_p)$ is the general linear group with entries in the field of $p$ elements. "
  )


;; ## Investigation into $\GL_2 (\mathbb{F}_p)$

;; We are only interested in this cases looking at fields with prime elements. Firstly, let us take a look at the general linear group and its sizes.

(def GL2
  (grp/gl2 2))

(def GL3
  (grp/gl2 3))

(p/order GL3)


(defn prime? [n]
  (and (> n 1)
       (not-any? #(zero? (mod n %))
                 (range 2 (inc (Math/sqrt n))))))


(defn primes-up-to [n]
  (filter prime? (range 2 (inc n))))


(def ds
  (tc/dataset))



(-> ds
    (tc/add-column :prime (primes-up-to 50))
    (tc/map-columns :GL [:prime] grp/gl2)
    (tc/map-columns :order [:GL] p/order))
;;In the tablecloth structure in this notebook, we have calculated the sizes of a few of the $\GL_2 (\F_p)$ groups. It is time to prove the official result regarding that. 
(math/lemma
 "size" "In $2 \\times 2$ invertible matrices, we need the determinant to be zero. In the case of 2 dimensions the determinant has the following form: 
                             $$
                             \\det A = ad-bc
                             $$
                             In order for this quantity to not be zero, we must have linearly independent vectors representing the columns of the matrix. For the first column, all vectors minus the zero vector is possible. 
                             For the second column, there are $p$ linearly dependent vectors to the first column. Therefore, there are $p^2 - p$ possible vectors for the second column. Therefore: 
                             $$
                             |\\GL_2 (\\F_p)| = (p^2-1)(p^2-p)
                             $$
                            "
 :name "Size of $\\GL_2(\\F_p)$")

;; Therefore, for a prime $p$ we can see how fast the order grows for these groups.



(-> ds
    (tc/add-column :prime (primes-up-to 25))
    (tc/map-columns :GL [:prime] grp/gl2)
    (tc/map-columns :order [:GL] p/order)
    (plotly/layer-line {:=x :prime
                        :=y :order}))

;; And infact if we treat $p$ as a continuous variable, we get a quartic: 

(defn gl2-size [p]
  (* (- (* p p) 1)
     (- (* p p) p)))

(-> (tc/dataset {:p (range 1 50)})
    (tc/map-columns :order [:p] gl2-size)
    (plotly/layer-line {:=x :p
                        :=y :order}))


;; Conjugacy classes are an important notion for groups especially when regarding character tables and representations (which we will see later).
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
            [text :as text]))

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
                   as $\\rho$ applied to an element in $G$."
 )

;; Just shorthand notation. Now for some definitions of random walks, and the associated operators needed for random walks on groups. 

(math/definition
  "random-walk" "Let $(X, \\mathcal{X})$ be a measurable state space. A **random walk** on $X$ is a discrete time Markov process such that:

1. $\\P(X_{n+1} \\in A \\mid X_n, X_{n-1}, \\dots, X_0) = \\P(X_{n+1} \\in A \\mid X_n)$"
  :name "Random Walk"
  )
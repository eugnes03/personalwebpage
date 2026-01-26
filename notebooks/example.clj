^{:kindly/hide-code true
  :clay {:title  "Example"
         :quarto {:author      :Eugen
                  :description "Example notebook"
                  :type        :post
                  :date        "2025-10-02"
                  :category    :general
                  :tags        [:example]}}}

(ns example
  (:require [scicloj.clay.v2.api :as clay]
            [tablecloth.api :as tc]
            [scicloj.kindly.v4.kind :as kind]))


(+ 1 2)
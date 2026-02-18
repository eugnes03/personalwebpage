(ns text
  "Text rendering utilities for Clay notebooks.

   Usage:
     (text/title \"My Section Title\")
     (text/blockquote \"Some quote\" :cite \"Author\")
     (text/cite \"Author\" \"Title\" :url \"https://...\" :year 2024)"
  (:require [scicloj.kindly.v4.kind :as kind]
            [clojure.string :as str]))

;; ---------------------------------------------------------------------------
;; Title / heading
;; ---------------------------------------------------------------------------

(defn title
  "Render a markdown heading.

   text  - heading text (supports markdown/LaTeX)
   level - heading level 1-6 (default 1)"
  ([text] (title text 1))
  ([text level]
   (vary-meta
     (kind/md (str (apply str (repeat level "#")) " " text))
     assoc :kindly/hide-code true)))

;; (text/title "Introduction")
;; (text/title "Background" 2)
;; (text/title "A Result on $\\mathbb{R}^n$" 3)

;; ---------------------------------------------------------------------------
;; Blockquote
;; ---------------------------------------------------------------------------

(defn blockquote
  "Render a markdown blockquote.

   body - markdown string

   Options:
     :cite - attribution string"
  [body & {:keys [cite]}]
  (let [quoted (->> (str/split-lines body)
                    (map #(str "> " %))
                    (str/join "\n"))]
    (vary-meta
      (kind/md
        (if cite
          (str quoted "\n>\n> --- " cite)
          quoted))
      assoc :kindly/hide-code true)))

;; (text/blockquote "The purpose of computation is insight, not numbers.")
;; (text/blockquote "Mathematics is the queen of the sciences." :cite "Gauss")

;; ---------------------------------------------------------------------------
;; Citation / reference
;; ---------------------------------------------------------------------------

(defn cite
  "Render a formatted citation / reference.

   author - author name(s)
   title  - work title

   Options:
     :year      - publication year
     :url       - link to the work
     :journal   - journal or venue name
     :volume    - volume number
     :pages     - page range string
     :publisher - publisher name
     :doi       - DOI string"
  [author title & {:keys [year url journal volume pages publisher doi]}]
  (let [parts (cond-> [(str "**" author "**")
                       (if url
                         (str "\"[" title "](" url ")\"")
                         (str "\"" title "\""))]
                year      (conj (str "(" year ")"))
                journal   (conj (str "*" journal "*"))
                volume    (conj (str "vol. " volume))
                pages     (conj (str "pp. " pages))
                publisher (conj publisher)
                doi       (conj (str "[doi:" doi "](https://doi.org/" doi ")")))]
    (vary-meta
      (kind/md (str (str/join ", " parts) "."))
      assoc :kindly/hide-code true)))

;; (text/cite "Serre" "Linear Representations of Finite Groups"
;;            :year 1977 :publisher "Springer")
;;
;; (text/cite "Atiyah & MacDonald" "Introduction to Commutative Algebra"
;;            :year 1969 :publisher "Addison-Wesley"
;;            :url "https://example.com")
;;
;; (text/cite "Smith et al." "On the structure of groups"
;;            :year 2023 :journal "Journal of Algebra"
;;            :volume 42 :pages "1-25"
;;            :doi "10.1234/example")

(defn bibliography
  "Render a list of citations as a numbered reference list.

   refs - seq of citation strings (plain markdown)"
  [refs]
  (vary-meta
    (kind/md
      (str/join "\n"
                (map-indexed (fn [i r] (str (inc i) ". " r)) refs)))
    assoc :kindly/hide-code true))

;; (text/bibliography
;;   ["Serre, *Linear Representations of Finite Groups*, Springer, 1977."
;;    "Atiyah & MacDonald, *Introduction to Commutative Algebra*, 1969."
;;    "Lang, *Algebra*, Springer, 2002."])

;; ---------------------------------------------------------------------------
;; Download link
;; ---------------------------------------------------------------------------

(defn download
  "Render a styled download link for a file (PDF, data, etc.).

   Place files in site/assets/pdfs/ and reference with a path
   relative to the rendered HTML (site/notebooks/<name>.html).

   href  - relative path (e.g. \"../../assets/pdfs/notes.pdf\")
   label - display text"
  [href label]
  (vary-meta
    (kind/hiccup
      [:a {:href href
           :download true
           :style (str "display:inline-flex;align-items:center;gap:6px;"
                       "padding:8px 16px;border-radius:6px;"
                       "background:#f0f0f0;color:#333;text-decoration:none;"
                       "font-weight:500;border:1px solid #ddd")}
       [:span "\u2B07"]
       [:span label]])
    assoc :kindly/hide-code true))

;; (text/download "../../assets/pdfs/cv.pdf" "Download CV")
;; (text/download "../../assets/pdfs/lecture-notes.pdf" "Download Lecture Notes")

(ns math
  "Mathematical theorem environment utilities for Clay notebooks.

   Emits Quarto fenced-div syntax via kind/md, giving auto-numbered,
   cross-referenceable theorem environments styled with custom CSS.

   Usage:
     (math/definition \"group\" \"A **group** is a set $G$...\" :name \"Group\")
     (math/theorem \"lagrange\" \"If $H \\\\leq G$...\" :name \"Lagrange's Theorem\")
     (math/proof \"Consider the left cosets...\")

   Supported environments:
     definition, theorem, lemma, corollary, proposition,
     conjecture, example, exercise, proof, remark"
  (:require [scicloj.kindly.v4.kind :as kind]))

;; Quarto theorem environment prefixes
(def ^:private env-prefixes
  {:definition  "def"
   :theorem     "thm"
   :lemma       "lem"
   :corollary   "cor"
   :proposition "prp"
   :conjecture  "cnj"
   :example     "exm"
   :exercise    "exr"
   :proof       nil
   :remark      nil})

(defn- theorem-env
  "Emit a Quarto theorem fenced div as kind/md.

   env   - keyword like :definition, :theorem, etc.
   label - string id for cross-refs (e.g. \"group\" -> @def-group), or nil
   body  - markdown string (supports LaTeX math)
   name  - optional display name (shown in header)"
  [env label body name]
  (let [prefix (get env-prefixes env)
        id     (when (and prefix label)
                 (str prefix "-" label))
        header (when name
                 (str "## " name "\n"))]
    (vary-meta
      (kind/md
        (str "::: {" (when id (str "#" id)) "." (clojure.core/name env) "}\n"
             (or header "")
             body "\n"
             ":::"))
      assoc :kindly/hide-code true)))

(defn definition
  "Render a definition environment.

   label - ID for cross-refs (@def-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name (e.g. \"Group\")"
  [label body & {:keys [name]}]
  (theorem-env :definition label body name))

(defn theorem
  "Render a theorem environment.

   label - ID for cross-refs (@thm-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name (e.g. \"Maschke's Theorem\")"
  [label body & {:keys [name]}]
  (theorem-env :theorem label body name))

(defn lemma
  "Render a lemma environment.

   label - ID for cross-refs (@lem-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :lemma label body name))

(defn corollary
  "Render a corollary environment.

   label - ID for cross-refs (@cor-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :corollary label body name))

(defn proposition
  "Render a proposition environment.

   label - ID for cross-refs (@prp-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :proposition label body name))

(defn conjecture
  "Render a conjecture environment.

   label - ID for cross-refs (@cnj-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :conjecture label body name))

(defn example
  "Render an example environment.

   label - ID for cross-refs (@exm-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :example label body name))

(defn exercise
  "Render an exercise environment.

   label - ID for cross-refs (@exr-label)
   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [label body & {:keys [name]}]
  (theorem-env :exercise label body name))

(defn proof
  "Render a proof environment. Quarto auto-adds the QED symbol.

   body - Markdown + LaTeX content"
  [body]
  (theorem-env :proof nil body nil))

(defn remark
  "Render a remark environment.

   body  - Markdown + LaTeX content

   Options:
     :name - Display name"
  [body & {:keys [name]}]
  (theorem-env :remark nil body name))

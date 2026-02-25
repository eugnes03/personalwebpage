(ns group-theory.protocols)

(defprotocol Group
  "A group: a set with an associative binary operation, identity, and inverses."
  (op [G g h] "Group operation: combine elements g and h.")
  (inv [G g] "Group inverse of element g.")
  (id [G] "The identity element."))

(defprotocol FiniteGroup
  "A finite group whose elements can be enumerated."
  (elements [G] "Sequence of all group elements.")
  (order [G] "The number of elements in the group."))

(defprotocol GroupStructure
  "Structural information about a finite group."
  (conjugacy-classes [G]
    "Sequence of conjugacy classes.
     Each class is a map with keys:
       :representative - a representative element
       :elements       - set of elements in the class
       :size           - number of elements in the class"))

(defprotocol GroupType
  "Type tag for multimethod dispatch."
  (group-type [G] "Keyword identifying the group family, e.g. :cyclic, :symmetric."))


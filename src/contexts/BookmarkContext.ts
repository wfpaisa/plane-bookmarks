import { createContext } from "react";
import type { BookmarkItem } from "../types/bookmark";

/**
 * Contexto que provee la función onUpdate a los nodos del árbol.
 * Permite que NodeInput (dentro del árbol virtualizado) actualice
 * el estado global de un bookmark sin prop drilling a través de
 * react-arborist, que no soporta props arbitrarias en sus nodos.
 */
export const BookmarkContext = createContext<{
  onUpdate?: (id: string, data: BookmarkItem) => void;
}>({});

import "./App.css";
import "react-complex-tree/lib/style-modern.css";
import { useState, useRef, useMemo, useCallback } from "react";
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  type TreeItem,
  type TreeItemIndex,
  type TreeRef,
} from "react-complex-tree";
import { bookmarksData, type BookmarkData } from "./data/bookmarks";
import cx from "classnames";

// Interfaz para los items del árbol
interface TreeItemData {
  title: string;
  nombre: string;
  fechaCreacion: string;
  icono: string;
  tags: string[];
  link?: string;
}

function App() {
  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const tree = useRef<TreeRef<TreeItemData>>(null);

  // Función para convertir los datos de la BD al formato del árbol
  const convertToTreeItems = (
    data: BookmarkData[],
  ): Record<TreeItemIndex, TreeItem<TreeItemData>> => {
    const items: Record<TreeItemIndex, TreeItem<TreeItemData>> = {};

    // Crear el item root
    items.root = {
      index: "root",
      isFolder: true,
      children: data.map((item) => item.key),
      data: {
        title: "Bookmarks",
        nombre: "Bookmarks",
        fechaCreacion: new Date().toISOString(),
        icono: "📑",
        tags: [],
      },
    };

    // Función recursiva para procesar cada nodo
    const processNode = (node: BookmarkData) => {
      const hasChildren = node.children && node.children.length > 0;

      items[node.key] = {
        index: node.key,
        isFolder: hasChildren,
        children: hasChildren ? node.children!.map((child) => child.key) : [],
        data: {
          title: node.title,
          nombre: node.nombre,
          fechaCreacion: node.fechaCreacion,
          icono: node.icono,
          tags: node.tags,
          link: node.link,
        },
      };

      // Procesar recursivamente los hijos
      if (hasChildren) {
        node.children!.forEach((child) => processNode(child));
      }
    };

    // Procesar todos los nodos de nivel superior
    data.forEach((node) => processNode(node));

    return items;
  };

  // Convertir los datos de la "base de datos" al formato del árbol
  const items = useMemo(() => convertToTreeItems(bookmarksData), []);

  const dataProvider = useMemo(
    () =>
      new StaticTreeDataProvider(items, (item, newName) => ({
        ...item,
        data: {
          ...item.data,
          nombre: newName,
          title: `${item.data.icono} ${newName}`,
        },
      })),
    [items],
  );

  // Función recursiva para encontrar todos los items que coinciden con la búsqueda
  const findAllMatchingItems = useCallback(
    async (
      search: string,
      searchRoot: TreeItemIndex = "root",
    ): Promise<TreeItemIndex[]> => {
      const item = await dataProvider.getTreeItem(searchRoot);
      const matches: TreeItemIndex[] = [];

      // Buscar en título, nombre y tags
      const searchLower = search.toLowerCase();
      const matchesTitle = item.data.title.toLowerCase().includes(searchLower);
      const matchesNombre = item.data.nombre
        .toLowerCase()
        .includes(searchLower);
      const matchesTags = item.data.tags.some((tag: string) =>
        tag.toLowerCase().includes(searchLower),
      );

      if (
        (matchesTitle || matchesNombre || matchesTags) &&
        item.index !== "root"
      ) {
        matches.push(item.index);
      }

      // Buscar recursivamente en los hijos
      if (item.children) {
        const childrenMatches = await Promise.all(
          item.children.map((child) => findAllMatchingItems(search, child)),
        );
        childrenMatches.forEach((childMatches) => {
          matches.push(...childMatches);
        });
      }

      return matches;
    },
    [dataProvider],
  );

  // Función para obtener todos los ancestros de un item
  const getAncestors = useCallback(
    async (itemIndex: TreeItemIndex): Promise<TreeItemIndex[]> => {
      const ancestors: TreeItemIndex[] = [];

      const findParent = async (
        current: TreeItemIndex,
        searchIn: TreeItemIndex = "root",
      ): Promise<boolean> => {
        const item = await dataProvider.getTreeItem(searchIn);

        if (item.children?.includes(current)) {
          if (searchIn !== "root") {
            ancestors.push(searchIn);
          }
          return true;
        }

        if (item.children) {
          for (const child of item.children) {
            if (await findParent(current, child)) {
              if (searchIn !== "root") {
                ancestors.push(searchIn);
              }
              return true;
            }
          }
        }

        return false;
      };

      await findParent(itemIndex);
      return ancestors.reverse();
    },
    [dataProvider],
  );

  // Efecto para manejar el filtrado
  const handleFilter = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        // Si no hay búsqueda, contraer todo
        setExpandedItems([]);
        return;
      }

      const matches = await findAllMatchingItems(searchTerm);

      if (matches.length > 0) {
        // Obtener todos los ancestros de los items coincidentes
        const allAncestors = new Set<TreeItemIndex>();

        for (const match of matches) {
          const ancestors = await getAncestors(match);
          ancestors.forEach((ancestor) => allAncestors.add(ancestor));
        }

        // Expandir todos los ancestros
        const itemsToExpand = Array.from(allAncestors);
        setExpandedItems(itemsToExpand);
      } else {
        setExpandedItems([]);
      }
    },
    [findAllMatchingItems, getAncestors],
  );

  // Calcular viewState basado en el filtro
  const viewState = useMemo(() => {
    return {
      "bookmarks-tree": {
        expandedItems,
      },
    };
  }, [expandedItems]);

  // Manejar cambio de búsqueda con efecto
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearch = e.target.value;
      setSearch(newSearch);
      handleFilter(newSearch);
    },
    [handleFilter],
  );

  return (
    <>
      <div style={{ marginBottom: "20px", padding: "10px" }}>
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Filtrar bookmarks..."
          style={{ padding: "8px", marginRight: "10px", width: "300px" }}
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              handleFilter("");
            }}
            style={{ padding: "8px 16px" }}
          >
            Limpiar
          </button>
        )}
      </div>
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={(item) => item.data.title}
        viewState={viewState}
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems={true}
        onExpandItem={(item) => {
          setExpandedItems((prev) => [...prev, item.index]);
        }}
        onCollapseItem={(item) => {
          setExpandedItems((prev) => prev.filter((id) => id !== item.index));
        }}
        renderItem={({ item, depth, children, title, context, arrow }) => {
          const InteractiveComponent = context.isRenaming ? "div" : "button";
          const type = context.isRenaming ? undefined : "button";
          return (
            <li
              {...(context.itemContainerWithChildrenProps as any)}
              className={cx(
                "rct-tree-item-li",
                item.isFolder && "rct-tree-item-li-isFolder",
                context.isSelected && "rct-tree-item-li-selected",
                context.isExpanded && "rct-tree-item-li-expanded",
                context.isFocused && "rct-tree-item-li-focused",
                context.isDraggingOver && "rct-tree-item-li-dragging-over",
                context.isSearchMatching && "rct-tree-item-li-search-match",
              )}
            >
              <div
                {...(context.itemContainerWithoutChildrenProps as any)}
                style={{ paddingLeft: `${(depth + 1) * 10}px` }}
                className={cx(
                  "rct-tree-item-title-container",
                  item.isFolder && "rct-tree-item-title-container-isFolder",
                  context.isSelected &&
                    "rct-tree-item-title-container-selected",
                  context.isExpanded &&
                    "rct-tree-item-title-container-expanded",
                  context.isFocused && "rct-tree-item-title-container-focused",
                  context.isDraggingOver &&
                    "rct-tree-item-title-container-dragging-over",
                  context.isSearchMatching &&
                    "rct-tree-item-title-container-search-match",
                )}
              >
                {arrow}
                <InteractiveComponent
                  type={type}
                  {...(context.interactiveElementProps as any)}
                  className={cx("rct-tree-item-button")}
                >
                  {title}
                  {item.data.link && (
                    <a
                      href={item.data.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: "8px", fontSize: "0.8em" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗
                    </a>
                  )}
                </InteractiveComponent>
              </div>
              {children}
            </li>
          );
        }}
      >
        <Tree
          treeId="bookmarks-tree"
          rootItem="root"
          treeLabel="Bookmarks"
          ref={tree}
        />
      </UncontrolledTreeEnvironment>
    </>
  );
}

export default App;

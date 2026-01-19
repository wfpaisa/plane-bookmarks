# React Arborist - Tree Component Library

React Arborist provides a complete tree view solution for React applications, similar to VSCode sidebar, Mac Finder, or Windows Explorer.

## Features

- Drag and drop sorting
- Open/close folders
- Inline renaming
- Virtualized rendering
- Custom styling
- Keyboard navigation
- Aria attributes
- Tree filtering
- Selection synchronization
- Controlled or uncontrolled trees

## Installation

```bash
npm install react-arborist
# or
yarn add react-arborist
```

## Basic Usage

```js
const data = [
  { id: "1", name: "Unread" },
  { id: "2", name: "Threads" },
  {
    id: "3",
    name: "Chat Rooms",
    children: [
      { id: "c1", name: "General" },
      { id: "c2", name: "Random" },
      { id: "c3", name: "Open Source Projects" },
    ],
  },
  {
    id: "4",
    name: "Direct Messages",
    children: [
      { id: "d1", name: "Alice" },
      { id: "d2", name: "Bob" },
      { id: "d3", name: "Charlie" },
    ],
  },
];
```

### Simple Tree

```jsx
import { Tree } from "react-arborist";

function App() {
  return <Tree initialData={data} />;
}
```

### Custom Node Component

```jsx
function App() {
  return (
    <Tree
      initialData={data}
      openByDefault={false}
      width={600}
      height={1000}
      indent={24}
      rowHeight={36}
      overscanCount={1}
      paddingTop={30}
      paddingBottom={10}
      padding={25}
    >
      {Node}
    </Tree>
  );
}

function Node({ node, style, dragHandle }) {
  return (
    <div style={style} ref={dragHandle}>
      {node.isLeaf ? "🍁" : "🗀"}
      {node.data.name}
    </div>
  );
}
```

### Controlled Tree

```jsx
function App() {
  const onCreate = ({ parentId, index, type }) => {};
  const onRename = ({ id, name }) => {};
  const onMove = ({ dragIds, parentId, index }) => {};
  const onDelete = ({ ids }) => {};

  return (
    <Tree
      data={data}
      onCreate={onCreate}
      onRename={onRename}
      onMove={onMove}
      onDelete={onDelete}
    />
  );
}
```

### Tree Filtering

```jsx
function App() {
  const term = useSearchTermString();
  return (
    <Tree
      data={data}
      searchTerm={term}
      searchMatch={(node, term) =>
        node.data.name.toLowerCase().includes(term.toLowerCase())
      }
    />
  );
}
```

### Selection Sync

```jsx
function App() {
  const chatId = useCurrentChatId();
  return <Tree initialData={data} selection={chatId} />;
}
```

### Tree API Access

```jsx
function App() {
  const treeRef = useRef();

  useEffect(() => {
    const tree = treeRef.current;
    tree.selectAll();
  }, []);

  return <Tree initialData={data} ref={treeRef} />;
}
```

### Custom Data Structure

```jsx
function App() {
  const data = [
    {
      category: "Food",
      subCategories: [{ category: "Restaurants" }, { category: "Groceries" }],
    },
  ];
  return (
    <Tree
      data={data}
      idAccessor="category"
      childrenAccessor={(d) => d.subCategories}
    />
  );
}
```

### Custom Rendering

```jsx
function App() {
  return (
    <Tree
      data={data}
      renderRow={MyRow}
      renderDragPreview={MyDragPreview}
      renderCursor={MyCursor}
    >
      {MyNode}
    </Tree>
  );
}
```

### Dynamic Sizing

```js
const { ref, width, height } = useResizeObserver();

<div className="parent" ref={ref}>
  <Tree height={height} width={width} />
</div>;
```

## Tree Component Props

```ts
interface TreeProps<T> {
  // Data Options
  data?: readonly T[];
  initialData?: readonly T[];

  // Data Handlers
  onCreate?: handlers.CreateHandler<T>;
  onMove?: handlers.MoveHandler<T>;
  onRename?: handlers.RenameHandler<T>;
  onDelete?: handlers.DeleteHandler<T>;

  // Renderers
  children?: ElementType<renderers.NodeRendererProps<T>>;
  renderRow?: ElementType<renderers.RowRendererProps<T>>;
  renderDragPreview?: ElementType<renderers.DragPreviewProps>;
  renderCursor?: ElementType<renderers.CursorProps>;
  renderContainer?: ElementType<{}>;

  // Sizes
  rowHeight?: number;
  overscanCount?: number;
  width?: number | string;
  height?: number;
  indent?: number;
  paddingTop?: number;
  paddingBottom?: number;
  padding?: number;

  // Config
  childrenAccessor?: string | ((d: T) => T[] | null);
  idAccessor?: string | ((d: T) => string);
  openByDefault?: boolean;
  selectionFollowsFocus?: boolean;
  disableMultiSelection?: boolean;
  disableEdit?: string | boolean | BoolFunc<T>;
  disableDrag?: string | boolean | BoolFunc<T>;
  disableDrop?:
    | string
    | boolean
    | ((args: {
        parentNode: NodeApi<T>;
        dragNodes: NodeApi<T>[];
        index: number;
      }) => boolean);

  // Event Handlers
  onActivate?: (node: NodeApi<T>) => void;
  onSelect?: (nodes: NodeApi<T>[]) => void;
  onScroll?: (props: ListOnScrollProps) => void;
  onToggle?: (id: string) => void;
  onFocus?: (node: NodeApi<T>) => void;

  // Selection
  selection?: string;

  // Open State
  initialOpenState?: OpenMap;

  // Search
  searchTerm?: string;
  searchMatch?: (node: NodeApi<T>, searchTerm: string) => boolean;

  // Extra
  className?: string | undefined;
  rowClassName?: string | undefined;
  dndRootElement?: globalThis.Node | null;
  onClick?: MouseEventHandler;
  onContextMenu?: MouseEventHandler;
  dndManager?: DragDropManager;
}
```

## Node Component Props

```ts
export type NodeRendererProps<T> = {
  style: CSSProperties;
  node: NodeApi<T>;
  tree: TreeApi<T>;
  dragHandle?: (el: HTMLDivElement | null) => void;
  preview?: boolean;
};
```

## Node API Methods

### State Properties

- `node.isRoot` - Root node check
- `node.isLeaf` - Leaf node check
- `node.isInternal` - Internal node check
- `node.isOpen` - Open state
- `node.isEditing` - Editing state
- `node.isSelected` - Selection state
- `node.isFocused` - Focus state
- `node.isDragging` - Dragging state
- `node.willReceiveDrop` - Drop target state

### Navigation

- `node.childIndex` - Index among siblings
- `node.next` - Next visible node
- `node.prev` - Previous visible node
- `node.nextSibling` - Next sibling in data

### Selection Methods

- `node.select()` - Select only this node
- `node.deselect()` - Deselect this node
- `node.selectMulti()` - Add to selection
- `node.selectContiguous()` - Select range

### Activation Methods

- `node.activate()` - Trigger activation
- `node.focus()` - Focus node

### Open/Close Methods

- `node.open()` - Open folder
- `node.close()` - Close folder
- `node.toggle()` - Toggle open/close
- `node.openParents()` - Open all parents

### Editing Methods

- `node.edit()` - Start editing
- `node.submit(newName)` - Submit rename
- `node.reset()` - Cancel editing

### Event Handlers

- `node.handleClick(event)` - Handle click with modifiers

## Tree API Methods

### Node Accessors

- `tree.get(id)` - Get node by ID
- `tree.at(index)` - Get node by index
- `tree.visibleNodes` - All visible nodes
- `tree.firstNode` - First visible node
- `tree.lastNode` - Last visible node
- `tree.focusedNode` - Currently focused node
- `tree.mostRecentNode` - Most recently selected

### Focus Methods

- `tree.hasFocus` - Tree has focus
- `tree.focus(id)` - Focus specific node
- `tree.isFocused(id)` - Check if focused
- `tree.pageUp()` - Page up
- `tree.pageDown()` - Page down

### Selection Methods

- `tree.selectedIds` - Set of selected IDs
- `tree.selectedNodes` - Array of selected nodes
- `tree.hasNoSelection` - No selection check
- `tree.hasSingleSelection` - Single selection check
- `tree.hasMultipleSelections` - Multiple selection check
- `tree.isSelected(id)` - Check if selected
- `tree.select(id)` - Select specific node
- `tree.deselect(id)` - Deselect specific node
- `tree.selectMulti(id)` - Add to selection
- `tree.selectContiguous(id)` - Select range
- `tree.deselectAll()` - Clear selection
- `tree.selectAll()` - Select all

### Visibility Methods

- `tree.open(id)` - Open folder
- `tree.close(id)` - Close folder
- `tree.toggle(id)` - Toggle folder
- `tree.openParents(id)` - Open parent folders
- `tree.openSiblings(id)` - Open sibling folders
- `tree.openAll()` - Open all folders
- `tree.closeAll()` - Close all folders
- `tree.isOpen(id)` - Check if open

### Drag and Drop

- `tree.isDragging(id)` - Check if dragging
- `tree.willReceiveDrop(id)` - Check if drop target

### Scrolling

- `tree.scrollTo(id, align?)` - Scroll to node

### Properties

- `tree.isEditing` - Tree is editing
- `tree.isFiltered` - Tree is filtered
- `tree.props` - Tree props
- `tree.root` - Root node

import "./App.css";
import { bookmarksData, type BookmarkItem } from "./data/bookmarks";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";

function App() {
  const [term, setTerm] = useState("");
  const [data, setData] = useState<BookmarkItem[]>(bookmarksData);
  const stats = useBookmarkStats(data);

  const handleDataImport = (newData: BookmarkItem[]) => {
    setData(newData);
  };

  return (
    <div className="app-container">
      <Sidebar term={term} onTermChange={setTerm} stats={stats} />
      <MainContent
        data={data}
        searchTerm={term}
        onDataImport={handleDataImport}
      />
    </div>
  );
}

export default App;

import "./App.css";
import { bookmarksData } from "./data/bookmarks";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";

function App() {
  const [term, setTerm] = useState("");
  const stats = useBookmarkStats(bookmarksData);

  return (
    <div className="app-container">
      <Sidebar term={term} onTermChange={setTerm} stats={stats} />
      <MainContent data={bookmarksData} searchTerm={term} />
    </div>
  );
}

export default App;

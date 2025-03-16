import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./routes/Main";
import Header from "./components/Header";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Routes>
          <Route path="/" element={<Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />} />
        </Routes>
    </Router>
  );
}

export default App;

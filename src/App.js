import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./routes/Main";
import Watch from "./routes/Watch";

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Main/>} />
          <Route path="/watch" element={<Watch/>} />
        </Routes>
    </Router>
  );
}

export default App;

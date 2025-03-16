import React, { useState, useEffect } from "react";
import styles from "./Header.module.css";
import SignupModal from "./SignupModal";

function Header({ toggleSidebar }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);
  const [name, setName] = useState(""); 

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserName(storedToken);
    }
  }, []);

  const fetchUserName = async (token) => {
    try {
      const response = await fetch("http://localhost:8080/auth/userinfo", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setName(data.name);
      }
    } catch (error) {
      console.error("사용자 정보 불러오기 실패", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "로그인 실패");
      }

      alert("로그인 성공");
      localStorage.setItem("token", data.token);
      setToken(data.token);
      fetchUserName(data.token);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>VIGILANCE</h1>

      {token ? (
        <div className={styles.profile} onClick={toggleSidebar}> {/* 클릭 시 사이드바 열림 */}
          <span>{name}</span>
          <img src="/profile-icon.png" alt="Profile" className={styles.profileIcon} />
        </div>
      ) : (
        <div className={styles.loginContainer}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="ID"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className={styles.input}
            />
            <input
              type="password"
              placeholder="PW"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={handleLogin} className={styles.button}>로그인</button>
            <button onClick={() => setIsModalOpen(true)} className={styles.button}>회원가입</button>
          </div>
        </div>
      )}

      {isModalOpen && <SignupModal onClose={() => setIsModalOpen(false)} />}
    </header>
  );
}

export default Header;

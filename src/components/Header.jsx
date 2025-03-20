import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ useNavigate 추가
import styles from "./Header.module.css";
import SignupModal from "./SignupModal";

function Header() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ useNavigate 사용

  /**
   * ✅ 로그인 요청 & 로그인 성공 시 `/watch`로 이동
   */
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

      // ✅ 로그인 성공 시 토큰 저장 및 페이지 이동
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      navigate("/watch"); // ✅ 페이지 이동 (useNavigate 사용)
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.logo}>VIGILANCE</h1>
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
      </header>

      {/* ✅ 모달이 헤더 바깥에서 렌더링되도록 수정 */}
      {isModalOpen && <SignupModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

export default Header;

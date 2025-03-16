import React, { useEffect, useState } from "react";
import styles from "./MainPage.module.css";

function MainPage() {
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

  return (
    <div className={styles.mainContainer}>
      <img src="/background.jpg" alt="Vigilance" className={styles.image} />
      {token && <button className={styles.watchButton}>감시</button>}
    </div>
  );
}

export default MainPage;

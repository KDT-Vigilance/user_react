import React from "react";
import Header from '../components/Header'
import styles from "./MainPage.module.css";

function MainPage() {
  return (
    <>
      <Header/>
        <div className={styles.mainContainer}>
          <img src="/background.jpg" alt="Vigilance" className={styles.image} />
      </div>
    </>
  );
}

export default MainPage;

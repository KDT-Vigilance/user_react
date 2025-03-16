import React, { useEffect } from "react";
import styles from "./AddressSearch.module.css";

function AddressSearch({ zipCode, setZipCode }) {
  useEffect(() => {
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement("script");
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => console.log("📌 카카오 주소 API 로드 완료");
      document.body.appendChild(script);
    }
  }, []);

  const handleSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert("카카오 주소 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        setZipCode(data.zonecode); // ✅ 우편번호만 저장
      }
    }).open();
  };

  return (
    <div className={styles.addressContainer}>
      <input type="text" placeholder="우편번호" value={zipCode || ""} readOnly className={styles.input} />
      <button onClick={handleSearch} className={styles.button}>검색</button>
    </div>
  );
}

export default AddressSearch;

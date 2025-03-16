import React, { useState } from "react";
import styles from "./PhoneVerification.module.css";

function PhoneVerification({ phone, setPhone, setIsPhoneVerified }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    try {
      const response = await fetch("http://localhost:8080/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error("인증번호 전송 실패");
      setIsCodeSent(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyCode = async () => {
    try {
      const response = await fetch("http://localhost:8080/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: verificationCode }),
      });
      const data = await response.json();
      if (data.success) {
        setIsPhoneVerified(true);
        alert("인증 완료!");
        setError("");
      } else {
        setError("인증번호가 틀렸습니다.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.phoneContainer}>
      <div className={styles.errorContainer}>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.inputGroup}>
        <input type="text" placeholder="휴대폰 번호" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} disabled={isCodeSent} />
        <button onClick={sendCode} className={styles.button}>{isCodeSent ? "보냄" : "인증"}</button>
      </div>

      <div className={styles.inputGroup}>
        <input type="text" placeholder="인증번호" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className={styles.input} disabled={!isCodeSent} />
        <button onClick={verifyCode} className={styles.button} disabled={!isCodeSent}>인증</button>
      </div>
    </div>
  );
}

export default PhoneVerification;

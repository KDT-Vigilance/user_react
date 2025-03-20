import React, { useState } from "react";
import PhoneVerification from "./PhoneVerification";
import AddressSearch from "./AddressSearch";
import styles from "./SignupModal.module.css";

const API_BASE_URL = "http://localhost:8080/auth"; // ✅ 백엔드 API 주소

function SignupModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [zipCode, setZipCode] = useState("");   
  const [error, setError] = useState("");

  // ✅ Step 1 → Step 2 이동 (유효성 검사 + 아이디 중복 확인)
  const handleNext = async () => {
    if (!account || !password || !confirmPassword) {
      setError("모든 입력 필드를 작성해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // ✅ 아이디 중복 확인
      const response = await fetch(`${API_BASE_URL}/check-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });

      const data = await response.json();
      if (!data.available) {
        setError("이미 사용 중인 ID입니다.");
        return;
      }

      setError("");
      setStep(2);
    } catch (err) {
      setError("아이디 중복 확인 중 오류가 발생했습니다.");
    }
  };

  // ✅ 회원가입 요청
  const handleSignup = async () => {
    if (!isPhoneVerified) {
      setError("휴대폰 인증을 완료해주세요.");
      return;
    }
    if (!zipCode) {
      setError("우편번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          password,
          phone,
          zip_code: zipCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "회원가입 요청 실패");
      }

      alert("회원가입 성공!");
      onClose(); // 모달 닫기
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.innerBox}>
          <button className={styles.closeButton} onClick={onClose}>❌</button>

          {/* Step 1: 계정 정보 입력 */}
          {step === 1 ? (
            <>
              <div className={styles.errorContainer}>
                {error && <p className={styles.error}>{error}</p>}
              </div>
              <input type="text" placeholder="로그인할 ID" value={account} onChange={(e) => setAccount(e.target.value)} className={styles.input} />
              <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} />
              <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.input} />
              <div className={styles.buttonContainer}>
                <button className={styles.nextButton} onClick={handleNext}>다음</button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: 휴대폰 인증 + 우편번호 입력 */}
              <PhoneVerification phone={phone} setPhone={setPhone} setIsPhoneVerified={setIsPhoneVerified} />
              <AddressSearch zipCode={zipCode} setZipCode={setZipCode} />
              <div className={styles.buttonContainer}>
                <button className={styles.signupButton} onClick={handleSignup}>회원가입</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupModal;

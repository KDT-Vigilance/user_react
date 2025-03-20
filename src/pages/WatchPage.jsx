import React, { useState, useEffect } from "react";
import styles from "./WatchPage.module.css";

function WatchPage({ userId }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraNames, setCameraNames] = useState({});
  const [editingCamera, setEditingCamera] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [status, setStatus] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 사이드바 열고 닫기 상태
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  useEffect(() => {
    fetchCameraList();
    const storedNames = JSON.parse(localStorage.getItem("camname")) || {};
    setCameraNames(storedNames);
  }, []);
  
  // 🚨 videoUrl 변경되면 자동으로 handleAlertClick 실행
  useEffect(() => {
    if (videoUrl && !isAlertActive) {
      console.log("[useEffect] videoUrl 변경 감지, 화면 전환 실행");
      setIsAlertActive(true);
    }
  }, [videoUrl, isAlertActive]);
  
  

  /** ✅ FastAPI에서 카메라 목록 가져오기 */
  const fetchCameraList = async () => {
    try {
      console.log("[fetchCameraList] 요청 시작...");
      const response = await fetch("http://localhost:8000/video/cameras");
      console.log("[fetchCameraList] 응답 상태 코드:", response.status);
      if (!response.ok) throw new Error("웹캠 데이터를 불러올 수 없음");
  
      const data = await response.json();
      console.log("[fetchCameraList] 받은 데이터:", data);
  
      if (Array.isArray(data.cameras) && data.cameras.length > 0) {
        setCameras(data.cameras);
        setSelectedCamera(data.cameras[0]);
  
        // ✅ camName을 localStorage에 저장 (기본값 설정)
        const storedNames = JSON.parse(localStorage.getItem("camname")) || {};
        data.cameras.forEach((cam) => {
          if (!storedNames[cam]) {
            storedNames[cam] = cam; // 기본 이름 저장
          }
        });
        localStorage.setItem("camname", JSON.stringify(storedNames));
  
        console.log("✅ camName이 localStorage에 저장됨:", storedNames);
      }
    } catch (error) {
      console.error("[fetchCameraList] 오류 발생:", error);
    }
  };

  /** ✅ FastAPI `/latest_video` API를 주기적으로 호출하여 최신 S3 URL 가져오기 */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestVideoUrl();
    }, 2000); // 2초마다 최신 비디오 URL 체크

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, []); // ✅ 처음 한 번 실행

  /** ✅ FastAPI `/latest_video` API 호출하여 최신 S3 URL 가져오기 */
  const fetchLatestVideoUrl = async () => {
    try {
      console.log("[fetchLatestVideoUrl] 요청 시작...");
      const response = await fetch("http://localhost:8000/video/latest_video");
      console.log("[fetchLatestVideoUrl] 응답 상태 코드:", response.status);
      
      if (!response.ok) throw new Error("최신 비디오 URL을 불러올 수 없음");
      
      const data = await response.json();
      console.log("[fetchLatestVideoUrl] 받은 데이터:", data);

      if (data.video_url) {
        setVideoUrl(data.video_url);
        setIsAlertActive(true);
        sendReport(selectedCamera, data.video_url);
      }
    } catch (error) {
      console.error("[fetchLatestVideoUrl] 오류 발생:", error);
    }
  };

   // 🚨 videoUrl 변경되면 자동으로 상황 발생 처리
  useEffect(() => {
    if (videoUrl && !isAlertActive) {
      console.log("[useEffect] videoUrl 변경 감지, 화면 전환 실행");
      setIsAlertActive(true);
    }
  }, [videoUrl, isAlertActive]);  


  /** ✅ 🚨 신고 정보(report) 생성 후 백엔드로 전송 */
  const sendReport = async (camera, videoUrl) => {
    try {
      // ✅ userId 가져오기
      let userId = localStorage.getItem("userId") || null;
      if (!userId) {
        console.error("❌ userId가 설정되지 않음. localStorage에서 가져올 수 없습니다.");
        return;
      }

      // ✅ localStorage에서 camname 가져오기
      let storedCamNames = JSON.parse(localStorage.getItem("camname")) || {};
      
      console.log("🔍 localStorage에서 camname 데이터:", storedCamNames);

      // ✅ camera가 null이면 selectedCamera 사용, 그래도 null이면 기본값 "CAM1"
      if (!camera) {
        console.warn("⚠️ camera 값이 null이므로 selectedCamera를 대신 사용");
        camera = selectedCamera || "CAM1";
      }

      console.log("🔍 camera 값 확인:", camera);

      // ✅ localStorage의 camname을 무조건 사용
      let camName = storedCamNames[camera];

      // ✅ camName이 없으면 로그 출력 후 기본값 설정
      if (!camName) {
        console.error(`❌ camName이 localStorage에 없음. camera: ${camera}, 저장된 camname:`, storedCamNames);
        return;
      }

      console.log("📌 userId 확인:", userId);
      console.log("📌 camName 확인:", camName);
      console.log("📌 videoUrl 확인:", videoUrl);

      // ✅ 데이터가 모두 존재하는지 확인
      if (!userId || !camName || !videoUrl) {
        console.error("❌ 요청 데이터 누락:", { userId, camName, videoUrl });
        return;
      }

      const report = { userId, camName, videoUrl, status: 0 };

      console.log("[sendReport] 백엔드로 전송할 데이터:", report);

      const response = await fetch("http://localhost:8080/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });

      console.log("[sendReport] 응답 상태 코드:", response.status);

      if (response.ok) {
        const reportData = await response.json();
        console.log("[sendReport] 받은 데이터:", reportData);
        setReportData(reportData);
        setStatus(0);

        // 👉 신고가 저장되었으면 1초마다 백엔드에서 상태 체크
        startStatusPolling(reportData._id);
      } else {
        console.error("[sendReport] 신고 데이터 저장 실패.");
      }
    } catch (error) {
      console.error("[sendReport] 신고 요청 중 오류 발생", error);
    }
  };

  /** ✅ 🔄 1초마다 백엔드에서 `status` 가져오기 */
  const startStatusPolling = (user_id) => {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
  
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8080/report/status/${user_id}`);
        console.log("[startStatusPolling] 응답 상태 코드:", response.status);
  
        const data = await response.json();
        console.log("[startStatusPolling] 받은 데이터:", data);
  
        if (data.status !== undefined) {
          setStatus(data.status);
  
          // 👉 status가 3, 4가 되면 원래 화면(100% 실시간 스트리밍)으로 복귀
          if (data.status >= 3) {
            setIsAlertActive(false);
            setVideoUrl("");  // 녹화된 비디오 숨김
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("[startStatusPolling] 신고 상태 업데이트 중 오류 발생", error);
        clearInterval(interval);
      }
    }, 1000);
  
    setStatusCheckInterval(interval);
  };


  /** ✅ 🚨 상황 발생 버튼 클릭 시 */
  const handleAlertClick = (camera) => {
    if (!isWebSocketConnected) {
      console.warn("⚠️ WebSocket이 연결되지 않아 실행 불가");
      return;
    }
  
    setSelectedCamera(camera);
    setIsAlertActive(true);
  
    console.log(`[handleAlertClick] 🚨 상황 발생 요청! 카메라: ${camera}`);
  };
  
  

  /** ✅ 사이드바 버튼 클릭 시 기본 화면으로 복귀 */
  const handleSidebarClick = (camera) => {
    console.log(`[handleSidebarClick] 사이드바에서 클릭됨: ${camera}`);
    setSelectedCamera(camera);
    setIsAlertActive(false);
    setVideoUrl("");  // 녹화된 비디오 숨김
  };
  

  /** ✅ 사이드바 열고 닫기 */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /** ✅ 카메라 이름을 더블 클릭하여 편집 */
  const handleDoubleClick = (camera) => {
    setEditingCamera(camera);
  };

  /** ✅ 입력값 변경 시 state 업데이트 */
  const handleNameChange = (event, camera) => {
    setCameraNames({ ...cameraNames, [camera]: event.target.value });
  };

  /** ✅ 엔터 키 입력 또는 포커스 아웃 시 이름 저장 */
  const handleNameSave = (camera) => {
    let updatedNames = { ...cameraNames };
    if (!cameraNames[camera] || cameraNames[camera].trim() === "") {
      updatedNames[camera] = camera;
    }
    setCameraNames(updatedNames);
    setEditingCamera(null);
    localStorage.setItem("camname", JSON.stringify(updatedNames));
  };

  
  /** ✅ 상태 메시지 매칭 */
  const statusMessages = {
    0: "송신 완료",
    1: "확인 중",
    2: "출동 중",
    3: "조치 완료",
    4: "이상 무",
  };

  /** ✅ 실시간 스트리밍 URL */
  const videoFeedUrl = `http://localhost:8000/video/video_feed?camera=${selectedCamera}`;

  return (
    <div className={styles.container}>
      {isSidebarOpen && (
        <div className={styles.sidebar}>
          <h2 className={styles.logo}>Vigilance</h2>
          {cameras.map((camera, index) => (
            <button key={index} className={styles.cameraButton} onClick={() => handleSidebarClick(camera)}>
              {editingCamera === camera ? (
                <input
                  type="text"
                  value={cameraNames[camera] || ""}
                  onChange={(e) => handleNameChange(e, camera)}
                  onBlur={() => handleNameSave(camera)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave(camera)}
                  autoFocus
                  className={styles.cameraInput}
                />
              ) : (
                <span onDoubleClick={() => handleDoubleClick(camera)}>
                  {cameraNames[camera] || camera}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <button className={styles.sidebarToggle} onClick={toggleSidebar}>
        {isSidebarOpen ? "◀" : "▶"}
      </button>
  
      <div className={styles.mainContent}>
        {/* ✅ WebSocket 연결 대기 중일 때 메시지 추가 */}
        {!isWebSocketConnected && (
          <p className={styles.warningText}>⚠️ WebSocket 연결 대기 중...</p>
        )}
  
        {/* ✅ 🚨 "상황 발생" 버튼 추가 */}
        {isAlertActive && (
          <button className={styles.alertButton} onClick={() => handleAlertClick(selectedCamera)}>
            상황 발생
          </button>
        )}
  
        {isAlertActive && videoUrl && status < 3 ? (
          // 50:50 화면 (상황 발생)
          <div className={styles.videoWrapper}>
            <div className={styles.videoContainer}>
              <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
            </div>
            <div className={styles.videoContainer}>
              <video src={videoUrl} autoPlay loop muted controls className={styles.videoStream}></video>
            </div>
          </div>
        ) : (
          // 100% 실시간 스트리밍 화면 (기본)
          <div className={styles.videoWrapperSingle}>
            <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
          </div>
        )}
  
        {/* 상태 코드 표시 */}
        <div className={styles.statusBox}>
          상태: {statusMessages[status] || "알 수 없음"}
        </div>
  
        {/* 🚨 신고 데이터 표시 (카메라명 & 비디오 URL) */}
        <div className={styles.reportBox}>
          {reportData ? (
            <>
              <p><strong>📍 신고 카메라:</strong> {reportData.camName}</p>
              <p><strong>📹 비디오 URL:</strong> <a href={reportData.videoUrl} target="_blank">{reportData.videoUrl}</a></p>
            </>
          ) : (
            <p>신고된 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
  
}

export default WatchPage;

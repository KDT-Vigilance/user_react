import React, { useState, useEffect } from "react";
import styles from "./WatchPage.module.css";

function WatchPage({ userId }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraNames, setCameraNames] = useState({});
  const [editingCamera, setEditingCamera] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previousVideoUrl, setPreviousVideoUrl] = useState("");
  const [reportList, setReportList] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [status, setStatus] = useState(null);
  const [isAlertActive, setIsAlertActive] = useState(false); // 🚨 감지 활성화 여부

  /** ✅ 상태 메시지 정의 */
  const statusMessages = {
    0: "송신 완료",
    1: "확인 중",
    2: "출동 중",
    3: "조치 완료",
    4: "이상 무",
  };

  /** ✅ 로컬 스토리지에서 camName 불러오기 */
  useEffect(() => {
    fetchCameraList();
    const storedNames = JSON.parse(localStorage.getItem("camname")) || {};
    setCameraNames(storedNames);
  }, []);

  /** ✅ 카메라 목록 가져오기 */
  const fetchCameraList = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/cameras");
      if (!response.ok) throw new Error("웹캠 데이터를 불러올 수 없음");

      const data = await response.json();
      if (Array.isArray(data.cameras) && data.cameras.length > 0) {
        setCameras(data.cameras);
        setSelectedCamera((prev) => prev || data.cameras[0]);

        const storedNames = JSON.parse(localStorage.getItem("camname")) || {};
        data.cameras.forEach((cam) => {
          if (!storedNames[cam]) storedNames[cam] = cam;
        });
        localStorage.setItem("camname", JSON.stringify(storedNames));
        setCameraNames(storedNames);
      }
    } catch (error) {
      console.error("[fetchCameraList] 오류 발생:", error);
    }
  };

  /** ✅ 2초마다 최신 비디오 URL 가져오기 */
  useEffect(() => {
    const interval = setInterval(fetchLatestVideoUrl, 2000);
    return () => clearInterval(interval);
  }, []);

  /** ✅ FastAPI에서 최신 영상 가져오기 */
  const fetchLatestVideoUrl = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/latest_video");
      if (!response.ok) throw new Error("최신 비디오 URL을 불러올 수 없음");

      const data = await response.json();
      if (data.video_url && data.video_url !== previousVideoUrl) {
        setVideoUrl(data.video_url);
        setPreviousVideoUrl(data.video_url);

        sendReport(selectedCamera || cameras[0], data.video_url);
      }
    } catch (error) {
      console.error("[fetchLatestVideoUrl] 오류 발생:", error);
    }
  };

  /** ✅ 신고 정보 전송 후 자동으로 50:50 화면으로 전환 */
  const sendReport = async (camera, videoUrl) => {
    try {
      let userId = localStorage.getItem("userId") || null;
      if (!userId) return;

      let storedCamNames = JSON.parse(localStorage.getItem("camname")) || {};
      let camName = storedCamNames[camera] || camera;

      if (!camName) {
        camName = "CAM1";
      }

      const report = { userId, camName, videoUrl, status: 0 };

      const response = await fetch("http://localhost:8080/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        const reportData = await response.json();
        setReportList((prev) => [...prev, reportData]);
        setSelectedReportId(reportData._id);
        setStatus(0);
        setIsAlertActive(true); // 🚨 감지 활성화
        startStatusPolling(reportData._id);
      }
    } catch (error) {
      console.error("[sendReport] 신고 요청 중 오류 발생", error);
    }
  };

  /** ✅ 1초마다 신고 상태 확인 및 자동 제거 */
  const startStatusPolling = (reportId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8080/report/status/${reportId}`);
        const data = await response.json();

        if (data.status !== undefined) {
          setReportList((prevList) =>
            prevList.map((report) =>
              report._id === reportId ? { ...report, status: data.status } : report
            )
          );

          setStatus(data.status);

          if (data.status >= 3) {
            setReportList((prevList) => prevList.filter((report) => report._id !== reportId));
            if (selectedReportId === reportId) setSelectedReportId(null);
            setStatus(null);
            setIsAlertActive(false); // 🚨 감지 비활성화
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("[startStatusPolling] 신고 상태 업데이트 중 오류 발생", error);
        clearInterval(interval);
      }
    }, 1000);
  };

  /** ✅ 카메라 이름 수정 기능 */
  const handleDoubleClick = (camera) => {
    setEditingCamera(camera);
  };

  const handleNameChange = (event, camera) => {
    setCameraNames((prev) => {
      const updatedNames = { ...prev, [camera]: event.target.value };
      localStorage.setItem("camname", JSON.stringify(updatedNames));
      return updatedNames;
    });
  };

  const handleNameSave = (camera) => {
    setEditingCamera(null);
  };

  /** ✅ 사이드바 열고 닫기 */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /** ✅ 실시간 스트리밍 URL */
  const videoFeedUrl = `http://localhost:8000/video/video_feed?camera=${selectedCamera}`;

  // ✅ 최신 신고된 비디오를 가져오기 위해 추가
  const latestReport = reportList.length > 0 ? reportList[reportList.length - 1] : null;

  
  const selectedReport = reportList.find((r) => r._id === selectedReportId)

  
  return (
    <div className={styles.container}>
      {/* ✅ 햄버거 버튼 (사이드바 토글) */}
      <button className={styles.hamburger} onClick={toggleSidebar}>
        ☰
      </button>

      {/* ✅ 사이드바 (햄버거 버튼을 클릭하면 확장) */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <h2 className={styles.logo} style={{ display: isSidebarOpen ? "block" : "none" }}>Vigilance</h2>
        {cameras.map((camera, index) => (
          <button 
            key={index} 
            className={styles.cameraButton} 
            onClick={() => {
              setSelectedCamera(camera);
              setSelectedReportId(null); // ✅ 신고 화면에서 빠져나와 무조건 100% 화면으로 변경
            }}
          >
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

      {/* ✅ 메인 콘텐츠 (영상 영역) */}
      <div className={styles.mainContent}>
        {/* ✅ 우측 하단 상태 메시지 */}
        <div className={styles.statusBox}>
          {status !== null ? `현재 상태: ${statusMessages[status] || "알 수 없음"}` : "대기 중..."}
        </div>

        {/* ✅ 상황 발생 버튼 (신고 리스트) */}
        {reportList.length > 0 && (
          <div className={styles.alertBox}>
            {reportList.map((report) => {
              // 🔍 camName이 로컬 스토리지에 저장된 이름인지 확인
              const storedCamNames = JSON.parse(localStorage.getItem("camname")) || {};
              const displayCamName = storedCamNames[report.camName] || report.camName;

              return (
                <button
                  key={report._id}
                  className={`${styles.alertButton} ${selectedReportId === report._id ? styles.active : ""}`}
                  onClick={() => setSelectedReportId(report._id)} // ✅ 신고된 영상 클릭 시 50:50 화면 전환
                >
                  상황 발생: {displayCamName} {/* 🔹 CAM1 → 저장된 카메라 이름으로 표시 */}
                </button>
              );
            })}
          </div>
        )}



        {/* ✅ 50:50 화면 (상황 발생 시, status가 3 이상이면 해제) */}
        {selectedReportId && status !== null && status < 3 ? (
          <div className={styles.videoWrapper}>
            <div className={styles.videoContainer}>
              <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
              <div className={styles.videoLabel}>실시간</div>
            </div>
            <div className={styles.videoContainer}>
              {selectedReport && (
                <video
                  key={selectedReport.video_url}
                  src={selectedReport.video_url}
                  autoPlay
                  loop
                  muted
                  controls
                  preload="auto"
                  onLoadedMetadata={(e) => e.target.play()}
                  className={styles.videoStream}
                />
              )}
              <div className={styles.videoLabel}>상황 발생</div>
            </div>
          </div>
        ) : (
          <div className={styles.videoWrapperSingle}>
            <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
          </div>
        )}
      </div>
    </div>
  );
  
}

export default WatchPage;

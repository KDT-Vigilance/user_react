import React, { useState, useEffect } from "react";
import styles from "./WatchPage.module.css";

function WatchPage() {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraNames, setCameraNames] = useState({});
  const [alertCameras, setAlertCameras] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [streamError, setStreamError] = useState(false);

  useEffect(() => {
    fetchCameraList();
    fetchAlerts();
    const storedNames = JSON.parse(localStorage.getItem("cameraNames")) || {};
    setCameraNames(storedNames);

    // ⏳ 주기적으로 경보 목록 업데이트 (5초마다)
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  /** ✅ FastAPI에서 카메라 목록 가져오기 */
  const fetchCameraList = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/cameras");
      if (!response.ok) throw new Error("웹캠 데이터를 불러올 수 없음");
      const data = await response.json();

      if (Array.isArray(data.cameras) && data.cameras.length > 0) {
        setCameras(data.cameras);
        setSelectedCamera(data.cameras[0]); // ✅ 첫 번째 카메라 기본 선택
      }
    } catch (error) {
      console.error("카메라 목록 불러오는 중 오류 발생", error);
    }
  };

  /** ✅ FastAPI에서 감지된 경보 목록 가져오기 */
  const fetchAlerts = async () => {
    try {
      const response = await fetch("http://localhost:8000/alerts");
      const data = await response.json();
      if (Array.isArray(data.alerts) && data.alerts.length > 0) {
        setAlertCameras(data.alerts);
      } else {
        setAlertCameras([]);
      }
    } catch (error) {
      console.error("알림 데이터를 불러오는 중 오류 발생", error);
    }
  };

  /** ✅ 🚨 상황 발생 버튼 클릭 시 녹화된 비디오 로드 */
  const handleAlertClick = async (camera) => {
    setSelectedCamera(camera);
    setIsAlertActive(true);
    setVideoUrl(""); // ✅ 기존 녹화된 영상 URL 초기화

    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:8000/video/recorded_video?camera=${camera}`);
        if (response.ok) {
          setVideoUrl(response.url); // ✅ 녹화된 비디오 URL 가져오기
        } else {
          console.warn("🚨 녹화된 비디오 없음.");
        }
      } catch (error) {
        console.error("녹화된 비디오를 가져오는 중 오류 발생", error);
      }
    }, 5000); // ✅ 녹화 완료 후 5초 뒤 영상 로드
  };

  /** ✅ 사이드바 버튼 클릭 시 기본 화면으로 복귀 */
  const handleSidebarClick = (camera) => {
    setSelectedCamera(camera);
    setIsAlertActive(false);
    setVideoUrl(""); // ✅ 녹화 영상 숨기기
  };

  /** ✅ 실시간 스트리밍 URL */
  const videoFeedUrl = `http://localhost:8000/video/video_feed?camera=${selectedCamera}`;

  return (
    <div className={styles.container}>
      {/* 🎥 왼쪽 사이드바 (카메라 선택 버튼) */}
      <div className={styles.sidebar}>
        <h2 className={styles.logo}>Vigilance</h2>
        {cameras.length > 0 ? (
          cameras.map((camera, index) => (
            <button key={index} className={styles.cameraButton} onClick={() => handleSidebarClick(camera)}>
              {cameraNames[camera] || camera}
            </button>
          ))
        ) : (
          <p className={styles.noCameras}>카메라 없음</p>
        )}
      </div>

      {/* 🚨 감지된 카메라 알림 (우측 상단 고정) */}
      {alertCameras.length > 0 && (
        <div className={styles.alertBox}>
          {alertCameras.map((cam, idx) => (
            <button key={idx} className={styles.alertButton} onClick={() => handleAlertClick(cam)}>
              상황 발생: {cameraNames[cam] || cam}
            </button>
          ))}
        </div>
      )}

      {/* 🎥 메인 영상 스트리밍 */}
      <div className={styles.mainContent}>
        {isAlertActive && videoUrl ? (
          // 🚨 감지 시 50:50 화면 분할
          <div className={styles.videoWrapper}>
            <div className={styles.videoContainer}>
              <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
            </div>
            <div className={styles.videoContainer}>
              <video src={videoUrl} controls className={styles.videoStream}></video>
            </div>
          </div>
        ) : (
          // ✅ 감지 없을 때 기본 화면
          <div className={styles.videoWrapperSingle}>
            <div className={styles.videoContainer}>
              <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchPage;

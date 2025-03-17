import React, { useState, useEffect } from "react";
import styles from "./WatchPage.module.css";

function WatchPage() {
  const [cameras, setCameras] = useState([]); // ✅ 감지된 카메라 리스트
  const [selectedCamera, setSelectedCamera] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [cameraNames, setCameraNames] = useState({});
  const [alertCameras, setAlertCameras] = useState([]);

  useEffect(() => {
    fetchCameraList();
    fetchAlerts();
    const storedNames = JSON.parse(localStorage.getItem("cameraNames")) || {};
    setCameraNames(storedNames);
  }, []);

  /** ✅ FastAPI에서 감지된 카메라 리스트 가져오기 */
  const fetchCameraList = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/cameras");
      if (!response.ok) throw new Error("웹캠 데이터를 불러올 수 없음");
      const data = await response.json();
      
      if (Array.isArray(data.cameras) && data.cameras.length > 0) {
        setCameras(data.cameras);
        setSelectedCamera(data.cameras[0]); // 첫 번째 카메라 기본 선택
      }
    } catch (error) {
      console.error("카메라 목록을 불러오는 중 오류 발생", error);
    }
  };

  /** ✅ FastAPI에서 감지된 경보 목록 가져오기 */
  const fetchAlerts = async () => {
    try {
      const response = await fetch("http://localhost:8000/alerts");
      const data = await response.json();
      if (Array.isArray(data.alerts)) {
        setAlertCameras(data.alerts);
      }
    } catch (error) {
      console.error("알림 데이터를 불러오는 중 오류 발생", error);
    }
  };

  /** ✅ 더블클릭 시 이름 수정 가능 */
  const handleDoubleClick = (index) => {
    setEditingIndex(index);
  };

  /** ✅ 카메라 이름 입력 */
  const handleNameChange = (e, index) => {
    const newNames = { ...cameraNames, [cameras[index]]: e.target.value };
    setCameraNames(newNames);
  };

  /** ✅ 입력한 이름 저장 (빈 값이면 원래 이름 유지) */
  const handleNameSave = (index) => {
    if (!cameraNames[cameras[index]]) {
      setCameraNames((prev) => ({ ...prev, [cameras[index]]: cameras[index] }));
    }
    localStorage.setItem("cameraNames", JSON.stringify(cameraNames));
    setEditingIndex(null);
  };

  return (
    <div className={styles.container}>
      {/* 🎥 왼쪽 사이드바 (카메라 선택 버튼) */}
      <div className={styles.sidebar}>
        <h2 className={styles.logo}>Vigilance</h2>
        {cameras.map((camera, index) => (
          <button
            key={index}
            className={styles.cameraButton}
            onClick={() => setSelectedCamera(camera)}
            onDoubleClick={() => handleDoubleClick(index)}
          >
            {editingIndex === index ? (
              <input
                type="text"
                value={cameraNames[camera] || ""}
                onChange={(e) => handleNameChange(e, index)}
                onBlur={() => handleNameSave(index)}
                autoFocus
                className={styles.cameraInput}
              />
            ) : (
              cameraNames[camera] || camera
            )}
          </button>
        ))}
      </div>

      {/* 🎥 메인 영상 스트리밍 영역 */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h3 className={styles.camTitle}>
            {cameraNames[selectedCamera] || selectedCamera}
          </h3>

          {/* 🚨 감지된 카메라 표시 */}
          {alertCameras.length > 0 && (
            <div className={styles.alertBox}>
              {alertCameras.map((cam, idx) => (
                <button key={idx} className={styles.alertButton} onClick={() => setSelectedCamera(cam)}>
                  상황 발생: {cameraNames[cam] || cam}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🎥 실시간 영상 박스 */}
        <div className={styles.videoWrapper}>
          <div className={styles.videoContainer}>
            {selectedCamera && (
              <img
                src={`http://localhost:8000/video/video_feed?camera=${selectedCamera}`}
                alt="Live Stream"
                className={styles.videoStream}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchPage;

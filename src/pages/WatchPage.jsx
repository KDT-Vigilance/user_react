import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./WatchPage.module.css";

// ✅ 컴포넌트 외부로 상태 메시지 분리
const statusMessages = {
  0: "송신 완료",
  1: "확인 중",
  2: "출동 중",
  3: "조치 완료",
  4: "이상 무",
};

function WatchPage() {
  const userId = localStorage.getItem("userId"); // ✅ localStorage에서 직접 가져옴
  const pollingRefs = useRef(new Map());
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
  const [isAlertActive, setIsAlertActive] = useState(false);

  useEffect(() => {
    fetchCameraList();
  }, []);

  const fetchCameraList = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/cameras");
      if (!response.ok) throw new Error("웹캠 데이터를 불러올 수 없음");

      const data = await response.json();
      if (Array.isArray(data.cameras) && data.cameras.length > 0) {
        setCameras(data.cameras);
        setSelectedCamera((prev) => prev || data.cameras[0]);

        const updatedNames = { ...cameraNames };
        data.cameras.forEach((cam) => {
          if (!updatedNames[cam]) updatedNames[cam] = cam;
        });
        localStorage.setItem("camname", JSON.stringify(updatedNames));
        setCameraNames(updatedNames);
      }
    } catch (error) {
      console.error("[fetchCameraList] 오류 발생:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchLatestVideoUrl, 2000);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  const fetchLatestVideoUrl = async () => {
    try {
      const response = await fetch("http://localhost:8000/video/latest_video");
      if (!response.ok) throw new Error("최신 비디오 URL을 불러올 수 없음");
  
      const data = await response.json();
      console.log("[latest_video 응답]", data);
  
      if (data.video_url && data.video_url !== previousVideoUrl) {
        setVideoUrl(data.video_url);
        setPreviousVideoUrl(data.video_url);
  
        // ✅ 누락된 camera, detectedTime 보완
        const fallbackCamera = selectedCamera || cameras[0] || "CAM1";
        const fallbackTime = new Date().toISOString();
  
        const camera = data.camera ?? fallbackCamera;
        const detectedTime = data.detected_time ?? fallbackTime;
  
        console.log("📦 sendReport 호출 준비:", {
          camera,
          video_url: data.video_url,
          detectedTime,
        });
  
        sendReport(camera, data.video_url, detectedTime);
      }
    } catch (error) {
      console.error("[fetchLatestVideoUrl] 오류 발생:", error);
    }
  };
  
  

  const sendReport = async (camera, videoUrl, detectedTime) => {
    try {
      if (!userId) return;
  
      const storedCamNames = JSON.parse(localStorage.getItem("camname")) || {};
      const camName = storedCamNames[camera] || camera || "CAM1";
  
      const report = {
        userId,
        camName,
        videoUrl,
        status: 0,
        detectedTime, // ✅ 시간 추가
      };
  
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
        setIsAlertActive(true);
        startStatusPolling(reportData._id);
      }
    } catch (error) {
      console.error("[sendReport] 신고 요청 중 오류 발생", error);
    }
  };
  

  const startStatusPolling = (reportId) => {
    if (pollingRefs.current.has(reportId)) return;

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
            setIsAlertActive(false);

            clearInterval(interval);
            pollingRefs.current.delete(reportId);
          }
        }
      } catch (error) {
        console.error("[startStatusPolling] 신고 상태 업데이트 중 오류 발생", error);
        clearInterval(interval);
        pollingRefs.current.delete(reportId);
      }
    }, 1000);

    pollingRefs.current.set(reportId, interval);
  };

  useEffect(() => {
    if (selectedReportId && status !== null && status < 3) {
      setIsAlertActive(true);
    }
  }, [selectedReportId, status]);

  const handleDoubleClick = (camera) => {
    setEditingCamera(camera);
  };

  const handleNameChange = (event, camera) => {
    setCameraNames((prev) => {
      const updated = { ...prev, [camera]: event.target.value };
      localStorage.setItem("camname", JSON.stringify(updated));
      return updated;
    });
  };

  const handleNameSave = (camera) => {
    setEditingCamera(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const videoFeedUrl = useMemo(() => {
    return selectedCamera ? `http://localhost:8000/video/video_feed?camera=${selectedCamera}` : "";
  }, [selectedCamera]);

  const latestReport = reportList.length > 0 ? reportList[reportList.length - 1] : null;
  const selectedReport = reportList.find((r) => r._id === selectedReportId);

  return (
    <div className={styles.container}>
      <button className={styles.hamburger} onClick={toggleSidebar}>☰</button>

      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <h2 className={styles.logo} style={{ display: isSidebarOpen ? "block" : "none" }}>
          Vigilance
        </h2>
        {cameras.map((camera, index) => (
          <button
            key={index}
            className={styles.cameraButton}
            onClick={() => {
              setSelectedCamera(camera);
              setSelectedReportId(null);
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

      <div className={styles.mainContent}>
        <div className={styles.statusBox}>
          {status !== null ? `현재 상태: ${statusMessages[status] || "알 수 없음"}` : "대기 중..."}
        </div>

        {reportList.length > 0 && (
          <div className={styles.alertBox}>
            {reportList.map((report) => {
              const storedCamNames = JSON.parse(localStorage.getItem("camname")) || {};
              const displayCamName = storedCamNames[report.camName] || report.camName;

              return (
                <button
                  key={report._id}
                  className={`${styles.alertButton} ${
                    selectedReportId === report._id ? styles.active : ""
                  }`}
                  onClick={() => setSelectedReportId(report._id)}
                >
                  상황 발생: {displayCamName} ({report.detectedTime?.slice(11, 16) || "시간 없음"})
                </button>
              );
            })}
          </div>
        )}

        {isAlertActive ? (
          <div className={styles.videoWrapper}>
            <div className={styles.videoContainer}>
            <video
              src={`http://localhost:8000/video/video_feed?camera=${selectedCamera}`}
              autoPlay
              muted
              controls
              className={styles.videoStream}
            />
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
                  playInline
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
            {videoFeedUrl && (
              <img src={videoFeedUrl} alt="Live Stream" className={styles.videoStream} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchPage;

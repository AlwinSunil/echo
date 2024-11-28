import React, { useState, useRef, useEffect } from "react";

const App = () => {
	const [mediaAccess, setMediaAccess] = useState({
		camera: false,
		screen: false,
	});
	const [isStreaming, setIsStreaming] = useState(false);

	const videoRefs = {
		camera: useRef(null),
		screen: useRef(null),
	};
	const streamsRef = useRef({
		camera: null,
		screen: null,
	});
	const wsRef = useRef(null);
	const mediaRecordersRef = useRef({
		camera: null,
		screen: null,
	});

	// Request media access for camera or screen
	const requestMediaAccess = async (type) => {
		try {
			const constraints =
				type === "camera"
					? {
							video: {
								width: { ideal: 1920 },
								height: { ideal: 1080 },
								frameRate: { ideal: 30 },
							},
							audio: true,
					  }
					: {
							video: {
								mediaSource: "screen",
								frameRate: { ideal: 30 },
							},
							audio: true,
					  };

			const stream = await (type === "camera"
				? navigator.mediaDevices.getUserMedia(constraints)
				: navigator.mediaDevices.getDisplayMedia(constraints));

			if (videoRefs[type].current) {
				videoRefs[type].current.srcObject = stream;
			}
			streamsRef.current[type] = stream;
			setMediaAccess((prev) => ({ ...prev, [type]: true }));
		} catch (error) {
			console.error(`Error accessing ${type}:`, error);
			alert(`Failed to access ${type}`);
		}
	};

	// Remove stream
	const removeStream = (type) => {
		if (
			(type === "camera" && mediaAccess.screen) ||
			(type === "screen" && mediaAccess.camera)
		) {
			if (streamsRef.current[type]) {
				streamsRef.current[type]
					?.getTracks()
					.forEach((track) => track.stop());
				streamsRef.current[type] = null;
				if (videoRefs[type].current) {
					videoRefs[type].current.srcObject = null;
				}
				setMediaAccess((prev) => ({ ...prev, [type]: false }));
			}
		} else {
			alert("You must keep at least one stream active.");
		}
	};

	// Start streaming
	const startStreaming = () => {
		if (!mediaAccess.camera && !mediaAccess.screen) {
			alert("Please enable at least one stream before starting.");
			return;
		}

		// Connect to WebSocket
		wsRef.current = new WebSocket("ws://localhost:3000/ws");

		wsRef.current.onopen = () => {
			Object.keys(streamsRef.current).forEach((type) => {
				if (streamsRef.current[type]) {
					const stream = streamsRef.current[type];
					const mediaRecorder = new MediaRecorder(stream, {
						mimeType: "video/webm",
					});

					// Send start message
					wsRef.current.send(
						JSON.stringify({
							type: "start",
							streamType: type,
						})
					);

					// Handler for data availability
					mediaRecorder.ondataavailable = (event) => {
						if (event.data.size > 0) {
							wsRef.current.send(event.data);
						}
					};

					// Start recording every 100ms for low latency
					mediaRecorder.start(100);
					mediaRecordersRef.current[type] = mediaRecorder;
				}
			});

			setIsStreaming(true);
		};

		wsRef.current.onerror = (error) => {
			console.error("WebSocket Error:", error);
			alert("WebSocket connection error");
		};

		wsRef.current.onclose = () => {
			setIsStreaming(false);
		};
	};

	// Stop streaming
	const stopStreaming = () => {
		if (wsRef.current) {
			Object.keys(streamsRef.current).forEach((type) => {
				if (streamsRef.current[type]) {
					// Stop tracks
					streamsRef.current[type]
						?.getTracks()
						.forEach((track) => track.stop());

					// Stop media recorder
					mediaRecordersRef.current[type]?.stop();

					// Send end message
					wsRef.current.send(
						JSON.stringify({
							type: "end",
							streamType: type,
						})
					);

					// Clear video source
					if (videoRefs[type].current) {
						videoRefs[type].current.srcObject = null;
					}
				}
			});

			// Close WebSocket
			wsRef.current.close();
		}

		// Reset state
		setIsStreaming(false);
		setMediaAccess({ camera: false, screen: false });
		streamsRef.current = { camera: null, screen: null };
		mediaRecordersRef.current = { camera: null, screen: null };
	};

	return (
		<div
			style={{
				fontFamily: "Arial, sans-serif",
				maxWidth: "800px",
				margin: "0 auto",
				padding: "20px",
			}}
		>
			<h1 style={{ textAlign: "center" }}>Multi-Stream Video Capture</h1>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "20px",
				}}
			>
				{["camera", "screen"].map((type) => (
					<div
						key={type}
						style={{
							textAlign: "center",
							width: "48%",
						}}
					>
						<h2>
							{type === "camera" ? "Camera" : "Screen"} Stream
						</h2>
						<video
							ref={videoRefs[type]}
							style={{
								width: "100%",
								height: "300px",
								background: "black",
								transform:
									type === "camera" ? "scaleX(-1)" : "none",
							}}
							autoPlay
							muted
						/>
						<button
							onClick={() =>
								mediaAccess[type]
									? removeStream(type)
									: requestMediaAccess(type)
							}
							style={{
								marginTop: "10px",
								padding: "10px 20px",
								backgroundColor: mediaAccess[type]
									? "red"
									: "green",
								color: "white",
								border: "none",
								cursor: "pointer",
							}}
						>
							{mediaAccess[type]
								? `Remove ${type}`
								: `Capture ${type}`}
						</button>
					</div>
				))}
			</div>

			<div style={{ textAlign: "center" }}>
				{(mediaAccess.camera || mediaAccess.screen) && !isStreaming && (
					<button
						onClick={startStreaming}
						style={{
							padding: "10px 20px",
							backgroundColor: "green",
							color: "white",
							border: "none",
							cursor: "pointer",
							fontSize: "16px",
						}}
					>
						Start Streaming
					</button>
				)}

				{isStreaming && (
					<button
						onClick={stopStreaming}
						style={{
							padding: "10px 20px",
							backgroundColor: "red",
							color: "white",
							border: "none",
							cursor: "pointer",
							fontSize: "16px",
						}}
					>
						Stop Streaming
					</button>
				)}
			</div>
		</div>
	);
};

export default App;

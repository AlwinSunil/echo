import React, { useState, useRef, useEffect } from "react";

const App = () => {
	const [mediaAccess, setMediaAccess] = useState({
		camera: false,
		screen: false,
	});
	const [isStreaming, setIsStreaming] = useState(false);
	const [sessionId, setSessionId] = useState(null);

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

	// Notify backend about stream state changes
	const notifyBackend = (type, action) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			const message = {
				type: "streamStateChange",
				streamType: type,
				action, // 'start' or 'stop'
			};
			wsRef.current.send(JSON.stringify(message));
		}
	};

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

	// Dynamically handle stream changes
	useEffect(() => {
		if (isStreaming) {
			Object.keys(mediaAccess).forEach((type) => {
				if (mediaAccess[type] && !mediaRecordersRef.current[type]) {
					// Start recording
					const stream = streamsRef.current[type];
					if (stream) {
						const mediaRecorder = new MediaRecorder(stream, {
							mimeType: "video/webm",
						});

						mediaRecorder.ondataavailable = (event) => {
							if (event.data.size > 0) {
								const streamTypeBit = type === "screen" ? 1 : 0;

								// Create a new Blob by combining the original Blob with a new Blob containing the stream type byte
								const modifiedBlob = new Blob(
									[
										event.data,
										new Uint8Array([streamTypeBit]),
									],
									{ type: event.data.type }
								);

								// Send the modified Blob
								wsRef.current.send(modifiedBlob);

								console.log(modifiedBlob);
								console.log(event.data);
							}
						};

						mediaRecorder.start(100); // Record in chunks of 100ms
						mediaRecordersRef.current[type] = mediaRecorder;
						notifyBackend(type, "start");
					}
				} else if (
					!mediaAccess[type] &&
					mediaRecordersRef.current[type]
				) {
					// Stop recording
					mediaRecordersRef.current[type]?.stop();
					mediaRecordersRef.current[type] = null;

					// Notify backend about stream stop
					notifyBackend(type, "stop");
				}
			});
		}
	}, [mediaAccess, isStreaming]);

	// Start streaming
	const startStreaming = () => {
		if (!mediaAccess.camera && !mediaAccess.screen) {
			alert("Please enable at least one stream before starting.");
			return;
		}

		wsRef.current = new WebSocket("ws://localhost:3000/ws");

		wsRef.current.onopen = () => {
			wsRef.current.onmessage = (event) => {
				const data = JSON.parse(event.data);

				if (data.sessionId) {
					setSessionId(data.sessionId);
					setIsStreaming(true);

					// Notify backend that streaming is active
					Object.keys(mediaAccess).forEach((type) => {
						if (mediaAccess[type]) {
							notifyBackend(type, "start");
						}
					});
				}
			};
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
					streamsRef.current[type]
						?.getTracks()
						.forEach((track) => track.stop());

					mediaRecordersRef.current[type]?.stop();

					wsRef.current.send(
						JSON.stringify({
							type: "end",
							streamType: type,
						})
					);

					if (videoRefs[type].current) {
						videoRefs[type].current.srcObject = null;
					}
				}
			});

			wsRef.current.close();
		}

		setIsStreaming(false);
		setMediaAccess({ camera: false, screen: false });
		streamsRef.current = { camera: null, screen: null };
		mediaRecordersRef.current = { camera: null, screen: null };
		setSessionId(null);
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

			{sessionId && (
				<div
					style={{
						textAlign: "center",
						backgroundColor: "#f0f0f0",
						padding: "10px",
						marginBottom: "20px",
						borderRadius: "5px",
					}}
				>
					<strong>Session ID:</strong> {sessionId}
				</div>
			)}

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
							borderRadius: "5px",
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

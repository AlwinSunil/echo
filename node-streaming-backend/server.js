import express from "express";
import fs from "fs";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import cors from "cors";

// ES Module path resolving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3000;
const VIDEO_DIR = path.join(__dirname, "videos");

// Ensure videos directory exists
if (!fs.existsSync(VIDEO_DIR)) {
	fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Active Recordings Tracking
const activeRecordings = new Map();

// WebSocket Connection Handler
wss.on("connection", (ws) => {
	console.log("WebSocket connection established");

	ws.on("message", (rawData) => {
		try {
			const message = JSON.parse(rawData.toString());

			switch (message.type) {
				case "start": {
					const { streamType, videoMetadata } = message;

					// Validate stream type
					if (!["camera", "screen"].includes(streamType)) {
						ws.send(
							JSON.stringify({
								type: "error",
								message: `Invalid streamType: ${streamType}`,
							})
						);
						return;
					}

					const fileId = uuidv4();
					const rawFilePath = path.join(
						VIDEO_DIR,
						`${fileId}_${streamType}_raw.webm`
					);
					const finalFilePath = path.join(
						VIDEO_DIR,
						`${fileId}_${streamType}.mp4`
					);

					// Create a writable stream for raw video
					const fileStream = fs.createWriteStream(rawFilePath, {
						flags: "a",
					});

					// Store recording details
					activeRecordings.set(streamType, {
						fileStream,
						videoBuffer: [],
						rawFilePath,
						finalFilePath,
						metadata: videoMetadata || {},
						startTime: Date.now(),
					});

					ws.send(
						JSON.stringify({
							type: "start_ack",
							fileId: fileId,
						})
					);
					break;
				}

				case "data": {
					const { streamType, chunk, metadata } = message;
					const recording = activeRecordings.get(streamType);

					if (recording && chunk) {
						try {
							// Convert base64 chunk to buffer
							const buffer = Buffer.from(chunk, "base64");

							// Log chunk size for debugging
							console.log(
								`Received ${streamType} chunk of size ${buffer.length} bytes`
							);

							// Update recording metadata if new info is provided
							if (metadata) {
								recording.metadata = {
									...recording.metadata,
									...metadata,
								};
							}

							// Add chunk to buffer
							recording.videoBuffer.push(buffer);

							// Flush buffer to disk if it gets too large
							const bufferSizeLimit = 1024 * 1024 * 10; // 10 MB
							if (
								recording.videoBuffer.reduce(
									(sum, buf) => sum + buf.length,
									0
								) >= bufferSizeLimit
							) {
								const dataToWrite = Buffer.concat(
									recording.videoBuffer
								);
								recording.fileStream.write(dataToWrite, () => {
									console.log(
										`Flushed buffered data to disk for ${streamType}`
									);
								});

								// Clear the buffer
								recording.videoBuffer = [];
							}
						} catch (error) {
							console.error(
								`Error processing chunk for ${streamType}:`,
								error
							);
							ws.send(
								JSON.stringify({
									type: "error",
									message: `Error processing chunk for ${streamType}`,
								})
							);
						}
					}
					break;
				}

				case "end": {
					const { streamType } = message;
					const recording = activeRecordings.get(streamType);

					if (recording) {
						// Write any remaining data in the buffer
						if (recording.videoBuffer.length > 0) {
							const dataToWrite = Buffer.concat(
								recording.videoBuffer
							);
							recording.fileStream.write(dataToWrite, () => {
								console.log(
									`Flushed remaining data for ${streamType}`
								);
							});
						}

						// Close the file stream
						recording.fileStream.end(() => {
							console.log(
								`Raw video saved: ${recording.rawFilePath}`
							);
						});

						// Use FFmpeg to convert and optimize the video
						const ffmpegProcess = spawn("ffmpeg", [
							"-i",
							recording.rawFilePath,
							"-c:v",
							"libx264", // H.264 video codec
							"-preset",
							"medium", // Compression preset
							"-crf",
							"23", // Constant Rate Factor (quality)
							"-c:a",
							"aac", // Audio codec
							recording.finalFilePath,
						]);

						ffmpegProcess.stdout.on("data", (data) => {
							console.log(`FFmpeg stdout: ${data}`);
						});

						ffmpegProcess.stderr.on("data", (data) => {
							console.error(`FFmpeg stderr: ${data}`);
						});

						ffmpegProcess.on("close", (code) => {
							if (code === 0) {
								console.log(
									`Successfully converted ${streamType} video`
								);

								// Optional: Remove raw file
								fs.unlinkSync(recording.rawFilePath);

								// Send acknowledgment with final file path and metadata
								ws.send(
									JSON.stringify({
										type: "end_ack",
										filePath: recording.finalFilePath,
										metadata: recording.metadata,
									})
								);
							} else {
								console.error(
									`FFmpeg conversion failed with code ${code}`
								);
							}
						});

						// Remove from active recordings
						activeRecordings.delete(streamType);
					}
					break;
				}

				default:
					ws.send(
						JSON.stringify({
							type: "error",
							message: `Unknown message type: ${message.type}`,
						})
					);
			}
		} catch (error) {
			console.error("Error processing message:", error);
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Error processing your message.",
				})
			);
		}
	});

	// Handle WebSocket connection closure
	ws.on("close", () => {
		activeRecordings.forEach((recording, streamType) => {
			try {
				// Finalize any ongoing recordings
				if (recording.videoBuffer.length > 0) {
					const dataToWrite = Buffer.concat(recording.videoBuffer);
					recording.fileStream.write(dataToWrite);
				}

				recording.fileStream.end(() => {
					console.log(
						`Connection closed. Saved ${streamType} recording: ${recording.rawFilePath}`
					);
				});
			} catch (error) {
				console.error(
					`Error finalizing recording for ${streamType}:`,
					error
				);
			}
		});
		activeRecordings.clear();
	});
});

// Create HTTP server
const server = app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

// Handle WebSocket upgrade
server.on("upgrade", (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit("connection", ws, request);
	});
});

export default app;

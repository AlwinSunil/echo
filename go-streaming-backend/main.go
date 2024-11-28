package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ensureOutputDir() error {
	outputDir := "outputs"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}
	return nil
}

func processVideoWithFFmpeg(inputFile string) error {
	// Ensure the input file exists
	if _, err := os.Stat(inputFile); os.IsNotExist(err) {
		return fmt.Errorf("input file does not exist: %s", inputFile)
	}

	outputFile := inputFile + "_optimized.webm"

	// Construct FFmpeg command with more robust error checking
	ffmpegCmd := exec.Command(
		"ffmpeg",
		"-i", inputFile, // Input file
		"-c:v", "libvpx-vp9", // VP9 video codec
		"-crf", "30", // Constant Rate Factor for quality (lower is better quality)
		"-b:v", "0", // No bitrate limit
		"-b:a", "128k", // Audio bitrate
		"-c:a", "libopus", // Opus audio codec
		"-strict", "experimental",
		"-f", "webm", // Force WebM container
		"-y", // Overwrite output file
		outputFile,
	)

	// Capture detailed error output
	output, err := ffmpegCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("FFmpeg error: %v\nOutput: %s", err, string(output))
	}

	log.Printf("Successfully processed video: %s", outputFile)
	return nil
}

func handleStream(conn *websocket.Conn) {
	defer conn.Close()

	// Ensure output directory exists
	if err := ensureOutputDir(); err != nil {
		log.Println("Error setting up output directory:", err)
		return
	}

	// Create unique filename with timestamp
	tempFileName := filepath.Join("outputs", fmt.Sprintf("stream_%d.webm", time.Now().Unix()))
	file, err := os.Create(tempFileName)
	if err != nil {
		log.Println("Error creating temporary file:", err)
		return
	}
	defer file.Close()

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		if messageType == websocket.TextMessage {
			var streamMessage map[string]interface{}
			if err := json.Unmarshal(message, &streamMessage); err != nil {
				log.Println("Error unmarshalling message:", err)
				continue
			}

			switch streamMessage["type"] {
			case "start":
				log.Println("Started recording:", tempFileName)
			case "end":
				log.Println("Stopping recording, processing video")

				// Close the file before processing
				file.Close()

				// Process video with improved FFmpeg command
				start := time.Now()
				if err := processVideoWithFFmpeg(tempFileName); err != nil {
					log.Printf("Video processing failed: %v", err)
				} else {
					elapsed := time.Since(start)
					log.Printf("Video processing completed in %v", elapsed)
				}
			}
		} else if messageType == websocket.BinaryMessage {
			_, err := file.Write(message)
			if err != nil {
				log.Println("Error writing to file:", err)
			}
		}
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading WebSocket connection:", err)
		return
	}
	handleStream(conn)
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	log.Println("Server started on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}

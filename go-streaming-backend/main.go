package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type StreamClip struct {
	Type       string  `json:"type"`
	FileName   string  `json:"filename"`
	StartTime  float64 `json:"start_time"`
	EndTime    float64 `json:"end_time"`
	ClipNumber int     `json:"clip_number"`
}

type StreamSession struct {
	ID        string       `json:"id"`
	StartTime time.Time    `json:"start_time"`
	Clips     []StreamClip `json:"clips"`
	mu        sync.Mutex
}

type StreamState struct {
	File          *os.File
	ClipNumber    int
	LastWriteTime time.Time
	StartTime     float64
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func createStreamSession() *StreamSession {
	sessionID := uuid.New().String()
	sessionDir := filepath.Join("outputs", sessionID)

	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		log.Printf("Failed to create session directory: %v", err)
		return nil
	}

	return &StreamSession{
		ID:        sessionID,
		StartTime: time.Now(),
		Clips:     []StreamClip{},
	}
}

func (s *StreamSession) addClip(clipType, fileName string, startTime, endTime float64, clipNumber int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	clip := StreamClip{
		Type:       clipType,
		FileName:   fileName,
		StartTime:  startTime,
		EndTime:    endTime,
		ClipNumber: clipNumber,
	}

	s.Clips = append(s.Clips, clip)
	s.saveSessionMetadata()
}

func (s *StreamSession) saveSessionMetadata() {
	metadataPath := filepath.Join("outputs", s.ID, "session_metadata.json")
	metadata, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		log.Printf("Error creating session metadata: %v", err)
		return
	}

	if err := os.WriteFile(metadataPath, metadata, 0644); err != nil {
		log.Printf("Error saving session metadata: %v", err)
	}
}

func processVideoWithFFmpeg(inputFile, outputDir string, streamType string, clipNumber int) (string, error) {
	// Placeholder for actual FFmpeg processing logic.
	return inputFile, nil
}

func handleStream(conn *websocket.Conn) {
	defer conn.Close()

	session := createStreamSession()
	if session == nil {
		log.Println("Failed to create stream session")
		return
	}

	if err := conn.WriteJSON(map[string]string{"sessionId": session.ID}); err != nil {
		log.Println("Error sending session ID:", err)
		return
	}

	sessionDir := filepath.Join("outputs", session.ID)
	startTime := time.Now()

	streamStates := make(map[string]*StreamState)
	var streamMutex sync.Mutex

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
			case "streamStateChange":
				streamType := streamMessage["streamType"].(string)
				action := streamMessage["action"].(string)

				if action == "start" {
					streamMutex.Lock()
					if _, exists := streamStates[streamType]; !exists {
						tempFileName := filepath.Join(sessionDir, fmt.Sprintf("%s_clip_%d_temp.webm",
							streamType, time.Now().UnixNano()))
						file, err := os.Create(tempFileName)
						if err != nil {
							log.Printf("Error creating file for %s: %v", streamType, err)
							streamMutex.Unlock()
							continue
						}

						startTimeRelative := time.Since(startTime).Seconds()
						streamStates[streamType] = &StreamState{
							File:          file,
							ClipNumber:    0,
							LastWriteTime: time.Now(),
							StartTime:     startTimeRelative,
						}

						log.Printf("Started recording %s: %s", streamType, tempFileName)
					}
					streamMutex.Unlock()
				} else if action == "stop" {
					streamMutex.Lock()
					if state, exists := streamStates[streamType]; exists {
						state.File.Close()
						tempFileName := state.File.Name()

						processedFileName, err := processVideoWithFFmpeg(tempFileName, sessionDir, streamType, state.ClipNumber)
						if err != nil {
							log.Printf("Video processing failed for %s: %v", streamType, err)
						} else {
							endTimeRelative := time.Since(startTime).Seconds()
							session.addClip(streamType, processedFileName, state.StartTime, endTimeRelative, state.ClipNumber)
							state.ClipNumber++
						}

						delete(streamStates, streamType)
					}
					streamMutex.Unlock()
				}

			default:
				log.Println("Unknown message type:", streamMessage["type"])
			}
		} else if messageType == websocket.BinaryMessage {
			streamMutex.Lock()

			// Ensure the message has at least one byte for the stream type
			if len(message) < 1 {
				log.Println("Received empty binary message")
				streamMutex.Unlock()
				continue
			}

			// Extract the stream type from the last byte
			streamTypeBit := message[len(message)-1]
			var streamType string
			if streamTypeBit == 1 {
				streamType = "screen"
			} else {
				streamType = "camera"
			}

			// Remove the last byte to isolate the binary data
			binaryData := message[:len(message)-1]

			// Write the binary data to the appropriate file
			if state, exists := streamStates[streamType]; exists {
				if state.File != nil {
					_, err := state.File.Write(binaryData)
					if err != nil {
						log.Printf("Error writing data to file for stream type %s: %v", streamType, err)
					} else {
						state.LastWriteTime = time.Now()
						log.Printf("Writing data for stream type: %s", streamType)
					}
				}
			} else {
				log.Printf("No active state found for stream type: %s", streamType)
			}

			streamMutex.Unlock()
		}
	}

	// Final cleanup: Close files and process any remaining streams
	streamMutex.Lock()
	for streamType, state := range streamStates {
		if state.File != nil {
			state.File.Close()
			tempFileName := state.File.Name()

			processedFileName, err := processVideoWithFFmpeg(tempFileName, sessionDir, streamType, state.ClipNumber)
			if err != nil {
				log.Printf("Final video processing failed for %s: %v", streamType, err)
			} else {
				endTimeRelative := time.Since(startTime).Seconds()
				session.addClip(streamType, processedFileName, state.StartTime, endTimeRelative, state.ClipNumber)
			}
		}
	}
	streamMutex.Unlock()

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

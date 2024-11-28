import React, { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface StreamPreviewProps {
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export function StreamPreview({
  isCameraOn,
  isScreenSharing,
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  const [cameraAspectRatio, setCameraAspectRatio] = useState<string>("16/9");
  const [screenAspectRatio, setScreenAspectRatio] = useState<string>("16/9");

  // Use separate state for camera and screen streams
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const manageCameraStream = async () => {
      // If camera should be on and no current stream
      if (isCameraOn && !cameraStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // Set stream to video element
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }

          // Store the stream in state
          setCameraStream(stream);

          // Determine aspect ratio
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          if (settings.width && settings.height) {
            const ratio = `${settings.width}/${settings.height}`;
            setCameraAspectRatio(ratio);
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }
      // If camera should be off and stream exists
      else if (!isCameraOn && cameraStream) {
        // Stop all tracks in the camera stream
        cameraStream.getTracks().forEach((track) => track.stop());

        // Clear the video source
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Clear the stream state
        setCameraStream(null);
      }
    };

    const manageScreenStream = async () => {
      // If screen sharing should be on and no current stream
      if (isScreenSharing && !screenStream) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });

          // Set stream to screen video element
          if (screenRef.current) {
            screenRef.current.srcObject = stream;
          }

          // Store the stream in state
          setScreenStream(stream);

          // Handle stream ending (e.g., user cancels screen share)
          stream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
          };

          // Determine aspect ratio
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          if (settings.width && settings.height) {
            const ratio = `${settings.width}/${settings.height}`;
            setScreenAspectRatio(ratio);
          }
        } catch (err) {
          console.error("Error sharing screen:", err);
        }
      }
      // If screen sharing should be off and stream exists
      else if (!isScreenSharing && screenStream) {
        // Stop all tracks in the screen stream
        screenStream.getTracks().forEach((track) => track.stop());

        // Clear the screen video source
        if (screenRef.current) {
          screenRef.current.srcObject = null;
        }

        // Clear the stream state
        setScreenStream(null);
      }
    };

    // Separately manage camera and screen streams
    // This ensures they are handled independently
    manageCameraStream();
    manageScreenStream();
  }, [isCameraOn, isScreenSharing]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    };
  }, [isCameraOn]);

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
    };
  }, [isScreenSharing]);

  return (
    <Card className="overflow-hidden shadow-none border-none">
      <CardContent className="p-0">
        <div className="relative grid grid-cols-2 gap-3">
          <div
            className="relative bg-black overflow-hidden"
            style={{
              aspectRatio: cameraAspectRatio,
            }}
          >
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Camera off
              </div>
            )}
          </div>
          <div
            className="relative bg-black overflow-hidden"
            style={{
              aspectRatio: screenAspectRatio,
            }}
          >
            {isScreenSharing ? (
              <video
                ref={screenRef}
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Screen sharing off
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

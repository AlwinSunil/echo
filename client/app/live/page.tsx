"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { Camera, Mic, MicOff, Monitor } from "lucide-react";

import { ChatComponent } from "@/components/chat-component";
import { NetworkStatus } from "@/components/network-status";
import { StreamPreview } from "@/components/stream-preview";
import { Button } from "@/components/ui/button";
import { ViewerCount } from "@/components/viewer-count";

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveStatus, setLiveStatus] = useState("Waiting to be started");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const viewerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLive) {
      setLiveStatus("Setting up stream");
      const timeout = setTimeout(() => {
        setLiveStatus("Going live");
        setTimeout(() => {
          setLiveStatus("Live");
        }, 2000);
      }, 2000);

      // Start viewer count simulation
      viewerIntervalRef.current = setInterval(() => {
        setViewerCount((prev) => prev + Math.floor(Math.random() * 10));
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    } else {
      setLiveStatus("Waiting to be started");
      if (viewerIntervalRef.current) {
        clearInterval(viewerIntervalRef.current);
        viewerIntervalRef.current = null;
      }
      setViewerCount(0);
    }

    // Cleanup interval on unmount
    return () => {
      if (viewerIntervalRef.current) {
        clearInterval(viewerIntervalRef.current);
      }
    };
  }, [isLive]);

  const handleGoLive = () => {
    setIsLive((prev) => !prev);
  };

  const handleBanUser = (user: string) => {
    console.log(`User ${user} has been banned`);
  };

  return (
    <>
      <NetworkStatus status={liveStatus} />
      <div className="container mx-auto p-4 space-y-2.5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex justify-between items-center">
            <h1 className="text-xl font-bold">Live Streaming Dashboard</h1>
            <ViewerCount count={viewerCount} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <StreamPreview
              isCameraOn={isCameraOn}
              isScreenSharing={isScreenSharing}
            />
            <div className="flex gap-2 justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  className="rounded-none shadow-none"
                  variant={isCameraOn ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                >
                  <Camera className="h-5 w-5" />
                </Button>
                <Button
                  className="rounded-none shadow-none"
                  variant={isScreenSharing ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  <Monitor className="h-5 w-5" />
                </Button>
                <Button
                  className="rounded-none shadow-none"
                  variant={isAudioOn ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsAudioOn(!isAudioOn)}
                >
                  {isAudioOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <Button
                className={clsx(
                  "rounded-none text-sm uppercase font-semibold h-9 px-4 shadow-none",
                  {
                    "bg-red-500 text-white": isLive,
                    "bg-black text-white": !isLive,
                  },
                )}
                variant={isLive ? "destructive" : "default"}
                onClick={handleGoLive}
                size="sm"
              >
                {isLive ? "End Stream" : "Go Live"}
              </Button>
            </div>
          </div>
          <div className="lg:col-span-1 h-[calc(100vh-152px)]">
            <ChatComponent
              onBanUser={handleBanUser}
              isChatVisible={isChatVisible}
              toggleChat={() => setIsChatVisible(!isChatVisible)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

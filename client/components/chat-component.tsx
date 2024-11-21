import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { MessageSquare, MessageSquareOff } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  user: string;
  text: string;
}

interface ChatComponentProps {
  onBanUser: (user: string) => void;
  isChatVisible: boolean;
  toggleChat: () => void;
}

export function ChatComponent({
  onBanUser,
  isChatVisible,
  toggleChat,
}: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now(),
        user: `User${Math.floor(Math.random() * 1000)}`,
        text: newMessage.trim(),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card
      className={clsx(
        "transition-height duration-300 flex shadow-none flex-col",
        isChatVisible ? "h-full" : "h-auto",
      )}
    >
      <CardHeader
        className={clsx(
          "p-2 flex flex-row justify-between items-center",
          isChatVisible && "border-b",
        )}
      >
        <h3 className="text-base font-semibold ml-1">Live Chat</h3>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-7 text-xs shadow-none !mt-0"
          onClick={toggleChat}
        >
          {isChatVisible ? (
            <MessageSquareOff className="h-3 w-3" />
          ) : (
            <MessageSquare className="h-3 w-3" />
          )}
          {isChatVisible ? "Hide Chat" : "Show Chat"}
        </Button>
      </CardHeader>
      {isChatVisible && (
        <>
          <CardContent className="flex-grow overflow-hidden p-0">
            <div ref={scrollRef} className="h-full pb-0 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex min-h-8 py-1.5 w-full items-center px-4 cursor-pointer space-x-2 first:mt-1 hover:bg-gray-50 hover:border-y hover:border-gray-100 border-y border-white"
                >
                  <div className="flex items-start w-full space-x-2">
                    <Avatar className="w-6 h-6 border">
                      <AvatarFallback className="text-xs">
                        {message.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow mt-0.5">
                      <p className="text-sm">
                        <span className="font-semibold text-xs">
                          {message.user}:
                        </span>{" "}
                        <span className="text-gray-800">{message.text}</span>
                      </p>
                    </div>
                    <div className="flex h-full justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBanUser(message.user)}
                        className="text-xs rounded-none mt-0.5 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 shadow-none px-1.5 py-0.5 hover h-fit"
                      >
                        Ban
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-2.5 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex w-full space-x-1.5"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="text-sm shadow-none h-9 py-1.5 pl-3 bg-gray-50 rounded-none border-gray-300 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-none h-9 px-4 shadow-none !mt-0"
              >
                Send
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

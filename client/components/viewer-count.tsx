import React from "react";

interface ViewerCountProps {
  count: number;
}

export function ViewerCount({ count }: ViewerCountProps) {
  return (
    <div className="flex gap-2 text-sm items-center">
      <span className="text-sm text-gray-700">{count} viewers</span>
      <div className="bg-rose-100 text-red-600 flex items-center justify-center h-fit font-semibold py-0.5 px-2">
        <div className="text-xs mr-1">⦿</div>
        Live
      </div>
    </div>
  );
}

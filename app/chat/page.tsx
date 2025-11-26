"use client";

import { useEffect } from "react";

export default function ChatPage() {
  useEffect(() => {
    console.log("✔️ Chat page loaded — /chat is working");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-2xl w-full p-8 text-center rounded-lg shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Greanly — Chat
        </h1>

        <p className="mb-6 text-gray-600">
          This is the chat page at <code>/chat</code>.  
          Your chatbot UI will go here soon.
        </p>

        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded text-green-700">
            👍 Navigation to /chat works correctly
          </div>
          <div className="p-3 bg-yellow-50 rounded text-yellow-700">
            Replace this placeholder with your real chatbot when ready
          </div>
        </div>
      </div>
    </main>
  );
}

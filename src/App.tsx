import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LogEntry {
  timestamp: string;
  message: string;
}

type CommandType =
  | "CLEAN_CYCLE"
  | "LEFT_START"
  | "RIGHT_START"
  | "STOP_ROBOT"
  | "HOME";

// Resolve API base intelligently:
// 1) Env override (Vite or CRA)
// 2) If running on localhost -> assume backend on port 3001 with same proto
// 3) Otherwise use same-origin (reverse proxy /api to backend in prod)
function getApiBase() {
  const envUrl =
    // Vite
    (import.meta as any)?.env?.VITE_API_BASE ?? "";

  if (envUrl) return envUrl.replace(/\/$/, "");

  const { protocol, hostname } = window.location;
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (isLocal) {
    // Use same protocol to avoid mixed-content when running https locally
    return `${protocol}//localhost:3001`;
  }

  // In production, prefer same-origin and route via reverse proxy (/api → backend)
  return window.location.origin;
}

const API_BASE = getApiBase();

function App() {
  const [deviceId, setDeviceId] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const sendCommand = async (command: CommandType) => {
    if (!deviceId.trim()) {
      alert("Please enter Device ID");
      return;
    }

    setLoading(true);
    addLog(`Sending ${command} command...`);

    const apiUrl = `${API_BASE}/api/robot-command`;

    // Abort after 15s
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, command }),
        signal: controller.signal,
        // If your backend is on a different origin, make sure it handles CORS.
        // mode: 'cors', // not required; default is fine
      });
      let data: any = {};
      data = await response.json();

      if (data.success) {
        alert(`✓ ${command} command sent successfully`);
      } else {
        const msg =
          data?.error ||
          data?.message ||
          `Failed with ${response.status} ${response.statusText}`;
        addLog(`✗ Error: ${msg}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        addLog("✗ Network error: request timed out");
      } else {
        addLog(
          `✗ Network error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-center mb-4">
          <img
            src="https://kpgroup.co/wp-content/uploads/2025/07/kp-logo-150x150-1.webp"
            className="h-16 w-16"
            alt="KP Logo"
          />
        </div>

        <h1 className="text-xl font-semibold text-center mb-4">
          SR2KV2 Robot Control Panel
        </h1>

        <input
          id="deviceId"
          type="text"
          placeholder="Enter Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="w-full mb-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => sendCommand("CLEAN_CYCLE")}
            disabled={loading}
            className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clean Cycle
          </button>

          <button
            onClick={() => sendCommand("LEFT_START")}
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Left Start
          </button>

          <button
            onClick={() => sendCommand("RIGHT_START")}
            disabled={loading}
            className="bg-slate-600 text-white py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Right Start
          </button>

          <button
            onClick={() => sendCommand("HOME")}
            disabled={loading}
            className="bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Home
          </button>

          <button
            onClick={() => sendCommand("STOP_ROBOT")}
            disabled={loading}
            className="col-span-2 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Stop
          </button>
        </div>

        <div className="mt-4 bg-gray-100 border rounded-md p-2 h-40 overflow-y-auto text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="py-1">
                <span className="text-gray-600">[{log.timestamp}]</span>{" "}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import express from 'express';
import cors from 'cors';
import axios from "axios";
import https from "https";
const app = express();
const PORT = process.env.PORT || 3001;

const ROBOT_API_BASE_URL = 'https://65.2.149.144/api';
const ROBOT_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjaGlycHN0YWNrIiwiaXNzIjoiY2hpcnBzdGFjayIsInN1YiI6ImJiNGUwMTZiLTYzODYtNDgwNS05NmNiLTcxMWJjNTM5YjFjOCIsInR5cCI6ImtleSJ9.8Jr9fgsTQlpIxOojN-nndVMcKJ5XnVIumZX_LcD8nLo';


const agent = new https.Agent({
  rejectUnauthorized: false, // Only use this if you need to ignore self-signed certs
});

const apiClient = axios.create({
  baseURL: ROBOT_API_BASE_URL,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${ROBOT_API_TOKEN}`,
  },
  httpsAgent: agent,
});
const COMMANDS = {
  CLEAN_CYCLE: {
    base64_command: 'WgEAAA==',
  },
  LEFT_START: {
    base64_command: 'WwEAAA==',
  },
  RIGHT_START: {
    base64_command: 'XAIAAA==',
  },
  STOP_ROBOT: {
    base64_command: 'XQEAAA==',
  },
  HOME: {
    base64_command: 'XgEAAA==',
  },
};

app.use(cors());
app.use(express.json());

app.post('/api/robot-command', async (req, res) => {
  try {
    const { deviceId, command } = req.body;

    if (!deviceId || !command) {
      return res.status(400).json({ error: 'deviceId and command are required' });
    }

    if (!COMMANDS[command]) {
      return res.status(400).json({ error: 'Invalid command type' });
    }

    const commandData = COMMANDS[command].base64_command;

    const queueItem = {
      fPort: 8,
      data: commandData,
      confirmed: true,
    };
console.log('Sending command to robot API:', { deviceId, command, ROBOT_API_BASE_URL });
    try {
    const response = await apiClient.post(`/devices/${deviceId}/queue`, {
      queueItem: queueItem,
    });
    console.log('Robot API response:', response.data);
    return res.json({ success: true, data: "Command sent successfully" });
  } catch (error) {
    console.error(
      "API Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
  } catch (error) {
    console.error('Error processing robot command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store pipeline status
let latestPipelineStatus = {};

// Webhook endpoint for pipeline events
app.post('/webhook/pipeline', (req, res) => {
  const event = req.headers['x-gitlab-event'];
  const token = req.headers['x-gitlab-token'];

  if (token !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook token' });
  }

  if (event === 'Pipeline Hook') {
    const { project, object_attributes: pipeline } = req.body;
    
    if (pipeline.ref === 'master' || pipeline.ref === 'main') {
      latestPipelineStatus = {
        id: pipeline.id,
        status: pipeline.status,
        stages: pipeline.stages,
        ref: pipeline.ref,
        sha: pipeline.sha,
        web_url: `${project.web_url}/-/pipelines/${pipeline.id}`,
        created_at: pipeline.created_at,
        updated_at: pipeline.updated_at
      };

      // Emit pipeline update to connected clients
      io.emit('pipelineUpdate', latestPipelineStatus);
    }
  }

  res.status(200).send('Webhook received');
});

// API endpoint to trigger manual pipeline stage
app.post('/api/pipeline/:projectId/stages/:stage/trigger', async (req, res) => {
  const { projectId, stage } = req.params;
  const { gitlabToken } = req.body;

  try {
    const response = await fetch(`${process.env.GITLAB_URL}/api/v4/projects/${projectId}/pipeline_schedules`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': gitlabToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Manual trigger of ${stage} stage`,
        ref: 'master',
        cron: '0 * * * *',
        cron_timezone: 'UTC',
        active: true,
        variables: [
          { key: 'MANUAL_STAGE', value: stage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger pipeline stage');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest pipeline status
app.get('/api/pipeline/status', (req, res) => {
  res.json(latestPipelineStatus);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
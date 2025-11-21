import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import videosStatusRoute from '../weaveit-generator/videosStatusRoute';
import generateRoute from '../weaveit-generator/generateRoute';
import { testConnection, getVideoByJobId, getVideoByVideoId, getVideosByWallet } from './db';

// Load environment variables from root .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mount API routers under `/api` so frontend can call `/api/generate` and `/api/videos/status/:id`
app.use('/api', videosStatusRoute);
app.use('/api', generateRoute);

// Video serving endpoint - serves video data from database by job ID
app.get('/api/videos/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const videoBuffer = await getVideoByJobId(jobId);

    if (!videoBuffer) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Set proper headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', videoBuffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.send(videoBuffer);
  } catch (err) {
    console.error('Error serving video:', err);
    res.status(500).json({ error: 'Failed to retrieve video' });
  }
});

// Video serving endpoint - serves video data from database by video ID
app.get('/api/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const videoBuffer = await getVideoByVideoId(videoId);

    if (!videoBuffer) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Set proper headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', videoBuffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.send(videoBuffer);
  } catch (err) {
    console.error('Error serving video:', err);
    res.status(500).json({ error: 'Failed to retrieve video' });
  }
});

// Get all video IDs for a wallet address
app.get('/api/wallet/:walletAddress/videos', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const videos = await getVideosByWallet(walletAddress);

    res.json({
      wallet_address: walletAddress,
      count: videos.length,
      videos: videos.map(v => ({
        video_id: v.video_id,
        job_id: v.job_id,
        duration_sec: v.duration_sec,
        format: v.format,
        created_at: v.created_at,
        video_url: `/api/videos/${v.video_id}`
      }))
    });
  } catch (err) {
    console.error('Error fetching wallet videos:', err);
    res.status(500).json({ error: 'Failed to retrieve videos' });
  }
});

// DB health endpoint
app.get('/api/db/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Fallback 404 handler (always JSON)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

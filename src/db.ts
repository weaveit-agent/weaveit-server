import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/.env' });

function cleanDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  // handle a string that was copied from a shell command like:
  // psql 'postgresql://user:pass@host/db?sslmode=require'
  let s = raw.trim();
  if (s.startsWith('psql ')) s = s.slice(5).trim();
  // remove surrounding single or double quotes
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1);
  }
  // Remove channel_binding parameter that pg library doesn't support
  s = s.replace(/[&?]channel_binding=require/g, '');
  return s;
}

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = cleanDatabaseUrl(rawDatabaseUrl);

const sslMode = (process.env.PGSSLMODE || '').toLowerCase();
const sslRequired = sslMode === 'require' || (databaseUrl && databaseUrl.includes('sslmode=require'));

const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl, ssl: sslRequired ? { rejectUnauthorized: false } : undefined }
    : {
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
        ssl: sslRequired ? { rejectUnauthorized: false } : undefined
      }
);

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

// User management
export async function ensureUser(walletAddress: string): Promise<void> {
  await pool.query(
    `INSERT INTO users (wallet_address) 
     VALUES ($1) 
     ON CONFLICT (wallet_address) DO NOTHING`,
    [walletAddress]
  );
}

export async function getUserPoints(walletAddress: string): Promise<number> {
  const result = await pool.query(
    'SELECT prompt_points FROM users WHERE wallet_address = $1',
    [walletAddress]
  );
  return result.rows[0]?.prompt_points || 0;
}

// Job management
export async function createVideoJob(
  walletAddress: string,
  scriptBody: string,
  title?: string,
  jobType: 'video' | 'audio' = 'video'
): Promise<string> {
  await ensureUser(walletAddress);
  const result = await pool.query(
    `INSERT INTO video_jobs (wallet_address, script_body, title, job_type, status) 
     VALUES ($1, $2, $3, $4, 'pending') 
     RETURNING job_id`,
    [walletAddress, scriptBody, title || null, jobType]
  );
  return result.rows[0].job_id;
}

export async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'generating' | 'failed' | 'completed',
  errorMessage?: string
): Promise<void> {
  await pool.query(
    `UPDATE video_jobs 
     SET status = $1, error_message = $2 
     WHERE job_id = $3`,
    [status, errorMessage || null, jobId]
  );
}

export async function getJobStatus(jobId: string): Promise<{
  status: string;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
} | null> {
  const result = await pool.query(
    `SELECT status, error_message, created_at, updated_at 
     FROM video_jobs 
     WHERE job_id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
}

// Video storage
export async function storeVideo(
  jobId: string,
  walletAddress: string,
  videoData: Buffer,
  durationSec?: number,
  format: string = 'mp4',
  audioData?: Buffer
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO videos (job_id, wallet_address, video_data, duration_sec, format, audio_data) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING video_id`,
    [jobId, walletAddress, videoData, durationSec, format, audioData || null]
  );
  return result.rows[0].video_id;
}

// Audio-only storage
export async function storeAudio(
  jobId: string,
  walletAddress: string,
  audioData: Buffer,
  durationSec?: number,
  format: string = 'mp3'
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO videos (job_id, wallet_address, audio_data, duration_sec, format) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING video_id`,
    [jobId, walletAddress, audioData, durationSec, format]
  );
  return result.rows[0].video_id;
}

export async function getVideo(jobId: string): Promise<{
  video_id: string;
  video_data: Buffer;
  duration_sec: number | null;
  format: string;
  created_at: Date;
} | null> {
  const result = await pool.query(
    `SELECT video_id, video_data, duration_sec, format, created_at 
     FROM videos 
     WHERE job_id = $1`,
    [jobId]
  );
  return result.rows[0] || null;
}

export async function getVideoByJobId(jobId: string): Promise<Buffer | null> {
  const result = await pool.query(
    'SELECT video_data FROM videos WHERE job_id = $1',
    [jobId]
  );
  return result.rows[0]?.video_data || null;
}

export async function getVideoByVideoId(videoId: string): Promise<Buffer | null> {
  const result = await pool.query(
    'SELECT video_data FROM videos WHERE video_id = $1',
    [videoId]
  );
  return result.rows[0]?.video_data || null;
}

export async function getVideosByWallet(walletAddress: string): Promise<Array<{
  video_id: string;
  job_id: string;
  duration_sec: number | null;
  format: string;
  created_at: Date;
}>> {
  const result = await pool.query(
    `SELECT video_id, job_id, duration_sec, format, created_at 
     FROM videos 
     WHERE wallet_address = $1 
     ORDER BY created_at DESC`,
    [walletAddress]
  );
  return result.rows;
}

// Get all content (videos and audios) for a wallet
export async function getContentByWallet(walletAddress: string): Promise<Array<{
  video_id: string;
  job_id: string;
  duration_sec: number | null;
  format: string;
  content_type: 'video' | 'audio';
  created_at: Date;
}>> {
  const result = await pool.query(
    `SELECT 
       v.video_id, 
       v.job_id, 
       v.duration_sec, 
       v.format, 
       v.created_at,
       CASE 
         WHEN v.video_data IS NOT NULL THEN 'video'
         ELSE 'audio'
       END as content_type
     FROM videos v
     WHERE v.wallet_address = $1 
     ORDER BY v.created_at DESC`,
    [walletAddress]
  );
  return result.rows;
}

// Audio retrieval
export async function getAudioByJobId(jobId: string): Promise<Buffer | null> {
  const result = await pool.query(
    'SELECT audio_data FROM videos WHERE job_id = $1',
    [jobId]
  );
  return result.rows[0]?.audio_data || null;
}

export async function getAudioByAudioId(audioId: string): Promise<Buffer | null> {
  const result = await pool.query(
    'SELECT audio_data FROM videos WHERE video_id = $1',
    [audioId]
  );
  return result.rows[0]?.audio_data || null;
}

// Cleanup old jobs
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
  const result = await pool.query(
    `DELETE FROM video_jobs 
     WHERE status = 'failed' AND created_at < NOW() - INTERVAL '${daysOld} days'`
  );
  return result.rowCount || 0;
}

// Clear script body after successful completion
export async function clearScriptBody(jobId: string): Promise<void> {
  await pool.query(
    'UPDATE video_jobs SET script_body = NULL WHERE job_id = $1',
    [jobId]
  );
}

export default pool;

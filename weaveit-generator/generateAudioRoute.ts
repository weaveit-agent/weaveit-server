import express from 'express';
import type { Request, Response } from 'express';
import { enhanceScript } from '../src/codeAnalyzer';
import { generateSpeechBuffer } from '../src/textToSpeech';
import { createVideoJob, updateJobStatus, storeAudio } from '../src/db';

const router = express.Router();

// POST /api/generate/audio
const generateAudioHandler = async (req: Request, res: Response): Promise<void> => {
  let jobId: string | null = null;
  
  try {
    let { walletAddress, script, title } = req.body;

    if (!script || typeof script !== 'string' || script.trim() === '') {
      res.status(400).json({ error: 'Missing script in request body' });
      return;
    }

    // Wallet address is required for database storage
    if (!walletAddress || typeof walletAddress !== 'string') {
      res.status(400).json({ error: 'Missing walletAddress in request body' });
      return;
    }

    console.log('weaveit-generator: Processing audio-only request:', { title, walletAddress });

    // Create job in database with job_type = 'audio'
    jobId = await createVideoJob(walletAddress, script, title, 'audio');
    console.log('Created audio job:', jobId);

    // Update status to generating
    await updateJobStatus(jobId, 'generating');

    // Enhance the script for narration
    const explanation = await enhanceScript(script);
    
    // Generate speech buffer (no file saving)
    const audioBuffer = await generateSpeechBuffer(explanation);
    console.log(`Generated audio: ${audioBuffer.length} bytes`);

    // Store audio in database
    const audioId = await storeAudio(jobId, walletAddress, audioBuffer);
    console.log('Stored audio in database:', audioId);

    // Update job status to completed
    await updateJobStatus(jobId, 'completed');

    res.json({
      jobId,
      audioId,
      status: 'completed',
      message: 'Audio tutorial generated successfully',
    });
    return;
  } catch (error) {
    console.error('weaveit-generator: Audio generation error:', error);
    
    // Update job status to failed if we have a jobId
    if (jobId) {
      await updateJobStatus(jobId, 'failed', String(error)).catch(console.error);
    }
    
    res.status(500).json({ error: 'Failed to generate audio' });
    return;
  }
};

router.post('/generate/audio', generateAudioHandler);

export default router;

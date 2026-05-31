export type UploadErrorType =
  | 'network'
  | 'server'
  | 'rate_limit'
  | 'transcript'
  | 'content_too_short'
  | 'file_too_large'
  | 'validation'
  | 'generation_failed'
  | 'unknown';

export const UPLOAD_ERROR_TYPES: UploadErrorType[] = [
  'network',
  'server',
  'rate_limit',
  'transcript',
  'content_too_short',
  'file_too_large',
  'validation',
  'generation_failed',
  'unknown',
];

export function isUploadErrorType(value: string | null): value is UploadErrorType {
  return !!value && UPLOAD_ERROR_TYPES.includes(value as UploadErrorType);
}

export interface ClassifiedUploadError {
  type: UploadErrorType;
  message: string;
  detail?: string;
  isRateLimit: boolean;
  isRetryable: boolean;
}

export function classifyUploadError(err: unknown): ClassifiedUploadError {
  const errorVal = err as {
    response?: { status?: number; data?: { detail?: string } };
    message?: string;
    code?: string;
  };
  const status = errorVal?.response?.status;
  const detail = (errorVal?.response?.data?.detail || errorVal?.message || '').toLowerCase();
  const rawDetail = errorVal?.response?.data?.detail || errorVal?.message || '';

  if (status === 429) {
    return { type: 'rate_limit', message: '', isRateLimit: true, isRetryable: false };
  }
  if (!errorVal?.response && (errorVal?.code === 'ERR_NETWORK' || errorVal?.message?.includes('Network'))) {
    return {
      type: 'network',
      message: 'Network error — please check your connection and try again.',
      detail: rawDetail,
      isRateLimit: false,
      isRetryable: true,
    };
  }
  if (status === 400 && (detail.includes('transcript') || detail.includes('youtube') || detail.includes('caption'))) {
    return {
      type: 'transcript',
      message: 'Could not use this transcript. Try pasting clearer lecture text or captions.',
      detail: rawDetail,
      isRateLimit: false,
      isRetryable: false,
    };
  }
  if (status === 400 && (detail.includes('too short') || detail.includes('minimum') || detail.includes('insufficient'))) {
    return {
      type: 'content_too_short',
      message: 'The content is too short. Please provide more detailed source material.',
      detail: rawDetail,
      isRateLimit: false,
      isRetryable: false,
    };
  }
  if (status === 500) {
    return {
      type: 'server',
      message: 'The AI service hit an unexpected error. Please try again in a moment.',
      detail: rawDetail,
      isRateLimit: false,
      isRetryable: true,
    };
  }
  if (status && status >= 502) {
    return {
      type: 'server',
      message: 'The AI engine may still be waking up. Wait a minute and retry.',
      detail: rawDetail,
      isRateLimit: false,
      isRetryable: true,
    };
  }
  return {
    type: 'unknown',
    message: errorVal?.response?.data?.detail || errorVal?.message || 'An unexpected error occurred. Please try again.',
    detail: rawDetail,
    isRateLimit: false,
    isRetryable: false,
  };
}

export const UPLOAD_ERROR_META: Record<
  UploadErrorType,
  { title: string; subtitle: string; mood: 'sad' | 'confused' | 'sleepy' | 'worried' | 'oops' }
> = {
  network: {
    title: 'Connection lost',
    subtitle: 'Lumina could not reach the AI engine. Check your internet and try again.',
    mood: 'worried',
  },
  server: {
    title: 'AI engine hiccup',
    subtitle: 'The backend may be waking from sleep on free tier — give it a minute, then retry.',
    mood: 'sleepy',
  },
  rate_limit: {
    title: 'Generation limit reached',
    subtitle: 'Free tier needs a short breather. Wait ~60s or upgrade credits.',
    mood: 'confused',
  },
  transcript: {
    title: 'Transcript trouble',
    subtitle: 'We need clearer lecture text. Copy captions manually and paste them here.',
    mood: 'confused',
  },
  content_too_short: {
    title: 'Not enough material',
    subtitle: 'Add more transcript, notes, or pages so Lumina has enough to synthesize.',
    mood: 'sad',
  },
  file_too_large: {
    title: 'File too large',
    subtitle: 'Keep uploads under 15MB or split the document into smaller parts.',
    mood: 'oops',
  },
  validation: {
    title: 'Missing input',
    subtitle: 'Choose a file, paste a transcript, or add text before synthesizing.',
    mood: 'confused',
  },
  generation_failed: {
    title: 'Synthesis incomplete',
    subtitle: 'Generation finished but the study board was not ready. Please try again.',
    mood: 'sad',
  },
  unknown: {
    title: 'Something went wrong',
    subtitle: 'An unexpected error occurred while building your study board.',
    mood: 'oops',
  },
};

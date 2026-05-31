import axios from 'axios';
import type { UploadErrorType } from '@/lib/uploadErrors';

export type ApiIssueKind =
  | 'network'
  | 'timeout'
  | 'quota_exceeded'
  | 'payment_required'
  | 'server'
  | 'bad_request'
  | 'unknown';

export interface ParsedApiError {
  kind: ApiIssueKind;
  status?: number;
  message: string;
  detail?: string;
  uploadErrorType: UploadErrorType;
  isRetryable: boolean;
  userTitle: string;
  userHint: string;
}

export function parseApiError(err: unknown): ParsedApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const detail =
      (err.response?.data as { detail?: string })?.detail ||
      err.message ||
      'Unexpected error';

    if (status === 429 || detail.toLowerCase().includes('quota')) {
      return {
        kind: 'quota_exceeded',
        status,
        message: detail,
        detail,
        uploadErrorType: 'rate_limit',
        isRetryable: false,
        userTitle: 'Generation credits exhausted',
        userHint: 'Wait for the cooldown timer, upgrade credits, or regenerate missing sections one at a time.',
      };
    }
    if (status === 402 || detail.toLowerCase().includes('payment')) {
      return {
        kind: 'payment_required',
        status,
        message: detail,
        detail,
        uploadErrorType: 'rate_limit',
        isRetryable: false,
        userTitle: 'Credits required',
        userHint: 'Add credits on the pricing page to continue generating study materials.',
      };
    }
    if (status === 400) {
      return {
        kind: 'bad_request',
        status,
        message: detail,
        detail,
        uploadErrorType: 'validation',
        isRetryable: false,
        userTitle: 'Invalid request',
        userHint: 'Check your file or transcript and try again.',
      };
    }
    if (status && status >= 500) {
      return {
        kind: 'server',
        status,
        message: detail,
        detail,
        uploadErrorType: 'server',
        isRetryable: true,
        userTitle: 'AI engine unavailable',
        userHint: 'The backend may be waking up. Wait a minute and retry.',
      };
    }
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message.includes('Network'))) {
      return {
        kind: 'network',
        message: err.message,
        uploadErrorType: 'network',
        isRetryable: true,
        userTitle: 'Connection lost',
        userHint: 'Check your internet connection and try again.',
      };
    }
    if (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout')) {
      return {
        kind: 'timeout',
        message: err.message,
        uploadErrorType: 'server',
        isRetryable: true,
        userTitle: 'Request timed out',
        userHint: 'Large uploads can take longer on free tier. Retry in a moment.',
      };
    }
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return {
    kind: 'unknown',
    message,
    uploadErrorType: 'unknown',
    isRetryable: false,
    userTitle: 'Something went wrong',
    userHint: message,
  };
}

export function isQuotaApiError(parsed: ParsedApiError): boolean {
  return parsed.kind === 'quota_exceeded' || parsed.kind === 'payment_required';
}

/** Shared handler for quota vs other API failures in UI components */
export function handleApiIssue(
  err: unknown,
  handlers: {
    onQuota?: (parsed: ParsedApiError) => void;
    onError?: (parsed: ParsedApiError) => void;
  }
): ParsedApiError {
  const parsed = parseApiError(err);
  if (isQuotaApiError(parsed)) {
    handlers.onQuota?.(parsed);
  } else {
    handlers.onError?.(parsed);
  }
  return parsed;
}

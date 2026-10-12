/**
 * Profound Agent Analytics log forwarding.
 *
 * Records every request on the response 'finish' event and forwards the logs to Profound
 * in batches. Logs are buffered in memory and flushed when the buffer reaches FLUSH_SIZE
 * entries or every FLUSH_INTERVAL_MS, whichever comes first. Sending happens in the
 * background and never blocks, delays, or fails the user's response.
 *
 * The middleware is a no-op when PROFOUND_API_KEY is not set.
 */

const PROFOUND_API_KEY = process.env.PROFOUND_API_KEY;
const PROFOUND_LOG_ENDPOINT = process.env.PROFOUND_LOG_ENDPOINT || 'https://tryprofound.com';

const FLUSH_SIZE = 100;
const FLUSH_INTERVAL_MS = 5000;
// Profound accepts at most 1,000 logs per request.
const MAX_BATCH_SIZE = 1000;
// Upper bound for the in-memory buffer so a stalled flush can't grow memory without limit.
const MAX_BUFFER_SIZE = MAX_BATCH_SIZE * 10;

let buffer = [];
let flushTimer = null;

const getClientIp = req => {
  const forwardedFor = req.get('x-forwarded-for');
  const firstForwarded = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  return req.ip || firstForwarded || req.socket?.remoteAddress || null;
};

const toLogEntry = (req, res) => {
  const statusCode = parseInt(res.statusCode, 10);
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    return null;
  }

  return {
    timestamp: new Date().toISOString(),
    method: req.method,
    host: req.get('host'),
    path: req.path,
    status_code: statusCode,
    ip: getClientIp(req),
    user_agent: req.get('user-agent') || '',
    query_params: req.query || {},
    referer: req.get('referer') || null,
  };
};

const sendBatch = async logs => {
  try {
    const response = await fetch(PROFOUND_LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': PROFOUND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logs),
    });
    if (!response.ok) {
      console.error(
        `Profound log forwarding failed: ${response.status} ${response.statusText} (${logs.length} logs dropped)`
      );
    }
  } catch (e) {
    console.error(`Profound log forwarding failed (${logs.length} logs dropped):`, e.message);
  }
};

const flush = () => {
  while (buffer.length > 0) {
    const batch = buffer.splice(0, MAX_BATCH_SIZE);
    // Fire and forget: sendBatch handles its own errors.
    sendBatch(batch);
  }
};

const enqueue = entry => {
  if (buffer.length >= MAX_BUFFER_SIZE) {
    buffer.shift();
  }
  buffer.push(entry);
  if (buffer.length >= FLUSH_SIZE) {
    flush();
  }
};

const startFlushTimer = () => {
  if (flushTimer) {
    return;
  }
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
  // Don't keep the process alive just for the flush timer.
  flushTimer.unref();
};

/**
 * Express middleware that captures request logs for Profound Agent Analytics.
 */
const profoundAnalytics = (req, res, next) => {
  if (!PROFOUND_API_KEY) {
    return next();
  }

  startFlushTimer();
  res.on('finish', () => {
    try {
      const entry = toLogEntry(req, res);
      if (entry) {
        enqueue(entry);
      }
    } catch (e) {
      console.error('Profound log capture failed:', e.message);
    }
  });
  next();
};

module.exports = profoundAnalytics;

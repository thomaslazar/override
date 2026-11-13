// Builds ready-to-play attempts off the main thread. Requests are answered in order.
import { prepare } from './bot.js';
onmessage = e => {
  const { level, fails, pick } = e.data;
  postMessage({ level, fails, pick, S: prepare(level, fails, pick) });
};

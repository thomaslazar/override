// Builds ready-to-play attempts off the main thread. Requests are answered in order.
import { prepare } from './bot.js';
onmessage = e => {
  const { level, fails } = e.data;
  postMessage({ level, fails, S: prepare(level, fails) });
};

import { workerData } from 'node:worker_threads';

// Provide the module with glboal api
import './api.js';

// Run the module code
import(workerData.path);

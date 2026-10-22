// Load a local .env file if present (Node 20.12+). Cloud hosts provide variables directly.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

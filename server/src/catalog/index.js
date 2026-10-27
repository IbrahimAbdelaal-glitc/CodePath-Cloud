// The built-in course catalog, in path order (beginner to advanced). See services/courseCatalog.js.
// The roadmap comes last because its stages link the courses before it.
import foundations from './cyber-foundations.js';
import networking from './networking-linux.js';
import defensive from './defensive-ops.js';
import governance from './architecture-governance.js';
import roadmap from './cyber-roadmap.js';

export default [foundations, networking, defensive, governance, roadmap];

// The catalog release this code ships. The API applies a release once, on the first start-up that sees it, and records
// it in CatalogRelease; later start-ups only read that record. Change this name only to ship an intentional catalog update.
// The release is refused (and nothing is written) if it would remove any lesson, question or module with learner history.
export const CATALOG_RELEASE = '2026-10-29-cyber-roadmap';

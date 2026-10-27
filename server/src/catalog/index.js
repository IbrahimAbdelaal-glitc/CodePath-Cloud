// The built-in course catalog, in path order (beginner to advanced). See services/courseCatalog.js.
// The roadmap comes last because its stages link the courses before it.
import foundations from './cyber-foundations.js';
import networking from './networking-linux.js';
import defensive from './defensive-ops.js';
import governance from './architecture-governance.js';
import roadmap from './cyber-roadmap.js';

export default [foundations, networking, defensive, governance, roadmap];

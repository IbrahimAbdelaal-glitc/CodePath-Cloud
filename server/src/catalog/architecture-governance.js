// Course 4 (Advanced): Security Architecture, Governance & Risk.
// Videos: Professor Messer, CompTIA Security+ SY0-701 Training Course (playlist PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv),
// domains 3 (architecture), 4.6 (identity and access) and 5 (governance, risk and compliance).
// Questions are grounded in the transcripts published on professormesser.com; these videos have no chapter markers,
// so checkpoints sit late in each video, after the topic has been covered.
import { MULTI, TF, FILL, youtube } from './helpers.js';

const MESSER = 'Professor Messer, CompTIA Security+ SY0-701 Training Course (free on YouTube).';
const messer = (id, duration) => youtube(id, { duration, credit: MESSER });
const tx = (title) => `Professor Messer transcript, "${title}"`;

export default {
  key: 'security-governance',
  // v2: 80% pass marks on in-video questions and block quizzes
  version: 3,
  topics: {
    'gov-architecture': 'Secure architecture',
    'gov-data': 'Data protection and resilience',
    'gov-iam': 'Identity and access management',
    'gov-risk': 'Governance and risk management',
    'gov-assurance': 'Third parties, compliance and awareness',
  },
  roadmap: {
    slug: 'security-architecture-governance-risk',
    title: 'Security Architecture, Governance & Risk',
    summary: 'Designing secure cloud and network architectures, protecting data, managing identity, and leading security through policy, risk and compliance.',
    description:
      'The capstone of the path takes a leadership view of security. Learn who is responsible for what in the cloud, how infrastructure as code, serverless, microservices, SDN and containers change security, how zones and the attack surface shape network design, how data is classified and protected at rest, in transit and in use, how resilience, backups and recovery sites keep a business running, how identity and access are managed with SSO, SAML, OAuth and access control models, and how organizations govern security with policies, quantitative and qualitative risk analysis, business impact analysis, vendor risk, compliance, audits and security awareness.',
    category: 'Cybersecurity',
    difficulty: 'ADVANCED',
    prerequisites: ['Cybersecurity Foundations', 'Networking & Linux Foundations', 'Defensive Security Operations (recommended)'],
    learningOutcomes: [
      'Apply the shared responsibility model and evaluate cloud, virtualization, container, SDN and embedded architectures for security',
      'Design networks with security zones and a minimal attack surface, and classify and protect data in each of its states',
      'Plan resilience with high availability, clustering, recovery sites, backups, replication and continuity of operations',
      'Compare SSO, LDAP, SAML, OAuth and federation, and choose between MAC, DAC, RBAC, rule-based and ABAC access control',
      'Calculate SLE and ALE, use RTO, RPO, MTTR and MTBF, choose risk strategies, and manage vendor risk, compliance, audits and awareness programs',
    ],
    sources: [
      {
        title: 'CompTIA SY0-701 Security+ Training Course (YouTube playlist)',
        author: 'Professor Messer',
        url: 'https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
      {
        title: 'Security+ course index with written transcripts',
        author: 'Professor Messer',
        url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/',
      },
    ],
    order: 13,
    isFeatured: true,
  },
  modules: [
    // ── Module 1 ────────────────────────────────────────────────────
    {
      key: 'architecture',
      title: 'Secure Architecture',
      description: 'Cloud responsibility, infrastructure as code, serverless and microservices, segmentation and SDN, virtualization and containers, and secure network design.',
      difficulty: 'ADVANCED',
      lessons: [
        {
          key: 'cloud',
          title: 'Cloud infrastructures',
          summary: 'Shared responsibility, hybrid cloud, third parties, infrastructure as code, serverless and microservices.',
          video: messer('8qpQ8Q6xxiU', 595),
          content: `## What this lesson covers

- **Responsibility matrix:** cloud providers document who secures what for **SaaS**, **PaaS**, **IaaS** and on-premises. For example, the provider manages the OS for SaaS and PaaS, while the customer manages it for IaaS; in the example matrix, **accounts and identities are always the customer's responsibility**.
- **Hybrid (multi-provider) cloud:** more flexibility but more complexity: separate configurations, inconsistent logs, and data crossing the public internet.
- **Third-party vendors** in the cloud need a vendor risk management policy, incident response plans and monitoring.
- **Infrastructure as code (IaC)** describes servers and services as code, so instances can be rebuilt consistently anywhere.
- **Serverless** runs individual functions on demand; **microservices** split an application behind an **API gateway**, improving scalability and resilience.`,
          takeaways: ['In IaaS, the customer secures the operating system.', 'Accounts and identities remain the customer’s responsibility.'],
          checkpoints: [
            {
              at: 160,
              q: 'In the cloud responsibility matrix discussed in the video, who is responsible for the operating system in an infrastructure-as-a-service (IaaS) deployment?',
              options: ['The customer', 'The cloud provider', 'Neither; IaaS has no operating system', 'The internet service provider'],
              answer: 'The customer',
              explanation: 'With SaaS and PaaS the provider manages the OS; with IaaS (and on-premises) the customer does.',
              topic: 'gov-architecture',
              source: tx('Cloud Infrastructures'),
            },
            {
              at: 570,
              q: 'In a microservice architecture, what component receives client requests and forwards them to the right microservice?',
              options: ['An API gateway', 'A hypervisor', 'A VLAN trunk', 'A RAID controller'],
              answer: 'An API gateway',
              explanation: 'Clients talk to the API gateway, which routes each request to the appropriate microservice.',
              topic: 'gov-architecture',
              source: tx('Cloud Infrastructures'),
            },
          ],
        },
        {
          key: 'network-infra',
          title: 'Network infrastructure concepts',
          summary: 'Physical isolation, logical segmentation and software-defined networking planes.',
          video: messer('jd001Hj7XWM', 416),
          content: `## What this lesson covers

- **Physical isolation (air gap):** separate switches with no connection, so a compromise on one cannot reach the other. Secure, but it does not scale (100 customers means 100 switches).
- **Logical segmentation with VLANs** gives the same separation on one physical switch.
- **Software-defined networking (SDN)** splits devices into planes:
  - **Data plane:** forwards traffic (also NAT, encryption, trunking).
  - **Control plane:** routing tables, session and NAT tables.
  - **Management plane:** configuration via SSH, SNMP or APIs.
- SDN lets cloud administrators add infrastructure such as firewalls on demand.`,
          takeaways: ['The data plane forwards; the control plane decides; the management plane configures.', 'VLANs give logical segmentation without extra hardware.'],
          checkpoints: [
            {
              at: 395,
              q: 'An administrator connects to a switch over SSH to change its configuration. Which SDN plane is being used?',
              options: ['Management plane', 'Data plane', 'Control plane', 'Physical plane'],
              answer: 'Management plane',
              explanation: 'Configuration via SSH, SNMP or APIs happens in the management plane; the control plane manages tables and the data plane forwards traffic.',
              topic: 'gov-architecture',
              source: tx('Network Infrastructure Concepts'),
            },
          ],
        },
        {
          key: 'other-infra',
          title: 'Other infrastructure concepts',
          summary: 'Centralized vs decentralized security, virtualization vs containers, IoT, SCADA, RTOS, embedded systems and high availability.',
          video: messer('HDiNPPrGhzE', 864),
          content: `## What this lesson covers

- **On-premises vs cloud security:** on-prem gives full control at higher cost; attackers do not care where your security is.
- **Centralized management** gives one view of everything but can be a **single point of failure**.
- **Virtualization:** a **hypervisor** runs VMs, each with its own guest OS. **Containerization** (for example Docker) shares the **host OS**, with each app isolated in its own container.
- **IoT** devices are convenient, but their makers may not be security experts.
- **SCADA/ICS** systems should be completely segmented from the outside.
- **RTOS** (deterministic, for example anti-lock brakes) and **embedded systems** are self-contained and hard to access or patch.
- **High availability (HA)** keeps systems running when a component fails, with active/standby or active/active pairs, at increasing cost.`,
          takeaways: ['Containers share one host OS; VMs each need their own guest OS.', 'High availability is always-on, unlike simple redundancy.'],
          checkpoints: [
            {
              at: 560,
              q: 'What is a key difference between virtual machines and containers?',
              options: [
                'Each VM runs its own guest OS, while containers share the host operating system',
                'Containers each run a separate hypervisor',
                'VMs cannot be isolated from one another',
                'Containers require more operating system copies than VMs',
              ],
              answer: 'Each VM runs its own guest OS, while containers share the host operating system',
              explanation: 'Containerization removes duplicate guest operating systems; containers are isolated apps running on the shared host OS.',
              topic: 'gov-architecture',
              source: tx('Other Infrastructure Concepts'),
            },
            {
              at: 840,
              q: 'How does high availability (HA) differ from simple redundancy?',
              options: [
                'HA systems are always on and take over automatically, while redundant spares may need to be installed and configured first',
                'HA is cheaper than redundancy',
                'Redundancy means no spare equipment exists',
                'HA only applies to power supplies',
              ],
              answer: 'HA systems are always on and take over automatically, while redundant spares may need to be installed and configured first',
              explanation: 'A redundant device might sit in a closet; HA keeps a running partner ready (or active) so service continues during a failure.',
              topic: 'gov-architecture',
              source: tx('Other Infrastructure Concepts'),
            },
          ],
        },
        {
          key: 'considerations',
          title: 'Infrastructure considerations',
          summary: 'Availability, resilience, cost, responsiveness, scalability, ease of deployment and recovery, patching, power and compute.',
          video: messer('Ap3Z_0ZdqpQ', 828),
          content: `## What this lesson covers

- **Availability** for the right people, often measured as uptime percentages such as 99.999%.
- **Resilience**, measured with **MTTR** (mean time to repair).
- **Cost:** installation, maintenance, replacement, depreciation and taxes.
- **Responsiveness** and **scalability/elasticity** (grow and shrink capacity; monitoring must scale too).
- **Ease of deployment** through orchestration, and **risk transference** through cybersecurity insurance (for example for ransomware).
- **Ease of recovery:** restoring a system image (about 10 minutes) instead of reinstalling (about an hour).
- **Patch availability:** embedded systems such as HVAC controls may never be patched, so add protections like firewalls.
- **Power:** UPS and generators; **compute** engines in the cloud.`,
          takeaways: ['Plan for fast, cheap recovery before you need it.', 'Unpatchable devices need compensating protections.'],
          checkpoints: [
            {
              at: 600,
              q: 'A malware-infected system can be recovered either by reinstalling from installation media (about an hour) or from a prepared image (about 10 minutes). Which infrastructure consideration does choosing the image improve?',
              options: ['Ease of recovery', 'Data sovereignty', 'Attack surface', 'Risk appetite'],
              answer: 'Ease of recovery',
              explanation: 'Both result in a working system, but restoring an image is faster and cheaper, which is what ease of recovery measures.',
              topic: 'gov-architecture',
              source: tx('Infrastructure Considerations'),
            },
          ],
        },
        {
          key: 'secure-infra',
          title: 'Secure infrastructures',
          summary: 'Security zones, attack surface and protecting connectivity.',
          video: messer('l64La1xYXL4', 354),
          content: `## What this lesson covers

- **Security zones** group devices by use or access type (trusted/untrusted, internal/external, inside, internet, servers, screened), which makes firewall rules clearer.
- The **attack surface** is every potential opening: application code, open ports, authentication and human error such as one misconfigured firewall rule. Minimize it by auditing code, blocking ports and monitoring.
- **Connectivity:** secure network cabling and drops, use application-level encryption, and protect remote links with IPsec tunnels or VPN concentrators.`,
          takeaways: ['Zones make firewall rules easier to understand and maintain.', 'One misconfigured rule can expand the attack surface.'],
          checkpoints: [
            {
              at: 330,
              q: 'Which of these are part of an organization’s attack surface? Select all that apply.',
              type: MULTI,
              options: ['Application code', 'Open ports on servers', 'A misconfigured firewall rule (human error)', 'An unplugged spare monitor in storage'],
              answer: ['Application code', 'Open ports on servers', 'A misconfigured firewall rule (human error)'],
              explanation: 'The attack surface is every potential way in: code, open ports, authentication and human error.',
              topic: 'gov-architecture',
              source: tx('Secure Infrastructures'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'According to the responsibility matrix discussed, who is always responsible for accounts and identities?',
          options: ['The customer', 'The cloud provider', 'It depends only on SaaS vs PaaS', 'The regulator'],
          answer: 'The customer',
          explanation: 'In the example matrix the customer is always responsible for accounts and identities, whatever the service model.',
          lesson: 'Cloud infrastructures',
          source: tx('Cloud Infrastructures'),
        },
        {
          q: 'Which challenges come with a hybrid (multi-provider) cloud? Select all that apply.',
          type: MULTI,
          options: [
            'Configurations must be managed separately and can mismatch',
            'Logs use different formats and terminology',
            'Data moving between providers crosses the public internet',
            'Providers automatically share one firewall policy',
          ],
          answer: [
            'Configurations must be managed separately and can mismatch',
            'Logs use different formats and terminology',
            'Data moving between providers crosses the public internet',
          ],
          explanation: 'Providers do not talk to each other directly, so settings and logs differ, and data between them traverses the internet.',
          lesson: 'Cloud infrastructures',
          source: tx('Cloud Infrastructures'),
        },
        {
          q: 'Describing servers, web servers and databases as code so the whole environment can be rebuilt consistently is called infrastructure as ___.',
          type: FILL,
          answer: 'code',
          accepted: ['code (IaC)', 'IaC'],
          explanation: 'Infrastructure as code lets you build and modify application instances from a single definition on any provider.',
          lesson: 'Cloud infrastructures',
          source: tx('Cloud Infrastructures'),
        },
        {
          q: 'What is a benefit of a serverless architecture?',
          options: [
            'Functions run only when needed, saving time and money, with less emphasis on the underlying OS',
            'Applications run as one large executable on the client',
            'It eliminates all security responsibilities',
            'It requires a physical server for every function',
          ],
          answer: 'Functions run only when needed, saving time and money, with less emphasis on the underlying OS',
          explanation: 'Serverless builds compute containers on demand for individual functions and removes them when they are no longer needed.',
          lesson: 'Cloud infrastructures',
          source: tx('Cloud Infrastructures'),
        },
        {
          q: 'Physical isolation with separate switches scales easily to hundreds of customers.',
          type: TF,
          answer: 'False',
          explanation: 'Each isolated customer needs its own switch (100 customers means 100 switches). VLANs provide logical segmentation instead.',
          lesson: 'Network infrastructure concepts',
          source: tx('Network Infrastructure Concepts'),
        },
        {
          q: 'Which SDN plane maintains routing tables and tells the data plane where traffic should go?',
          options: ['Control plane', 'Data plane', 'Management plane', 'Application plane'],
          answer: 'Control plane',
          explanation: 'The control plane manages routing, session and NAT tables; the data plane does the forwarding.',
          lesson: 'Network infrastructure concepts',
          source: tx('Network Infrastructure Concepts'),
        },
        {
          q: 'What is the main security drawback of consolidating all monitoring into one central console?',
          options: ['It becomes a single point of failure for visibility', 'It removes all logs', 'It prevents alerts', 'It requires no storage'],
          answer: 'It becomes a single point of failure for visibility',
          explanation: 'Losing the console means losing visibility, and it needs more storage and CPU as the organization grows.',
          lesson: 'Other infrastructure concepts',
          source: tx('Other Infrastructure Concepts'),
        },
        {
          q: 'Anti-lock brakes that must take priority instantly rely on which kind of operating system?',
          options: ['A real-time operating system (RTOS)', 'A general-purpose desktop OS', 'A container runtime', 'A hypervisor'],
          answer: 'A real-time operating system (RTOS)',
          explanation: 'An RTOS is deterministic: critical processes get the resources they need within a guaranteed time.',
          lesson: 'Other infrastructure concepts',
          source: tx('Other Infrastructure Concepts'),
        },
        {
          q: 'Why should SCADA/industrial control systems be completely segmented from the outside?',
          options: [
            'A compromise could affect critical infrastructure such as power generation or refineries for a long time',
            'They do not use networks',
            'They are always open source',
            'Segmentation makes them faster',
          ],
          answer: 'A compromise could affect critical infrastructure such as power generation or refineries for a long time',
          explanation: 'The potential impact is so large that SCADA systems are some of the most secured networks in the world.',
          lesson: 'Other infrastructure concepts',
          source: tx('Other Infrastructure Concepts'),
        },
        {
          q: 'Mean time to repair (MTTR) measures:',
          options: [
            'How long it takes to replace or fix something that has failed',
            'How long equipment runs before failing',
            'How much data can be lost',
            'How many users a system supports',
          ],
          answer: 'How long it takes to replace or fix something that has failed',
          explanation: 'MTTR is a measure of resilience: the time to restore a failed component with a working one.',
          lesson: 'Infrastructure considerations',
          source: tx('Infrastructure Considerations'),
        },
        {
          q: 'An embedded HVAC controller has no patches available. What is a reasonable compensating step?',
          options: [
            'Place a firewall between the device and the rest of the network',
            'Connect it directly to the internet',
            'Ignore it, since embedded systems cannot be attacked',
            'Give it administrator access to other systems',
          ],
          answer: 'Place a firewall between the device and the rest of the network',
          explanation: 'Attackers will target any technology; unpatchable devices need extra layers such as firewalls.',
          lesson: 'Infrastructure considerations',
          source: tx('Infrastructure Considerations'),
        },
        {
          q: 'Grouping devices into zones such as "inside", "internet" and "screened" helps mainly by:',
          options: [
            'Making firewall rules easier to understand and maintain',
            'Assigning IP addresses automatically',
            'Encrypting all traffic',
            'Removing the need for authentication',
          ],
          answer: 'Making firewall rules easier to understand and maintain',
          explanation: 'Zones separate devices by use or access type, so rules like "trusted to untrusted" are clearer in a large rule base.',
          lesson: 'Secure infrastructures',
          source: tx('Secure Infrastructures'),
        },
        {
          q: 'Why use application-level encryption even on an internal wired network?',
          options: [
            'If someone taps the cabling, captured packets remain unreadable',
            'It speeds up the network',
            'It replaces firewalls',
            'Internal networks cannot be tapped',
          ],
          answer: 'If someone taps the cabling, captured packets remain unreadable',
          explanation: 'Network drops and cabling can be tapped; encryption protects the content even if packets are captured.',
          lesson: 'Secure infrastructures',
          source: tx('Secure Infrastructures'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-145: The NIST Definition of Cloud Computing',
          authors: 'Peter Mell, Timothy Grance',
          publisher: 'NIST',
          year: 2011,
          url: 'https://csrc.nist.gov/pubs/sp/800/145/final',
          kind: 'STANDARD',
          note: 'The standard definitions of SaaS, PaaS, IaaS and cloud deployment models.',
        },
        {
          title: 'NIST SP 800-190: Application Container Security Guide',
          authors: 'Murugiah Souppaya, John Morello, Karen Scarfone',
          publisher: 'NIST',
          year: 2017,
          url: 'https://csrc.nist.gov/pubs/sp/800/190/final',
          kind: 'STANDARD',
          note: 'Risks and countermeasures for containers and orchestrators.',
        },
        {
          title: 'The Protection of Information in Computer Systems',
          authors: 'Jerome H. Saltzer, Michael D. Schroeder',
          publisher: 'Proceedings of the IEEE',
          year: 1975,
          url: 'https://web.mit.edu/Saltzer/www/publications/protection/',
          kind: 'PAPER',
          note: 'The classic design principles (least privilege, economy of mechanism, fail-safe defaults) behind secure architecture.',
        },
      ],
    },

    // ── Module 2 ────────────────────────────────────────────────────
    {
      key: 'data-resilience',
      title: 'Data Protection and Resilience',
      description: 'Data types and classifications, states of data, protection techniques, resiliency and backups.',
      difficulty: 'ADVANCED',
      lessons: [
        {
          key: 'classification',
          title: 'Data types and classifications',
          summary: 'Regulated data, trade secrets, PII, PHI and classification levels.',
          video: messer('R0W0_gZCVzk', 354),
          content: `## What this lesson covers

- **Data types:** regulated (for example card data under PCI rules), trade secrets, intellectual property (copyright, trademarks), legal and financial information, human-readable and non-human-readable (for example barcodes).
- **PII:** personally identifiable information such as name, date of birth, biometrics and address.
- **PHI:** protected health information, including health status, records and health-care payments.
- **Proprietary data:** unique to the organization.
- **Classifications:** sensitive, confidential, public/unclassified, private/classified/restricted, and **critical** (must always be available).`,
          takeaways: ['PHI covers health status, records and payments.', 'Classification determines who may access data and how.'],
          checkpoints: [
            {
              at: 330,
              q: 'Records of an individual’s health-care payments are an example of which data type?',
              options: ['Protected health information (PHI)', 'Proprietary data', 'Public data', 'Intellectual property'],
              answer: 'Protected health information (PHI)',
              explanation: 'PHI includes health status, health-care records and payments for health care.',
              topic: 'gov-data',
              source: tx('Data Types and Classifications'),
            },
          ],
        },
        {
          key: 'states',
          title: 'States of data',
          summary: 'At rest, in transit and in use, plus data sovereignty and geolocation.',
          video: messer('71RQaYQ4QSw', 367),
          content: `## What this lesson covers

- **Data at rest:** on storage devices; protect with full-disk, database or file encryption, plus permissions.
- **Data in transit (in motion):** crossing networks; protect with firewalls, IPS, **TLS** and **IPsec** VPNs.
- **Data in use:** in RAM or the CPU, almost always decrypted. The 2013 Target breach took about 110 million card numbers from the memory of point-of-sale terminals even though data at rest and in transit was encrypted.
- **Data sovereignty:** data is subject to the laws of the country where it is stored; the **GDPR** requires data collected on EU citizens to be stored in the EU.
- **Geolocation** (GPS, 802.11, mobile provider) can drive access decisions.`,
          takeaways: ['Data in use is usually unencrypted, which is why attackers target memory.', 'Data sovereignty: the storage country’s laws apply.'],
          checkpoints: [
            {
              at: 300,
              q: 'In the 2013 Target breach, attackers stole card numbers from point-of-sale memory even though data at rest and in transit was encrypted. Which data state did they target?',
              options: ['Data in use', 'Data at rest', 'Data in transit', 'Archived data'],
              answer: 'Data in use',
              explanation: 'Data in RAM or the CPU must be decrypted to be processed, so attackers went after it there.',
              topic: 'gov-data',
              source: tx('States of Data'),
            },
          ],
        },
        {
          key: 'protecting',
          title: 'Protecting data',
          summary: 'Geofencing, encryption, hashing, obfuscation, masking, tokenization, segmentation and permissions.',
          video: messer('leX_Qa7wqB4', 867),
          content: `## What this lesson covers

- **Geographic restrictions and geofencing:** grant access only from certain locations.
- **Encryption** turns plaintext into ciphertext (confusion: the output looks nothing like the input).
- **Hashing** produces a fingerprint (message digest) that cannot be reversed; used for passwords, download integrity and digital signatures. Two inputs with the same hash are a **collision**. SHA-256 produces 256 bits (64 hex characters).
- **Obfuscation** makes code hard to read; **masking** hides part of data (showing only a card's last four digits).
- **Tokenization** replaces sensitive data with a one-time token (as in phone payments), with no mathematical link to the original.
- **Segmentation** splits data across databases; **permission restrictions** limit access after authentication.`,
          takeaways: ['A hash cannot be reversed into the original data.', 'Tokens cannot be used to derive the original card number.'],
          checkpoints: [
            {
              at: 690,
              q: 'When you pay with your phone, a one-time value is sent instead of your real card number. What is this technique?',
              options: ['Tokenization', 'Hashing', 'Masking', 'Geofencing'],
              answer: 'Tokenization',
              explanation: 'Tokenization replaces the card number with a token that cannot be used to derive it and cannot be reused.',
              topic: 'gov-data',
              source: tx('Protecting Data'),
            },
            {
              at: 840,
              q: 'Why might an organization split customer data across several separate databases?',
              options: [
                'An attacker would need to breach each database, and each can get security matched to its sensitivity',
                'It makes backups unnecessary',
                'It removes the need for permissions',
                'It makes data public',
              ],
              answer: 'An attacker would need to breach each database, and each can get security matched to its sensitivity',
              explanation: 'Data segmentation limits what one breach exposes and allows stronger controls on more sensitive data.',
              topic: 'gov-data',
              source: tx('Protecting Data'),
            },
          ],
        },
        {
          key: 'resiliency',
          title: 'Resiliency',
          summary: 'High availability, clustering, load balancing, recovery sites, platform diversity, multi-cloud and COOP.',
          video: messer('sb0dRaQbuBA', 581),
          content: `## What this lesson covers

- **High availability:** always-on systems ready to take the load, at higher cost.
- **Server clustering:** servers act as one, usually with shared storage and identical OSes. **Load balancing:** a central device spreads requests across servers that do not know about each other.
- **Recovery sites:** **hot** (exact replica, constantly synchronized), **warm** (some equipment and data) and **cold** (an empty building with power). Use **geographic dispersion**.
- **Platform diversity:** different operating systems limit the impact of a single vulnerability. **Multi-cloud** spreads risk across providers.
- **Continuity of operations planning (COOP):** non-technical fallbacks such as manual transactions and paper receipts.`,
          takeaways: ['A hot site is ready to run immediately; a cold site is an empty building.', 'Plan manual fallbacks before you need them.'],
          checkpoints: [
            {
              at: 470,
              q: 'Which recovery site is an exact replica of your data center, with data constantly synchronized?',
              options: ['Hot site', 'Warm site', 'Cold site', 'Test lab'],
              answer: 'Hot site',
              explanation: 'A hot site duplicates hardware and keeps applications and data updated so you can switch over immediately.',
              topic: 'gov-data',
              source: tx('Resiliency'),
            },
          ],
        },
        {
          key: 'backups',
          title: 'Backups',
          summary: 'On-site and off-site backups, frequency, encryption, snapshots, testing, replication and journaling.',
          video: messer('8mGSwRScqIM', 735),
          content: `## What this lesson covers

- **On-site** backups restore quickly; **off-site** backups survive a site loss. Many organizations use both.
- Choose **frequency** by how often data changes, with multiple backup sets (daily, weekly, monthly).
- **Encrypt** backups: tapes can be stolen in transit, and cloud copies need protection. Keep the recovery keys safe.
- **Snapshots** capture virtual machines with one click, similar to incremental backups.
- **Test** restores, including whether applications can use the restored data.
- **Replication** copies data to other locations in near real time.
- **Journaling** writes changes to a journal first, so a power loss does not corrupt the database.`,
          takeaways: ['Untested backups may fail when you need them.', 'Journaling protects against corruption during power loss.'],
          checkpoints: [
            {
              at: 700,
              q: 'A database write is interrupted by a power outage. Which technique lets the system recover without corrupting the database?',
              options: ['Journaling', 'Replication', 'Masking', 'Off-site storage'],
              answer: 'Journaling',
              explanation: 'Data is written to a journal first; after power returns, the journal is used to complete or correct the database update.',
              topic: 'gov-data',
              source: tx('Backups'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'A customer’s name, date of birth and mother’s maiden name are examples of:',
          options: ['Personally identifiable information (PII)', 'Trade secrets', 'Non-human-readable data', 'Public data'],
          answer: 'Personally identifiable information (PII)',
          explanation: 'PII is any detail that can tie data back to an individual.',
          lesson: 'Data types and classifications',
          source: tx('Data Types and Classifications'),
        },
        {
          q: 'Data classified as "critical" should above all be:',
          options: ['Always available', 'Publicly visible', 'Deleted after use', 'Stored only on paper'],
          answer: 'Always available',
          explanation: 'Critical data needs processes and procedures to maintain uptime and availability.',
          lesson: 'Data types and classifications',
          source: tx('Data Types and Classifications'),
        },
        {
          q: 'Data stored on a hard drive is considered data at rest only if it is encrypted.',
          type: TF,
          answer: 'False',
          explanation: 'Any data saved on a storage device is data at rest, encrypted or not.',
          lesson: 'States of data',
          source: tx('States of Data'),
        },
        {
          q: 'Which technologies protect data in transit? Select all that apply.',
          type: MULTI,
          options: ['TLS', 'IPsec site-to-site VPN', 'Full-disk encryption', 'Firewall and IPS policies'],
          answer: ['TLS', 'IPsec site-to-site VPN', 'Firewall and IPS policies'],
          explanation: 'TLS and IPsec encrypt traffic; firewalls and IPS control what crosses the network. Full-disk encryption protects data at rest.',
          lesson: 'States of data',
          source: tx('States of Data'),
        },
        {
          q: 'The GDPR requires that data collected on EU citizens be stored in the EU. This is an example of data ___.',
          type: FILL,
          answer: 'sovereignty',
          explanation: 'Data sovereignty means the laws of the country where data is stored apply to it.',
          lesson: 'States of data',
          source: tx('States of Data'),
        },
        {
          q: 'Two different inputs produce exactly the same hash. What is this called?',
          options: ['A collision', 'A token', 'Confusion', 'A mask'],
          answer: 'A collision',
          explanation: 'Hash algorithms prone to collisions are retired in favor of stronger ones.',
          lesson: 'Protecting data',
          source: tx('Protecting Data'),
        },
        {
          q: 'A receipt shows a card number as ************1234. Which technique is this?',
          options: ['Data masking', 'Hashing', 'Tokenization', 'Encryption in transit'],
          answer: 'Data masking',
          explanation: 'Masking hides part of the data while the processor still holds the full value.',
          lesson: 'Protecting data',
          source: tx('Protecting Data'),
        },
        {
          q: 'How many bits long is a SHA-256 hash?',
          options: ['256', '64', '128', '512'],
          answer: '256',
          explanation: 'SHA-256 produces 256 bits, usually shown as 64 hexadecimal characters.',
          lesson: 'Protecting data',
          source: tx('Protecting Data'),
        },
        {
          q: 'Allowing access to certain data only while a user is inside a corporate building is called:',
          options: ['Geofencing', 'Obfuscation', 'Replication', 'Tokenization'],
          answer: 'Geofencing',
          explanation: 'Geofencing applies policies based on a user’s location, determined by network location or geolocation.',
          lesson: 'Protecting data',
          source: tx('Protecting Data'),
        },
        {
          q: 'How does load balancing differ from server clustering?',
          options: [
            'Load-balanced servers do not know about each other; a central device distributes requests',
            'Load balancing requires identical operating systems',
            'Clustered servers never share storage',
            'There is no difference',
          ],
          answer: 'Load-balanced servers do not know about each other; a central device distributes requests',
          explanation: 'Cluster members work together as one server, often with shared storage; behind a load balancer servers are independent and can run different OSes.',
          lesson: 'Resiliency',
          source: tx('Resiliency'),
        },
        {
          q: 'Why use different operating systems for different purposes (platform diversity)?',
          options: [
            'A vulnerability in one OS is unlikely to affect all systems',
            'It reduces licensing costs',
            'It removes the need for patches',
            'It speeds up backups',
          ],
          answer: 'A vulnerability in one OS is unlikely to affect all systems',
          explanation: 'Vulnerabilities are usually specific to an OS, so diversity spreads the risk.',
          lesson: 'Resiliency',
          source: tx('Resiliency'),
        },
        {
          q: 'During an outage, staff switch to manual transactions and paper receipts. This is part of:',
          options: ['Continuity of operations planning (COOP)', 'Tokenization', 'Data masking', 'Geofencing'],
          answer: 'Continuity of operations planning (COOP)',
          explanation: 'COOP defines non-technical ways to keep providing services when technology is unavailable.',
          lesson: 'Resiliency',
          source: tx('Resiliency'),
        },
        {
          q: 'Why should backups sent off site be encrypted?',
          options: [
            'Backup media can be lost or stolen in transit or accessed in third-party or cloud storage',
            'Encryption makes backups smaller',
            'Off-site storage forbids unencrypted data',
            'It removes the need to test restores',
          ],
          answer: 'Backup media can be lost or stolen in transit or accessed in third-party or cloud storage',
          explanation: 'Backups contain sensitive data; encryption keeps it unreadable if stolen. Keep the recovery keys safe.',
          lesson: 'Backups',
          source: tx('Backups'),
        },
        {
          q: 'Which statements about backups are true? Select all that apply.',
          type: MULTI,
          options: [
            'Restores should be tested, including whether applications can use the data',
            'Replication copies data to other locations in near real time',
            'Snapshots are a common backup method for virtual machines',
            'A backup that has never been tested is guaranteed to work',
          ],
          answer: [
            'Restores should be tested, including whether applications can use the data',
            'Replication copies data to other locations in near real time',
            'Snapshots are a common backup method for virtual machines',
          ],
          explanation: 'Testing proves backups work; replication and snapshots are common techniques. Untested backups may fail.',
          lesson: 'Backups',
          source: tx('Backups'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-34 Rev. 1: Contingency Planning Guide for Federal Information Systems',
          authors: 'Marianne Swanson et al.',
          publisher: 'NIST',
          year: 2010,
          url: 'https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final',
          kind: 'STANDARD',
          note: 'How to plan recovery sites, backups and continuity of operations.',
        },
        {
          title: 'Why Information Security is Hard: An Economic Perspective',
          authors: 'Ross Anderson',
          publisher: 'Annual Computer Security Applications Conference (ACSAC)',
          year: 2001,
          url: 'https://www.cl.cam.ac.uk/~rja14/Papers/econ.pdf',
          kind: 'PAPER',
          note: 'Why misaligned incentives, not just technology, make data hard to protect.',
        },
        {
          title: 'PCI DSS (Payment Card Industry Data Security Standard)',
          authors: 'PCI Security Standards Council',
          publisher: 'PCI SSC',
          year: null,
          url: 'https://www.pcisecuritystandards.org/standards/pci-dss/',
          kind: 'STANDARD',
          note: 'The industry standard for protecting regulated cardholder data.',
        },
      ],
    },

    // ── Module 3 ────────────────────────────────────────────────────
    {
      key: 'iam',
      title: 'Identity and Access Management',
      description: 'IAM lifecycle, identity proofing, SSO, LDAP, SAML, OAuth and federation, access control models, MFA and password security.',
      difficulty: 'ADVANCED',
      lessons: [
        {
          key: 'iam',
          title: 'Identity and access management',
          summary: 'Provisioning, identity proofing, SSO, LDAP, SAML, OAuth, federation and interoperability.',
          video: messer('ZoOyyqhptik', 766),
          content: `## What this lesson covers

- **IAM** gives the right permissions to the right people at the right times, from **provisioning** at onboarding to **deprovisioning** at offboarding.
- **Identity proofing:** resolution, validation and **attestation** (for example government ID or an in-person meeting).
- **Single sign-on (SSO):** log in once and access resources for a period (for example 24 hours).
- **LDAP:** directory access based on the **X.500** standard, organized as a directory information tree (attributes such as CN, OU, O, C).
- **SAML:** authentication to a third party using a token from an authorization server; not designed for mobile.
- **OAuth:** an **authorization** framework, usually paired with **OpenID** for authentication.
- **Federation:** sign in with an existing account from another provider. Choose technologies that **interoperate**.`,
          takeaways: ['OAuth handles authorization; OpenID adds authentication.', 'Deprovisioning at offboarding is as important as provisioning.'],
          checkpoints: [
            {
              at: 720,
              q: 'OAuth is primarily which kind of framework?',
              options: ['An authorization framework (often paired with OpenID for authentication)', 'A directory protocol based on X.500', 'A disk encryption standard', 'A firewall rule language'],
              answer: 'An authorization framework (often paired with OpenID for authentication)',
              explanation: 'OAuth decides what resources an app may access; OpenID Connect commonly provides the authentication.',
              topic: 'gov-iam',
              source: tx('Identity and Access Management'),
            },
          ],
        },
        {
          key: 'access-controls',
          title: 'Access controls',
          summary: 'Least privilege, MAC, DAC, RBAC, rule-based, ABAC and time-of-day restrictions.',
          video: messer('9ANHcZwJfdQ', 469),
          content: `## What this lesson covers

- **Least privilege:** only the rights needed for the job, never administrator rights by default.
- **Mandatory access control (MAC):** resources carry labels (confidential, secret, top secret); the administrator defines access.
- **Discretionary access control (DAC):** the data's creator decides who has access; flexible but weaker.
- **Role-based access control (RBAC):** permissions assigned to groups for job roles; users inherit them.
- **Rule-based access control:** administrator-defined rules on objects (for example access only 9:00–5:00).
- **Attribute-based access control (ABAC):** many criteria combined: IP address, time, action, relationship to data.
- **Time-of-day restrictions** can apply across models (mind the time zones).`,
          takeaways: ['RBAC assigns permissions to roles, not individuals.', 'DAC relies on every owner to secure their own data.'],
          checkpoints: [
            {
              at: 440,
              q: 'You create a spreadsheet and decide which coworkers can read or edit it. Which access control model is this?',
              options: ['Discretionary access control (DAC)', 'Mandatory access control (MAC)', 'Role-based access control (RBAC)', 'Attribute-based access control (ABAC)'],
              answer: 'Discretionary access control (DAC)',
              explanation: 'In DAC the owner of the data controls access, which is flexible but relies on each user to set it correctly.',
              topic: 'gov-iam',
              source: tx('Access Controls'),
            },
          ],
        },
        {
          key: 'mfa',
          title: 'Multifactor authentication',
          summary: 'Something you know, have, are, and somewhere you are.',
          video: messer('MpIzA4fNWew', 269),
          content: `## What this lesson covers

- **Something you know:** password, PIN, unlock pattern.
- **Something you have:** smart card, USB security key, hardware or software token, phone receiving SMS codes.
- **Something you are:** biometrics, stored as a mathematical representation, hard to change, best combined with other factors.
- **Somewhere you are:** location from IP address or GPS; for example blocking a login from another country minutes after a local one.`,
          takeaways: ['Biometrics are stored as mathematical representations, not images.', 'Location can be an authentication factor.'],
          checkpoints: [
            {
              at: 250,
              q: 'A USB security key with a certificate unique to you is which authentication factor?',
              options: ['Something you have', 'Something you know', 'Something you are', 'Somewhere you are'],
              answer: 'Something you have',
              explanation: 'Physical devices such as smart cards, security keys and tokens are possession factors.',
              topic: 'gov-iam',
              source: tx('Multifactor Authentication'),
            },
          ],
        },
        {
          key: 'passwords',
          title: 'Password security',
          summary: 'Entropy, length and age, password managers, passwordless and just-in-time permissions.',
          video: messer('eMOe-PLBy1k', 381),
          content: `## What this lesson covers

- **Entropy** measures how unpredictable a password is; mix character types and use longer passphrases.
- **Password age, expiration and history** are set by administrators (note that current NIST guidance, covered in Course 1, advises against forced periodic changes for most users).
- Use a **different password for every account**, made practical by a **password manager** with an encrypted database.
- **Passwordless** methods (face unlock, Windows PIN) are often combined with another factor.
- **Just-in-time (JIT) permissions:** a vault issues **temporary, ephemeral** admin credentials for a task; the primary credentials are never revealed.`,
          takeaways: ['Just-in-time access limits how long admin rights exist.', 'Password managers enable unique passwords everywhere.'],
          checkpoints: [
            {
              at: 360,
              q: 'A technician receives temporary administrator credentials from a vault for one task; they expire afterwards. What is this called?',
              options: ['Just-in-time permissions', 'Discretionary access control', 'Password history', 'Federation'],
              answer: 'Just-in-time permissions',
              explanation: 'JIT access issues ephemeral credentials from a central vault, so a breached account does not carry standing admin rights.',
              topic: 'gov-iam',
              source: tx('Password Security'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which events typically trigger IAM changes? Select all that apply.',
          type: MULTI,
          options: ['Onboarding a new employee', 'Offboarding a departing employee', 'A promotion or move to another department', 'Restarting a laptop'],
          answer: ['Onboarding a new employee', 'Offboarding a departing employee', 'A promotion or move to another department'],
          explanation: 'IAM provisions at onboarding, deprovisions at offboarding, and adjusts permissions when roles change.',
          lesson: 'Identity and access management',
          source: tx('Identity and Access Management'),
        },
        {
          q: 'Verifying a new user’s identity with a passport or driver’s license is part of identity ___.',
          type: FILL,
          answer: 'proofing',
          explanation: 'Identity proofing confirms users are who they claim to be, including attestation with documents or in-person checks.',
          lesson: 'Identity and access management',
          source: tx('Identity and Access Management'),
        },
        {
          q: 'LDAP is based on which directory standard?',
          options: ['X.500', 'X.509', '802.1X', 'RFC 1918'],
          answer: 'X.500',
          explanation: 'LDAP (Lightweight Directory Access Protocol) is based on the ITU X.500 directory specification.',
          lesson: 'Identity and access management',
          source: tx('Identity and Access Management'),
        },
        {
          q: 'SAML was originally designed with mobile devices in mind.',
          type: TF,
          answer: 'False',
          explanation: 'SAML was never designed for mobile; OAuth was built for modern and mobile systems.',
          lesson: 'Identity and access management',
          source: tx('Identity and Access Management'),
        },
        {
          q: 'Logging in to a website with your existing LinkedIn account instead of creating a new account is an example of:',
          options: ['Federation', 'Mandatory access control', 'Data masking', 'Journaling'],
          answer: 'Federation',
          explanation: 'Federation lets a site rely on another provider’s authentication database.',
          lesson: 'Identity and access management',
          source: tx('Identity and Access Management'),
        },
        {
          q: 'Files labeled confidential, secret or top secret, with access set only by administrators, describe which model?',
          options: ['Mandatory access control (MAC)', 'Discretionary access control (DAC)', 'Rule-based access control', 'Federation'],
          answer: 'Mandatory access control (MAC)',
          explanation: 'MAC labels resources and the administrator defines who can access each label.',
          lesson: 'Access controls',
          source: tx('Access Controls'),
        },
        {
          q: 'An administrator creates a "Managers" group, assigns it permissions, and adds managers to it. Which model is this?',
          options: ['Role-based access control (RBAC)', 'Discretionary access control (DAC)', 'Mandatory access control (MAC)', 'Time-of-day restriction only'],
          answer: 'Role-based access control (RBAC)',
          explanation: 'RBAC assigns permissions to roles (groups); users added to the group inherit them.',
          lesson: 'Access controls',
          source: tx('Access Controls'),
        },
        {
          q: 'Which access control model can combine IP address, time of day, the requested action and the user’s relationship to the data?',
          options: ['Attribute-based access control (ABAC)', 'Discretionary access control (DAC)', 'Mandatory access control (MAC)', 'Least privilege alone'],
          answer: 'Attribute-based access control (ABAC)',
          explanation: 'ABAC evaluates many attributes together, a next generation of authorization models.',
          lesson: 'Access controls',
          source: tx('Access Controls'),
        },
        {
          q: 'Why does least privilege limit the damage from malware?',
          options: [
            'Malware runs with the user’s limited rights rather than administrator rights',
            'It deletes malware automatically',
            'It encrypts all files',
            'It blocks all network traffic',
          ],
          answer: 'Malware runs with the user’s limited rights rather than administrator rights',
          explanation: 'If a user runs malicious software, it only has that user’s permissions.',
          lesson: 'Access controls',
          source: tx('Access Controls'),
        },
        {
          q: 'A smartphone unlock pattern is which authentication factor?',
          options: ['Something you know', 'Something you have', 'Something you are', 'Somewhere you are'],
          answer: 'Something you know',
          explanation: 'Only you know the pattern, like a password or PIN.',
          lesson: 'Multifactor authentication',
          source: tx('Multifactor Authentication'),
        },
        {
          q: 'Biometric systems store a picture of your fingerprint and compare images.',
          type: TF,
          answer: 'False',
          explanation: 'They store a mathematical representation of the biometric, not the image itself.',
          lesson: 'Multifactor authentication',
          source: tx('Multifactor Authentication'),
        },
        {
          q: 'What does password entropy describe?',
          options: ['How unpredictable a password is', 'How old a password is', 'How many accounts use the password', 'How the password is stored'],
          answer: 'How unpredictable a password is',
          explanation: 'Higher entropy (length and character variety) makes guessing, spraying and brute force harder.',
          lesson: 'Password security',
          source: tx('Password Security'),
        },
        {
          q: 'Which statements about password managers are true? Select all that apply.',
          type: MULTI,
          options: [
            'They store passwords in an encrypted database',
            'They make unique passwords for every site practical',
            'They can generate random passwords',
            'They require reusing the same password everywhere',
          ],
          answer: ['They store passwords in an encrypted database', 'They make unique passwords for every site practical', 'They can generate random passwords'],
          explanation: 'Password managers encrypt their vault and generate and fill unique passwords.',
          lesson: 'Password security',
          source: tx('Password Security'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-162: Guide to Attribute Based Access Control (ABAC) Definition and Considerations',
          authors: 'Vincent C. Hu et al.',
          publisher: 'NIST',
          year: 2014,
          url: 'https://csrc.nist.gov/pubs/sp/800/162/upd2/final',
          kind: 'STANDARD',
          note: 'A deeper look at the ABAC model introduced in this module.',
        },
        {
          title: 'NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management',
          authors: 'National Institute of Standards and Technology',
          publisher: 'NIST',
          year: 2025,
          url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final',
          kind: 'STANDARD',
          note: 'Current federal guidance on authenticators, MFA and password policy.',
        },
      ],
    },

    // ── Module 4 ────────────────────────────────────────────────────
    {
      key: 'governance-risk',
      title: 'Governance and Risk Management',
      description: 'Security policies, risk assessments, quantitative and qualitative analysis, risk strategies and business impact analysis.',
      difficulty: 'ADVANCED',
      lessons: [
        {
          key: 'policies',
          title: 'Security policies',
          summary: 'Information security policies, AUP, business continuity, disaster recovery, incident response, SDLC and change management.',
          video: messer('5kY9kvzeWjA', 662),
          content: `## What this lesson covers

- Policies support **confidentiality, integrity and availability (CIA)**, saying what to do and why.
- The **information security policy** answers questions such as what happens when a virus is found, and lists roles and responsibilities.
- **Acceptable use policy (AUP):** what users may do with company technology; also limits legal liability.
- **Business continuity** and **disaster recovery** plans must be documented and tested **before** they are needed.
- **Incident response** policies and roles; the NIST SP 800-61 lifecycle.
- **SDLC:** waterfall (linear) vs agile (rapid cycles).
- **Change management:** scheduled, documented changes with a **fallback (backout) procedure**.`,
          takeaways: ['An AUP defines acceptable use of company technology for everyone.', 'Every change needs a fallback plan.'],
          checkpoints: [
            {
              at: 630,
              q: 'What is perhaps the most important element of a documented change, according to the video?',
              options: ['A fallback procedure if the change does not go as planned', 'The name of the vendor', 'The color of the change form', 'The number of users notified'],
              answer: 'A fallback procedure if the change does not go as planned',
              explanation: 'Change management documents frequency, duration and installation, and especially how to back out a failed change.',
              topic: 'gov-risk',
              source: tx('Security Policies'),
            },
          ],
        },
        {
          key: 'risk-mgmt',
          title: 'Risk management',
          summary: 'One-time, ad hoc, recurring and continuous risk assessments.',
          video: messer('cLhUMoQS1a8', 209),
          content: `## What this lesson covers

Risk management identifies and manages potential risks from inside and outside. Assessment types:

- **One-time:** tied to a project, such as an acquisition or new technology.
- **Ad hoc:** for one specific purpose, for example a new attack type the CEO heard about.
- **Recurring:** on a schedule (every 3, 6 or 12 months), sometimes mandated, as with PCI DSS's annual requirement.
- **Continuous:** for example a risk step in every change control.`,
          takeaways: ['Ad hoc assessments answer one specific question.', 'Some assessments are mandated by standards such as PCI DSS.'],
          checkpoints: [
            {
              at: 195,
              q: 'After hearing about a new attack at a conference, the CEO asks for an assessment of just that threat. What type of risk assessment is this?',
              options: ['Ad hoc', 'Recurring', 'Continuous', 'Mandatory annual'],
              answer: 'Ad hoc',
              explanation: 'An ad hoc assessment is created for one specific purpose; the committee can disband once it reports.',
              topic: 'gov-risk',
              source: tx('Risk Management'),
            },
          ],
        },
        {
          key: 'risk-analysis',
          title: 'Risk analysis',
          summary: 'Qualitative vs quantitative analysis, SLE, ALE, ARO, impact, likelihood, appetite, tolerance and risk registers.',
          video: messer('Ykx7t54y-oo', 553),
          content: `## What this lesson covers

- **Qualitative** analysis uses broad ratings (for example a traffic-light grid of low/medium/high).
- **Quantitative** analysis calculates values:
  - **SLE = AV × EF** (single loss expectancy = asset value × exposure factor)
  - **ALE = ARO × SLE** (annualized loss expectancy = annualized rate of occurrence × SLE)
  - Example: a $1,000 laptop, EF 1.0 → SLE $1,000; 7 stolen per year → ALE $7,000.
- **Impact:** life comes first, then property, safety and finances. **Likelihood** is qualitative; **probability** is quantitative.
- **Risk appetite** (how much risk the organization is willing to take) vs **risk tolerance** (the acceptable variation above it).
- **Risk register:** key risk indicators, owners and thresholds.`,
          takeaways: ['SLE = AV × EF; ALE = ARO × SLE.', 'Life safety always comes first.'],
          checkpoints: [
            {
              at: 400,
              q: 'A server worth $20,000 would lose half its value in a flood (EF 0.5), and floods are expected once every 10 years (ARO 0.1). What is the annualized loss expectancy (ALE)?',
              options: ['$1,000', '$10,000', '$2,000', '$100'],
              answer: '$1,000',
              explanation: 'SLE = AV × EF = $20,000 × 0.5 = $10,000. ALE = ARO × SLE = 0.1 × $10,000 = $1,000.',
              topic: 'gov-risk',
              source: tx('Risk Analysis'),
            },
          ],
        },
        {
          key: 'strategies',
          title: 'Risk management strategies',
          summary: 'Transfer, accept (with exemptions and exceptions), avoid and mitigate, plus risk reporting.',
          video: messer('pmyuWY7Pbag', 192),
          content: `## What this lesson covers

- **Transfer:** move the risk to another party, for example cybersecurity insurance.
- **Accept:** the most common choice, sometimes formalized as an **exemption** (for example an unpatchable machine kept off the network) or an **exception** (for example more time to patch when patches break critical software).
- **Avoid:** remove the risky activity entirely.
- **Mitigate:** reduce the risk, for example with a next-generation firewall.
- **Risk reporting** gives management a living list of critical and emerging risks.`,
          takeaways: ['Insurance transfers risk; a firewall mitigates it.', 'Exemptions and exceptions are ways to formally accept risk.'],
          checkpoints: [
            {
              at: 180,
              q: 'Buying cybersecurity insurance is an example of which risk strategy?',
              options: ['Transfer', 'Avoid', 'Mitigate', 'Accept'],
              answer: 'Transfer',
              explanation: 'Insurance moves some of the financial impact to another party.',
              topic: 'gov-risk',
              source: tx('Risk Management Strategies'),
            },
          ],
        },
        {
          key: 'bia',
          title: 'Business impact analysis',
          summary: 'RTO, RPO, MTTR and MTBF.',
          video: messer('myI-v3mj7Kc', 174),
          content: `## What this lesson covers

- **RTO (recovery time objective):** how long until you are back up and running.
- **RPO (recovery point objective):** how much data must be restored to be operational (for example the last 12 months).
- **MTTR (mean time to repair):** average time to diagnose, obtain, install and configure replacements; can be reduced with spares or support contracts.
- **MTBF (mean time between failures):** expected run time between outages; roughly **total uptime ÷ number of breakdowns**.`,
          takeaways: ['RTO is about time to recover; RPO is about how much data you need back.', 'MTBF ≈ total uptime ÷ breakdowns.'],
          checkpoints: [
            {
              at: 165,
              q: 'A switch ran for 9,000 hours in total and broke down 3 times. What is its approximate mean time between failures (MTBF)?',
              options: ['3,000 hours', '27,000 hours', '9,003 hours', '3 hours'],
              answer: '3,000 hours',
              explanation: 'MTBF ≈ total uptime ÷ number of breakdowns = 9,000 ÷ 3 = 3,000 hours.',
              topic: 'gov-risk',
              source: tx('Business Impact Analysis'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which policy defines what employees may and may not do with company computers, phones and networks?',
          options: ['Acceptable use policy (AUP)', 'Disaster recovery plan', 'Change management policy', 'Risk register'],
          answer: 'Acceptable use policy (AUP)',
          explanation: 'The AUP informs users of appropriate use and helps protect the organization legally.',
          lesson: 'Security policies',
          source: tx('Security Policies'),
        },
        {
          q: 'Which software development lifecycle is linear: requirements, development, testing, deployment, then maintenance?',
          options: ['Waterfall', 'Agile', 'Ad hoc', 'Continuous risk assessment'],
          answer: 'Waterfall',
          explanation: 'Waterfall proceeds in a linear sequence; agile iterates rapidly through design, development, testing and review.',
          lesson: 'Security policies',
          source: tx('Security Policies'),
        },
        {
          q: 'Business continuity plans should be designed and tested before an outage occurs.',
          type: TF,
          answer: 'True',
          explanation: 'Continuity and disaster recovery must be planned, documented and tested in advance.',
          lesson: 'Security policies',
          source: tx('Security Policies'),
        },
        {
          q: 'A risk step performed for every change that goes through change control is an example of which assessment type?',
          options: ['Continuous', 'One-time', 'Ad hoc', 'Annual only'],
          answer: 'Continuous',
          explanation: 'Assessing risk as part of every change control is an ongoing, continuous process.',
          lesson: 'Risk management',
          source: tx('Risk Management'),
        },
        {
          q: 'Single loss expectancy (SLE) is calculated as:',
          options: ['Asset value × exposure factor', 'ARO × ALE', 'Asset value ÷ ARO', 'MTBF × MTTR'],
          answer: 'Asset value × exposure factor',
          explanation: 'SLE = AV × EF; ALE = ARO × SLE.',
          lesson: 'Risk analysis',
          source: tx('Risk Analysis'),
        },
        {
          q: 'An asset is completely destroyed by an event. What is the exposure factor?',
          type: FILL,
          answer: '1.0',
          accepted: ['1', '100%', '1.00'],
          explanation: 'Exposure factor is the fraction of value lost: 0.25 for a quarter, 1.0 for the whole asset.',
          lesson: 'Risk analysis',
          source: tx('Risk Analysis'),
        },
        {
          q: 'Which impact is usually placed at the very top of risk concerns?',
          options: ['Life', 'Property', 'Financial', 'Reputation'],
          answer: 'Life',
          explanation: 'Assets can be replaced; people cannot. Life safety comes first.',
          lesson: 'Risk analysis',
          source: tx('Risk Analysis'),
        },
        {
          q: 'In the speed-limit analogy, why is risk tolerance described as higher than risk appetite?',
          options: [
            'Police tolerate some speeding above the limit before acting, even though the limit is the accepted level',
            'The speed limit is always ignored',
            'Risk appetite is always higher than tolerance',
            'Tolerance never changes with conditions',
          ],
          answer: 'Police tolerate some speeding above the limit before acting, even though the limit is the accepted level',
          explanation: 'The limit is the appetite; the variance tolerated before a ticket is the tolerance, which can tighten in bad weather.',
          lesson: 'Risk analysis',
          source: tx('Risk Analysis'),
        },
        {
          q: 'A document listing each project risk with its key risk indicator, owner and threshold is a risk ___.',
          type: FILL,
          answer: 'register',
          explanation: 'A risk register documents risks, owners, thresholds and possible responses.',
          lesson: 'Risk analysis',
          source: tx('Risk Analysis'),
        },
        {
          q: 'Patches must be installed within three days, but this month’s patches crash critical software, so management allows extra time. This is:',
          options: ['An exception (accepting the risk)', 'Risk transfer', 'Risk avoidance', 'A recovery point objective'],
          answer: 'An exception (accepting the risk)',
          explanation: 'An exception temporarily departs from policy while accepting the risk; an exemption excludes a specific case from a policy.',
          lesson: 'Risk management strategies',
          source: tx('Risk Management Strategies'),
        },
        {
          q: 'Which strategy removes the risk by not doing the risky activity at all?',
          options: ['Avoid', 'Transfer', 'Accept', 'Mitigate'],
          answer: 'Avoid',
          explanation: 'Avoidance removes the risk entirely; mitigation reduces it.',
          lesson: 'Risk management strategies',
          source: tx('Risk Management Strategies'),
        },
        {
          q: 'The business requires at least the last 12 months of customer data restored before it considers itself operational. Which metric is this?',
          options: ['Recovery point objective (RPO)', 'Recovery time objective (RTO)', 'Mean time between failures (MTBF)', 'Annualized rate of occurrence (ARO)'],
          answer: 'Recovery point objective (RPO)',
          explanation: 'RPO defines the data that must be recovered; RTO defines how long recovery may take.',
          lesson: 'Business impact analysis',
          source: tx('Business Impact Analysis'),
        },
        {
          q: 'How can an organization reduce its mean time to repair (MTTR)? Select all that apply.',
          type: MULTI,
          options: [
            'Keep spare equipment on site',
            'Sign a support contract with a short replacement time',
            'Increase the asset value',
            'Lower the recovery point objective',
          ],
          answer: ['Keep spare equipment on site', 'Sign a support contract with a short replacement time'],
          explanation: 'Spending a little more on spares or fast replacement contracts shortens the time to repair.',
          lesson: 'Business impact analysis',
          source: tx('Business Impact Analysis'),
        },
      ],
      readings: [
        {
          title: 'The NIST Cybersecurity Framework (CSF) 2.0',
          authors: 'National Institute of Standards and Technology',
          publisher: 'NIST (CSWP 29)',
          year: 2024,
          url: 'https://doi.org/10.6028/NIST.CSWP.29',
          kind: 'STANDARD',
          note: 'The widely used framework, now with a "Govern" function, for organizing cybersecurity risk management.',
        },
        {
          title: 'NIST SP 800-30 Rev. 1: Guide for Conducting Risk Assessments',
          authors: 'Joint Task Force Transformation Initiative',
          publisher: 'NIST',
          year: 2012,
          url: 'https://csrc.nist.gov/pubs/sp/800/30/r1/final',
          kind: 'STANDARD',
          note: 'How to identify threats, vulnerabilities, likelihood and impact.',
        },
        {
          title: 'The Economics of Information Security Investment',
          authors: 'Lawrence A. Gordon, Martin P. Loeb',
          publisher: 'ACM Transactions on Information and System Security',
          year: 2002,
          url: 'https://doi.org/10.1145/581271.581274',
          kind: 'PAPER',
          note: 'The Gordon-Loeb model on how much to invest in protecting an asset relative to its expected loss.',
        },
      ],
    },

    // ── Module 5 ────────────────────────────────────────────────────
    {
      key: 'assurance',
      title: 'Third Parties, Compliance and Awareness',
      description: 'Vendor risk, supply chain analysis, compliance and its consequences, audits, and security awareness programs.',
      difficulty: 'ADVANCED',
      lessons: [
        {
          key: 'third-party',
          title: 'Third-party risk assessment',
          summary: 'Contracts, testing and right to audit, supply chain analysis, due diligence, conflicts of interest and vendor monitoring.',
          video: messer('13KNjPexnEI', 696),
          content: `## What this lesson covers

- Vendors (payroll, marketing, travel, suppliers) hold your data, so put **risk assessment requirements in the contract**.
- Contracts can require **penetration tests**, governed by **rules of engagement** (scope, timing, IP ranges, emergency contacts, handling sensitive data), and a **right-to-audit** clause.
- **Supply chain analysis:** the 2020 **SolarWinds** compromise pushed malware to customers through a validly signed update.
- **Independent assessments** bring an outside perspective; **due diligence** verifies a vendor before signing.
- Watch for **conflicts of interest** (a vendor working for your biggest competitor, a relative of an executive, gifts for signing).
- **Vendor monitoring:** financial and security reviews and **questionnaires**, updated throughout the relationship.`,
          takeaways: ['A right-to-audit clause lets you verify a vendor’s security.', 'Even signed software updates can carry supply-chain malware.'],
          checkpoints: [
            {
              at: 640,
              q: 'In the SolarWinds incident, how did malware reach customer networks?',
              options: [
                'Through a legitimate software update that carried a valid SolarWinds digital signature',
                'Through phishing emails from SolarWinds staff',
                'Through a misconfigured VLAN',
                'Through a stolen backup tape',
              ],
              answer: 'Through a legitimate software update that carried a valid SolarWinds digital signature',
              explanation: 'Attackers inserted malware into the product build; SolarWinds then shipped the signed update to its customers.',
              topic: 'gov-assurance',
              source: tx('Third-party Risk Assessment'),
            },
          ],
        },
        {
          key: 'compliance',
          title: 'Compliance',
          summary: 'Internal and external reporting, regulations, consequences, due diligence and due care, and compliance monitoring.',
          video: messer('IjJf4jLtONQ', 485),
          content: `## What this lesson covers

- **Compliance** means meeting standards set by laws, regulations or agreements, often overseen by a **central compliance officer (CCO)** with internal and external reporting.
- Examples: **Sarbanes-Oxley (SOX)**, **HIPAA** (health information privacy) and the **Gramm-Leach-Bliley Act (GLBA)** (financial privacy notices).
- **Consequences:** fines, sanctions, loss of license, contractual breaches and **reputational damage**. Uber's 2016 breach was concealed for over a year and led to $148 million in fines in 2018.
- **Due diligence** (activities with third parties) and **due care** (internal activities); executives provide **attestation and acknowledgment**.
- **Compliance monitoring** is increasingly automated.`,
          takeaways: ['Concealing a breach can turn a security incident into a compliance disaster.', 'HIPAA protects the privacy of medical information.'],
          checkpoints: [
            {
              at: 380,
              q: 'What made the consequences of Uber’s 2016 breach so severe, according to the video?',
              options: [
                'The company delayed disclosure for over a year and allegedly paid the attackers to stay quiet',
                'The attackers used ransomware',
                'Uber had no firewall',
                'The breach involved physical theft',
              ],
              answer: 'The company delayed disclosure for over a year and allegedly paid the attackers to stay quiet',
              explanation: 'Uber would have been in compliance had it disclosed the breach; concealment led to $148 million in fines and reputational damage.',
              topic: 'gov-assurance',
              source: tx('Compliance'),
            },
          ],
        },
        {
          key: 'audits',
          title: 'Audits and assessments',
          summary: 'Internal and external audits, attestation, audit committees and self-assessments.',
          video: messer('uo2Yw720mv4', 168),
          content: `## What this lesson covers

- A **cybersecurity audit** examines infrastructure, software, devices and policies, and can find vulnerabilities before attackers do.
- **Attestation** is an opinion of truth about an audit's results.
- **Internal audits** are often run by an **audit committee** and start with **self-assessments**.
- Some regulations require **external, third-party audits**, with the type and frequency set by the regulation.`,
          takeaways: ['Attestation affirms the truth of audit results.', 'Some regulations require external auditors.'],
          checkpoints: [
            {
              at: 160,
              q: 'An opinion of truth about the results of an audit is called:',
              options: ['Attestation', 'Tokenization', 'Federation', 'Exposure factor'],
              answer: 'Attestation',
              explanation: 'Organizations perform an audit and then attest to its results.',
              topic: 'gov-assurance',
              source: tx('Audits and Assessments'),
            },
          ],
        },
        {
          key: 'awareness',
          title: 'Security awareness',
          summary: 'Phishing campaigns, recognizing phishing, anomalous behavior, reporting and training.',
          video: messer('W_Npxwk4fbI', 405),
          content: `## What this lesson covers

- **Phishing campaigns** measure who clicks and route them to additional training; they also test email filters.
- Signs of phishing: spelling or grammar errors, mismatched domains, inconsistent construction, unusual attachments, and requests for personal information or credentials. Report suspected phishing through a known process.
- **Anomalous behavior recognition:** risky (modifying host files, replacing OS files, uploading sensitive files), unexpected (logins from another country, large transfers) and unintentional (typos, a lost USB drive, misconfigurations).
- **Reporting and monitoring** metrics such as click rates, password manager adoption and MFA use.
- A **security awareness team** develops role-specific and compliance-focused training.`,
          takeaways: ['Phishing simulations measure and improve user awareness.', 'Track metrics over time to see if training works.'],
          checkpoints: [
            {
              at: 380,
              q: 'Which of these are signs that an email may be phishing? Select all that apply.',
              type: MULTI,
              options: [
                'Spelling and grammatical errors',
                'A link domain that does not match the claimed sender',
                'A request for your login credentials',
                'An email from a colleague confirming a meeting you scheduled',
              ],
              answer: ['Spelling and grammatical errors', 'A link domain that does not match the claimed sender', 'A request for your login credentials'],
              explanation: 'Errors, mismatched domains, unusual attachments and requests for personal information or credentials are classic phishing signs.',
              topic: 'gov-assurance',
              source: tx('Security Awareness'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Why put risk assessment requirements into a contract with a vendor?',
          options: [
            'So expectations are clear and penalties apply if the agreement is breached',
            'Because contracts replace security controls',
            'So the vendor can access more data',
            'To avoid any audits',
          ],
          answer: 'So expectations are clear and penalties apply if the agreement is breached',
          explanation: 'Contractual requirements set expectations for both parties and penalties for breaches.',
          lesson: 'Third-party risk assessment',
          source: tx('Third-party Risk Assessment'),
        },
        {
          q: 'A contract clause that allows you to regularly audit a vendor’s security is called a right to ___.',
          type: FILL,
          answer: 'audit',
          explanation: 'The right-to-audit clause ensures regular audits of the vendor’s security controls.',
          lesson: 'Third-party risk assessment',
          source: tx('Third-party Risk Assessment'),
        },
        {
          q: 'Which situations are conflicts of interest with a prospective vendor? Select all that apply.',
          type: MULTI,
          options: [
            'The vendor also works for your largest competitor',
            'The vendor employs a relative of one of your executives',
            'The vendor offers gifts if the contract is signed',
            'The vendor has a published security policy',
          ],
          answer: ['The vendor also works for your largest competitor', 'The vendor employs a relative of one of your executives', 'The vendor offers gifts if the contract is signed'],
          explanation: 'Each of these could compromise judgment in the business relationship.',
          lesson: 'Third-party risk assessment',
          source: tx('Third-party Risk Assessment'),
        },
        {
          q: 'Investigating and verifying a company’s claims before doing business with it is called:',
          options: ['Due diligence', 'Due care', 'Attestation', 'Geofencing'],
          answer: 'Due diligence',
          explanation: 'Due diligence verifies information (finances, customers, background checks) before signing.',
          lesson: 'Third-party risk assessment',
          source: tx('Third-party Risk Assessment'),
        },
        {
          q: 'Vendor monitoring ends once the contract is signed.',
          type: TF,
          answer: 'False',
          explanation: 'Monitoring continues with financial health checks, security reviews, news monitoring and questionnaires.',
          lesson: 'Third-party risk assessment',
          source: tx('Third-party Risk Assessment'),
        },
        {
          q: 'Which US law ensures the privacy of individuals’ medical information?',
          options: ['HIPAA', 'SOX', 'GLBA', 'GDPR'],
          answer: 'HIPAA',
          explanation: 'HIPAA, the Health Insurance Portability and Accountability Act, protects medical information privacy.',
          lesson: 'Compliance',
          source: tx('Compliance'),
        },
        {
          q: 'Which are possible consequences of non-compliance? Select all that apply.',
          type: MULTI,
          options: ['Fines and sanctions', 'Loss of a required license', 'Reputational damage', 'Automatic tax refunds'],
          answer: ['Fines and sanctions', 'Loss of a required license', 'Reputational damage'],
          explanation: 'Non-compliance can bring fines, sanctions, loss of license, contractual breaches and reputational harm.',
          lesson: 'Compliance',
          source: tx('Compliance'),
        },
        {
          q: 'In compliance terms, activities an organization performs internally are referred to as:',
          options: ['Due care', 'Due diligence', 'Attestation', 'Exemption'],
          answer: 'Due care',
          explanation: 'Due care refers to internal activities; due diligence to activities with third parties.',
          lesson: 'Compliance',
          source: tx('Compliance'),
        },
        {
          q: 'Who usually starts and stops internal audits?',
          options: ['The audit committee', 'The help desk', 'The firewall administrator only', 'External customers'],
          answer: 'The audit committee',
          explanation: 'The audit committee is responsible for risk management and for initiating internal audits.',
          lesson: 'Audits and assessments',
          source: tx('Audits and Assessments'),
        },
        {
          q: 'Some compliance regulations require that an audit be performed by a third party.',
          type: TF,
          answer: 'True',
          explanation: 'In that case an external group performs the audit, with type and frequency set by the regulation.',
          lesson: 'Audits and assessments',
          source: tx('Audits and Assessments'),
        },
        {
          q: 'A user keeps typing the wrong domain name. In anomalous behavior recognition, this is categorized as:',
          options: ['Unintentional behavior', 'Risky behavior', 'Unexpected behavior', 'Malicious insider behavior'],
          answer: 'Unintentional behavior',
          explanation: 'Human errors such as typos, misplaced USB drives or misconfigurations are unintentional.',
          lesson: 'Security awareness',
          source: tx('Security Awareness'),
        },
        {
          q: 'Which metrics might a security awareness team track? Select all that apply.',
          type: MULTI,
          options: ['Phishing click rates', 'Password manager adoption', 'MFA use', 'Office temperature'],
          answer: ['Phishing click rates', 'Password manager adoption', 'MFA use'],
          explanation: 'These metrics show whether awareness efforts improve security over time.',
          lesson: 'Security awareness',
          source: tx('Security Awareness'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-161 Rev. 1: Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations',
          authors: 'Jon Boyens et al.',
          publisher: 'NIST',
          year: 2022,
          url: 'https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final',
          kind: 'STANDARD',
          note: 'How to manage cybersecurity risk across suppliers and the supply chain.',
        },
        {
          title: 'Advanced Persistent Threat Compromise of Government Agencies, Critical Infrastructure, and Private Sector Organizations (AA20-352A)',
          authors: 'Cybersecurity and Infrastructure Security Agency',
          publisher: 'CISA',
          year: 2020,
          url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a',
          kind: 'REPORT',
          note: 'CISA’s advisory on the SolarWinds supply-chain compromise discussed in this module.',
        },
        {
          title: 'NIST SP 800-37 Rev. 2: Risk Management Framework for Information Systems and Organizations',
          authors: 'Joint Task Force',
          publisher: 'NIST',
          year: 2018,
          url: 'https://csrc.nist.gov/pubs/sp/800/37/r2/final',
          kind: 'STANDARD',
          note: 'The lifecycle approach to authorizing and continuously monitoring systems, including privacy.',
        },
      ],
    },
  ],
};

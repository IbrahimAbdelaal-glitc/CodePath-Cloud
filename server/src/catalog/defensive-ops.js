// Course 3 (Intermediate): Defensive Security Operations.
// Concept videos: Professor Messer, CompTIA Security+ SY0-701 Training Course (playlist PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv).
//   Questions are grounded in the transcripts published on professormesser.com; checkpoints sit late in each video.
// Hands-on videos: TCM Security, "Security Operations (SOC) 101 Course" (video 56NDgBOSpUg, in TCM's
//   "Full-Length Hacking Courses" playlist PLLKT__MCUeixqHJ1TRqrHsEd6_EdEvo47), cut at its own chapter markers.
//   No transcript was available, so those questions rely on the chapter titles plus the cited standards (RFCs, tool
//   documentation) and are flagged for instructor review.
import { MULTI, TF, FILL, youtube } from './helpers.js';

const MESSER = 'Professor Messer, CompTIA Security+ SY0-701 Training Course (free on YouTube).';
const TCM = 'TCM Security, Security Operations (SOC) 101 Course (free on YouTube).';
const SOC = '56NDgBOSpUg';
const messer = (id, duration) => youtube(id, { duration, credit: MESSER });
const soc = (start, end) => youtube(SOC, { start, end, credit: TCM });
const tx = (title) => `Professor Messer transcript, "${title}"`;
const socSrc = (chapter, std) =>
  `TCM SOC 101 chapter "${chapter}"${std ? `; facts from ${std}` : ''}. Confirm against the video.`;

export default {
  key: 'defensive-ops',
  // v2: 80% pass marks on in-video questions and block quizzes
  version: 2,
  topics: {
    'def-threats': 'Threats and indicators',
    'def-hardening': 'Hardening and network defense',
    'def-monitoring': 'Security monitoring and the SOC',
    'def-analysis': 'Phishing and traffic analysis',
    'def-vulns': 'Vulnerability management',
    'def-ir': 'Incident response and forensics',
  },
  roadmap: {
    slug: 'defensive-security-operations',
    title: 'Defensive Security Operations',
    summary: 'Threats, hardening, monitoring, phishing and traffic analysis, vulnerability management and incident response.',
    description:
      'Think like a blue team. This course covers who attacks organizations and how, the indicators that reveal a compromise, how systems and networks are hardened, how a security operations center (SOC) monitors with logs, SIEMs and security tools, how analysts investigate phishing emails and network traffic with Wireshark and Snort, how vulnerabilities are found, prioritized and fixed, and how incidents are handled from preparation to forensics.',
    category: 'Cybersecurity',
    difficulty: 'INTERMEDIATE',
    prerequisites: ['Cybersecurity Foundations', 'Networking & Linux Foundations (ports, protocols, Linux basics)'],
    learningOutcomes: [
      'Characterize threat actors and threat vectors, and recognize common indicators of compromise',
      'Apply secure baselines and hardening, and choose between firewall types, IPS designs and endpoint protections such as EDR and XDR',
      'Explain how a SOC uses SIEMs, logs, SNMP, NetFlow and vulnerability scanners to monitor an organization',
      'Analyze phishing emails using headers and SPF, DKIM and DMARC, and examine traffic with tcpdump, Wireshark and Snort rules',
      'Prioritize vulnerabilities with CVSS and context, plan remediation and compensating controls, and follow the incident response lifecycle and forensic best practices',
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
      {
        title: 'Security Operations (SOC) 101 Course',
        author: 'TCM Security',
        url: 'https://www.youtube.com/watch?v=56NDgBOSpUg',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
    ],
    order: 12,
    isFeatured: true,
  },
  modules: [
    // ── Module 1 ────────────────────────────────────────────────────
    {
      key: 'threats',
      title: 'The Threat Landscape',
      description: 'Threat actors and their motives, threat vectors, malware, and indicators of compromise.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'actors',
          title: 'Threat actors',
          summary: 'Nation states, unskilled attackers, hacktivists, insiders, organized crime and shadow IT.',
          video: messer('6xUH0t6ugIM', 623),
          content: `## What this lesson covers

Threat actors are described by attributes: **internal or external**, **resources and funding**, **sophistication**, and **motivation** (data exfiltration, espionage, disruption, financial gain, philosophy or politics, revenge, war).

| Actor | Typically | Notes |
| --- | --- | --- |
| Nation state | External, extensive resources, very sophisticated | Advanced persistent threats (APTs); Stuxnet |
| Unskilled attacker | External, few resources | Runs scripts they do not understand |
| Hacktivist | External | Political or philosophical aims: defacement, DoS, leaks |
| Insider threat | Internal | Knows where data is and how to bypass controls |
| Organized crime | External, well funded | Motivated by money; ransomware businesses |
| Shadow IT | Internal | Departments bypassing IT rules and change control |`,
          takeaways: ['Knowing who is attacking helps you understand why, and how to defend.', 'Organized crime is motivated by money; hacktivists by causes.'],
          checkpoints: [
            {
              at: 580,
              q: 'A department buys its own cloud services with a company credit card, bypassing IT’s change control and security reviews. Which threat actor category is this?',
              options: ['Shadow IT', 'Nation state', 'Hacktivist', 'Organized crime'],
              answer: 'Shadow IT',
              explanation: 'Shadow IT is an internal group working around IT policies, often without considering backups, change control or security.',
              topic: 'def-threats',
              source: tx('Threat Actors'),
            },
          ],
        },
        {
          key: 'vectors',
          title: 'Common threat vectors',
          summary: 'Messages, images, files, voice, removable media, vulnerable software, networks, default credentials and the supply chain.',
          video: messer('4lAbGpTDZ18', 1034),
          content: `## What this lesson covers

A **threat vector** (attack vector) is the method an attacker uses to gain access:

- **Messages:** email, SMS and instant messages carrying phishing links or malware.
- **Images and files:** SVG images can embed scripts; PDFs, archives, Office macros and browser extensions can carry malware.
- **Voice:** vishing, spam over IP, war dialing.
- **Removable media:** USB drives dropped in a parking lot, or USB devices that act as keyboards; they bypass air gaps.
- **Vulnerable and unsupported software**, open service ports, misconfigurations, and **default credentials** (admin/admin).
- **Unsecure networks:** weak wireless (upgrade to WPA3), rogue access points, Bluetooth; 802.1X authenticates network access.
- **Supply chain:** managed service providers, contractors (the 2013 Target breach came through an HVAC contractor), counterfeit hardware.`,
          takeaways: ['Every open port and installed service adds to the attack surface.', 'Supply-chain partners can become your attackers’ way in.'],
          checkpoints: [
            {
              at: 980,
              q: 'In the 2013 Target breach described in the video, how did the attackers first get in?',
              options: [
                'Through systems controlled by an HVAC contractor (a supply-chain vector)',
                'Through a USB drive left in the parking lot',
                'By guessing a default router password',
                'Through an SVG image on the website',
              ],
              answer: 'Through systems controlled by an HVAC contractor (a supply-chain vector)',
              explanation: 'The attackers gained access via an HVAC contractor’s systems, then moved into Target’s network and its point-of-sale systems.',
              topic: 'def-threats',
              source: tx('Common Threat Vectors'),
            },
          ],
        },
        {
          key: 'malware',
          title: 'An overview of malware',
          summary: 'Malware types, ransomware and the two most important defenses.',
          video: messer('-eZs8wjjGGE', 366),
          content: `## What this lesson covers

- Malware includes viruses, worms, ransomware, Trojan horses, rootkits, keyloggers, spyware, bloatware and logic bombs. They often work together: a worm exploits a vulnerability, installs a backdoor, and the attacker installs more.
- Infection paths: clicking an email attachment or link, pop-ups, and **drive-by downloads**.
- **Ransomware** encrypts your data (the OS keeps working so you can read the ransom note) and demands payment for the key.
- Best defenses: **keep systems and apps updated**, keep anti-malware signatures current, and keep **offline backups** that ransomware cannot reach.`,
          takeaways: ['Offline backups let you recover from ransomware without paying.', 'Patching closes the vulnerabilities malware uses to install itself.'],
          checkpoints: [
            {
              at: 340,
              q: 'Why should backups be stored offline?',
              options: [
                'So ransomware on an infected system cannot find and encrypt the backups too',
                'Offline storage is faster',
                'Online backups cannot be restored',
                'Antivirus cannot scan online backups',
              ],
              answer: 'So ransomware on an infected system cannot find and encrypt the backups too',
              explanation: 'If backups are reachable, ransomware may encrypt them as well. Offline backups let you wipe and restore a known-good copy.',
              topic: 'def-threats',
              source: tx('An Overview of Malware'),
            },
          ],
        },
        {
          key: 'ioc',
          title: 'Indicators of compromise',
          summary: 'Evidence that a system has been breached.',
          video: messer('x72hG9GvkaQ', 658),
          content: `## What this lesson covers

An **indicator of compromise (IOC)** is evidence that gives you high confidence a breach has occurred:

- **Account lockouts** you did not cause (possibly to set up a help-desk impersonation).
- **Concurrent session usage** and **impossible travel** (logins from Omaha and Australia minutes apart).
- **Blocked content:** malware disabling updates and security sites.
- **Resource consumption:** unusual traffic spikes, for example at 3 a.m.
- **Resource inaccessibility:** crashed servers, encrypted files.
- **Out-of-cycle logging** and **missing logs** (attackers delete logs).
- **Published or documented data:** your private data appearing online.`,
          takeaways: ['Impossible travel between logins is a strong IOC.', 'Missing logs can themselves be an indicator.'],
          checkpoints: [
            {
              at: 470,
              q: 'A user logs in from Omaha and, five minutes later, from Australia. What is this indicator called?',
              options: ['Impossible travel', 'Out-of-cycle logging', 'Resource inaccessibility', 'Blocked content'],
              answer: 'Impossible travel',
              explanation: 'Two logins too far apart to be physically possible in the time between them should raise an alert.',
              topic: 'def-threats',
              source: tx('Indicators of Compromise'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which threat actor typically has the most resources and sophistication, and is often behind advanced persistent threats (APTs)?',
          options: ['Nation state', 'Unskilled attacker', 'Shadow IT', 'Hacktivist'],
          answer: 'Nation state',
          explanation: 'Governments can fund sophisticated developers and constant attacks; these are often called APTs.',
          lesson: 'Threat actors',
          source: tx('Threat Actors'),
        },
        {
          q: 'What primarily motivates organized crime groups?',
          options: ['Money', 'Political protest', 'Curiosity', 'Revenge on a former employer'],
          answer: 'Money',
          explanation: 'Organized crime runs attacks as a business, often with a corporate structure, and is motivated by profit.',
          lesson: 'Threat actors',
          source: tx('Threat Actors'),
        },
        {
          q: 'Which threat actors are commonly internal to the organization? Select all that apply.',
          type: MULTI,
          options: ['Insider threat', 'Shadow IT', 'Nation state', 'Organized crime'],
          answer: ['Insider threat', 'Shadow IT'],
          explanation: 'Insiders and shadow IT operate from inside; nation states, unskilled attackers, hacktivists and organized crime tend to be external.',
          lesson: 'Threat actors',
          source: tx('Threat Actors'),
        },
        {
          q: 'An attacker who runs downloaded scripts without understanding them, and cannot adapt when they fail, is called an ___ attacker.',
          type: FILL,
          answer: 'unskilled',
          explanation: 'Unskilled attackers have limited resources and sophistication and rely on readily available scripts.',
          lesson: 'Threat actors',
          source: tx('Threat Actors'),
        },
        {
          q: 'Why can an SVG image be a threat vector?',
          options: [
            'It is XML that can embed scripts or HTML that run in the browser',
            'It is always an executable file',
            'It disables the firewall',
            'It cannot be scanned by antivirus',
          ],
          answer: 'It is XML that can embed scripts or HTML that run in the browser',
          explanation: 'Scalable Vector Graphics are XML descriptions; attackers can embed JavaScript, for example a cross-site scripting payload.',
          lesson: 'Common threat vectors',
          source: tx('Common Threat Vectors'),
        },
        {
          q: 'An air-gapped network has no network connection to the outside. Which threat vector can still reach it?',
          options: ['A USB drive carried inside', 'A phishing website', 'A DNS attack from the internet', 'A remote port scan'],
          answer: 'A USB drive carried inside',
          explanation: 'Removable media bypasses the air gap; it can carry malware in or data out, and some act as keyboards.',
          lesson: 'Common threat vectors',
          source: tx('Common Threat Vectors'),
        },
        {
          q: 'Leaving a router’s username and password as admin/admin is an example of which threat vector?',
          options: ['Default credentials', 'Supply chain', 'Vishing', 'Watering hole'],
          answer: 'Default credentials',
          explanation: 'Default credentials are published for thousands of devices; always change them.',
          lesson: 'Common threat vectors',
          source: tx('Common Threat Vectors'),
        },
        {
          q: 'Unsupported operating systems are a risk mainly because:',
          options: ['The manufacturer no longer provides security patches', 'They run slower', 'They cannot connect to networks', 'They block antivirus'],
          answer: 'The manufacturer no longer provides security patches',
          explanation: 'Without patches, known vulnerabilities stay open; keep an inventory so you can find such systems.',
          lesson: 'Common threat vectors',
          source: tx('Common Threat Vectors'),
        },
        {
          q: 'During a ransomware infection, the operating system usually keeps working normally. Why?',
          options: [
            'The attacker wants you to see the ransom message',
            'Ransomware cannot affect operating systems',
            'The antivirus protects the OS',
            'The OS is always backed up automatically',
          ],
          answer: 'The attacker wants you to see the ransom message',
          explanation: 'Ransomware encrypts personal data but leaves the OS running so the victim can read the payment demand.',
          lesson: 'An overview of malware',
          source: tx('An Overview of Malware'),
        },
        {
          q: 'Which are the two fundamental best practices against malware named in the video? Select all that apply.',
          type: MULTI,
          options: ['Keep a good (offline) backup', 'Keep the OS and applications up to date', 'Disable the firewall', 'Pay the ransom quickly'],
          answer: ['Keep a good (offline) backup', 'Keep the OS and applications up to date'],
          explanation: 'Backups let you recover; updates close the vulnerabilities malware exploits.',
          lesson: 'An overview of malware',
          source: tx('An Overview of Malware'),
        },
        {
          q: 'Malware that installs itself just by visiting a site, without you clicking anything, is called a drive-by ___.',
          type: FILL,
          answer: 'download',
          accepted: ['downloads'],
          explanation: 'Drive-by downloads install malware automatically when a malicious site is visited.',
          lesson: 'An overview of malware',
          source: tx('An Overview of Malware'),
        },
        {
          q: 'Why might an attacker deliberately get a user’s account locked out?',
          options: [
            'To call the help desk pretending to be the user and get the password reset',
            'To free up disk space',
            'To speed up the network',
            'To install updates',
          ],
          answer: 'To call the help desk pretending to be the user and get the password reset',
          explanation: 'Strong password-reset procedures guard against this impersonation tactic.',
          lesson: 'Indicators of compromise',
          source: tx('Indicators of Compromise'),
        },
        {
          q: 'Logs that should exist for a time period are missing. This can itself be an indicator of compromise.',
          type: TF,
          answer: 'True',
          explanation: 'Attackers often delete logs to hide their activity, so alert when expected log data is missing.',
          lesson: 'Indicators of compromise',
          source: tx('Indicators of Compromise'),
        },
        {
          q: 'Which of these are indicators of compromise? Select all that apply.',
          type: MULTI,
          options: [
            'A large outbound data transfer at 3 a.m.',
            'Security updates suddenly fail to download',
            'Patches installed outside the scheduled change window',
            'A user changing their own password after the scheduled reminder',
          ],
          answer: ['A large outbound data transfer at 3 a.m.', 'Security updates suddenly fail to download', 'Patches installed outside the scheduled change window'],
          explanation: 'Resource consumption, blocked content and out-of-cycle logging are IOCs; a planned password change is normal.',
          lesson: 'Indicators of compromise',
          source: tx('Indicators of Compromise'),
        },
      ],
      readings: [
        {
          title: '2026 Data Breach Investigations Report (DBIR)',
          authors: 'Verizon',
          publisher: 'Verizon Business',
          year: 2026,
          url: 'https://www.verizon.com/business/resources/reports/dbir/',
          kind: 'REPORT',
          note: 'Annual data on how breaches actually happen: actors, vectors and patterns.',
        },
        {
          title: 'National Cyber Power Index 2022',
          authors: 'Julia Voo, Irfan Hemani, Daniel Cassidy',
          publisher: 'Belfer Center for Science and International Affairs, Harvard Kennedy School',
          year: 2022,
          url: 'https://www.belfercenter.org/publication/national-cyber-power-index-2022',
          kind: 'REPORT',
          note: 'Harvard Kennedy School research comparing countries’ cyber capabilities and intent, context for nation-state threat actors.',
        },
        {
          title: 'Intelligence-Driven Computer Network Defense Informed by Analysis of Adversary Campaigns and Intrusion Kill Chains',
          authors: 'Eric M. Hutchins, Michael J. Cloppert, Rohan M. Amin',
          publisher: 'Lockheed Martin',
          year: 2011,
          url: 'https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/cyber/LM-White-Paper-Intel-Driven-Defense.pdf',
          kind: 'PAPER',
          note: 'The paper that introduced the cyber "kill chain" for analyzing intrusions.',
        },
        {
          title: 'The Pyramid of Pain',
          authors: 'David J. Bianco',
          publisher: 'Enterprise Detection & Response (blog)',
          year: 2013,
          url: 'https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html',
          kind: 'ARTICLE',
          note: 'Why some indicators of compromise (hashes, IPs) are trivial for attackers to change and others (TTPs) are not.',
        },
      ],
    },

    // ── Module 2 ────────────────────────────────────────────────────
    {
      key: 'hardening',
      title: 'Hardening and Network Defense',
      description: 'Secure baselines, hardening targets, firewall types, intrusion prevention and endpoint security.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'baselines',
          title: 'Secure baselines',
          summary: 'Establishing, deploying and maintaining security settings.',
          video: messer('BWPJD9Eb9iE', 251),
          content: `## What this lesson covers

- A **security baseline** is the set of security settings (firewall, patch level, OS and application settings) every application instance must have.
- **Establish** it from manufacturer guidance, for example Microsoft's **Security Compliance Toolkit (SCT)**; Windows has thousands of Group Policy settings.
- **Deploy** with central tools (Group Policy, MDM) and automation.
- **Maintain** it: update for new vulnerabilities and versions, resolve conflicting vendor guidance, test before deploying and **audit** afterwards.`,
          takeaways: ['Baselines must be established, deployed and maintained.', 'Audit regularly to confirm baselines are still in place.'],
          checkpoints: [
            {
              at: 235,
              q: 'After deploying a security baseline, what should you keep doing?',
              options: ['Audit systems to confirm the baseline is still in effect and update it as needs change', 'Nothing; baselines never change', 'Remove it after a month', 'Disable automatic updates'],
              answer: 'Audit systems to confirm the baseline is still in effect and update it as needs change',
              explanation: 'New vulnerabilities, application updates or new operating systems require baseline changes, and audits confirm compliance.',
              topic: 'def-hardening',
              source: tx('Secure Baselines'),
            },
          ],
        },
        {
          key: 'targets',
          title: 'Hardening targets',
          summary: 'Mobile devices, workstations, network devices, cloud, servers, ICS/SCADA, embedded systems, RTOS and IoT.',
          video: messer('YQKbs0ug0XQ', 610),
          content: `## What this lesson covers

Default configurations are rarely secure. Use manufacturers' **hardening guides**, then:

- **Mobile devices:** patch, segment company and personal data, manage with an **MDM**.
- **Workstations:** monthly patches; remove unused software.
- **Network devices:** change default credentials; patches are rare, so apply them promptly.
- **Cloud:** secure the management workstation, **least privilege**, **EDR**, backups to a separate provider.
- **Servers:** patch, strong passwords, least privilege, disable unused accounts, limit who can connect.
- **SCADA/ICS:** often isolated by an **air gap**.
- **Embedded systems, RTOS and IoT:** patch quickly when possible and **segment them onto their own network**.`,
          takeaways: ['Remove software you do not use; every program is a potential vulnerability.', 'Segment IoT and embedded devices.'],
          checkpoints: [
            {
              at: 580,
              q: 'Why segment IoT devices onto their own network?',
              options: [
                'If one is compromised, the attacker is limited to that segment',
                'IoT devices run faster on separate networks',
                'It removes the need to patch them',
                'IoT devices cannot use IP addresses',
              ],
              answer: 'If one is compromised, the attacker is limited to that segment',
              explanation: 'IoT makers are often not security experts; segmentation limits the scope of any exploit.',
              topic: 'def-hardening',
              source: tx('Hardening Targets'),
            },
          ],
        },
        {
          key: 'firewalls',
          title: 'Firewall types',
          summary: 'Network firewalls, UTMs, next-generation firewalls and web application firewalls.',
          video: messer('mq1HRM-zGtQ', 480),
          content: `## What this lesson covers

- **Traditional network firewalls** filter on layer 4 (TCP/UDP ports) and often also provide VPN, routing and NAT.
- **UTM (unified threat management)** all-in-one devices bundle URL filtering, spam filtering, IDS/IPS, VPN and QoS, but often only see ports and slow down as features are enabled.
- **Next-generation firewalls (NGFW)** work at **layer 7**, identifying applications regardless of port, and often include IPS and URL categories.
- **Web application firewalls (WAF)** inspect input to web applications and block attacks such as **SQL injection**; PCI DSS emphasizes them for card-processing apps.`,
          takeaways: ['NGFWs decide by application, not just port.', 'A WAF protects web applications from attacks like SQL injection.'],
          checkpoints: [
            {
              at: 440,
              q: 'Which firewall is designed to inspect input to web applications and block attacks such as SQL injection?',
              options: ['Web application firewall (WAF)', 'Traditional layer 4 firewall', 'UTM spam filter', 'Host-based firewall only'],
              answer: 'Web application firewall (WAF)',
              explanation: 'A WAF analyzes HTTP/HTTPS input to web apps; its logs show blocked SQL injection and XSS attempts.',
              topic: 'def-hardening',
              source: tx('Firewall Types'),
            },
          ],
        },
        {
          key: 'ips',
          title: 'Intrusion prevention',
          summary: 'IDS versus IPS, fail-open versus fail-closed, and active versus passive monitoring.',
          video: messer('7QuYupuic3Q', 313),
          content: `## What this lesson covers

- An **IPS** watches traffic in real time and blocks exploits; an **IDS** can only alert.
- **Fail-open:** if the device fails, traffic keeps flowing (no security). **Fail-closed:** if it fails, traffic stops.
- **Active (inline) monitoring** sits in the traffic path and can block immediately.
- **Passive monitoring** receives a copy of traffic via a **port mirror (SPAN)** or **tap**; it cannot cause downtime but also cannot block in real time, an "IDS design".`,
          takeaways: ['An inline IPS can block; a passive one can only alert.', 'Fail-open keeps the network up; fail-closed keeps it secure.'],
          checkpoints: [
            {
              at: 290,
              q: 'An IPS receives a copy of traffic from a switch’s SPAN port. What can it NOT do?',
              options: ['Block malicious traffic in real time', 'Alert on malicious traffic', 'Identify known exploits', 'Log attack attempts'],
              answer: 'Block malicious traffic in real time',
              explanation: 'With passive monitoring the original traffic still reaches its destination; the IPS only sees a copy, so it can alert but not block.',
              topic: 'def-hardening',
              source: tx('Intrusion Prevention'),
            },
          ],
        },
        {
          key: 'endpoint',
          title: 'Endpoint security',
          summary: 'Defense in depth, posture assessment, NAC agents, EDR and XDR.',
          video: messer('83pCkSSj1IQ', 564),
          content: `## What this lesson covers

- **Defense in depth:** layered security across every platform, from the edge firewall to the endpoint.
- **Access control** limits who can reach which data, by user, group, location and application.
- **Posture assessment** checks a device when it connects: trusted certificate, antivirus running and updated, apps current, disk encryption. Agents can be **persistent**, **dissolvable** or **agentless** (integrated with Active Directory). Failing devices can be **quarantined** on a separate VLAN.
- **EDR** adds behavioral analysis, process monitoring, **root-cause analysis** and automated response (isolate, quarantine, roll back).
- **XDR** correlates data across many systems and sources, including user-behavior analytics, to reduce false positives and speed investigations.`,
          takeaways: ['Posture assessment keeps non-compliant devices off production networks.', 'EDR goes beyond signatures with behavior and root-cause analysis.'],
          checkpoints: [
            {
              at: 530,
              q: 'What does XDR add compared with EDR on a single endpoint?',
              options: [
                'It correlates data from many systems and sources across the organization',
                'It replaces the need for any endpoint agent',
                'It only uses antivirus signatures',
                'It disables posture assessment',
              ],
              answer: 'It correlates data from many systems and sources across the organization',
              explanation: 'Extended detection and response combines endpoint, network and user-behavior data to catch missed detections and reduce false positives.',
              topic: 'def-hardening',
              source: tx('Endpoint Security'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Microsoft’s tool for applying its recommended security baselines to Windows is called the Security Compliance ___.',
          type: FILL,
          answer: 'Toolkit',
          accepted: ['toolkit', 'Toolkit (SCT)', 'SCT'],
          explanation: 'The Security Compliance Toolkit (SCT) includes Microsoft’s baselines and deployment tools.',
          lesson: 'Secure baselines',
          source: tx('Secure Baselines'),
        },
        {
          q: 'Which steps belong to managing secure baselines? Select all that apply.',
          type: MULTI,
          options: ['Establish the baseline', 'Deploy it (for example via Group Policy or MDM)', 'Maintain and audit it', 'Delete it after deployment'],
          answer: ['Establish the baseline', 'Deploy it (for example via Group Policy or MDM)', 'Maintain and audit it'],
          explanation: 'Baselines are created, deployed with automation, and kept current and audited.',
          lesson: 'Secure baselines',
          source: tx('Secure Baselines'),
        },
        {
          q: 'Which device type is commonly isolated from the rest of the organization by an air gap?',
          options: ['SCADA/industrial control systems', 'Employee laptops', 'Public web servers', 'Guest Wi-Fi clients'],
          answer: 'SCADA/industrial control systems',
          explanation: 'SCADA/ICS systems that control industrial equipment are often on isolated, air-gapped networks with no internet access.',
          lesson: 'Hardening targets',
          source: tx('Hardening Targets'),
        },
        {
          q: 'Patches for routers, switches and other purpose-built appliances are released often, so they can usually wait.',
          type: TF,
          answer: 'False',
          explanation: 'These patches are relatively rare, so a security release is an important event to evaluate and deploy.',
          lesson: 'Hardening targets',
          source: tx('Hardening Targets'),
        },
        {
          q: 'Which practices harden servers? Select all that apply.',
          type: MULTI,
          options: ['Apply OS security patches', 'Enforce minimum password length and complexity', 'Disable unused accounts', 'Grant every account administrator rights'],
          answer: ['Apply OS security patches', 'Enforce minimum password length and complexity', 'Disable unused accounts'],
          explanation: 'Servers should be patched, use strong passwords and least privilege, and have unused accounts disabled.',
          lesson: 'Hardening targets',
          source: tx('Hardening Targets'),
        },
        {
          q: 'At which OSI layer do next-generation firewalls make decisions?',
          options: ['Layer 7 (application)', 'Layer 4 (transport) only', 'Layer 2 (data link)', 'Layer 1 (physical)'],
          answer: 'Layer 7 (application)',
          explanation: 'NGFWs decode traffic and identify applications, so they do not rely on port numbers alone.',
          lesson: 'Firewall types',
          source: tx('Firewall Types'),
        },
        {
          q: 'What is a common drawback of UTM all-in-one security appliances?',
          options: [
            'Enabling many features can slow the device, and many only inspect layer 4',
            'They cannot filter spam',
            'They cannot act as a VPN endpoint',
            'They only work on wireless networks',
          ],
          answer: 'Enabling many features can slow the device, and many only inspect layer 4',
          explanation: 'UTMs bundle many services, which can hurt performance, and many make decisions on port numbers only.',
          lesson: 'Firewall types',
          source: tx('Firewall Types'),
        },
        {
          q: 'An NGFW lets employees view a social site but not post to it, even though both use the same port. How?',
          options: [
            'It identifies the application and its functions at layer 7',
            'It blocks port 443',
            'It uses a different VLAN for posting',
            'It requires a UTM in front of it',
          ],
          answer: 'It identifies the application and its functions at layer 7',
          explanation: 'Because NGFWs inspect the application layer, they can control specific application behaviors independently of ports.',
          lesson: 'Firewall types',
          source: tx('Firewall Types'),
        },
        {
          q: 'An inline security device crashes and all traffic through it stops. How was it configured?',
          options: ['Fail-closed', 'Fail-open', 'Passive monitoring', 'Port mirroring'],
          answer: 'Fail-closed',
          explanation: 'Fail-closed severs the connection when the device fails; fail-open lets traffic continue without inspection.',
          lesson: 'Intrusion prevention',
          source: tx('Intrusion Prevention'),
        },
        {
          q: 'Why might an organization choose passive rather than inline (active) IPS monitoring?',
          options: [
            'It cannot cause network downtime or block legitimate traffic by mistake',
            'It blocks attacks faster',
            'It requires no copy of traffic',
            'It encrypts traffic',
          ],
          answer: 'It cannot cause network downtime or block legitimate traffic by mistake',
          explanation: 'Passive monitoring sits outside the traffic path, so an outage or aggressive rules do not affect users, but it can only alert.',
          lesson: 'Intrusion prevention',
          source: tx('Intrusion Prevention'),
        },
        {
          q: 'A posture-assessment agent that runs at login, performs its checks and then removes itself is a ___ agent.',
          type: FILL,
          answer: 'dissolvable',
          explanation: 'Dissolvable agents need no formal installation and terminate after checking; persistent agents stay installed.',
          lesson: 'Endpoint security',
          source: tx('Endpoint Security'),
        },
        {
          q: 'A laptop fails its posture assessment because antivirus signatures are out of date. What is a common response?',
          options: [
            'Quarantine it on a separate VLAN with instructions to fix it, then reassess',
            'Give it full network access anyway',
            'Delete the user’s account',
            'Disable the firewall',
          ],
          answer: 'Quarantine it on a separate VLAN with instructions to fix it, then reassess',
          explanation: 'Non-compliant devices are limited until they are brought back into compliance and pass the check again.',
          lesson: 'Endpoint security',
          source: tx('Endpoint Security'),
        },
        {
          q: 'Which capabilities does EDR provide beyond traditional signature-based antivirus? Select all that apply.',
          type: MULTI,
          options: ['Behavioral analysis', 'Root-cause analysis', 'Automated isolation and rollback', 'Physical door locks'],
          answer: ['Behavioral analysis', 'Root-cause analysis', 'Automated isolation and rollback'],
          explanation: 'EDR monitors behavior and processes, determines how malware arrived, and can automatically isolate, quarantine and roll back.',
          lesson: 'Endpoint security',
          source: tx('Endpoint Security'),
        },
      ],
      readings: [
        {
          title: 'CIS Critical Security Controls Version 8.1',
          authors: 'Center for Internet Security',
          publisher: 'CIS',
          year: 2024,
          url: 'https://www.cisecurity.org/controls/v8-1',
          kind: 'STANDARD',
          note: 'Prioritized safeguards including secure configuration, the practical form of secure baselines.',
        },
        {
          title: 'NIST SP 800-41 Rev. 1: Guidelines on Firewalls and Firewall Policy',
          authors: 'Karen Scarfone, Paul Hoffman',
          publisher: 'NIST',
          year: 2009,
          url: 'https://csrc.nist.gov/pubs/sp/800/41/r1/final',
          kind: 'STANDARD',
          note: 'Firewall technologies and how to plan a firewall policy.',
        },
        {
          title: 'Snort: Lightweight Intrusion Detection for Networks',
          authors: 'Martin Roesch',
          publisher: 'USENIX LISA ’99',
          year: 1999,
          url: 'https://www.usenix.org/legacy/publications/library/proceedings/lisa99/full_papers/roesch/roesch.pdf',
          kind: 'PAPER',
          note: 'The original paper describing Snort, the open-source IDS/IPS used later in this course.',
        },
      ],
    },

    // ── Module 3 ────────────────────────────────────────────────────
    {
      key: 'monitoring',
      title: 'Security Monitoring and the SOC',
      description: 'The role and structure of a security operations center, monitoring, SIEMs, security tools and log data.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'soc-role',
          title: 'The SOC and its role',
          summary: 'What a security operations center does.',
          video: soc(4026, 5146),
          content: `## What this lesson covers

A **security operations center (SOC)** is the team, processes and technology that continuously **monitor, detect, analyze and respond** to security events for an organization.

Typical SOC responsibilities:
- Monitoring alerts from SIEMs, EDR, IDS/IPS and email security tools
- Triaging and investigating alerts to separate true incidents from false positives
- Escalating and coordinating incident response
- Threat hunting and improving detections over time

> **Instructor review:** this lesson is a clip of TCM's SOC 101 course ("The SOC and Its Role" chapter). The summary above describes the SOC function in general terms; confirm the questions match the video.`,
          takeaways: ['A SOC monitors, detects, analyzes and responds around the clock.', 'Triage separates real incidents from false positives.'],
          checkpoints: [
            {
              at: 1080,
              q: 'What is the core function of a security operations center (SOC)?',
              options: [
                'Continuously monitor, detect, analyze and respond to security events',
                'Develop the company’s product features',
                'Manage employee payroll',
                'Design office networks only',
              ],
              answer: 'Continuously monitor, detect, analyze and respond to security events',
              explanation: 'A SOC is the operational security team that watches for and responds to threats.',
              topic: 'def-monitoring',
              review: true,
              source: socSrc('The SOC and Its Role'),
            },
          ],
        },
        {
          key: 'soc-models',
          title: 'SOC models, roles and organizational structures',
          summary: 'In-house, outsourced and hybrid SOCs, and analyst tiers.',
          video: soc(6520, 7209),
          content: `## What this lesson covers

- **SOC models:** in-house (internal), outsourced (for example an MSSP or managed detection and response provider), and hybrid.
- **Analyst tiers:** Tier 1 analysts triage alerts; Tier 2 analysts investigate in depth; Tier 3 analysts handle advanced analysis and threat hunting. Other roles include SOC managers and security engineers who build and tune tools.

> **Instructor review:** clip of TCM SOC 101, chapter "SOC Models, Roles, and Organizational Structures". Confirm the questions against the video.`,
          takeaways: ['SOCs can be internal, outsourced or hybrid.', 'Tier 1 triages; higher tiers investigate and hunt.'],
          checkpoints: [
            {
              at: 650,
              q: 'In a tiered SOC, who usually performs the first triage of incoming alerts?',
              options: ['Tier 1 analysts', 'The CEO', 'Tier 3 threat hunters only', 'External auditors'],
              answer: 'Tier 1 analysts',
              explanation: 'Tier 1 handles initial triage and escalates to Tier 2/3 for deeper investigation.',
              topic: 'def-monitoring',
              review: true,
              source: socSrc('SOC Models, Roles, and Organizational Structures'),
            },
          ],
        },
        {
          key: 'monitoring',
          title: 'Security monitoring',
          summary: 'What to monitor, SIEMs, vulnerability scans, reports and alert tuning.',
          video: messer('np2WI_rM-Ok', 627),
          content: `## What this lesson covers

- Monitor **systems** (authentications and where they come from), **applications** (availability, data transfer volumes) and **infrastructure** (VPNs, firewalls, IPS).
- A **SIEM** consolidates logs from many devices into one database for reporting and correlation.
- Scanning produces **actionable reports** and supports ad hoc "what if" reports.
- An IBM report (2022) found it took about **nine months** on average to identify and contain a breach, so keep long-term data.
- Alerts may trigger responses such as **quarantining** a system. Tune alerts to reduce **false positives** (alerts that are wrong) and **false negatives** (events that are missed).`,
          takeaways: ['A SIEM correlates logs across many devices.', 'False negatives, missed real events, are especially dangerous.'],
          checkpoints: [
            {
              at: 600,
              q: 'A real attack happens but produces no alert. What is this called?',
              options: ['A false negative', 'A false positive', 'A true positive', 'An exemption'],
              answer: 'A false negative',
              explanation: 'A false negative is a real event that is not detected; a false positive is an alert for something that is not actually a problem.',
              topic: 'def-monitoring',
              source: tx('Security Monitoring'),
            },
          ],
        },
        {
          key: 'tools',
          title: 'Security tools',
          summary: 'SCAP, benchmarks, agents, SIEM, antivirus, DLP, SNMP, NetFlow and vulnerability scanners.',
          video: messer('nNiNTviiacU', 846),
          content: `## What this lesson covers

- **SCAP** (Security Content Automation Protocol, maintained by NIST) gives tools a common language for vulnerabilities, enabling automation.
- **Benchmarks** such as those from the **Center for Internet Security (CIS)** capture best-practice settings.
- **Agent-based vs agentless** compliance checks.
- **SIEM** reporting and correlation; **antivirus/anti-malware**; **DLP** (data loss prevention) blocks sensitive data such as Social Security or card numbers.
- **SNMP:** polling over UDP 161 reads values from a **MIB** identified by **OIDs**; **traps** over UDP 162 send proactive alerts.
- **NetFlow** probes and collectors summarize traffic; **vulnerability scanners** find potential weaknesses without exploiting them.`,
          takeaways: ['SCAP lets different security tools describe the same vulnerability the same way.', 'DLP finds and blocks sensitive data in motion.'],
          checkpoints: [
            {
              at: 800,
              q: 'Which tool would stop an employee from emailing a spreadsheet full of credit card numbers outside the company?',
              options: ['Data loss prevention (DLP)', 'NetFlow', 'SNMP traps', 'A vulnerability scanner'],
              answer: 'Data loss prevention (DLP)',
              explanation: 'DLP monitors data in real time and can identify and block sensitive information such as card numbers, SSNs and medical data.',
              topic: 'def-monitoring',
              source: tx('Security Tools'),
            },
          ],
        },
        {
          key: 'logs',
          title: 'Log data',
          summary: 'Firewall, application, endpoint, OS, IPS, network and metadata logs, plus dashboards and packet captures.',
          video: messer('EDru1LTYDJw', 820),
          content: `## What this lesson covers

- **Firewall logs:** source and destination IP and port, application (on an NGFW) and the disposition (allowed or blocked).
- **Application logs:** Windows Event Viewer, or **/var/log** on Linux and macOS.
- **Endpoint and OS security logs:** logons, process events, lockouts, disabled services.
- **IPS/IDS logs**, for example a Snort alert for a SYN flood with a priority and source and destination.
- **Network device logs:** routing changes, authentication errors, attacks.
- **Metadata:** email headers (servers, SPF results), photo GPS data, document author details.
- **Dashboards** give at-a-glance status; **packet captures** (for example Wireshark) show every byte.`,
          takeaways: ['Firewall logs record what was allowed and what was blocked.', 'Metadata in emails and documents can be valuable evidence.'],
          checkpoints: [
            {
              at: 790,
              q: 'On a Linux server, where would you typically look for application and system log files?',
              type: FILL,
              answer: '/var/log',
              accepted: ['/var/log/', 'var/log'],
              explanation: 'Linux and macOS store logs under /var/log; Windows uses the Event Viewer.',
              topic: 'def-monitoring',
              source: tx('Log Data'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which SOC model relies on a third-party provider (such as an MSSP) to perform monitoring?',
          options: ['Outsourced', 'In-house', 'Air-gapped', 'Fail-closed'],
          answer: 'Outsourced',
          explanation: 'Outsourced SOCs use a managed security provider; hybrid models split work between internal staff and a provider.',
          lesson: 'SOC models, roles and organizational structures',
          review: true,
          source: socSrc('SOC Models, Roles, and Organizational Structures'),
        },
        {
          q: 'Which activities are typical SOC responsibilities? Select all that apply.',
          type: MULTI,
          options: ['Triaging alerts', 'Investigating suspicious activity', 'Escalating and coordinating incident response', 'Writing the company’s marketing copy'],
          answer: ['Triaging alerts', 'Investigating suspicious activity', 'Escalating and coordinating incident response'],
          explanation: 'The SOC monitors, triages, investigates and coordinates response.',
          lesson: 'The SOC and its role',
          review: true,
          source: socSrc('The SOC and Its Role'),
        },
        {
          q: 'What does a SIEM do?',
          options: [
            'Consolidates logs from many devices into one database for reporting, correlation and alerting',
            'Encrypts all network traffic',
            'Assigns IP addresses',
            'Replaces firewalls',
          ],
          answer: 'Consolidates logs from many devices into one database for reporting, correlation and alerting',
          explanation: 'A Security Information and Event Manager centralizes and correlates logs from firewalls, servers, switches and more.',
          lesson: 'Security monitoring',
          source: tx('Security Monitoring'),
        },
        {
          q: 'According to the IBM report cited in the video, roughly how long did it take on average to identify and contain a breach in 2022?',
          options: ['About nine months', 'About nine minutes', 'About nine days', 'About nine years'],
          answer: 'About nine months',
          explanation: 'Attackers often remain inside a network for months, which is one reason long-term log retention and backups matter.',
          lesson: 'Security monitoring',
          source: tx('Security Monitoring'),
        },
        {
          q: 'An alert fires for a vulnerability that, on inspection, does not exist on the system. This is a false ___.',
          type: FILL,
          answer: 'positive',
          explanation: 'A false positive is an alert that turns out not to be real; a false negative is a real issue that was missed.',
          lesson: 'Security monitoring',
          source: tx('Security Monitoring'),
        },
        {
          q: 'Which organization maintains SCAP, the Security Content Automation Protocol?',
          options: ['NIST', 'OWASP', 'IANA', 'The Cyber Threat Alliance'],
          answer: 'NIST',
          explanation: 'SCAP is maintained by the National Institute of Standards and Technology (scap.nist.gov).',
          lesson: 'Security tools',
          source: tx('Security Tools'),
        },
        {
          q: 'An SNMP agent proactively sends an alert to the management station when CRC errors rise. What is this message called, and which port does it use?',
          options: ['An SNMP trap, UDP 162', 'An SNMP poll, UDP 161', 'A syslog message, UDP 514', 'A NetFlow record, TCP 443'],
          answer: 'An SNMP trap, UDP 162',
          explanation: 'Polling uses UDP 161; traps are sent proactively by the device over UDP 162.',
          lesson: 'Security tools',
          source: tx('Security Tools'),
        },
        {
          q: 'A vulnerability scanner exploits the vulnerabilities it finds to prove they are real.',
          type: TF,
          answer: 'False',
          explanation: 'Vulnerability scanners are minimally invasive and do not perform exploits; exploiting is part of a penetration test.',
          lesson: 'Security tools',
          source: `${tx('Security Tools')}; ${tx('Vulnerability Scanning')}`,
        },
        {
          q: 'Which details does a firewall log entry typically include? Select all that apply.',
          type: MULTI,
          options: ['Source and destination IP addresses', 'Port numbers', 'Whether the traffic was allowed or blocked', 'The user’s password'],
          answer: ['Source and destination IP addresses', 'Port numbers', 'Whether the traffic was allowed or blocked'],
          explanation: 'Firewall logs record flows, ports and disposition (and, on an NGFW, the application).',
          lesson: 'Log data',
          source: tx('Log Data'),
        },
        {
          q: 'A photo taken with a phone can contain GPS coordinates in its metadata.',
          type: TF,
          answer: 'True',
          explanation: 'Image metadata can reveal the device used and the location where the picture was taken.',
          lesson: 'Log data',
          source: tx('Log Data'),
        },
        {
          q: 'What is the main purpose of a SIEM dashboard?',
          options: [
            'To show the current security status at a glance',
            'To store years of raw packet captures',
            'To replace automated reports entirely',
            'To configure switches',
          ],
          answer: 'To show the current security status at a glance',
          explanation: 'Dashboards summarize current status; long-term analysis comes from reports.',
          lesson: 'Log data',
          source: tx('Log Data'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-92: Guide to Computer Security Log Management',
          authors: 'Karen Kent, Murugiah Souppaya',
          publisher: 'NIST',
          year: 2006,
          url: 'https://csrc.nist.gov/pubs/sp/800/92/final',
          kind: 'STANDARD',
          note: 'How to generate, transmit, store, analyze and dispose of security logs.',
        },
        {
          title: 'MITRE ATT&CK: Design and Philosophy',
          authors: 'Blake E. Strom et al.',
          publisher: 'The MITRE Corporation',
          year: 2020,
          url: 'https://attack.mitre.org/docs/ATTACK_Design_and_Philosophy_March_2020.pdf',
          kind: 'REPORT',
          note: 'The knowledge base of adversary tactics and techniques that SOCs map detections to.',
        },
        {
          title: 'Stalking the Wily Hacker',
          authors: 'Clifford Stoll',
          publisher: 'Communications of the ACM',
          year: 1988,
          url: 'https://doi.org/10.1145/42411.42412',
          kind: 'PAPER',
          note: 'A classic account of detecting and tracking an intruder through careful logging and monitoring.',
        },
      ],
    },

    // ── Module 4 ────────────────────────────────────────────────────
    {
      key: 'analysis',
      title: 'Phishing and Network Traffic Analysis',
      description: 'Analyzing email headers and authentication, capturing and filtering traffic, and writing Snort rules.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'email-headers',
          title: 'Email analysis methodology, headers and sender analysis',
          summary: 'A repeatable process for investigating a suspicious email.',
          video: soc(13847, 15471),
          content: `## What this lesson covers

A structured phishing analysis looks at the **headers**, the **sender**, the **content**, **URLs** and **attachments**, then documents findings.

Useful headers:
- **From**, **Reply-To** and **Return-Path**: a mismatch can reveal spoofing.
- **Received** lines: each mail server adds one; read them **bottom to top** to trace the path from the origin.
- **Message-ID**, **Date** and **Authentication-Results** (SPF, DKIM, DMARC outcomes).

> **Instructor review:** clip of TCM SOC 101 ("Email Analysis Methodology" and "Email Header and Sender Analysis"). Facts above follow standard email format (RFC 5322); confirm the questions against the video.`,
          takeaways: ['Read Received headers from the bottom up to trace an email’s path.', 'A Reply-To that differs from From is a common phishing sign.'],
          checkpoints: [
            {
              at: 1550,
              q: 'In which order should you read the Received headers to trace an email from its origin?',
              options: ['Bottom to top', 'Top to bottom', 'Alphabetically by server', 'Only the first one matters'],
              answer: 'Bottom to top',
              explanation: 'Each server prepends a Received line, so the oldest (closest to the sender) is at the bottom.',
              topic: 'def-analysis',
              review: true,
              source: socSrc('Email Header and Sender Analysis', 'RFC 5322 (Internet Message Format)'),
            },
          ],
        },
        {
          key: 'email-auth',
          title: 'Email authentication: SPF, DKIM and DMARC',
          summary: 'How receivers check whether an email really came from the domain it claims.',
          video: soc(15471, 16518),
          content: `## What this lesson covers

| Mechanism | What it checks |
| --- | --- |
| **SPF** (RFC 7208) | Whether the sending server's IP is authorized in the domain's DNS TXT record |
| **DKIM** (RFC 6376) | A digital signature over the message, verified with a public key published in DNS |
| **DMARC** (RFC 7489) | Policy (none, quarantine, reject) for messages that fail SPF/DKIM alignment, plus reporting |

> **Instructor review:** clip of TCM SOC 101 ("Email Authentication Methods"). Facts follow the cited RFCs; confirm the questions against the video.`,
          takeaways: ['SPF authorizes sending IPs; DKIM signs messages; DMARC sets the policy.', 'All three are published in DNS.'],
          checkpoints: [
            {
              at: 1000,
              q: 'Which email authentication mechanism uses a digital signature verified with a public key published in DNS?',
              options: ['DKIM', 'SPF', 'DMARC', 'SMTP'],
              answer: 'DKIM',
              explanation: 'DKIM signs messages; receivers fetch the public key from DNS to verify the signature.',
              topic: 'def-analysis',
              review: true,
              source: socSrc('Email Authentication Methods', 'RFC 6376 (DKIM)'),
            },
          ],
        },
        {
          key: 'pcap',
          title: 'Packet capture and flow analysis',
          summary: 'Full packet captures versus flow records.',
          video: soc(28324, 29034),
          content: `## What this lesson covers

- **Packet capture (PCAP)** records complete packets, including payloads: maximum detail, large storage.
- **Flow analysis** (for example NetFlow) records metadata about conversations, such as who talked to whom, when, on which ports and how much: compact and good for spotting anomalies, but no payloads.
- Tools like **tcpdump** capture from the command line, for example \`tcpdump -i eth0 -w capture.pcap\`.

> **Instructor review:** clip of TCM SOC 101 ("Packet Capture and Flow Analysis"). Confirm the questions against the video.`,
          takeaways: ['PCAP keeps payloads; flows keep only conversation metadata.', 'Flows are compact enough for long-term trend analysis.'],
          checkpoints: [
            {
              at: 680,
              q: 'What can a full packet capture show that a NetFlow record cannot?',
              options: ['The packet payloads (contents)', 'Source and destination IP addresses', 'The ports used', 'The amount of data transferred'],
              answer: 'The packet payloads (contents)',
              explanation: 'Flows summarize conversations (IPs, ports, volumes); only a packet capture keeps the actual contents.',
              topic: 'def-analysis',
              review: true,
              source: `${socSrc('Packet Capture and Flow Analysis')} See also ${tx('Logs and Monitoring')} (Network+).`,
            },
          ],
        },
        {
          key: 'wireshark',
          title: 'Wireshark: capture and display filters',
          summary: 'Filtering traffic before and after capture.',
          video: soc(33489, 34208),
          content: `## What this lesson covers

- **Capture filters** (BPF syntax, applied while capturing) limit what is recorded: \`host 10.0.0.5\`, \`port 53\`.
- **Display filters** (Wireshark syntax, applied after capture) narrow what you see: \`ip.addr == 10.0.0.5\`, \`http.request\`, \`dns\`, \`tcp.port == 443\`.
- Combine with \`&&\`, \`||\` and \`!\`.

> **Instructor review:** clip of TCM SOC 101 ("Wireshark: Capture and Display Filters"). Filter syntax follows the Wireshark documentation; confirm the questions against the video.`,
          takeaways: ['Capture filters decide what is recorded; display filters decide what is shown.', 'ip.addr == x matches either source or destination.'],
          checkpoints: [
            {
              at: 690,
              q: 'Which Wireshark display filter shows only packets to or from 10.0.0.5?',
              options: ['ip.addr == 10.0.0.5', 'host = 10.0.0.5 only', 'filter ip 10.0.0.5', 'tcp.port == 10.0.0.5'],
              answer: 'ip.addr == 10.0.0.5',
              explanation: 'ip.addr matches either the source or destination IPv4 address in Wireshark display-filter syntax.',
              topic: 'def-analysis',
              review: true,
              source: socSrc('Wireshark: Capture and Display Filters', 'the Wireshark display filter reference'),
            },
          ],
        },
        {
          key: 'snort',
          title: 'Snort: reading and writing rules',
          summary: 'The anatomy of an IDS/IPS rule.',
          video: soc(37612, 39096),
          content: `## What this lesson covers

A Snort rule has a **header** and **options**:

\`\`\`
alert tcp any any -> 192.168.1.10 80 (msg:"HTTP to web server"; content:"/admin"; sid:1000001; rev:1;)
\`\`\`

- **Action:** alert, log, pass, drop (drop/reject in inline IPS mode)
- **Protocol, source IP and port, direction (->), destination IP and port**
- **Options:** \`msg\` (alert text), \`content\` (bytes to match), \`sid\` (unique rule ID; local rules use 1,000,000 and up), \`rev\` (revision)

> **Instructor review:** clip of TCM SOC 101 ("Snort: Reading and Writing Rules"). Rule syntax follows the Snort documentation; confirm the questions against the video.`,
          takeaways: ['The rule header says what traffic; options say what to look for.', 'Every rule needs a unique sid.'],
          checkpoints: [
            {
              at: 1440,
              q: 'In this Snort rule, what does content:"/admin" do?',
              code: 'alert tcp any any -> 192.168.1.10 80 (msg:"Admin access"; content:"/admin"; sid:1000001; rev:1;)',
              options: [
                'Matches packets whose payload contains the bytes /admin',
                'Blocks the /admin folder on the server',
                'Sets the alert message',
                'Defines the rule’s unique ID',
              ],
              answer: 'Matches packets whose payload contains the bytes /admin',
              explanation: 'content searches the packet payload; msg sets the alert text and sid is the unique rule ID.',
              topic: 'def-analysis',
              review: true,
              source: socSrc('Snort: Reading and Writing Rules', 'the Snort rule documentation'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'An email’s From address shows your bank, but Reply-To points to a free webmail account. What does this suggest?',
          options: ['Possible phishing: replies go to the attacker', 'Normal bank behavior', 'A DKIM signature', 'An SPF pass'],
          answer: 'Possible phishing: replies go to the attacker',
          explanation: 'A mismatched Reply-To is a classic sign that the sender is not who they claim to be.',
          lesson: 'Email analysis methodology, headers and sender analysis',
          review: true,
          source: socSrc('Email Header and Sender Analysis', 'RFC 5322'),
        },
        {
          q: 'Which parts of an email should a structured phishing analysis examine? Select all that apply.',
          type: MULTI,
          options: ['Headers', 'Sender', 'URLs', 'Attachments'],
          answer: ['Headers', 'Sender', 'URLs', 'Attachments'],
          explanation: 'Phishing analysis covers headers, sender, content, URLs and attachments, then documents the findings.',
          lesson: 'Email analysis methodology, headers and sender analysis',
          review: true,
          source: socSrc('Email Analysis Methodology'),
        },
        {
          q: 'SPF lets a domain owner publish which servers are allowed to send email for the domain.',
          type: TF,
          answer: 'True',
          explanation: 'SPF (Sender Policy Framework) lists authorized sending IPs in a DNS TXT record.',
          lesson: 'Email authentication: SPF, DKIM and DMARC',
          review: true,
          source: socSrc('Email Authentication Methods', 'RFC 7208 (SPF)'),
        },
        {
          q: 'Which mechanism tells receivers what to do (none, quarantine or reject) when a message fails authentication, and sends reports?',
          options: ['DMARC', 'SPF', 'DKIM', 'TLS'],
          answer: 'DMARC',
          explanation: 'DMARC publishes a policy and reporting addresses based on SPF/DKIM alignment.',
          lesson: 'Email authentication: SPF, DKIM and DMARC',
          review: true,
          source: socSrc('Email Authentication Methods', 'RFC 7489 (DMARC)'),
        },
        {
          q: 'Where are SPF, DKIM and DMARC records published?',
          options: ['In DNS', 'In the email body', 'In the recipient’s browser', 'In the SIEM'],
          answer: 'In DNS',
          explanation: 'All three are published as DNS records for the sending domain.',
          lesson: 'Email authentication: SPF, DKIM and DMARC',
          review: true,
          source: socSrc('Email Authentication Methods', 'RFCs 7208, 6376 and 7489'),
        },
        {
          q: 'Which tcpdump option writes captured packets to a file?',
          options: ['-w', '-r', '-i', '-n'],
          answer: '-w',
          explanation: '-w writes to a pcap file, -r reads one, -i selects the interface and -n disables name resolution.',
          lesson: 'Packet capture and flow analysis',
          review: true,
          source: socSrc('Packet Capture and Flow Analysis', 'the tcpdump manual'),
        },
        {
          q: 'Flow records are a good choice for long-term trend analysis because they are compact.',
          type: TF,
          answer: 'True',
          explanation: 'Flows keep conversation metadata rather than full payloads, so they use far less storage than PCAPs.',
          lesson: 'Packet capture and flow analysis',
          review: true,
          source: socSrc('Packet Capture and Flow Analysis'),
        },
        {
          q: 'What is the difference between Wireshark capture filters and display filters?',
          options: [
            'Capture filters limit what is recorded; display filters limit what is shown from a capture',
            'They are identical',
            'Display filters delete packets from the file',
            'Capture filters only work on saved files',
          ],
          answer: 'Capture filters limit what is recorded; display filters limit what is shown from a capture',
          explanation: 'Capture filters (BPF) apply during capture; display filters apply afterwards and can be changed freely.',
          lesson: 'Wireshark: capture and display filters',
          review: true,
          source: socSrc('Wireshark: Capture and Display Filters', 'the Wireshark documentation'),
        },
        {
          q: 'Which Wireshark display filter shows only DNS traffic?',
          type: FILL,
          answer: 'dns',
          explanation: 'Typing the protocol name, dns, filters to DNS packets.',
          lesson: 'Wireshark: capture and display filters',
          review: true,
          source: socSrc('Wireshark: Capture and Display Filters', 'the Wireshark display filter reference'),
        },
        {
          q: 'In a Snort rule, what is the sid option for?',
          options: ['A unique identifier for the rule', 'The alert message text', 'The payload to match', 'The destination port'],
          answer: 'A unique identifier for the rule',
          explanation: 'sid uniquely identifies each rule; custom rules conventionally use numbers of 1,000,000 and up.',
          lesson: 'Snort: reading and writing rules',
          review: true,
          source: socSrc('Snort: Reading and Writing Rules', 'the Snort documentation'),
        },
        {
          q: 'Which Snort rule action would block traffic when Snort runs inline as an IPS?',
          options: ['drop', 'alert', 'log', 'msg'],
          answer: 'drop',
          explanation: 'alert and log only record; drop (or reject) blocks traffic in inline IPS mode. msg is an option, not an action.',
          lesson: 'Snort: reading and writing rules',
          review: true,
          source: socSrc('Snort: Reading and Writing Rules', 'the Snort documentation'),
        },
        {
          q: 'In the rule header "alert tcp any any -> 192.168.1.10 80", what does 80 refer to?',
          options: ['The destination port', 'The source port', 'The rule ID', 'The priority'],
          answer: 'The destination port',
          explanation: 'The header is: action, protocol, source IP, source port, direction, destination IP, destination port.',
          lesson: 'Snort: reading and writing rules',
          review: true,
          source: socSrc('Snort: Reading and Writing Rules', 'the Snort documentation'),
        },
      ],
      readings: [
        {
          title: 'RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)',
          authors: 'M. Kucherawy, E. Zwicky (eds.)',
          publisher: 'IETF',
          year: 2015,
          url: 'https://www.rfc-editor.org/rfc/rfc7489',
          kind: 'STANDARD',
          note: 'How DMARC builds on SPF and DKIM.',
        },
        {
          title: 'RFC 7208: Sender Policy Framework (SPF)',
          authors: 'S. Kitterman',
          publisher: 'IETF',
          year: 2014,
          url: 'https://www.rfc-editor.org/rfc/rfc7208',
          kind: 'STANDARD',
          note: 'The SPF specification.',
        },
        {
          title: 'RFC 6376: DomainKeys Identified Mail (DKIM) Signatures',
          authors: 'D. Crocker, T. Hansen, M. Kucherawy (eds.)',
          publisher: 'IETF',
          year: 2011,
          url: 'https://www.rfc-editor.org/rfc/rfc6376',
          kind: 'STANDARD',
          note: 'The DKIM specification.',
        },
      ],
    },

    // ── Module 5 ────────────────────────────────────────────────────
    {
      key: 'vulnerabilities',
      title: 'Vulnerability Management',
      description: 'Vulnerability scanning, application testing, threat intelligence, prioritization with CVSS, and remediation.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'scanning',
          title: 'Vulnerability scanning',
          summary: 'Network scans, static analysis, fuzzing and package verification.',
          video: messer('9B0mtWk_AM0', 465),
          content: `## What this lesson covers

- A **vulnerability scan** checks whether an attack *could* succeed; it does not perform the attack (that would be a penetration test). A port scan is a simple example.
- Scan from outside **and** inside (insider threats); verify results, because scans produce **false positives**.
- **Static application security testing (SAST)** reviews source code (for example for buffer overflows or injection) but misses issues such as weak authentication or insecure crypto implementations.
- **Dynamic analysis / fuzzing** feeds random input to find crashes; the first fuzzer came from Barton Miller's 1988 class at the University of Wisconsin. CERT offers the Basic Fuzzing Framework (BFF).
- **Package monitoring:** verify where software came from and test it in a lab first.`,
          takeaways: ['Scans detect potential vulnerabilities; pen tests exploit them.', 'Fuzzing finds bugs by sending unexpected input.'],
          checkpoints: [
            {
              at: 400,
              q: 'Feeding random, unexpected input into an application to see if it crashes is called:',
              options: ['Fuzzing', 'Static analysis', 'Port scanning', 'Code signing'],
              answer: 'Fuzzing',
              explanation: 'Fuzzing (dynamic analysis, fault injection, robustness testing) looks for unexpected behavior caused by unusual input.',
              topic: 'def-vulns',
              source: tx('Vulnerability Scanning'),
            },
          ],
        },
        {
          key: 'threat-intel',
          title: 'Threat intelligence',
          summary: 'OSINT, proprietary feeds, information-sharing organizations and the dark web.',
          video: messer('86fruE9jkKk', 286),
          content: `## What this lesson covers

- **OSINT (open-source intelligence):** discussion groups, social media, government reports and public commercial data.
- **Proprietary/third-party intelligence:** paid services that see attacks across many organizations and warn others early.
- **Information-sharing organizations**, such as the **Cyber Threat Alliance (CTA)**, which validates and scores submissions in a standard format for members.
- **Dark web monitoring:** forums and marketplaces where groups discuss tools and sell stolen data; watch for your organization's name.`,
          takeaways: ['OSINT is information available to anyone who knows where to look.', 'Sharing groups spread warnings across organizations.'],
          checkpoints: [
            {
              at: 270,
              q: 'Public social media posts, government reports and hacker discussion forums are examples of:',
              options: ['Open-source intelligence (OSINT)', 'Proprietary threat feeds', 'Classified intelligence', 'Static code analysis'],
              answer: 'Open-source intelligence (OSINT)',
              explanation: 'OSINT is information that is publicly available to anyone.',
              topic: 'def-vulns',
              source: tx('Threat Intelligence'),
            },
          ],
        },
        {
          key: 'analyzing',
          title: 'Analyzing vulnerabilities',
          summary: 'False positives and negatives, CVE and CVSS, exposure factor, environment and risk tolerance.',
          video: messer('eyVy1gKCuAU', 629),
          content: `## What this lesson covers

- **False positive:** a reported vulnerability that does not exist. Low or informational findings are **not** false positives.
- **False negative:** a real vulnerability the scanner missed, which is worse. Update signatures before scanning.
- **CVE** identifies vulnerabilities; the **National Vulnerability Database (nvd.nist.gov)** scores them with **CVSS** from **0 to 10** (10 is most critical).
- **Exposure factor:** the percentage of impact (for example 50% if a service is unavailable half the time).
- Prioritize using **environment** (internet-facing vs isolated lab), criticality, revenue impact and ease of exploitation, balanced against **risk tolerance** and testing time.`,
          takeaways: ['A false negative is more dangerous than a false positive.', 'CVSS scores range from 0 to 10.'],
          checkpoints: [
            {
              at: 600,
              q: 'The same vulnerability exists on an internet-facing cloud server and on an isolated lab machine. Which should usually be patched first?',
              options: ['The internet-facing cloud server', 'The isolated lab machine', 'Neither; vulnerabilities in the same CVE are equal', 'Whichever was installed first'],
              answer: 'The internet-facing cloud server',
              explanation: 'Environment matters: a system reachable by everyone on the internet has far higher exposure than an isolated lab system.',
              topic: 'def-vulns',
              source: tx('Analyzing Vulnerabilities'),
            },
          ],
        },
        {
          key: 'remediation',
          title: 'Vulnerability remediation',
          summary: 'Patching, insurance, segmentation, compensating controls, exceptions and validation.',
          video: messer('P9xakfmX70c', 525),
          content: `## What this lesson covers

- **Patching:** scheduled or, for zero-days, unscheduled.
- **Cybersecurity insurance** transfers some financial risk (not everything is covered).
- **Segmentation:** VLANs or **air gaps** limit an attacker's reach; NGFWs monitor between segments.
- **Compensating controls** when you cannot patch: disable the service, revoke access, firewall rules, router ACLs, host firewalls.
- **Exceptions and exemptions:** a committee may accept the risk (for example for a vulnerability only exploitable locally).
- **Validation:** rescan after patching, audit systems and report on progress.`,
          takeaways: ['When patching is not possible, use compensating controls.', 'Always rescan to verify remediation worked.'],
          checkpoints: [
            {
              at: 500,
              q: 'After rolling out an emergency patch, what is a good way to confirm it worked everywhere?',
              options: ['Perform a vulnerability scan (and audit some systems)', 'Assume it worked', 'Disable logging', 'Buy cybersecurity insurance'],
              answer: 'Perform a vulnerability scan (and audit some systems)',
              explanation: 'A rescan confirms the vulnerability is gone and may find systems that still need the patch.',
              topic: 'def-vulns',
              source: tx('Vulnerability Remediation'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'What is the key difference between a vulnerability scan and a penetration test?',
          options: [
            'A scan checks whether a vulnerability could exist; a penetration test actually tries to exploit it',
            'A scan is always done by attackers',
            'A penetration test only checks open ports',
            'There is no difference',
          ],
          answer: 'A scan checks whether a vulnerability could exist; a penetration test actually tries to exploit it',
          explanation: 'Vulnerability scans do not perform attacks; exploiting a vulnerability would make it a penetration test.',
          lesson: 'Vulnerability scanning',
          source: tx('Vulnerability Scanning'),
        },
        {
          q: 'Which issues are static code analyzers often poor at finding? Select all that apply.',
          type: MULTI,
          options: ['Weak authentication design', 'Insecure implementations of cryptography', 'Obvious buffer overflows in the code', 'Database injection in the code'],
          answer: ['Weak authentication design', 'Insecure implementations of cryptography'],
          explanation: 'SAST is good at code-level flaws such as buffer overflows and injection, but often misses authentication and crypto implementation issues.',
          lesson: 'Vulnerability scanning',
          source: tx('Vulnerability Scanning'),
        },
        {
          q: 'Before installing a software package from a third party, what is a sensible step?',
          options: ['Verify its source and test it in a lab environment', 'Install it directly in production', 'Disable antivirus', 'Rename the installer'],
          answer: 'Verify its source and test it in a lab environment',
          explanation: 'Packages from third parties may contain malware or vulnerabilities; verify and test before deploying.',
          lesson: 'Vulnerability scanning',
          source: tx('Vulnerability Scanning'),
        },
        {
          q: 'The Cyber Threat Alliance is an example of which source of threat intelligence?',
          options: ['An information-sharing organization', 'The dark web', 'Static analysis', 'A fuzzing framework'],
          answer: 'An information-sharing organization',
          explanation: 'The CTA gathers, validates, scores and shares threat information among its members.',
          lesson: 'Threat intelligence',
          source: tx('Threat Intelligence'),
        },
        {
          q: 'What is the advantage of a paid threat intelligence service that monitors many organizations?',
          options: [
            'It can spot attack trends in one sector and warn others before the threat arrives',
            'It patches systems automatically',
            'It replaces the firewall',
            'It removes the need for logs',
          ],
          answer: 'It can spot attack trends in one sector and warn others before the threat arrives',
          explanation: 'Seeing across many enterprises lets these providers alert customers early.',
          lesson: 'Threat intelligence',
          source: tx('Threat Intelligence'),
        },
        {
          q: 'A scanner reports a vulnerability as "low/informational". That makes it a false positive.',
          type: TF,
          answer: 'False',
          explanation: 'Low and informational findings are still valid vulnerabilities, just lower priority. A false positive is a finding that is not real.',
          lesson: 'Analyzing vulnerabilities',
          source: tx('Analyzing Vulnerabilities'),
        },
        {
          q: 'CVSS scores range from 0 up to what maximum value?',
          type: FILL,
          answer: '10',
          accepted: ['10.0'],
          explanation: 'CVSS scores run from 0 to 10, with 10 the most critical.',
          lesson: 'Analyzing vulnerabilities',
          source: tx('Analyzing Vulnerabilities'),
        },
        {
          q: 'Which is generally worse, and why?',
          options: [
            'A false negative, because a real vulnerability goes unreported',
            'A false positive, because it wastes time',
            'They are equally harmful',
            'Neither matters if you patch monthly',
          ],
          answer: 'A false negative, because a real vulnerability goes unreported',
          explanation: 'A missed vulnerability can be exploited without you ever knowing it existed.',
          lesson: 'Analyzing vulnerabilities',
          source: tx('Analyzing Vulnerabilities'),
        },
        {
          q: 'A vulnerability would make a service unavailable half of the time. What is its exposure factor?',
          options: ['50%', '100%', '5%', '0.5%'],
          answer: '50%',
          explanation: 'Exposure factor expresses the impact as a percentage of loss; half the time unavailable is 50%.',
          lesson: 'Analyzing vulnerabilities',
          source: tx('Analyzing Vulnerabilities'),
        },
        {
          q: 'A patch breaks a critical application, so you cannot install it yet. Which are valid compensating controls? Select all that apply.',
          type: MULTI,
          options: [
            'Add firewall rules blocking outside access to the service',
            'Disable the vulnerable service if it is not needed',
            'Move the system to an isolated segment',
            'Publish the vulnerability details on social media',
          ],
          answer: ['Add firewall rules blocking outside access to the service', 'Disable the vulnerable service if it is not needed', 'Move the system to an isolated segment'],
          explanation: 'Firewall rules, ACLs, disabling services or revoking access, and segmentation all reduce risk until a patch can be applied.',
          lesson: 'Vulnerability remediation',
          source: tx('Vulnerability Remediation'),
        },
        {
          q: 'Who usually decides to grant an exemption allowing a system to remain unpatched?',
          options: ['A security or change control committee', 'Any single technician', 'The attacker', 'The software vendor'],
          answer: 'A security or change control committee',
          explanation: 'Accepting the risk of an unpatched system is a group decision after evaluating the vulnerability.',
          lesson: 'Vulnerability remediation',
          source: tx('Vulnerability Remediation'),
        },
        {
          q: 'Cybersecurity insurance is a way to ___ risk: moving some of the financial impact to an insurer.',
          type: FILL,
          answer: 'transfer',
          accepted: ['move', 'transferring'],
          explanation: 'Insurance transfers some losses (revenue, recovery, lawsuits) to the insurer, though not everything is covered.',
          lesson: 'Vulnerability remediation',
          source: tx('Vulnerability Remediation'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-40 Rev. 4: Guide to Enterprise Patch Management Planning',
          authors: 'Murugiah Souppaya, Karen Scarfone',
          publisher: 'NIST',
          year: 2022,
          url: 'https://csrc.nist.gov/pubs/sp/800/40/r4/final',
          kind: 'STANDARD',
          note: 'Treats patching as preventive maintenance and explains how to plan it.',
        },
        {
          title: 'Common Vulnerability Scoring System v4.0: Specification Document',
          authors: 'FIRST',
          publisher: 'Forum of Incident Response and Security Teams',
          year: 2023,
          url: 'https://www.first.org/cvss/v4.0/specification-document',
          kind: 'STANDARD',
          note: 'How CVSS scores are calculated in the current version.',
        },
        {
          title: 'Known Exploited Vulnerabilities Catalog',
          authors: 'Cybersecurity and Infrastructure Security Agency',
          publisher: 'CISA',
          year: null,
          url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          kind: 'DOCUMENTATION',
          note: 'Vulnerabilities with evidence of active exploitation, a strong input for prioritization.',
        },
      ],
    },

    // ── Module 6 ────────────────────────────────────────────────────
    {
      key: 'incident-response',
      title: 'Incident Response and Digital Forensics',
      description: 'The incident response lifecycle, exercises, root cause analysis, threat hunting and forensic best practices.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'ir',
          title: 'Incident response',
          summary: 'Preparation, detection and analysis, containment, eradication, recovery and lessons learned.',
          video: messer('X2UiMLxRdhE', 553),
          content: `## What this lesson covers

The video follows the lifecycle in **NIST SP 800-61 Rev. 2** (*Computer Security Incident Handling Guide*):

1. **Preparation:** contact lists, an incident "go bag" (laptops, forensic software, removable media), documentation, baselines and file hashes, known-good images, policies and procedures.
2. **Detection and analysis:** IPS and antivirus alerts, configuration changes, traffic spikes. **Sandboxes** let you observe malware safely (some malware detects sandboxes and deletes itself).
3. **Containment, eradication and recovery:** remove malware or reimage, disable breached accounts, fix the vulnerability, restore from known-good backups.
4. **Post-incident activity:** a lessons-learned meeting soon after: what happened, the timeline, what to change, and missed indicators.

NIST published **Rev. 3** in 2025, which aligns incident response with the NIST Cybersecurity Framework 2.0 (see the readings).`,
          takeaways: ['Preparation happens before the incident; it is too late to train during one.', 'Hold the lessons-learned meeting soon after the incident.'],
          checkpoints: [
            {
              at: 520,
              q: 'When should the post-incident (lessons learned) meeting be held?',
              options: [
                'As soon as possible after the incident is resolved, while memories are fresh',
                'A year later, at the annual review',
                'Before the incident starts',
                'Only if the incident cost money',
              ],
              answer: 'As soon as possible after the incident is resolved, while memories are fresh',
              explanation: 'Meeting soon after resolution captures accurate details and improves plans for the next incident.',
              topic: 'def-ir',
              source: tx('Incident Response'),
            },
          ],
        },
        {
          key: 'planning',
          title: 'Incident planning',
          summary: 'Tabletop exercises, simulations, root cause analysis and threat hunting.',
          video: messer('CYFe16lCRMk', 409),
          content: `## What this lesson covers

- **Exercises** test processes, procedures and skills on **test systems**, not production.
- **Tabletop exercises:** everyone sits around a table and talks through a scenario, a cheaper alternative to a full-scale drill.
- **Simulations:** for example **phishing simulations** that show who clicks and whether filters catch the email.
- **Root cause analysis:** reconstruct how the attacker got in; there may be **multiple** root causes.
- **Threat hunting:** proactively look for threats and vulnerabilities before they are exploited.`,
          takeaways: ['Tabletop exercises test plans without a full drill.', 'Incidents may have more than one root cause.'],
          checkpoints: [
            {
              at: 380,
              q: 'The security team sends a fake phishing email to all employees and reports who clicked. What kind of exercise is this?',
              options: ['A simulation', 'A tabletop exercise', 'Root cause analysis', 'A legal hold'],
              answer: 'A simulation',
              explanation: 'Phishing simulations test users and filters with a realistic simulated attack.',
              topic: 'def-ir',
              source: tx('Incident Planning'),
            },
          ],
        },
        {
          key: 'forensics',
          title: 'Digital forensics',
          summary: 'Legal holds, chain of custody, acquisition, reporting, preservation and e-discovery.',
          video: messer('UtDWApdO8Zk', 594),
          content: `## What this lesson covers

- Best practices are documented in **RFC 3227**, *Guidelines for Evidence Collection and Archiving*.
- A **legal hold** (usually from lawyers) tells the **data custodian** which electronically stored information (ESI) to preserve.
- **Chain of custody:** prove who accessed the evidence and that it has not changed, using **hashes** and **digital signatures**.
- **Acquisition** from disks, memory, firmware, file systems, network devices, VM snapshots, logs, recycle bins and temp files, with detailed documentation.
- **Preservation:** work from **copies**; capture **live** data when encryption locks a powered-off system.
- **E-discovery** collects and produces data; forensics analyzes it.`,
          takeaways: ['Hashes prove evidence has not changed.', 'Analyze copies, never the original evidence.'],
          checkpoints: [
            {
              at: 560,
              q: 'How do investigators prove that digital evidence has not changed since it was collected?',
              options: ['By comparing cryptographic hashes and keeping a chain of custody', 'By renaming the files', 'By deleting the original', 'By compressing the evidence'],
              answer: 'By comparing cryptographic hashes and keeping a chain of custody',
              explanation: 'Hashes and digital signatures verify integrity, and the chain of custody documents everyone who accessed the evidence.',
              topic: 'def-ir',
              source: tx('Digital Forensics'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Put the NIST SP 800-61 Rev. 2 incident lifecycle in order. Which phase comes first?',
          options: ['Preparation', 'Detection and analysis', 'Containment, eradication and recovery', 'Post-incident activity'],
          answer: 'Preparation',
          explanation: 'The order is preparation; detection and analysis; containment, eradication and recovery; post-incident activity.',
          lesson: 'Incident response',
          source: tx('Incident Response'),
        },
        {
          q: 'Which items belong in an incident response "go bag"? Select all that apply.',
          type: MULTI,
          options: ['Laptops with forensic software', 'Removable media', 'Digital imaging equipment (camera)', 'The attacker’s contact details'],
          answer: ['Laptops with forensic software', 'Removable media', 'Digital imaging equipment (camera)'],
          explanation: 'The go bag holds the hardware and software needed to respond: laptops, forensic tools, removable media and imaging equipment.',
          lesson: 'Incident response',
          source: tx('Incident Response'),
        },
        {
          q: 'Why might malware behave differently inside a sandbox?',
          options: [
            'Some malware detects that it is in a virtual machine with limited connectivity and deletes itself',
            'Sandboxes run malware faster',
            'Sandboxes remove encryption',
            'Malware cannot run in virtual machines',
          ],
          answer: 'Some malware detects that it is in a virtual machine with limited connectivity and deletes itself',
          explanation: 'Sandbox-aware malware may hide its behavior to avoid analysis.',
          lesson: 'Incident response',
          source: tx('Incident Response'),
        },
        {
          q: 'During recovery, which actions help make sure the attacker cannot get back in? Select all that apply.',
          type: MULTI,
          options: ['Reimage or remove malware', 'Disable breached or attacker-created accounts', 'Fix the vulnerability that allowed access', 'Leave the system as it is'],
          answer: ['Reimage or remove malware', 'Disable breached or attacker-created accounts', 'Fix the vulnerability that allowed access'],
          explanation: 'Recovery replaces compromised files with known-good versions and closes the attacker’s way in.',
          lesson: 'Incident response',
          source: tx('Incident Response'),
        },
        {
          q: 'A tabletop exercise requires running a full-scale disaster drill on production systems.',
          type: TF,
          answer: 'False',
          explanation: 'Tabletop exercises are discussions around a table that step through procedures, without a full drill.',
          lesson: 'Incident planning',
          source: tx('Incident Planning'),
        },
        {
          q: 'Proactively searching for threats and vulnerabilities before they are exploited is called threat ___.',
          type: FILL,
          answer: 'hunting',
          explanation: 'Threat hunting looks for attackers and weaknesses before an alert ever fires.',
          lesson: 'Incident planning',
          source: tx('Incident Planning'),
        },
        {
          q: 'Root cause analysis should always conclude that exactly one cause allowed an incident.',
          type: TF,
          answer: 'False',
          explanation: 'Attackers may use several steps, so there can be multiple root causes.',
          lesson: 'Incident planning',
          source: tx('Incident Planning'),
        },
        {
          q: 'Which RFC documents guidelines for evidence collection and archiving?',
          options: ['RFC 3227', 'RFC 1918', 'RFC 8446', 'RFC 7489'],
          answer: 'RFC 3227',
          explanation: 'RFC 3227 describes best practices for collecting and archiving evidence.',
          lesson: 'Digital forensics',
          source: tx('Digital Forensics'),
        },
        {
          q: 'Who usually receives a legal hold request and is responsible for preserving the data?',
          options: ['The data custodian', 'The attacker', 'The help desk', 'The ISP'],
          answer: 'The data custodian',
          explanation: 'Legal holds are sent to the data custodian, who acquires and preserves the requested electronically stored information.',
          lesson: 'Digital forensics',
          source: tx('Digital Forensics'),
        },
        {
          q: 'Why might investigators capture data from a system while it is still running?',
          options: [
            'Encryption may lock the data once the system is powered off',
            'Running systems are easier to carry',
            'Powered-off systems have no data',
            'It speeds up e-discovery',
          ],
          answer: 'Encryption may lock the data once the system is powered off',
          explanation: 'Live acquisition preserves data that would become inaccessible when an encrypted system shuts down.',
          lesson: 'Digital forensics',
          source: tx('Digital Forensics'),
        },
        {
          q: 'What is the difference between e-discovery and forensic analysis?',
          options: [
            'E-discovery collects and produces data; forensics analyzes it (for example recovering deleted files)',
            'They are the same process',
            'E-discovery is only for malware',
            'Forensics never involves legal proceedings',
          ],
          answer: 'E-discovery collects and produces data; forensics analyzes it (for example recovering deleted files)',
          explanation: 'E-discovery is about acquiring and producing data; the forensics team analyzes it.',
          lesson: 'Digital forensics',
          source: tx('Digital Forensics'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management',
          authors: 'Alex Nelson, Sanjay Rekhi, Murugiah Souppaya, Karen Scarfone',
          publisher: 'NIST',
          year: 2025,
          url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
          kind: 'STANDARD',
          note: 'The current NIST incident response guidance, updated from the Rev. 2 lifecycle taught in the video to align with CSF 2.0.',
        },
        {
          title: 'NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response',
          authors: 'Karen Kent, Suzanne Chevalier, Tim Grance, Hung Dang',
          publisher: 'NIST',
          year: 2006,
          url: 'https://csrc.nist.gov/pubs/sp/800/86/final',
          kind: 'STANDARD',
          note: 'How to collect, examine and analyze data during an incident.',
        },
        {
          title: 'RFC 3227: Guidelines for Evidence Collection and Archiving',
          authors: 'D. Brezinski, T. Killalea',
          publisher: 'IETF',
          year: 2002,
          url: 'https://www.rfc-editor.org/rfc/rfc3227',
          kind: 'STANDARD',
          note: 'The RFC referenced in the video, including the order of volatility.',
        },
      ],
    },
  ],
};

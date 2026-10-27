// Course 2 (Beginner → Intermediate): Networking & Linux Foundations.
// Networking videos: Professor Messer, CompTIA Network+ N10-009 Training Course (playlist PLG49S3nxzAnl_tQe3kvnmeMid0mjF8Le8).
//   Questions are grounded in the transcripts Professor Messer publishes on each video page (professormesser.com).
//   These videos have no chapter markers, so checkpoints are placed late in each video, after the topic is covered.
// Linux videos: TCM Security (The Cyber Mentor), "Beginner Linux for Ethical Hackers" (playlist PLLKT__MCUeiwfK18Io6kvwrrhqQyQnV5W).
//   Only the published video descriptions (which list the commands covered) were available, so Linux questions test
//   the standard behavior of those commands and are flagged for instructor review against the videos.
import { MULTI, TF, FILL, youtube } from './helpers.js';

const MESSER = 'Professor Messer, CompTIA Network+ N10-009 Training Course (free on YouTube).';
const TCM = 'TCM Security (Heath Adams, The Cyber Mentor), Beginner Linux for Ethical Hackers (free on YouTube).';
const messer = (id, duration) => youtube(id, { duration, credit: MESSER });
const tcm = (id, duration) => youtube(id, { duration, credit: TCM });
const tx = (title) => `Professor Messer transcript, "${title}"`;
const LINUX_SRC = 'Standard Linux command behavior; the video description lists this command. Confirm against the video.';

export default {
  key: 'networking-linux',
  // v2: 80% pass marks on in-video questions and block quizzes
  version: 2,
  topics: {
    'net-models': 'Network models and devices',
    'net-addressing': 'IP addressing and subnetting',
    'net-ports': 'Ports and protocols',
    'net-modern': 'Modern network design',
    'linux-cli': 'Linux command line',
    'linux-admin': 'Linux administration and scripting',
  },
  roadmap: {
    slug: 'networking-and-linux-foundations',
    title: 'Networking & Linux Foundations',
    summary: 'How data crosses networks, IP addressing and ports, and the Linux command line used in security work.',
    description:
      'Security work happens on networks and, very often, on Linux. This course builds both foundations: the OSI model, networking devices, TCP and UDP, IPv4 and IPv6 addressing, subnetting, well-known ports, NAT, VLANs, wireless encryption, zero trust and network monitoring, followed by the Linux file system, users and permissions, networking commands, package management, services and Bash scripting.',
    category: 'Cybersecurity',
    difficulty: 'BEGINNER',
    prerequisites: [
      'Cybersecurity Foundations (recommended)',
      'A computer where you can practice in a Linux virtual machine (optional but recommended)',
    ],
    learningOutcomes: [
      'Map real traffic to the seven layers of the OSI model and name the devices that work at each layer',
      'Explain TCP versus UDP, sockets, and well-known and ephemeral ports, and recall the ports of common services',
      'Read IPv4 and IPv6 addresses, convert subnet masks to CIDR notation and calculate subnets and hosts',
      'Explain NAT and PAT, VLANs and trunking, WPA2/WPA3, zero trust and how logs and NetFlow support monitoring',
      'Navigate the Linux file system, manage users and permissions, inspect network settings, install tools, control services and write simple Bash scripts',
    ],
    sources: [
      {
        title: 'CompTIA N10-009 Network+ Training Course (YouTube playlist)',
        author: 'Professor Messer',
        url: 'https://www.youtube.com/playlist?list=PLG49S3nxzAnl_tQe3kvnmeMid0mjF8Le8',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
      {
        title: 'Network+ course index with written transcripts',
        author: 'Professor Messer',
        url: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/',
      },
      {
        title: 'Beginner Linux for Ethical Hackers (YouTube playlist)',
        author: 'TCM Security (The Cyber Mentor)',
        url: 'https://www.youtube.com/playlist?list=PLLKT__MCUeiwfK18Io6kvwrrhqQyQnV5W',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
    ],
    order: 11,
    isFeatured: true,
  },
  modules: [
    // ── Module 1 ────────────────────────────────────────────────────
    {
      key: 'how-networks-work',
      title: 'How Networks Move Data',
      description: 'The OSI model, the devices that make up a network, how traffic is addressed, and TCP versus UDP.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'osi',
          title: 'Understanding the OSI model',
          summary: 'The seven layers IT professionals use to describe how data moves.',
          video: messer('AYgXr1dynKU', 831),
          content: `## What this lesson covers

The **OSI (Open Systems Interconnection) reference model** is a shared vocabulary, not a protocol suite. From layer 7 down:

| Layer | Name | Examples |
| --- | --- | --- |
| 7 | Application | HTTP, FTP, DNS |
| 6 | Presentation | Character encoding, SSL/TLS encryption |
| 5 | Session | Starting and ending sessions, tunneling |
| 4 | Transport | TCP and UDP ports |
| 3 | Network | IP addresses, routing |
| 2 | Data link | MAC addresses, switching |
| 1 | Physical | Cables, fiber, signals |

Mnemonic (top down): **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing.

### As you watch
Notice how a Wireshark capture of one frame maps line by line onto the layers.`,
          takeaways: [
            'Layer 2 is the MAC address (switching) layer; layer 3 is the IP (routing) layer.',
            'TCP and UDP port numbers live at layer 4.',
            'A bad cable or wireless interference is a layer 1 problem.',
          ],
          checkpoints: [
            {
              at: 560,
              q: 'Network switches forward traffic based on MAC addresses. Which OSI layer is that?',
              options: ['Layer 2, data link', 'Layer 3, network', 'Layer 1, physical', 'Layer 4, transport'],
              answer: 'Layer 2, data link',
              explanation: 'MAC addresses belong to the data link layer, which is why it is often called the switching layer. Routers use IP addresses at layer 3.',
              topic: 'net-models',
              source: tx('Understanding the OSI Model'),
            },
            {
              at: 790,
              q: 'In a packet capture, a line shows TCP source and destination port numbers. Which OSI layer does that line represent?',
              options: ['Layer 4, transport', 'Layer 2, data link', 'Layer 7, application', 'Layer 3, network'],
              answer: 'Layer 4, transport',
              explanation: 'TCP and UDP, and their port numbers, operate at the transport layer.',
              topic: 'net-models',
              source: tx('Understanding the OSI Model'),
            },
          ],
        },
        {
          key: 'devices',
          title: 'Networking devices',
          summary: 'Routers, switches, firewalls, IDS/IPS, load balancers, proxies, storage and wireless.',
          video: messer('iqjj4ZSPV08', 871),
          content: `## What this lesson covers

- **Router (layer 3):** forwards traffic between IP subnets. A **layer 3 switch** combines a switch and a router in one box.
- **Switch (layer 2):** forwards by MAC address in hardware (ASICs); many provide **Power over Ethernet (PoE)**.
- **Firewall:** filters by port; a **next-generation firewall (NGFW)** identifies applications. Firewalls often provide VPNs, NAT and routing.
- **IDS vs IPS:** an intrusion *detection* system alerts on known attacks; an intrusion *prevention* system can also block them.
- **Load balancer:** spreads requests across servers, removes failed servers, and can offload TLS and cache content.
- **Proxy:** makes requests on the user's behalf, enabling caching, access control, URL filtering and content scanning.
- **NAS vs SAN:** file-level versus block-level storage access.
- **Access point (layer 2)** bridges 802.11 wireless and 802.3 Ethernet; a **wireless LAN controller** manages many access points.`,
          takeaways: ['An IPS can block attacks that an IDS can only alert on.', 'A SAN gives block-level access; a NAS gives file-level access.'],
          checkpoints: [
            {
              at: 380,
              q: 'What can an intrusion prevention system (IPS) do that an intrusion detection system (IDS) cannot?',
              options: ['Block the attack before it gets inside the network', 'Assign IP addresses', 'Store files at block level', 'Translate private addresses'],
              answer: 'Block the attack before it gets inside the network',
              explanation: 'An IDS can only alarm or alert. An IPS goes a step further and blocks the attack, which is why IPSs are common on enterprise networks.',
              topic: 'net-models',
              source: tx('Networking Devices'),
            },
            {
              at: 780,
              q: 'Which storage system gives block-level access, so changing part of a very large file does not require copying the whole file?',
              options: ['Storage area network (SAN)', 'Network-attached storage (NAS)', 'A proxy cache', 'A wireless LAN controller'],
              answer: 'Storage area network (SAN)',
              explanation: 'A SAN works like a local drive with block-level access. A NAS provides file-level access, so the whole file moves across the network.',
              topic: 'net-models',
              source: tx('Networking Devices'),
            },
          ],
        },
        {
          key: 'communication',
          title: 'Unicast, multicast, anycast and broadcast',
          summary: 'The four ways one device can address others.',
          video: messer('9Vx-awO6qfc', 234),
          content: `## What this lesson covers

- **Unicast:** one-to-one. Web browsing, file transfers and email are usually unicast.
- **Multicast:** one-to-many-of-many. Subscribers receive the same stream (multimedia, stock data, routing updates). It needs equipment that understands multicast.
- **Anycast:** one-to-one-of-many. One destination address is served by several devices and the closest responds, for example anycast DNS.
- **Broadcast:** one-to-all on the local broadcast domain (ARP requests, some routing updates). IPv6 removed broadcast in favor of multicast.`,
          takeaways: ['Anycast DNS sends you to the nearest server sharing one address.', 'IPv6 has no broadcast; it uses multicast instead.'],
          checkpoints: [
            {
              at: 215,
              q: 'IPv6 does not use broadcast addresses at all.',
              type: TF,
              answer: 'True',
              explanation: 'Broadcast is common in IPv4, but IPv6 removed it completely and uses multicast instead.',
              topic: 'net-models',
              source: tx('Network Communication'),
            },
          ],
        },
        {
          key: 'intro-ip',
          title: 'Introduction to IP: encapsulation, TCP, UDP and ports',
          summary: 'How data is packaged, delivered and handed to the right application.',
          video: messer('ueth6WvFVMU', 850),
          content: `## What this lesson covers

- **Encapsulation:** application data goes inside a TCP or UDP segment, inside an IP packet, inside an Ethernet frame (header, payload, trailer).
- **TCP** is *connection-oriented* and *reliable*: formal setup and teardown, acknowledgments, retransmission and flow control.
- **UDP** is *connectionless* and "unreliable" only in the sense that there are **no acknowledgments**, so no recovery or flow control.
- A **socket** combines IP address, protocol and port. Servers usually listen on **non-ephemeral ports 0–1,023**; clients use temporary **ephemeral ports 1,024–65,535**.
- Changing a port number is **not** a security control; firewalls decide what is allowed. TCP port 80 and UDP port 80 are different ports.`,
          takeaways: ['TCP acknowledges data; UDP does not.', 'Port numbers range from 0 to 65,535.', 'Moving a service to another port does not make it more secure.'],
          checkpoints: [
            {
              at: 480,
              q: 'Which feature belongs to TCP but not UDP?',
              options: ['Acknowledgments that let the sender retransmit lost data', 'Port numbers', 'Running inside IP packets', 'Carrying application data'],
              answer: 'Acknowledgments that let the sender retransmit lost data',
              explanation: 'TCP is reliable because the receiver acknowledges data, enabling error recovery and flow control. UDP sends no acknowledgments.',
              topic: 'net-ports',
              source: tx('Introduction to IP'),
            },
            {
              at: 820,
              q: 'A client opens a connection from port 3000 to a web server on port 80. What kind of port is 3000 here?',
              options: ['An ephemeral (temporary) port', 'A well-known port reserved for web servers', 'A port that only UDP can use', 'An invalid port'],
              answer: 'An ephemeral (temporary) port',
              explanation: 'Clients typically use temporary ports from the 1,024–65,535 range, while servers listen on well-known ports such as 80 and 443.',
              topic: 'net-ports',
              source: tx('Introduction to IP'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Put this mnemonic to use: which OSI layer is layer 5?',
          options: ['Session', 'Presentation', 'Transport', 'Network'],
          answer: 'Session',
          explanation: '"All People Seem To Need Data Processing": Application (7), Presentation (6), Session (5), Transport (4), Network (3), Data link (2), Physical (1).',
          lesson: 'Understanding the OSI model',
          source: tx('Understanding the OSI Model'),
        },
        {
          q: 'A user reports a damaged fiber cable. At which OSI layer is this problem?',
          options: ['Layer 1, physical', 'Layer 2, data link', 'Layer 3, network', 'Layer 7, application'],
          answer: 'Layer 1, physical',
          explanation: 'Cables, fiber, signals and wireless interference are all physical-layer concerns.',
          lesson: 'Understanding the OSI model',
          source: tx('Understanding the OSI Model'),
        },
        {
          q: 'Encryption and decryption with SSL/TLS is usually associated with which OSI layer?',
          options: ['Layer 6, presentation', 'Layer 4, transport', 'Layer 2, data link', 'Layer 1, physical'],
          answer: 'Layer 6, presentation',
          explanation: 'The presentation layer covers character encoding and application encryption such as SSL/TLS.',
          lesson: 'Understanding the OSI model',
          source: tx('Understanding the OSI Model'),
        },
        {
          q: 'Which of these operate at OSI layer 7, the application layer? Select all that apply.',
          type: MULTI,
          options: ['HTTP', 'DNS', 'FTP', 'Ethernet frames'],
          answer: ['HTTP', 'DNS', 'FTP'],
          explanation: 'HTTP/HTTPS, FTP, DNS and POP3 are application-layer protocols. Ethernet frames are layer 2.',
          lesson: 'Understanding the OSI model',
          source: tx('Understanding the OSI Model'),
        },
        {
          q: 'A router decides where to send traffic by looking at which address?',
          options: ['The destination IP address', 'The destination MAC address', 'The source port number', 'The frame check sequence'],
          answer: 'The destination IP address',
          explanation: 'Routers operate at layer 3 and use the destination IP address to choose the next hop.',
          lesson: 'Networking devices',
          source: tx('Networking Devices'),
        },
        {
          q: 'A next-generation firewall (NGFW) can identify the applications traversing the network, not just port numbers.',
          type: TF,
          answer: 'True',
          explanation: 'Traditional firewalls filter on TCP/UDP ports; NGFWs identify applications and let you allow or block them.',
          lesson: 'Networking devices',
          source: tx('Networking Devices'),
        },
        {
          q: 'Which capabilities can a load balancer provide? Select all that apply.',
          type: MULTI,
          options: [
            'Remove a failed server from the rotation',
            'Perform SSL/TLS offload',
            'Cache responses',
            'Assign MAC addresses to servers',
          ],
          answer: ['Remove a failed server from the rotation', 'Perform SSL/TLS offload', 'Cache responses'],
          explanation: 'Load balancers distribute load, detect outages, offload TCP and SSL, cache data and prioritize traffic with QoS.',
          lesson: 'Networking devices',
          source: tx('Networking Devices'),
        },
        {
          q: 'What does a proxy do?',
          options: [
            'Makes requests on the user’s behalf, so it can cache, filter URLs and scan content',
            'Assigns IP addresses automatically',
            'Converts wireless signals to fiber',
            'Stores files at block level',
          ],
          answer: 'Makes requests on the user’s behalf, so it can cache, filter URLs and scan content',
          explanation: 'Sitting in the middle of the conversation lets a proxy cache answers, require authentication, filter URLs and check for malicious content.',
          lesson: 'Networking devices',
          source: tx('Networking Devices'),
        },
        {
          q: 'A single DNS service address is answered by whichever of several data centers is closest. What kind of communication is this?',
          options: ['Anycast', 'Broadcast', 'Multicast', 'Unicast to every server'],
          answer: 'Anycast',
          explanation: 'Anycast sends to one of many devices sharing the same address; the closest one responds.',
          lesson: 'Unicast, multicast, anycast and broadcast',
          source: tx('Network Communication'),
        },
        {
          q: 'An ARP request sent to every device on the local network is an example of which communication type?',
          options: ['Broadcast', 'Anycast', 'Unicast', 'Multicast'],
          answer: 'Broadcast',
          explanation: 'Broadcast is one-to-all, limited to the local broadcast domain; ARP requests and some routing updates use it.',
          lesson: 'Unicast, multicast, anycast and broadcast',
          source: tx('Network Communication'),
        },
        {
          q: 'Which statements describe UDP? Select all that apply.',
          type: MULTI,
          options: ['Connectionless', 'No acknowledgments are sent', 'No flow control', 'Formal session setup and teardown'],
          answer: ['Connectionless', 'No acknowledgments are sent', 'No flow control'],
          explanation: 'UDP has no setup or teardown and sends no acknowledgments, so it cannot recover from errors or perform flow control.',
          lesson: 'Introduction to IP: encapsulation, TCP, UDP and ports',
          source: tx('Introduction to IP'),
        },
        {
          q: 'What is the highest possible TCP or UDP port number?',
          type: FILL,
          answer: '65535',
          accepted: ['65,535'],
          explanation: 'Port numbers range from 0 to 65,535.',
          lesson: 'Introduction to IP: encapsulation, TCP, UDP and ports',
          source: tx('Introduction to IP'),
        },
        {
          q: 'Moving a web server from port 443 to port 8443 makes it more secure.',
          type: TF,
          answer: 'False',
          explanation: 'Port numbers designate which application receives data; they are not a security mechanism. A firewall decides what is allowed.',
          lesson: 'Introduction to IP: encapsulation, TCP, UDP and ports',
          source: tx('Introduction to IP'),
        },
        {
          q: 'Which three values make up a socket?',
          options: ['IP address, protocol (TCP or UDP) and port number', 'MAC address, VLAN and port', 'Hostname, password and port', 'Subnet mask, gateway and DNS server'],
          answer: 'IP address, protocol (TCP or UDP) and port number',
          explanation: 'A socket identifies one end of a conversation by its IP address, transport protocol and application port.',
          lesson: 'Introduction to IP: encapsulation, TCP, UDP and ports',
          source: tx('Introduction to IP'),
        },
      ],
      readings: [
        {
          title: 'The Design Philosophy of the DARPA Internet Protocols',
          authors: 'David D. Clark',
          publisher: 'ACM SIGCOMM',
          year: 1988,
          url: 'https://doi.org/10.1145/52324.52336',
          kind: 'PAPER',
          note: 'Why the internet was built around packets, gateways and best-effort delivery.',
        },
        {
          title: 'End-to-End Arguments in System Design',
          authors: 'Jerome H. Saltzer, David P. Reed, David D. Clark',
          publisher: 'ACM Transactions on Computer Systems',
          year: 1984,
          url: 'https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf',
          kind: 'PAPER',
          note: 'The principle behind keeping the network simple and putting reliability (like TCP’s) at the endpoints (doi:10.1145/357401.357402).',
        },
        {
          title: 'RFC 9293: Transmission Control Protocol (TCP)',
          authors: 'W. Eddy (ed.)',
          publisher: 'IETF',
          year: 2022,
          url: 'https://www.rfc-editor.org/rfc/rfc9293',
          kind: 'STANDARD',
          note: 'The current TCP specification, including connection setup and reliability.',
        },
      ],
    },

    // ── Module 2 ────────────────────────────────────────────────────
    {
      key: 'addressing-ports',
      title: 'Addressing, Subnets and Ports',
      description: 'IPv4 addresses and private ranges, subnet masks and CIDR, calculating subnets and hosts, and the ports of common services.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'ipv4',
          title: 'IPv4 addressing',
          summary: 'Addresses, subnet masks, gateways, DHCP, APIPA and RFC 1918 private ranges.',
          video: messer('JNNcyZ_VE2A', 665),
          content: `## What this lesson covers

- An IPv4 address is **32 bits**: four **octets** of 8 bits, each 0–255 (for example 192.168.1.165).
- The **subnet mask** decides which addresses are local; the **default gateway** is the local router used to reach other subnets.
- **Loopback:** 127.0.0.1 (127.0.0.1–127.255.255.254) tests your own IP stack.
- **DHCP** assigns settings automatically. Without a DHCP server, Windows uses **APIPA** link-local addresses in **169.254.x.x**, which cannot leave the local subnet.
- **RFC 1918 private ranges** (not routable on the internet; reached via NAT):
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16`,
          takeaways: ['A 169.254.x.x address usually means DHCP was not reached.', 'Private addresses need NAT to reach the internet.'],
          checkpoints: [
            {
              at: 360,
              q: 'A laptop shows the address 169.254.37.12 and cannot reach the internet. What is the most likely cause?',
              options: [
                'It could not reach a DHCP server and assigned itself an APIPA link-local address',
                'It has a public IP address',
                'Its loopback adapter is disabled',
                'It is using IPv6',
              ],
              answer: 'It could not reach a DHCP server and assigned itself an APIPA link-local address',
              explanation: 'APIPA addresses (169.254.x.x) are self-assigned when no DHCP server answers. They only work on the local subnet.',
              topic: 'net-addressing',
              source: tx('IPv4 Addressing'),
            },
            {
              at: 640,
              q: 'Which of these is an RFC 1918 private address range?',
              options: ['172.16.0.0 – 172.31.255.255', '172.0.0.0 – 172.255.255.255', '169.254.0.0 – 169.254.255.255', '127.0.0.0 – 127.255.255.255'],
              answer: '172.16.0.0 – 172.31.255.255',
              explanation: 'RFC 1918 reserves 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31) and 192.168.0.0/16. 169.254 is APIPA and 127 is loopback.',
              topic: 'net-addressing',
              source: tx('IPv4 Addressing'),
            },
          ],
        },
        {
          key: 'masks',
          title: 'IPv4 subnet masks and CIDR notation',
          summary: 'Converting between binary, decimal and slash notation.',
          video: messer('p5NJ5Jt6oJo', 540),
          content: `## What this lesson covers

- Since 1993, networks use **classless** addressing (**CIDR**): a mask can be any length.
- A mask is a run of 1s followed by 0s. **CIDR notation** counts the 1s: 255.255.255.0 is **/24**.
- The 1s mark the **network** bits; the 0s mark the **host** bits.
- Decimal values for an octet with 1–8 leading ones: 128, 192, 224, 240, 248, 252, 254, 255.

| CIDR | Decimal mask | Host bits |
| --- | --- | --- |
| /12 | 255.240.0.0 | 20 |
| /19 | 255.255.224.0 | 13 |
| /20 | 255.255.240.0 | 12 |
| /26 | 255.255.255.192 | 6 |`,
          takeaways: ['Count the 1s in the mask to get the CIDR prefix.', 'Network bits plus host bits always equal 32 in IPv4.'],
          checkpoints: [
            {
              at: 470,
              q: 'What is /26 in decimal subnet mask notation?',
              options: ['255.255.255.192', '255.255.255.0', '255.255.255.224', '255.255.192.0'],
              answer: '255.255.255.192',
              explanation: '/26 is three full octets (24 ones) plus two ones in the last octet; two leading ones equal 192.',
              topic: 'net-addressing',
              source: tx('IPv4 Subnet Masks'),
            },
          ],
        },
        {
          key: 'calculating',
          title: 'Calculating IPv4 subnets and hosts',
          summary: 'Using powers of two to size networks.',
          video: messer('cYQOMifDlKI', 586),
          content: `## What this lesson covers

- **Variable-length subnet masks (VLSM)** let you size each network exactly.
- **Number of subnets** = 2^(subnet bits borrowed beyond the classful default).
- **Hosts per subnet** = 2^(host bits) − 2 (one address for the network, one for broadcast).

Worked examples from the video:

- 10.1.1.0/24 → 16 subnet bits → 65,536 subnets; 8 host bits → 254 hosts.
- 192.168.11.0/26 → 2 subnet bits → 4 subnets; 6 host bits → 62 hosts.
- 172.16.55.0/21 → 5 subnet bits → 32 subnets; 11 host bits → 2,046 hosts.`,
          takeaways: ['Hosts per subnet is 2^hostbits − 2.', 'The two subtracted addresses are the network and broadcast addresses.'],
          checkpoints: [
            {
              at: 540,
              q: 'How many usable host addresses does a /26 subnet have?',
              type: FILL,
              answer: '62',
              explanation: 'A /26 leaves 6 host bits: 2⁶ − 2 = 64 − 2 = 62 hosts (minus the network and broadcast addresses).',
              topic: 'net-addressing',
              source: tx('Calculating IPv4 Subnets and Hosts'),
            },
          ],
        },
        {
          key: 'ports',
          title: 'Common ports',
          summary: 'The well-known port numbers every security professional should know.',
          video: messer('jX1pobYmZdE', 1222),
          content: `## What this lesson covers

| Service | Port |
| --- | --- |
| FTP (data / control) | TCP 20 / 21 |
| SSH and SFTP | TCP 22 |
| Telnet (unencrypted) | TCP 23 |
| SMTP / SMTP with TLS | TCP 25 / 587 |
| DNS | UDP 53 (TCP 53 for large transfers) |
| DHCP | UDP 67, 68 |
| TFTP | UDP 69 |
| HTTP / HTTPS | TCP 80 / 443 |
| NTP | UDP 123 |
| SNMP / SNMP traps | UDP 161 / 162 |
| LDAP / LDAPS | TCP 389 / 636 |
| SMB | TCP 445 |
| Syslog | UDP 514 |
| Microsoft SQL Server | TCP 1433 |
| RDP | TCP 3389 |
| SIP | TCP 5060, 5061 |

SNMPv3 adds integrity, authentication and encryption; v1 and v2 send data in the clear.`,
          takeaways: ['Telnet (23) sends everything, including passwords, in the clear; SSH (22) encrypts.', 'SNMPv3 is the secure version of SNMP.'],
          checkpoints: [
            {
              at: 380,
              q: 'Why has SSH replaced Telnet for remote administration?',
              options: ['SSH encrypts the session, including login credentials; Telnet sends everything in the clear', 'Telnet only works on Windows', 'SSH uses UDP', 'Telnet cannot run commands'],
              answer: 'SSH encrypts the session, including login credentials; Telnet sends everything in the clear',
              explanation: 'Telnet (TCP 23) is unencrypted, so a packet capture reveals credentials. SSH (TCP 22) encrypts all communication.',
              topic: 'net-ports',
              source: tx('Common Ports'),
            },
            {
              at: 1180,
              q: 'Which port does the Remote Desktop Protocol (RDP) use by default?',
              type: FILL,
              answer: '3389',
              accepted: ['tcp 3389', 'TCP 3389', 'tcp/3389'],
              explanation: 'RDP uses TCP port 3389.',
              topic: 'net-ports',
              source: tx('Common Ports'),
            },
          ],
        },
        {
          key: 'other-protocols',
          title: 'ICMP, GRE and IPsec',
          summary: 'Ping, tunnels and encrypted VPNs.',
          video: messer('5BahWbszVAY', 505),
          content: `## What this lesson covers

- **ICMP** is carried by IP but is not TCP or UDP. \`ping\` uses it, and it reports errors like "network unreachable" or "time exceeded".
- **GRE** creates tunnels but provides **no encryption**.
- **IPsec** encrypts VPN traffic and can sign packets for integrity and anti-replay.
  - **IKE** builds the security association; phase 1 (ISAKMP, **UDP 500**) uses Diffie-Hellman.
  - **AH** provides integrity only; **ESP** encrypts.
  - **Tunnel mode** encrypts the original IP header too; **transport mode** leaves it visible.`,
          takeaways: ['GRE tunnels are not encrypted on their own.', 'IPsec tunnel mode hides the original destination address.'],
          checkpoints: [
            {
              at: 470,
              q: 'Which IPsec mode encrypts the original IP header as well as the data?',
              options: ['Tunnel mode', 'Transport mode', 'Authentication Header only', 'GRE mode'],
              answer: 'Tunnel mode',
              explanation: 'Tunnel mode encrypts the entire original packet and adds a new IP header; transport mode leaves the original header in the clear.',
              topic: 'net-ports',
              source: tx('Other Useful Protocols'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'How many bits are in an IPv4 address?',
          options: ['32', '64', '128', '48'],
          answer: '32',
          explanation: 'IPv4 addresses are four octets of 8 bits each, 32 bits in total.',
          lesson: 'IPv4 addressing',
          source: tx('IPv4 Addressing'),
        },
        {
          q: 'Which address would you ping to test your own computer’s IP stack?',
          options: ['127.0.0.1', '192.168.1.1', '169.254.0.1', '255.255.255.255'],
          answer: '127.0.0.1',
          explanation: 'The loopback address refers to the local device itself.',
          lesson: 'IPv4 addressing',
          source: tx('IPv4 Addressing'),
        },
        {
          q: 'What is the role of the default gateway?',
          options: [
            'It is the local router used to reach addresses outside the local subnet',
            'It assigns IP addresses to clients',
            'It translates names to IP addresses',
            'It stores the subnet mask',
          ],
          answer: 'It is the local router used to reach addresses outside the local subnet',
          explanation: 'The default gateway must be on the local subnet; traffic for other subnets is sent to it.',
          lesson: 'IPv4 addressing',
          source: tx('IPv4 Addressing'),
        },
        {
          q: 'Which ranges are RFC 1918 private IPv4 ranges? Select all that apply.',
          type: MULTI,
          options: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'],
          answer: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
          explanation: 'RFC 1918 defines 10/8, 172.16/12 and 192.168/16. 169.254/16 is the APIPA link-local range.',
          lesson: 'IPv4 addressing',
          source: tx('IPv4 Addressing'),
        },
        {
          q: 'A subnet mask of 255.255.0.0 is written in CIDR notation as /___.',
          type: FILL,
          answer: '16',
          accepted: ['/16'],
          explanation: 'Two full octets of ones = 16 ones, so the CIDR notation is /16.',
          lesson: 'IPv4 subnet masks and CIDR notation',
          source: tx('IPv4 Subnet Masks'),
        },
        {
          q: 'What is the decimal mask for /20?',
          options: ['255.255.240.0', '255.255.255.240', '255.240.0.0', '255.255.224.0'],
          answer: '255.255.240.0',
          explanation: '/20 = two full octets (16 ones) plus four ones in the third octet, which is 240.',
          lesson: 'IPv4 subnet masks and CIDR notation',
          source: tx('IPv4 Subnet Masks'),
        },
        {
          q: 'A /19 network has how many host bits?',
          options: ['13', '19', '11', '8'],
          answer: '13',
          explanation: 'IPv4 has 32 bits; 32 − 19 = 13 host bits.',
          lesson: 'IPv4 subnet masks and CIDR notation',
          source: tx('IPv4 Subnet Masks'),
        },
        {
          q: 'Why do we subtract 2 when calculating hosts per subnet?',
          options: [
            'One address is the network address and one is the broadcast address',
            'Two addresses are reserved for DNS servers',
            'The router and the switch each need one',
            'It is a rounding convention',
          ],
          answer: 'One address is the network address and one is the broadcast address',
          explanation: 'Hosts = 2^hostbits − 2; the first and last addresses of each subnet are not assignable to hosts.',
          lesson: 'Calculating IPv4 subnets and hosts',
          source: tx('Calculating IPv4 Subnets and Hosts'),
        },
        {
          q: 'How many hosts can each subnet of 172.16.55.0/21 hold?',
          options: ['2,046', '2,048', '254', '32'],
          answer: '2,046',
          explanation: 'A /21 leaves 11 host bits: 2¹¹ − 2 = 2,048 − 2 = 2,046.',
          lesson: 'Calculating IPv4 subnets and hosts',
          source: tx('Calculating IPv4 Subnets and Hosts'),
        },
        {
          q: 'Which port does HTTPS use by default?',
          options: ['TCP 443', 'TCP 80', 'TCP 22', 'UDP 53'],
          answer: 'TCP 443',
          explanation: 'HTTP uses TCP 80 and HTTPS (HTTP over TLS) uses TCP 443.',
          lesson: 'Common ports',
          source: tx('Common Ports'),
        },
        {
          q: 'DNS name queries normally use which port and protocol?',
          options: ['UDP 53', 'TCP 25', 'UDP 123', 'TCP 389'],
          answer: 'UDP 53',
          explanation: 'Small DNS queries use UDP 53; large transfers between DNS servers use TCP 53.',
          lesson: 'Common ports',
          source: tx('Common Ports'),
        },
        {
          q: 'A Windows file share is accessed over which port?',
          options: ['TCP 445 (SMB)', 'TCP 3389 (RDP)', 'UDP 514 (syslog)', 'TCP 1433 (SQL Server)'],
          answer: 'TCP 445 (SMB)',
          explanation: 'Modern Windows uses SMB directly over TCP 445 for file and printer sharing.',
          lesson: 'Common ports',
          source: tx('Common Ports'),
        },
        {
          q: 'Which version of SNMP adds message integrity, authentication and encryption?',
          options: ['SNMPv3', 'SNMPv1', 'SNMPv2', 'All versions'],
          answer: 'SNMPv3',
          explanation: 'SNMPv1 and v2 send data in the clear; SNMPv3 adds integrity, authentication and encryption.',
          lesson: 'Common ports',
          source: tx('Common Ports'),
        },
        {
          q: 'Syslog messages are commonly sent to a SIEM over which port?',
          type: FILL,
          answer: '514',
          accepted: ['UDP 514', 'udp 514', 'udp/514'],
          explanation: 'Syslog commonly uses UDP port 514 to transfer log data to a central collector such as a SIEM.',
          lesson: 'Common ports',
          source: tx('Common Ports'),
        },
        {
          q: 'ICMP, used by ping, runs over TCP.',
          type: TF,
          answer: 'False',
          explanation: 'ICMP is carried by IP but is its own protocol; it uses neither TCP nor UDP.',
          lesson: 'ICMP, GRE and IPsec',
          source: tx('Other Useful Protocols'),
        },
        {
          q: 'Which IPsec protocol provides encryption of the data?',
          options: ['ESP (Encapsulating Security Payload)', 'AH (Authentication Header)', 'GRE', 'ICMP'],
          answer: 'ESP (Encapsulating Security Payload)',
          explanation: 'AH validates integrity but sends data in the clear; ESP encrypts the data and also provides authentication.',
          lesson: 'ICMP, GRE and IPsec',
          source: tx('Other Useful Protocols'),
        },
      ],
      readings: [
        {
          title: 'RFC 1918: Address Allocation for Private Internets',
          authors: 'Y. Rekhter et al.',
          publisher: 'IETF',
          year: 1996,
          url: 'https://www.rfc-editor.org/rfc/rfc1918',
          kind: 'STANDARD',
          note: 'Defines the three private IPv4 ranges used inside most networks.',
        },
        {
          title: 'RFC 4632: Classless Inter-domain Routing (CIDR)',
          authors: 'V. Fuller, T. Li',
          publisher: 'IETF',
          year: 2006,
          url: 'https://www.rfc-editor.org/rfc/rfc4632',
          kind: 'STANDARD',
          note: 'The plan behind slash notation and classless subnetting.',
        },
        {
          title: 'Service Name and Transport Protocol Port Number Registry',
          authors: 'Internet Assigned Numbers Authority',
          publisher: 'IANA',
          year: null,
          url: 'https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml',
          kind: 'DOCUMENTATION',
          note: 'The official registry of well-known port numbers.',
        },
        {
          title: 'RFC 791: Internet Protocol',
          authors: 'J. Postel (ed.)',
          publisher: 'IETF',
          year: 1981,
          url: 'https://www.rfc-editor.org/rfc/rfc791',
          kind: 'STANDARD',
          note: 'The original IPv4 specification.',
        },
      ],
    },

    // ── Module 3 ────────────────────────────────────────────────────
    {
      key: 'modern-networks',
      title: 'Modern Network Design and Monitoring',
      description: 'IPv6, NAT and PAT, VLANs and trunking, wireless encryption, zero trust, and logs and monitoring.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'ipv6',
          title: 'IPv6 addressing',
          summary: '128-bit addresses, compression rules and IPv4/IPv6 coexistence.',
          video: messer('CpLznUxkzg8', 829),
          content: `## What this lesson covers

- IPv4 supports about **4.29 billion** addresses and is exhausted. IPv6 addresses are **128 bits**, written as eight 16-bit hexadecimal groups.
- **Compression rules:** remove leading zeros in each group, and replace one run of all-zero groups with **::** (only once per address).
  - 2601:04C3:4002:BE00:0000:0000:0000:0066 → **2601:4C3:4002:BE00::66**
- IPv4 and IPv6 cannot talk directly. Bridging options: **tunneling** (6to4, 4in6), **dual stack** (most common) and **translation** (NAT64 with DNS64).`,
          takeaways: ['IPv6 addresses are 128 bits.', 'The double colon can be used only once in an address.', 'Dual stack runs IPv4 and IPv6 side by side.'],
          checkpoints: [
            {
              at: 470,
              q: 'In a compressed IPv6 address, how many times can the double colon (::) appear?',
              options: ['Once', 'Twice', 'Once per group', 'As many times as needed'],
              answer: 'Once',
              explanation: 'If :: appeared twice, you could not tell how many zero groups each one replaced. It can be used only once.',
              topic: 'net-addressing',
              source: tx('IPv6 Addressing'),
            },
            {
              at: 800,
              q: 'Which migration approach runs IPv4 and IPv6 on the same system at the same time?',
              options: ['Dual stack', '6to4 tunneling', 'APIPA', 'Port address translation'],
              answer: 'Dual stack',
              explanation: 'Dual stack gives an adapter both an IPv4 and an IPv6 address with separate routing tables, and is the most common approach.',
              topic: 'net-addressing',
              source: tx('IPv6 Addressing'),
            },
          ],
        },
        {
          key: 'nat',
          title: 'Network address translation',
          summary: 'How private addresses reach the internet, and how PAT shares one public address.',
          video: messer('UILwCNOC5EI', 422),
          content: `## What this lesson covers

- **NAT** translates private (RFC 1918) source addresses to public addresses on the way out, and back again for replies.
- Basic NAT maps one private address to one public address, which needs many public addresses.
- **PAT (port address translation, NAT overload)** also translates **port numbers**, so many internal devices share **one public IP address**; the NAT table tracks each private address and port.`,
          takeaways: ['PAT lets a whole network share one public IPv4 address.', 'The NAT table maps private address:port to public address:port.'],
          checkpoints: [
            {
              at: 395,
              q: 'Two internal hosts, 10.10.20.50 and 10.10.20.70, browse the web through the same public IP 94.1.1.1. What keeps their traffic apart?',
              options: ['PAT assigns each connection a different public port number', 'Each host gets its own MAC address on the internet', 'DNS tracks which host made which request', 'The web server sees the private addresses'],
              answer: 'PAT assigns each connection a different public port number',
              explanation: 'Port address translation records private address:port ↔ public address:port, so replies to each public port go back to the right host.',
              topic: 'net-modern',
              source: tx('Network Address Translation'),
            },
          ],
        },
        {
          key: 'vlans',
          title: 'VLANs and trunking',
          summary: 'Separating broadcast domains on one switch and carrying many VLANs on one link.',
          video: messer('ATbzbST_OIw', 749),
          content: `## What this lesson covers

- A **VLAN** separates broadcast domains on the same physical switch; devices on different VLANs cannot talk directly.
- An **802.1Q trunk** carries many VLANs over one link by adding a **12-bit VLAN tag** to each frame (up to 4,094 usable VLANs).
- The **native VLAN** crosses the trunk **untagged** and must match on both switches.
- A **layer 3 switch** routes between VLANs using **switched virtual interfaces (SVIs)**.
- Voice and data can use separate VLANs over the same cable.`,
          takeaways: ['802.1Q tags frames with a 12-bit VLAN ID.', 'Native VLAN traffic is untagged on the trunk.'],
          checkpoints: [
            {
              at: 560,
              q: 'On an 802.1Q trunk, which VLAN’s traffic is sent without a VLAN tag?',
              options: ['The native VLAN', 'VLAN 4094', 'The voice VLAN', 'Every VLAN'],
              answer: 'The native VLAN',
              explanation: 'The native VLAN crosses the trunk untagged, and it must be configured identically on both connected switches.',
              topic: 'net-modern',
              source: tx('VLANs and Trunking'),
            },
          ],
        },
        {
          key: 'wireless',
          title: 'Wireless encryption',
          summary: 'From WEP to WPA3.',
          video: messer('YNcobcHXnnY', 203),
          content: `## What this lesson covers

- Wireless security needs **authentication**, **confidentiality (encryption)** and **integrity** checks.
- **WEP** had serious cryptographic flaws. **WPA** was a stopgap on the same hardware.
- **WPA2** (2004) uses **CCMP**: AES encryption with CBC-MAC integrity.
- **WPA3** (2018) uses **GCMP**: AES encryption with GMAC integrity.
- Use the strongest option your access points and clients support.`,
          takeaways: ['WEP is broken; use WPA2 at minimum and WPA3 where possible.', 'Both WPA2 and WPA3 use AES for confidentiality.'],
          checkpoints: [
            {
              at: 190,
              q: 'Which wireless security standard was introduced in 2018 and uses GCMP?',
              options: ['WPA3', 'WPA2', 'WEP', 'WPA'],
              answer: 'WPA3',
              explanation: 'WPA2 (2004) uses CCMP; WPA3 (2018) uses GCMP with AES and GMAC.',
              topic: 'net-modern',
              source: tx('Wireless Encryption'),
            },
          ],
        },
        {
          key: 'zero-trust',
          title: 'Zero trust',
          summary: 'Verifying every user, device and application, inside the network too.',
          video: messer('jlMwWL4yalM', 401),
          content: `## What this lesson covers

- Traditional networks protect the edge, but the inside is wide open. **Zero trust** treats every user, device and application as **untrusted** until verified.
- **Adaptive identity:** authentication considers who the user is, where they connect from, the IP address and connection type, and may require extra factors for risky logins.
- **Least privilege:** give only the rights a job requires; admin rights for everyone means malware gets admin rights too.
- **SASE (Secure Access Service Edge):** a cloud-delivered, "next generation VPN" that brings security close to users and applications wherever they are.`,
          takeaways: ['Zero trust verifies every request, not just at the perimeter.', 'Least privilege limits the damage from compromised accounts.'],
          checkpoints: [
            {
              at: 360,
              q: 'Under least privilege, a user who only needs to read a database should get:',
              options: ['Read access only', 'Administrator rights to be safe', 'Write access in case they need it later', 'No authentication'],
              answer: 'Read access only',
              explanation: 'Rights should match the job. Extra rights, especially admin rights, also extend to any malware running as that user.',
              topic: 'net-modern',
              source: tx('Zero Trust'),
            },
          ],
        },
        {
          key: 'monitoring',
          title: 'Logs and monitoring',
          summary: 'NetFlow, protocol analyzers, baselines, syslog, SIEMs and port mirroring.',
          video: messer('ieqSi5Aicxc', 785),
          content: `## What this lesson covers

- **NetFlow:** probes summarize traffic flows; a **collector** stores them and generates reports (top talkers, top applications).
- **Protocol analyzers** capture the raw packets themselves.
- A **network performance baseline** describes a normal day, so you can spot anomalies.
- **Syslog** is the standard way to send logs (with facility codes and severity levels) to a **SIEM**, which provides dashboards, alerts, long-term reports and forensics, for example spotting brute-force or password-spraying attempts.
- **APIs** automate configuration across many devices.
- **Port mirroring (SPAN)** or a network **tap** copies traffic to an IDS/IPS or NetFlow collector.`,
          takeaways: ['A baseline tells you what “normal” looks like.', 'SPAN ports copy traffic for monitoring tools.'],
          checkpoints: [
            {
              at: 600,
              q: 'A SIEM query shows hundreds of failed logins for many usernames within minutes. What attack might this reveal?',
              options: ['Brute-force or password-spraying attack', 'A VLAN trunk failure', 'IPv6 address exhaustion', 'A DHCP lease renewal'],
              answer: 'Brute-force or password-spraying attack',
              explanation: 'Tracking failed authentications over time in a SIEM can reveal brute-force or password-spraying attempts.',
              topic: 'net-modern',
              source: tx('Logs and Monitoring'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'How many bits long is an IPv6 address?',
          options: ['128', '32', '64', '256'],
          answer: '128',
          explanation: 'IPv6 addresses have 128 bits, written as eight 16-bit hexadecimal groups.',
          lesson: 'IPv6 addressing',
          source: tx('IPv6 Addressing'),
        },
        {
          q: 'What is the compressed form of 2601:04C3:4002:BE00:0000:0000:0000:0066?',
          options: ['2601:4C3:4002:BE00::66', '2601:4C3:4002:BE::66', '2601:04C3:4002:BE00::0066:0', '2601::4C3::4002:BE00:66'],
          answer: '2601:4C3:4002:BE00::66',
          explanation: 'Remove leading zeros in each group (04C3 → 4C3, 0066 → 66) and replace the run of zero groups with ::. Trailing zeros (BE00) stay.',
          lesson: 'IPv6 addressing',
          source: tx('IPv6 Addressing'),
        },
        {
          q: 'What does NAT64 (with DNS64) allow?',
          options: [
            'An IPv6-only client to communicate with an IPv4-only server',
            'Two IPv4 networks to share a VLAN',
            'IPv4 addresses to become 128 bits long',
            'Wireless clients to use WPA3',
          ],
          answer: 'An IPv6-only client to communicate with an IPv4-only server',
          explanation: 'DNS64 returns an IPv6 address that points at the NAT64 router, which translates between IPv6 and IPv4.',
          lesson: 'IPv6 addressing',
          source: tx('IPv6 Addressing'),
        },
        {
          q: 'Why can a device with a private 192.168.x.x address browse the internet?',
          options: [
            'A NAT router translates its private address into a public address',
            'Private addresses are routable on the internet',
            'DNS converts private addresses automatically',
            'The browser uses IPv6 only',
          ],
          answer: 'A NAT router translates its private address into a public address',
          explanation: 'RFC 1918 addresses are not routable on the internet; NAT translates them on the way out and back on the way in.',
          lesson: 'Network address translation',
          source: tx('Network Address Translation'),
        },
        {
          q: 'Port address translation (PAT) is also known as NAT ___.',
          type: FILL,
          answer: 'overload',
          accepted: ['overloading'],
          explanation: 'PAT, or NAT overload, translates both addresses and ports so many hosts share one public address.',
          lesson: 'Network address translation',
          source: tx('Network Address Translation'),
        },
        {
          q: 'Devices on different VLANs of the same switch can communicate directly without a router or layer 3 switch.',
          type: TF,
          answer: 'False',
          explanation: 'Each VLAN is a separate broadcast domain. Traffic between VLANs needs routing, for example via SVIs on a layer 3 switch.',
          lesson: 'VLANs and trunking',
          source: tx('VLANs and Trunking'),
        },
        {
          q: 'How long is the VLAN ID in an 802.1Q tag?',
          options: ['12 bits', '8 bits', '16 bits', '32 bits'],
          answer: '12 bits',
          explanation: 'The 12-bit VLAN ID allows 4,094 usable VLANs after excluding reserved values.',
          lesson: 'VLANs and trunking',
          source: tx('VLANs and Trunking'),
        },
        {
          q: 'Why put voice-over-IP phones on a separate VLAN from computers?',
          options: [
            'Voice needs consistent access, and separating it prevents bursty data traffic from degrading calls',
            'Phones cannot use Ethernet',
            'VLANs encrypt voice calls',
            'It doubles the available IP addresses',
          ],
          answer: 'Voice needs consistent access, and separating it prevents bursty data traffic from degrading calls',
          explanation: 'Data traffic is bursty while voice needs steady access; separate voice and data VLANs keep them apart on the same cable.',
          lesson: 'VLANs and trunking',
          source: tx('VLANs and Trunking'),
        },
        {
          q: 'Which wireless standard should no longer be used because of serious cryptographic vulnerabilities?',
          options: ['WEP', 'WPA2', 'WPA3', 'AES'],
          answer: 'WEP',
          explanation: 'WEP was found to have significant cryptographic flaws and was quickly replaced by WPA, then WPA2 and WPA3.',
          lesson: 'Wireless encryption',
          source: tx('Wireless Encryption'),
        },
        {
          q: 'Which three goals does wireless security address? Select all that apply.',
          type: MULTI,
          options: ['Authentication (who may join)', 'Confidentiality (encryption)', 'Integrity (message integrity check)', 'Higher transmission speed'],
          answer: ['Authentication (who may join)', 'Confidentiality (encryption)', 'Integrity (message integrity check)'],
          explanation: 'Wireless security limits who can access the network, encrypts traffic, and verifies messages were not altered.',
          lesson: 'Wireless encryption',
          source: tx('Wireless Encryption'),
        },
        {
          q: 'In a zero trust model, which of these are inherently untrusted until verified? Select all that apply.',
          type: MULTI,
          options: ['Users', 'Devices', 'Applications', 'Nothing inside the corporate network'],
          answer: ['Users', 'Devices', 'Applications'],
          explanation: 'Zero trust treats every user, device and application as untrusted and verifies traffic everywhere, including inside the network.',
          lesson: 'Zero trust',
          source: tx('Zero Trust'),
        },
        {
          q: 'A user signs in with the correct password, but from an unusual country at 3 a.m. over a VPN. Under adaptive identity, what might happen?',
          options: [
            'The system requires additional authentication factors or denies the login',
            'The login is always allowed because the password was correct',
            'The user is given administrator rights',
            'The user’s VLAN is changed',
          ],
          answer: 'The system requires additional authentication factors or denies the login',
          explanation: 'Adaptive identity weighs who, where, which IP and how the user connects, and can demand more factors or deny risky attempts.',
          lesson: 'Zero trust',
          source: tx('Zero Trust'),
        },
        {
          q: 'What is a network performance baseline used for?',
          options: [
            'Knowing what normal looks like, so you can tell whether current activity is unusual',
            'Assigning IP addresses',
            'Encrypting syslog messages',
            'Replacing the SIEM',
          ],
          answer: 'Knowing what normal looks like, so you can tell whether current activity is unusual',
          explanation: 'Comparing current values to the baseline shows whether utilization or behavior is better or worse than a normal day.',
          lesson: 'Logs and monitoring',
          source: tx('Logs and Monitoring'),
        },
        {
          q: 'What does NetFlow provide?',
          options: [
            'Summary statistics (metadata) about traffic flows',
            'A full copy of every packet payload',
            'Encryption for wireless networks',
            'IP address assignment',
          ],
          answer: 'Summary statistics (metadata) about traffic flows',
          explanation: 'NetFlow summarizes flows (top conversations, endpoints, applications); a protocol analyzer captures raw packets.',
          lesson: 'Logs and monitoring',
          source: tx('Logs and Monitoring'),
        },
        {
          q: 'A switch feature that copies traffic from one port to another port where an IDS is connected is called port ___.',
          type: FILL,
          answer: 'mirroring',
          accepted: ['mirror', 'mirroring (SPAN)', 'SPAN'],
          explanation: 'Port mirroring, also called SPAN (switched port analyzer), sends a copy of traffic to monitoring tools.',
          lesson: 'Logs and monitoring',
          source: tx('Logs and Monitoring'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-207: Zero Trust Architecture',
          authors: 'Scott Rose, Oliver Borchert, Stu Mitchell, Sean Connelly',
          publisher: 'NIST',
          year: 2020,
          url: 'https://csrc.nist.gov/pubs/sp/800/207/final',
          kind: 'STANDARD',
          note: 'The reference definition of zero trust and its deployment models.',
        },
        {
          title: 'The Generative Internet',
          authors: 'Jonathan Zittrain',
          publisher: 'Harvard Law Review, vol. 119',
          year: 2006,
          url: 'https://dash.harvard.edu/handle/1/9385626',
          kind: 'PAPER',
          note: 'A Harvard Law School professor on how the internet’s open design drives innovation and also invites security threats (Harvard DASH repository).',
        },
        {
          title: 'RFC 8200: Internet Protocol, Version 6 (IPv6) Specification',
          authors: 'S. Deering, R. Hinden',
          publisher: 'IETF',
          year: 2017,
          url: 'https://www.rfc-editor.org/rfc/rfc8200',
          kind: 'STANDARD',
          note: 'The current IPv6 specification.',
        },
        {
          title: 'RFC 3022: Traditional IP Network Address Translator (Traditional NAT)',
          authors: 'P. Srisuresh, K. Egevang',
          publisher: 'IETF',
          year: 2001,
          url: 'https://www.rfc-editor.org/rfc/rfc3022',
          kind: 'STANDARD',
          note: 'Defines basic NAT and NAPT (port address translation).',
        },
      ],
    },

    // ── Module 4 ────────────────────────────────────────────────────
    {
      key: 'linux-cli',
      title: 'The Linux Command Line',
      description: 'Navigating the file system, users and privileges, working with files, and common networking commands.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'navigation',
          title: 'Navigating the file system',
          summary: 'man, pwd, ls, cd, mkdir, rmdir, rm, cp, mv, passwd, locate and updatedb.',
          video: tcm('r8giT8BBdw8', 740),
          content: `## What this lesson covers

The video covers the commands below. Practice them in a Linux virtual machine (the TCM series uses Kali Linux).

| Command | What it does |
| --- | --- |
| \`man ls\` | Show the manual page for a command |
| \`pwd\` | Print the current (working) directory |
| \`ls -la\` | List files, including hidden ones, with details |
| \`cd /etc\` / \`cd ..\` | Change directory / go up one level |
| \`mkdir\`, \`rmdir\` | Make / remove an (empty) directory |
| \`rm\`, \`cp\`, \`mv\` | Remove, copy, move or rename files |
| \`passwd\` | Change your password |
| \`locate\` / \`updatedb\` | Find files by name / refresh locate’s database |

> **Instructor review:** questions for this lesson are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['Use man to read any command’s manual.', 'locate searches a database that updatedb refreshes.'],
          checkpoints: [
            {
              at: 650,
              q: 'Which command prints the directory you are currently in?',
              type: FILL,
              answer: 'pwd',
              explanation: 'pwd ("print working directory") shows your current location in the file system.',
              topic: 'linux-cli',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
        {
          key: 'users',
          title: 'Users and privileges',
          summary: 'adduser, su, sudo and chmod.',
          video: tcm('Sl60jGmr8e0', 579),
          content: `## What this lesson covers

- \`adduser\` creates a user account.
- \`su\` switches to another user; \`sudo\` runs a single command with elevated (root) privileges.
- \`chmod\` changes file permissions. Permissions are read (4), write (2) and execute (1) for the **owner**, **group** and **others**:
  - \`chmod 755 script.sh\` → owner rwx, group r-x, others r-x
  - \`chmod +x script.sh\` → add execute permission

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['sudo runs one command as root without switching user.', 'In octal permissions, read = 4, write = 2, execute = 1.'],
          checkpoints: [
            {
              at: 500,
              q: 'After running chmod 755 on a file, what can "others" (not the owner or group) do with it?',
              options: ['Read and execute it', 'Read, write and execute it', 'Only write it', 'Nothing'],
              answer: 'Read and execute it',
              explanation: '7 = rwx for the owner, 5 = r-x for the group and 5 = r-x for others (4 read + 1 execute).',
              topic: 'linux-cli',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
        {
          key: 'files',
          title: 'Viewing, creating and editing files',
          summary: 'echo, cat, touch, nano and gedit.',
          video: tcm('Lhubd_vrBjU', 376),
          content: `## What this lesson covers

- \`echo "text" > file.txt\` writes text to a file (**>** overwrites); **>>** appends instead.
- \`cat file.txt\` prints a file's contents.
- \`touch notes.txt\` creates an empty file (or updates its timestamp).
- \`nano\` is a terminal text editor; \`gedit\` is a graphical editor.

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['> overwrites a file; >> appends to it.', 'touch creates an empty file.'],
          checkpoints: [
            {
              at: 330,
              q: 'What does this sequence leave in notes.txt?',
              code: 'echo "one" > notes.txt\necho "two" >> notes.txt\ncat notes.txt',
              type: 'CODE_OUTPUT',
              answer: 'one\ntwo',
              explanation: 'The first > creates (or overwrites) the file with "one"; >> appends "two" on a new line; cat prints both lines.',
              topic: 'linux-cli',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
        {
          key: 'network-commands',
          title: 'Common network commands',
          summary: 'ifconfig, iwconfig, ping, arp, route and netstat.',
          video: tcm('CxzdU71yiaY', 368),
          content: `## What this lesson covers

| Command | Shows or does |
| --- | --- |
| \`ifconfig\` (or \`ip a\`) | Network interfaces and IP addresses |
| \`iwconfig\` | Wireless interface settings |
| \`ping\` | Tests reachability using ICMP |
| \`arp -a\` | The ARP table (IP ↔ MAC mappings) |
| \`route\` (or \`ip route\`) | The routing table, including the default gateway |
| \`netstat\` (or \`ss\`) | Network connections and listening ports |

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['arp maps IP addresses to MAC addresses.', 'netstat shows connections and listening ports.'],
          checkpoints: [
            {
              at: 330,
              q: 'Which command shows the table that maps IP addresses to MAC addresses on your local network?',
              options: ['arp', 'route', 'ping', 'iwconfig'],
              answer: 'arp',
              explanation: 'The ARP (Address Resolution Protocol) table maps local IP addresses to MAC addresses; arp -a lists it.',
              topic: 'linux-cli',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which command shows the manual page for another command?',
          options: ['man', 'help-me', 'locate', 'info-all'],
          answer: 'man',
          explanation: 'man <command> opens that command’s manual page.',
          lesson: 'Navigating the file system',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command moves you up one directory level?',
          options: ['cd ..', 'cd ~', 'cd /', 'pwd ..'],
          answer: 'cd ..',
          explanation: '.. refers to the parent directory; cd ~ goes home and cd / goes to the root.',
          lesson: 'Navigating the file system',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which ls option shows hidden files (names starting with a dot)?',
          options: ['-a', '-h', '-r', '-s'],
          answer: '-a',
          explanation: 'ls -a lists all entries, including hidden dotfiles; -l adds details, so ls -la is common.',
          lesson: 'Navigating the file system',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'locate cannot find a file you just created. Which command refreshes its database?',
          type: FILL,
          answer: 'updatedb',
          accepted: ['sudo updatedb'],
          explanation: 'locate searches a prebuilt index; updatedb rebuilds it so new files appear.',
          lesson: 'Navigating the file system',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command renames report.txt to final.txt?',
          options: ['mv report.txt final.txt', 'cp report.txt final.txt', 'rm report.txt final.txt', 'rename-file report.txt'],
          answer: 'mv report.txt final.txt',
          explanation: 'mv moves or renames; cp would leave the original in place.',
          lesson: 'Navigating the file system',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'What is the difference between su and sudo?',
          options: [
            'su switches to another user’s shell; sudo runs a single command with elevated privileges',
            'They are identical',
            'sudo creates users; su deletes them',
            'su only works on Windows',
          ],
          answer: 'su switches to another user’s shell; sudo runs a single command with elevated privileges',
          explanation: 'sudo elevates one command (and is logged), while su starts a session as another user.',
          lesson: 'Users and privileges',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command makes the script scan.sh executable?',
          options: ['chmod +x scan.sh', 'chown +x scan.sh', 'exec scan.sh', 'sudo scan.sh'],
          answer: 'chmod +x scan.sh',
          explanation: 'chmod changes permissions; +x adds execute permission.',
          lesson: 'Users and privileges',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'In octal file permissions, what number represents read + write (no execute)?',
          type: FILL,
          answer: '6',
          explanation: 'Read = 4, write = 2, execute = 1. Read + write = 6.',
          lesson: 'Users and privileges',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which statements about output redirection are true? Select all that apply.',
          type: MULTI,
          options: ['> overwrites the file', '>> appends to the file', '> deletes the command', '>> only works with cat'],
          answer: ['> overwrites the file', '>> appends to the file'],
          explanation: '> replaces the file contents; >> adds to the end.',
          lesson: 'Viewing, creating and editing files',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command creates an empty file named notes.txt?',
          options: ['touch notes.txt', 'cat notes.txt', 'mkdir notes.txt', 'man notes.txt'],
          answer: 'touch notes.txt',
          explanation: 'touch creates an empty file if it does not exist (or updates the timestamp if it does).',
          lesson: 'Viewing, creating and editing files',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'nano is a text editor that runs inside the terminal.',
          type: TF,
          answer: 'True',
          explanation: 'nano is a terminal editor; gedit is a graphical one.',
          lesson: 'Viewing, creating and editing files',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command tests whether a host is reachable using ICMP echo requests?',
          options: ['ping', 'arp', 'netstat', 'ifconfig'],
          answer: 'ping',
          explanation: 'ping sends ICMP echo requests and reports replies.',
          lesson: 'Common network commands',
          review: true,
          source: `${LINUX_SRC} ICMP behavior also covered in ${tx('Other Useful Protocols')}.`,
        },
        {
          q: 'Which command lists your network interfaces and their IP addresses?',
          options: ['ifconfig', 'route', 'passwd', 'locate'],
          answer: 'ifconfig',
          explanation: 'ifconfig (or the newer ip a) shows each interface with its IP and MAC address.',
          lesson: 'Common network commands',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'You want to see which ports are listening on your Linux machine. Which command helps?',
          options: ['netstat', 'touch', 'iwconfig', 'echo'],
          answer: 'netstat',
          explanation: 'netstat (or ss) shows network connections and listening ports, for example netstat -tulnp.',
          lesson: 'Common network commands',
          review: true,
          source: LINUX_SRC,
        },
      ],
      readings: [
        {
          title: 'The UNIX Time-Sharing System',
          authors: 'Dennis M. Ritchie, Ken Thompson',
          publisher: 'Communications of the ACM',
          year: 1974,
          url: 'https://doi.org/10.1145/361011.361061',
          kind: 'PAPER',
          note: 'The paper that introduced UNIX, the ancestor of Linux’s file system and permission model.',
        },
        {
          title: 'hier(7): description of the file system hierarchy',
          authors: 'Linux man-pages project',
          publisher: 'man7.org',
          year: null,
          url: 'https://man7.org/linux/man-pages/man7/hier.7.html',
          kind: 'DOCUMENTATION',
          note: 'What lives in /etc, /var, /home and the other standard directories.',
        },
        {
          title: 'The Linux man-pages project',
          authors: 'Michael Kerrisk et al.',
          publisher: 'man7.org',
          year: null,
          url: 'https://man7.org/linux/man-pages/',
          kind: 'DOCUMENTATION',
          note: 'The reference manuals for every command used in this module.',
        },
      ],
    },

    // ── Module 5 ────────────────────────────────────────────────────
    {
      key: 'linux-admin',
      title: 'Linux Tools, Services and Bash Scripting',
      description: 'Installing and updating tools, controlling services, and automating tasks with Bash.',
      difficulty: 'INTERMEDIATE',
      lessons: [
        {
          key: 'tools',
          title: 'Installing and updating tools',
          summary: 'apt for packages and git for tools hosted on GitHub.',
          video: tcm('k6isN-5-qdM', 473),
          content: `## What this lesson covers

- \`sudo apt update\` refreshes the list of available packages; \`sudo apt upgrade\` installs newer versions.
- \`sudo apt install <package>\` installs a package (the video uses the older \`apt-get\` form, which works the same way).
- \`git clone <url>\` downloads a copy of a repository, for example a tool hosted on GitHub.

Keep tools updated: as Module 3 of Cybersecurity Foundations explains, updates fix known security holes.

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['apt update refreshes package lists; apt upgrade installs updates.', 'git clone copies a repository locally.'],
          checkpoints: [
            {
              at: 420,
              q: 'Which command downloads a copy of a tool’s GitHub repository to your machine?',
              options: ['git clone <url>', 'apt update <url>', 'wget --install <url>', 'git push <url>'],
              answer: 'git clone <url>',
              explanation: 'git clone copies the repository (with its history) into a new local directory.',
              topic: 'linux-admin',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
        {
          key: 'services',
          title: 'Controlling services',
          summary: 'Starting, stopping and enabling services with service and systemctl.',
          video: tcm('qEyJzThzJ6c', 253),
          content: `## What this lesson covers

- \`sudo service apache2 start\` / \`stop\` starts or stops a service.
- \`sudo systemctl start ssh\`, \`systemctl stop ssh\` and \`systemctl status ssh\` do the same with systemd.
- \`sudo systemctl enable ssh\` makes the service start automatically at boot; \`disable\` stops that.

Only run the services you need: every listening service is something an attacker can scan for.

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['systemctl enable starts a service at every boot.', 'Each running network service increases your attack surface.'],
          checkpoints: [
            {
              at: 230,
              q: 'Which command makes the SSH service start automatically every time the system boots?',
              options: ['sudo systemctl enable ssh', 'sudo systemctl start ssh', 'sudo service ssh status', 'sudo apt install ssh --boot'],
              answer: 'sudo systemctl enable ssh',
              explanation: 'start runs it now; enable configures it to start at boot.',
              topic: 'linux-admin',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
        {
          key: 'bash',
          title: 'Scripting with Bash',
          summary: 'grep, cut, tr, for loops and if statements.',
          video: tcm('GENx_pXo7Co', 1154),
          content: `## What this lesson covers

- \`grep\` filters lines that match a pattern; \`cut\` extracts fields; \`tr\` translates or deletes characters.
- Pipes (\`|\`) send one command’s output into the next.
- A script starts with \`#!/bin/bash\`, takes arguments as \`$1\`, \`$2\`…, and uses \`if\` and \`for\` for logic and loops.

\`\`\`bash
#!/bin/bash
# Ping every host in a /24 and print the ones that reply
if [ "$1" == "" ]; then
  echo "Usage: ./sweep.sh 192.168.1"
else
  for ip in $(seq 1 254); do
    ping -c 1 $1.$ip | grep "64 bytes" | cut -d " " -f 4 | tr -d ":" &
  done
fi
\`\`\`

Only scan networks you own or are authorized to test.

> **Instructor review:** questions are based on the commands listed in the video description and their standard behavior.`,
          takeaways: ['Pipes chain small commands into powerful one-liners.', '$1 is the first argument passed to a script.'],
          checkpoints: [
            {
              at: 1100,
              q: 'What does this pipeline print?',
              code: 'echo "64 bytes from 192.168.1.7: icmp_seq=1" | cut -d " " -f 4 | tr -d ":"',
              type: 'CODE_OUTPUT',
              answer: '192.168.1.7',
              explanation: 'cut splits on spaces and takes field 4 ("192.168.1.7:"), then tr -d ":" deletes the colon.',
              topic: 'linux-admin',
              review: true,
              source: LINUX_SRC,
            },
          ],
        },
      ],
      bank: [
        {
          q: 'What does sudo apt update do?',
          options: ['Refreshes the list of available packages and versions', 'Installs every available update', 'Removes unused packages', 'Updates the Linux kernel only'],
          answer: 'Refreshes the list of available packages and versions',
          explanation: 'apt update refreshes package lists; apt upgrade actually installs newer versions.',
          lesson: 'Installing and updating tools',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which command installs the nmap package on a Debian-based system such as Kali?',
          options: ['sudo apt install nmap', 'sudo git nmap', 'sudo systemctl install nmap', 'sudo chmod nmap'],
          answer: 'sudo apt install nmap',
          explanation: 'apt install (or apt-get install) installs packages from the configured repositories.',
          lesson: 'Installing and updating tools',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Keeping tools and the operating system updated reduces exposure to known vulnerabilities.',
          type: TF,
          answer: 'True',
          explanation: 'Updates fix security holes found in earlier versions.',
          lesson: 'Installing and updating tools',
          review: true,
          source: `${LINUX_SRC} See also CS50 Cybersecurity notes, Lecture 2 (automatic updates).`,
        },
        {
          q: 'Which command shows whether the SSH service is currently running?',
          options: ['systemctl status ssh', 'systemctl enable ssh', 'apt status ssh', 'chmod ssh'],
          answer: 'systemctl status ssh',
          explanation: 'systemctl status shows whether a service is active, plus recent log lines.',
          lesson: 'Controlling services',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Which commands can stop a running service? Select all that apply.',
          type: MULTI,
          options: ['sudo systemctl stop apache2', 'sudo service apache2 stop', 'sudo systemctl enable apache2', 'sudo apt update apache2'],
          answer: ['sudo systemctl stop apache2', 'sudo service apache2 stop'],
          explanation: 'Both systemctl stop and service … stop stop a running service; enable only affects boot behavior.',
          lesson: 'Controlling services',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'Why disable services you do not need?',
          options: [
            'Every listening service is something an attacker can find and target',
            'Services slow down the keyboard',
            'Disabled services are encrypted',
            'It frees up IP addresses',
          ],
          answer: 'Every listening service is something an attacker can find and target',
          explanation: 'Fewer listening services means a smaller attack surface; port scans reveal what is running.',
          lesson: 'Controlling services',
          review: true,
          source: `${LINUX_SRC} Port scanning is covered in CS50 Cybersecurity notes, Lecture 2.`,
        },
        {
          q: 'Which command prints only the lines of a file that contain the word "error"?',
          options: ['grep error file.log', 'cut error file.log', 'tr error file.log', 'touch error file.log'],
          answer: 'grep error file.log',
          explanation: 'grep filters input to lines matching a pattern.',
          lesson: 'Scripting with Bash',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'In a Bash script, which variable holds the first argument passed on the command line?',
          type: FILL,
          answer: '$1',
          accepted: ['${1}'],
          explanation: '$1, $2 and so on hold positional arguments; $0 is the script name.',
          lesson: 'Scripting with Bash',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'What does this command print?',
          code: 'echo "a:b:c" | cut -d ":" -f 2',
          type: 'CODE_OUTPUT',
          answer: 'b',
          explanation: 'cut -d ":" splits on colons and -f 2 selects the second field, b.',
          lesson: 'Scripting with Bash',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'What does the | (pipe) character do?',
          options: [
            'Sends the output of one command as the input to the next',
            'Runs two commands at the same time on different machines',
            'Saves output to a file',
            'Comments out the rest of the line',
          ],
          answer: 'Sends the output of one command as the input to the next',
          explanation: 'Pipes connect commands into pipelines such as ping … | grep … | cut ….',
          lesson: 'Scripting with Bash',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'What is the first line of a Bash script usually?',
          options: ['#!/bin/bash', '// bash script', '<?bash ?>', 'import bash'],
          answer: '#!/bin/bash',
          explanation: 'The shebang line tells the system which interpreter runs the script.',
          lesson: 'Scripting with Bash',
          review: true,
          source: LINUX_SRC,
        },
        {
          q: 'It is acceptable to run a ping sweep script against any network, as long as you only send pings.',
          type: TF,
          answer: 'False',
          explanation: 'Only scan networks you own or have written authorization to test. Unauthorized scanning can violate policy and law.',
          lesson: 'Scripting with Bash',
          review: true,
          source: 'Course policy; ethical hacking requires authorization (CS50 Cybersecurity notes, Lecture 2).',
        },
      ],
      readings: [
        {
          title: 'GNU Bash Reference Manual',
          authors: 'Chet Ramey, Brian Fox',
          publisher: 'Free Software Foundation',
          year: null,
          url: 'https://www.gnu.org/software/bash/manual/bash.html',
          kind: 'DOCUMENTATION',
          note: 'The authoritative reference for Bash syntax, variables, loops and conditionals.',
        },
        {
          title: 'CIS Critical Security Controls Version 8.1',
          authors: 'Center for Internet Security',
          publisher: 'CIS',
          year: 2024,
          url: 'https://www.cisecurity.org/controls/v8-1',
          kind: 'STANDARD',
          note: 'Includes inventory of software, secure configuration and removing unneeded services, the practices behind this module.',
        },
      ],
    },
  ],
};

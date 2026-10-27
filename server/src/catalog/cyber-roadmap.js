// Roadmap: Cybersecurity: Foundations to Specialization. Four stages that take a beginner from how computers and the
// internet work to choosing a specialty. It reuses the existing catalog courses instead of repeating them: Stage 2
// links "Cybersecurity Foundations" and "Networking & Linux Foundations", and Stage 4 points to the other courses as
// specialty tracks.
//
// Videos and how the questions were grounded:
// - CS50's Understanding Technology, Harvard (playlist PLhQjrBD2T382p8amnvUp1rws1p7n7gJ2p, CC BY-NC-SA 4.0), cut at the
//   lectures' own chapter markers. Questions follow the published notes (cs50.harvard.edu/technology/notes/1/ and /2/).
// - Professor Messer, Security+ SY0-701 (free on YouTube). Questions follow the transcripts on professormesser.com.
//   Messer videos have no chapter markers, so checkpoint times were placed from each topic's position in the transcript.
// - TCM Security, SOC 101 (free on YouTube), cut at its chapter markers. No transcript was available, so those questions
//   rely on the chapter titles plus the cited documentation and are flagged for instructor review.
// - Linux, VirtualBox, Wireshark and OverTheWire facts in exams come from the official documentation cited in `source`.
import { TF, MULTI, youtube } from './helpers.js';

const CS50 = "CS50's Understanding Technology, Harvard University (David J. Malan). CC BY-NC-SA 4.0.";
const MESSER = 'Professor Messer, CompTIA Security+ SY0-701 Training Course (free on YouTube).';
const TCM = 'TCM Security, Security Operations (SOC) 101 Course (free on YouTube).';
const HW = '6mbFO0ZLMW8'; // CS50 UT: Hardware (59 min)
const NET = 'n_KghQP86Sw'; // CS50 UT: Internet (52 min)
const SOC = '56NDgBOSpUg';
const cs50 = (id, start, end) => youtube(id, { start, end, credit: CS50 });
const messer = (id, duration) => youtube(id, { duration, credit: MESSER });
const soc = (start, end) => youtube(SOC, { start, end, credit: TCM });
const notes = (n) => `CS50 Understanding Technology notes, ${n === 1 ? 'Hardware' : 'Internet'}`;
const tx = (title) => `Professor Messer transcript, "${title}"`;
const socSrc = (chapter, doc) => `TCM SOC 101 chapter "${chapter}"${doc ? `; facts from ${doc}` : ''}. Confirm against the video.`;

const SAFETY = `> **Stay legal and safe.** Only test systems you own or have written permission to test. Practice on your own
> virtual machines or on platforms built for it, such as OverTheWire. Scanning or attacking anyone else's systems, even
> "just to look", can be a crime.`;

export default {
  key: 'cyber-roadmap',
  version: 1,
  topics: {
    'road-start': 'Computer and internet basics',
    'road-core': 'Core security skills',
    'road-practice': 'Safe lab practice',
    'road-specialty': 'Security specialties',
  },
  roadmap: {
    slug: 'cybersecurity-foundations-to-specialization',
    title: 'Cybersecurity: Foundations to Specialization',
    summary: 'A four-stage roadmap from how computers work to choosing a cybersecurity specialty.',
    description:
      'A guided path for students who are new to cybersecurity, with skip tests for those who already know the basics. Stage 1 explains how computers and the internet work and the core ideas of security. Stage 2 builds core skills in networking, Linux, accounts and identity, and security fundamentals through two full courses. Stage 3 sets up a safe practice lab on your own computer with guided exercises. Stage 4 introduces four specialties (security operations and incident response, network and cloud security, application security, and authorized penetration testing) and the courses and resources for each. Every video has a short question; score at least 80% on a video\'s questions to open the next one, and at least 80% on each stage exam to unlock the next stage.',
    category: 'Cybersecurity',
    difficulty: 'BEGINNER',
    prerequisites: ['No prior experience needed', 'A computer you can install software on (needed from Stage 3)'],
    learningOutcomes: [
      'Explain how computers store data and how the internet moves it: binary, hardware, IP addresses, DNS, TCP, UDP and ports',
      'Apply the CIA triad and the categories and types of security controls to everyday situations',
      'Use networking, Linux command-line, identity and security fundamentals at a beginner level',
      'Build an isolated virtual lab and practice safely, only on systems you own or have permission to use',
      'Compare four cybersecurity specialties and choose a next course and practice platform',
    ],
    sources: [
      {
        title: "CS50's Understanding Technology (YouTube playlist)",
        author: 'CS50, Harvard University',
        url: 'https://www.youtube.com/playlist?list=PLhQjrBD2T382p8amnvUp1rws1p7n7gJ2p',
        license: 'CC BY-NC-SA 4.0',
      },
      { title: 'Course notes', author: 'CS50, Harvard University', url: 'https://cs50.harvard.edu/technology/', license: 'CC BY-NC-SA 4.0' },
      {
        title: 'CompTIA Security+ SY0-701 Training Course (YouTube playlist)',
        author: 'Professor Messer',
        url: 'https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
      {
        title: 'Security Operations (SOC) 101 Course',
        author: 'TCM Security',
        url: 'https://www.youtube.com/watch?v=56NDgBOSpUg',
        license: 'Free to watch on YouTube; embedded with attribution',
      },
    ],
    checkpointPassPercent: 80,
    order: 0,
    isFeatured: true,
  },
  modules: [
    // ── Stage 1 ─────────────────────────────────────────────────────
    {
      key: 'getting-started',
      title: 'Stage 1: Getting Started',
      description: 'How computers store data, how the internet moves it, and the basic ideas of security.',
      difficulty: 'BEGINNER',
      passPercent: 80,
      quizCount: 10,
      allowTestOut: true,
      time: 'About 3 to 4 hours: 2 hours of video plus the exercises',
      outcomes: [
        'Convert small numbers between binary and decimal, and explain bits, bytes and ASCII',
        'Describe what the CPU, RAM, hard drives, SSDs and the operating system do',
        'Explain IP addresses, DHCP, DNS, packets, TCP, UDP, ports and routers',
        'Explain confidentiality, integrity and availability, and sort security controls by category and type',
      ],
      prerequisites: ['None. If you already work in IT, try the skip test first.'],
      practice: `### Exercises (about 1 hour)

1. **Binary by hand.** Write your age and the number 200 in binary. Check your answers with a calculator in programmer mode.
2. **Look at your own computer.** Open Task Manager (Windows) or System Information (Mac) and note your CPU cores, RAM and storage type (HDD or SSD).
3. **Find your addresses.** Run \`ipconfig\` (Windows) or open your network settings (Mac or Linux). Write down your IP address, your router (gateway) and your DNS servers. Is your IP address private (10.x, 172.16.x or 192.168.x)?
4. **Trace a route.** Run \`tracert example.com\` (Windows) or \`traceroute example.com\` (Mac or Linux) and count the routers your packets pass through.
5. **CIA in real life.** For your email account, write one example each of confidentiality, integrity and availability, and one security control that protects it.`,
      nextSteps: `Pass the Stage 1 exam (80%) to unlock **Stage 2: Core Skills**, where you study networking, Linux, accounts and security fundamentals in depth. If any lesson felt hard, rewatch it before the exam; every attempt is saved and you can retake it.`,
      lessons: [
        {
          key: 'welcome',
          title: 'How this roadmap works',
          summary: 'The four stages, the 80% rules, skip tests and how to practice safely.',
          minutes: 5,
          content: `## Welcome

This roadmap takes you from no experience to choosing a cybersecurity specialty in four stages:

1. **Getting started:** how computers and the internet work, and the basic ideas of security.
2. **Core skills:** networking, Linux and the command line, accounts and identity, and security fundamentals.
3. **Practice:** build a safe lab on your own computer and work through guided exercises.
4. **Choose a specialty:** security operations and incident response, network and cloud security, application security, or authorized penetration testing.

### The rules

- Lessons open **one at a time**. Watch at least 90% of the video.
- Each video has a short question. Score **at least 80%** on a video's questions to finish the lesson and open the next one. If you answer wrong, rewatch the section and try again.
- Each stage ends with an **exam of at least 10 questions**. Score **at least 80%** to unlock the next stage. Every attempt is saved, you see an explanation for every question, and you can retake it.
- **Already experienced?** Stages 1 and 2 have a **skip test**: the same kind of exam, taken before the lessons. Pass it with 80% and the stage counts as done; the lessons stay open for review. You get 2 skip-test tries per stage.

### Resource labels

Readings and practice platforms are labeled **Free**, **Free account** (sign-up needed) or **Paid**.

${SAFETY}

Mark this lesson complete to start the first video.`,
          takeaways: [
            'Score 80% on each video’s questions to open the next video, and 80% on each stage exam to open the next stage.',
            'Stages 1 and 2 offer a skip test for experienced students.',
            'Only practice on systems you own or have permission to use.',
          ],
        },
        {
          key: 'binary',
          title: 'Binary, bits and ASCII',
          summary: 'How computers represent numbers and letters with only 0s and 1s.',
          video: cs50(HW, 0, 997),
          content: `## What this lesson covers

- **Binary** uses powers of 2 for place values (1, 2, 4, 8, ...), just as decimal uses powers of 10. Binary 111 is 4 + 2 + 1 = 7.
- A **bit** is one binary digit. A **byte** is 8 bits.
- Inside a computer, **transistors** act as switches: off is 0, on is 1.
- **ASCII** maps numbers to characters: 65 is A, 66 is B, 97 is a. Original ASCII uses 7 bits (128 characters); **Unicode** covers other languages and emoji.
- The bytes 01001000 01001001 are 72 and 73, which ASCII shows as **"HI"**.`,
          takeaways: ['Binary place values are powers of 2.', '1 byte = 8 bits.', 'ASCII maps numbers to characters (65 = A).'],
          checkpoints: [
            {
              at: 455,
              q: 'What decimal number is the binary number 111?',
              options: ['3', '7', '111', '8'],
              answer: '7',
              explanation: 'The places are 4, 2 and 1, so 111 in binary is 4 + 2 + 1 = 7.',
              topic: 'road-start',
              source: notes(1),
            },
            {
              at: 990,
              q: 'In ASCII, which character does the decimal number 72 represent?',
              options: ['A', 'H', 'I', 'a'],
              answer: 'H',
              explanation: '01001000 is 64 + 8 = 72, which ASCII maps to "H". 73 is "I", so the two bytes spell "HI".',
              topic: 'road-start',
              source: notes(1),
            },
          ],
        },
        {
          key: 'hardware',
          title: 'Inside the computer: CPU, memory and storage',
          summary: 'The CPU, cores, RAM, hard drives, SSDs and cache.',
          video: cs50(HW, 997, 2560),
          content: `## What this lesson covers

- The **CPU** is the brain of the computer. **Cores** inside it run operations; more cores means more tasks at once. **Hyper-threading** lets one core appear as two.
- **RAM** holds the programs and files you are using. It is fast, but it **keeps data only while the power is on**.
- A **hard disk drive (HDD)** stores data magnetically on spinning platters and keeps it without power.
- A **solid-state drive (SSD)** has no moving parts and is much faster, but has a finite number of writes.
- Data is "funneled" from disk to RAM to cache to the CPU. **Cache** keeps what the CPU needs next close at hand, like a shopkeeper who keeps popular candy at the counter.`,
          takeaways: ['RAM is fast but loses its data without power.', 'SSDs are faster than HDDs and have no moving parts.', 'Cache keeps data close to the CPU.'],
          checkpoints: [
            {
              at: 523,
              type: TF,
              q: 'RAM keeps its data after the computer is turned off.',
              answer: 'False',
              explanation: 'RAM stores data only while the power is on. Long-term storage is the job of hard drives and SSDs.',
              topic: 'road-start',
              source: notes(1),
            },
            {
              at: 1143,
              q: 'Compared with a hard disk drive, what is true of a solid-state drive?',
              options: [
                'It has no moving parts and is much faster',
                'It stores data on spinning magnetic platters',
                'It loses its data when the power is off',
                'It can be written to an unlimited number of times',
              ],
              answer: 'It has no moving parts and is much faster',
              explanation: 'SSDs use flash memory with no moving parts, so they load and save much faster. They do have a finite number of writes.',
              topic: 'road-start',
              source: notes(1),
            },
            {
              at: 1556,
              q: 'In the candy store analogy, what does keeping popular candy at the counter represent?',
              options: ['Cache memory', 'The hard drive', 'The power supply', 'The display connector'],
              answer: 'Cache memory',
              explanation: 'Cache keeps data the CPU is likely to need close at hand, so it does not have to fetch it from slower memory.',
              topic: 'road-start',
              source: notes(1),
            },
          ],
        },
        {
          key: 'os',
          title: 'Ports, wireless and the operating system',
          summary: 'Display and USB connectors, Wi-Fi and Bluetooth, and what the operating system and drivers do.',
          video: cs50(HW, 2560, 2955),
          content: `## What this lesson covers

- **Display connectors:** HDMI, DisplayPort and the older VGA.
- **USB** connects keyboards, printers and drives. USB-C can be plugged in either way up. A slow USB port limits even a fast drive.
- **Wi-Fi** is wireless networking; **Bluetooth** connects nearby devices such as headphones over a short range.
- The **operating system** (Windows, macOS, Linux) is loaded into RAM at power-on and makes all the hardware work together.
- **Device drivers** teach the operating system how to talk to a specific device, such as a printer or camera.`,
          takeaways: ['The operating system makes hardware and software work together.', 'Device drivers let the OS talk to specific hardware.'],
          checkpoints: [
            {
              at: 390,
              q: 'What lets the operating system talk to a specific model of printer or camera?',
              options: ['A device driver', 'A display connector', 'The CPU cache', 'A Bluetooth headset'],
              answer: 'A device driver',
              explanation: 'Device drivers are software that teach the operating system how to communicate with particular hardware.',
              topic: 'road-start',
              source: notes(1),
            },
          ],
        },
        {
          key: 'ip-dns',
          title: 'How the internet works: IP, DHCP and DNS',
          summary: 'Home networks, IP addresses, how devices get them, and how names become addresses.',
          video: cs50(NET, 0, 501),
          content: `## What this lesson covers

- Your home connects to the internet through an **ISP** (internet service provider) using a modem, often with a router for your devices.
- Every device on the internet has an **IP address**, like a postal address. IPv4 addresses look like #.#.#.#, with each number from 0 to 255.
- **DHCP** (Dynamic Host Configuration Protocol) gives devices their IP addresses automatically. Your home router runs DHCP for your devices.
- **DNS** (Domain Name System) converts names such as google.com into IP addresses.`,
          takeaways: ['IP addresses identify devices.', 'DHCP hands out addresses automatically.', 'DNS turns names into IP addresses.'],
          checkpoints: [
            {
              at: 398,
              q: 'Which protocol automatically gives your devices an IP address when they join a network?',
              options: ['DHCP', 'DNS', 'HTTP', 'USB'],
              answer: 'DHCP',
              explanation: 'DHCP (Dynamic Host Configuration Protocol) lets a device request an IP address, and a DHCP server, often your home router, assigns one.',
              topic: 'road-start',
              source: notes(2),
            },
            {
              at: 495,
              q: 'What does DNS do?',
              options: [
                'Converts domain names into IP addresses',
                'Encrypts web traffic',
                'Assigns IP addresses to devices',
                'Splits files into packets',
              ],
              answer: 'Converts domain names into IP addresses',
              explanation: 'DNS servers translate names like google.com into the IP addresses computers use to reach them.',
              topic: 'road-start',
              source: notes(2),
            },
          ],
        },
        {
          key: 'packets',
          title: 'Packets, TCP, ports and UDP',
          summary: 'How data travels in packets, how TCP makes delivery reliable, and what ports identify.',
          video: cs50(NET, 501, 1408),
          content: `## What this lesson covers

- Computers send data in **packets**, like envelopes with a sender and a recipient IP address. Large files are split across many packets ("1 of 4, 2 of 4...").
- **TCP** (Transmission Control Protocol) uses **sequence numbers**, so a computer can tell which packet is missing, ask for it again, and reassemble the whole file.
- **Ports** identify the service you want on a server: **80** for HTTP (web pages), **443** for HTTPS (secure web), **25** for email.
- A **protocol** is a set of rules, like a handshake when you meet someone.
- **UDP** (User Datagram Protocol) does not guarantee delivery. It suits video calls, where keeping the conversation flowing matters more than resending a lost packet.`,
          takeaways: ['TCP resends missing packets; UDP does not.', 'Ports identify services: 80 HTTP, 443 HTTPS, 25 email.'],
          checkpoints: [
            {
              at: 589,
              q: 'How does TCP help a file arrive complete?',
              options: [
                'Sequence numbers let the receiver spot a missing packet and ask for it again',
                'It sends the whole file in one very large packet',
                'It converts the file into a domain name',
                'It encrypts every packet with a password',
              ],
              answer: 'Sequence numbers let the receiver spot a missing packet and ask for it again',
              explanation: 'TCP numbers the packets, so the receiver can tell which one is missing, request it, and put the file back together.',
              topic: 'road-start',
              source: notes(2),
            },
            {
              at: 687,
              q: 'Which port is used for secure web traffic (HTTPS)?',
              options: ['443', '80', '25', '22'],
              answer: '443',
              explanation: 'Port 80 is plain HTTP, 443 is HTTPS (secure web) and 25 is email.',
              topic: 'road-start',
              source: notes(2),
            },
            {
              at: 902,
              q: 'Why do video calls often use UDP instead of TCP?',
              options: [
                'Keeping the call flowing matters more than resending a lost packet',
                'UDP guarantees that every packet arrives',
                'UDP is the only protocol that can carry sound',
                'TCP cannot work over Wi-Fi',
              ],
              answer: 'Keeping the call flowing matters more than resending a lost packet',
              explanation: 'UDP does not guarantee delivery. For live video, a dropped packet is better than waiting for it to be resent.',
              topic: 'road-start',
              source: notes(2),
            },
          ],
        },
        {
          key: 'routing',
          title: 'IP addresses, routers and traceroute',
          summary: 'IPv4 and IPv6, private addresses, how routers forward data, and how to trace a route.',
          video: cs50(NET, 1408, 2456),
          content: `## What this lesson covers

- IPv4 addresses are **32 bits** (about 4 billion addresses), which is running out. **IPv6** uses **128 bits**.
- **Private addresses** (10.x.x.x, 172.16.x.x, 192.168.x.x) are used inside home and office networks and are not reachable from the internet without special configuration.
- A **subnet mask** decides whether another computer is on the same network; the **router (gateway)** sends traffic elsewhere.
- **Routers** keep tables of where to send data next. The internet is a network of networks, often with many paths from A to B.
- **traceroute** shows each router on the path to a destination and how long each hop takes.`,
          takeaways: ['IPv4 is 32 bits; IPv6 is 128 bits.', 'Private addresses are used inside local networks.', 'traceroute lists the routers on a path.'],
          checkpoints: [
            {
              at: 212,
              q: 'Which of these is a private IP address used inside a home or office network?',
              options: ['192.168.1.20', '8.8.8.8', '151.101.1.69', '1.1.1.1'],
              answer: '192.168.1.20',
              explanation: 'Addresses starting 10., 172.16. or 192.168. are private. They are used inside local networks.',
              topic: 'road-start',
              source: notes(2),
            },
            {
              at: 537,
              q: 'What does a router do with a packet?',
              options: [
                'Sends it in the direction of its destination, often to the next router',
                'Translates the destination name into an IP address',
                'Stores it permanently on a hard drive',
                'Displays it on a monitor',
              ],
              answer: 'Sends it in the direction of its destination, often to the next router',
              explanation: 'Routers use tables of addresses to forward data towards its destination, hop by hop.',
              topic: 'road-start',
              source: notes(2),
            },
            {
              at: 1042,
              q: 'What does the traceroute program show?',
              options: [
                'Each router on the path to a destination and how long it took to reach it',
                'Every website you have ever visited',
                'The password for your Wi-Fi network',
                'Which programs are using your CPU',
              ],
              answer: 'Each router on the path to a destination and how long it took to reach it',
              explanation: 'traceroute sends packets to each router along the path and reports the time to reach each one.',
              topic: 'road-start',
              source: notes(2),
            },
          ],
        },
        {
          key: 'cia',
          title: 'The CIA triad',
          summary: 'Confidentiality, integrity and availability: the goals of IT security.',
          video: messer('SBcDGb9l6yo', 318),
          content: `## What this lesson covers

- **Confidentiality:** only the right people can see the information. Provided by **encryption**, **access controls** and extra **authentication factors**.
- **Integrity:** the data received is exactly what was sent. Provided by **hashing**, **digital signatures** and certificates. **Non-repudiation** proves who sent it.
- **Availability:** systems stay up for the people who need them. Provided by **fault tolerance** (redundant components) and **patching**.`,
          takeaways: ['Confidentiality: encryption and access control.', 'Integrity: hashing and digital signatures.', 'Availability: redundancy and patching.'],
          checkpoints: [
            {
              at: 150,
              q: 'Encrypting a file so that only the intended person can read it mainly protects which part of the CIA triad?',
              options: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'],
              answer: 'Confidentiality',
              explanation: 'Encryption keeps data private: anyone in the middle who gets the encrypted data cannot understand it.',
              topic: 'road-start',
              source: tx('The CIA Triad'),
            },
            {
              at: 245,
              q: 'You compare a hash of a downloaded file with the hash the sender published, and they match. Which goal does this check?',
              options: ['Integrity', 'Availability', 'Confidentiality', 'Authorization'],
              answer: 'Integrity',
              explanation: 'Matching hashes show the data you received is exactly the data that was sent, which is integrity.',
              topic: 'road-start',
              source: tx('The CIA Triad'),
            },
          ],
        },
        {
          key: 'controls',
          title: 'Security controls',
          summary: 'Technical, managerial, operational and physical controls, and the types of control.',
          video: messer('STM3EUvL7wg', 709),
          content: `## What this lesson covers

**Categories** (who or what implements the control):
- **Technical:** firewalls, antivirus, operating system settings.
- **Managerial:** policies and procedures.
- **Operational:** done by people, such as security guards and awareness training.
- **Physical:** fences, locks, badge readers.

**Types** (what the control does):
- **Preventive:** stops access (a firewall rule, a door lock).
- **Deterrent:** discourages an attack (warning signs, a login splash screen).
- **Detective:** identifies and logs an event (system logs, motion detectors).
- **Corrective:** fixes things after an event (restoring from backup).
- **Compensating:** another way to control a risk when the normal fix is not possible yet (a firewall rule until a patch arrives, a generator during a power cut).
- **Directive:** tells people what to do ("Authorized personnel only" signs, policies, training).`,
          takeaways: ['Four categories: technical, managerial, operational, physical.', 'Types: preventive, deterrent, detective, corrective, compensating, directive.'],
          checkpoints: [
            {
              at: 180,
              q: 'A security guard checking IDs at the entrance belongs to which control category?',
              options: ['Operational', 'Technical', 'Managerial', 'Physical'],
              answer: 'Operational',
              explanation: 'Operational controls are carried out by people, such as guards and awareness programs.',
              topic: 'road-start',
              source: tx('Security Controls'),
            },
            {
              at: 590,
              q: 'A vendor has not released a patch yet, so you add a firewall rule to block the attack until it arrives. What type of control is the firewall rule?',
              options: ['Compensating', 'Deterrent', 'Directive', 'Detective'],
              answer: 'Compensating',
              explanation: 'A compensating control manages the risk by other means until the normal fix (the patch) is possible.',
              topic: 'road-start',
              source: tx('Security Controls'),
            },
            {
              at: 700,
              q: 'An "Authorized personnel only" sign on an unlocked door is which type of control?',
              options: ['Directive', 'Preventive', 'Corrective', 'Compensating'],
              answer: 'Directive',
              explanation: 'A directive control tells people what to do. The sign does not physically stop anyone.',
              topic: 'road-start',
              source: tx('Security Controls'),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'What decimal number is the binary number 1000?',
          options: ['8', '4', '1000', '16'],
          answer: '8',
          explanation: 'The fourth place from the right is the 8s place, so 1000 in binary is 8.',
          lesson: 'Binary, bits and ASCII',
          source: notes(1),
        },
        {
          q: 'How many bits are in one byte?',
          options: ['8', '2', '10', '16'],
          answer: '8',
          explanation: 'A byte is 8 bits. Two bytes, such as 01001000 01001001, are 16 bits.',
          lesson: 'Binary, bits and ASCII',
          source: notes(1),
        },
        {
          type: TF,
          q: 'An SSD keeps your files when the computer is turned off.',
          answer: 'True',
          explanation: 'SSDs and hard drives are persistent storage. It is RAM that loses its contents without power.',
          lesson: 'Inside the computer: CPU, memory and storage',
          source: notes(1),
        },
        {
          q: 'What does hyper-threading do?',
          options: [
            'Lets a single CPU core present itself to the operating system as more than one core',
            'Doubles the size of the hard drive',
            'Connects two computers with a USB cable',
            'Encrypts data stored in RAM',
          ],
          answer: 'Lets a single CPU core present itself to the operating system as more than one core',
          explanation: 'With hyper-threading, one core appears as multiple cores, so it can work on two things at once.',
          lesson: 'Inside the computer: CPU, memory and storage',
          source: notes(1),
        },
        {
          q: 'Where is the operating system loaded when you turn on a computer?',
          options: ['Into RAM', 'Into the display connector', 'Into the router', 'Into the USB port'],
          answer: 'Into RAM',
          explanation: 'The operating system is stored on the drive and loaded into RAM when the computer starts.',
          lesson: 'Ports, wireless and the operating system',
          source: notes(1),
        },
        {
          q: 'You type example.com into a browser. What happens first so your computer can reach the site?',
          options: [
            'A DNS server is asked for the IP address of example.com',
            'DHCP assigns example.com a new IP address',
            'The router encrypts the page',
            'UDP resends all lost packets',
          ],
          answer: 'A DNS server is asked for the IP address of example.com',
          explanation: 'Computers need the IP address. DNS translates the name into that address.',
          lesson: 'How the internet works: IP, DHCP and DNS',
          source: notes(2),
        },
        {
          q: 'What is the range of each of the four numbers in an IPv4 address?',
          options: ['0 to 255', '0 to 99', '1 to 1000', '0 to 65535'],
          answer: '0 to 255',
          explanation: 'Each number is 8 bits, so it ranges from 0 to 255.',
          lesson: 'How the internet works: IP, DHCP and DNS',
          source: notes(2),
        },
        {
          q: 'Port 80 is used for which service?',
          options: ['HTTP (web pages)', 'Email', 'HTTPS', 'DNS'],
          answer: 'HTTP (web pages)',
          explanation: 'Port 80 is HTTP, the language web servers speak. HTTPS uses 443 and email uses 25.',
          lesson: 'Packets, TCP, ports and UDP',
          source: notes(2),
        },
        {
          type: TF,
          q: 'UDP guarantees that every packet reaches its destination.',
          answer: 'False',
          explanation: 'UDP does not guarantee delivery. TCP is the protocol that requests missing packets again.',
          lesson: 'Packets, TCP, ports and UDP',
          source: notes(2),
        },
        {
          q: 'How many bits long is an IPv6 address?',
          options: ['128', '32', '64', '8'],
          answer: '128',
          explanation: 'IPv4 addresses are 32 bits (about 4 billion addresses); IPv6 uses 128 bits.',
          lesson: 'IP addresses, routers and traceroute',
          source: notes(2),
        },
        {
          type: MULTI,
          q: 'Which of these are private IPv4 address ranges? Select all that apply.',
          options: ['10.x.x.x', '192.168.x.x', '172.16.x.x', '8.8.x.x'],
          answer: ['10.x.x.x', '192.168.x.x', '172.16.x.x'],
          explanation: '10., 172.16. and 192.168. addresses are private. 8.8.8.8 is a public address.',
          lesson: 'IP addresses, routers and traceroute',
          source: notes(2),
        },
        {
          q: 'Which measure mainly protects availability?',
          options: [
            'Fault-tolerant systems with redundant components',
            'Encrypting the data',
            'Hashing the data',
            'Requiring an extra authentication factor',
          ],
          answer: 'Fault-tolerant systems with redundant components',
          explanation: 'If one component fails, a redundant one keeps the system running. Encryption and MFA protect confidentiality; hashing protects integrity.',
          lesson: 'The CIA triad',
          source: tx('The CIA Triad'),
        },
        {
          q: 'A digital signature on a message lets the recipient confirm who sent it. What is this proof called?',
          options: ['Non-repudiation', 'Availability', 'Fault tolerance', 'Deterrence'],
          answer: 'Non-repudiation',
          explanation: 'Non-repudiation means there is proof the information really came from the sender.',
          lesson: 'The CIA triad',
          source: tx('The CIA Triad'),
        },
        {
          q: 'Restoring a ransomware-infected computer from a known good backup is which type of control?',
          options: ['Corrective', 'Preventive', 'Deterrent', 'Directive'],
          answer: 'Corrective',
          explanation: 'Corrective controls act after an event to reverse its impact, such as restoring from backup.',
          lesson: 'Security controls',
          source: tx('Security Controls'),
        },
        {
          q: 'Motion detectors that alert you when someone moves in a closed area are which type of control?',
          options: ['Detective', 'Compensating', 'Directive', 'Corrective'],
          answer: 'Detective',
          explanation: 'Detective controls identify and warn about an event. They may not prevent it.',
          lesson: 'Security controls',
          source: tx('Security Controls'),
        },
      ],
      readings: [
        {
          title: "CS50's Understanding Technology: lecture notes",
          authors: 'CS50, Harvard University',
          publisher: 'Harvard University',
          url: 'https://cs50.harvard.edu/technology/',
          kind: 'DOCUMENTATION',
          access: 'FREE',
          note: 'Written notes for the Hardware and Internet lectures used in this stage, plus later lectures on multimedia, security and programming.',
        },
        {
          title: 'NIST SP 800-12 Rev. 1: An Introduction to Information Security',
          authors: 'Michael Nieles, Kelley Dempsey, Victoria Pillitteri',
          publisher: 'NIST',
          year: 2017,
          url: 'https://csrc.nist.gov/pubs/sp/800/12/r1/final',
          kind: 'STANDARD',
          access: 'FREE',
          note: 'A plain-language introduction to security concepts, roles and controls.',
        },
        {
          title: 'Secure Our World: 4 core steps (Cybersecurity Awareness Month)',
          authors: 'Cybersecurity and Infrastructure Security Agency (CISA)',
          publisher: 'CISA',
          url: 'https://www.cisa.gov/cybersecurity-awareness-month',
          kind: 'ARTICLE',
          access: 'FREE',
          note: 'The four core steps everyone should take: avoid and report phishing, use strong passwords, use MFA and a password manager, and update software.',
        },
      ],
    },

    // ── Stage 2 ─────────────────────────────────────────────────────
    {
      key: 'core-skills',
      title: 'Stage 2: Core Skills',
      description: 'Networking, Linux and the command line, accounts and identity, and security fundamentals, through two full courses.',
      difficulty: 'BEGINNER',
      passPercent: 80,
      quizCount: 12,
      allowTestOut: true,
      linkedCourses: ['cyber-foundations', 'networking-linux'],
      time: 'About 25 to 35 hours across the two courses, at your own pace',
      outcomes: [
        'Explain the OSI model, IP addressing, subnets, common ports, NAT, VLANs and how networks are monitored',
        'Navigate the Linux file system, manage files, users and permissions, and run basic network commands',
        'Defend accounts with strong passwords, multi-factor authentication, password managers and passkeys',
        'Explain hashing, encryption, HTTPS, firewalls, malware and common web attacks such as SQL injection and XSS',
      ],
      prerequisites: ['Stage 1 passed, or its skip test', 'Comfort with the ideas of IP addresses, DNS and ports'],
      practice: `### Exercises (about 2 hours, alongside the courses)

1. **Linux every day.** In your Linux VM (Stage 3) or a free browser terminal, practice \`pwd\`, \`ls -la\`, \`cd\`, \`mkdir\`, \`cp\`, \`mv\` and \`grep\` until you can move around without notes.
2. **Permissions.** Create a file, then use \`chmod 600\`, \`chmod 644\` and \`chmod 755\` and check the result with \`ls -l\`. Explain each one in words.
3. **Your own accounts.** Turn on multi-factor authentication for your email, and move your passwords into a password manager. Check your email address at haveibeenpwned.com.
4. **Subnetting.** For 192.168.10.0/24 and 10.0.0.0/26, write the network address, the broadcast address and the number of usable hosts.`,
      nextSteps: `Finish both courses (every lesson and block quiz), then pass the Stage 2 exam (80%) to unlock **Stage 3: Practice**, where you build your own lab. Experienced? Take the skip test instead.`,
      lessons: [
        {
          key: 'core-plan',
          title: 'Your core skills plan',
          summary: 'How the two Stage 2 courses cover networking, Linux, identity and security fundamentals.',
          minutes: 5,
          content: `## Two courses, four skills

This stage reuses two full courses on this site instead of repeating them. Open each one from the cards on this stage. They track your progress separately and both must be finished before the Stage 2 exam.

| Skill | Where you learn it |
| --- | --- |
| **Networking** | Networking & Linux Foundations: modules 1 to 3 (OSI model, IP addressing, subnets, ports, NAT, VLANs, Wi-Fi security, monitoring) |
| **Linux and the command line** | Networking & Linux Foundations: modules 4 and 5 (navigation, users and privileges, files, network commands, tools, services, Bash) |
| **Accounts and identity** | Cybersecurity Foundations: module 1 (passwords, MFA, phishing, single sign-on, password managers, passkeys) |
| **Security fundamentals** | Cybersecurity Foundations: modules 2 to 5 (hashing, encryption, HTTPS, firewalls, malware, web attacks, privacy) |

### Suggested order

1. Cybersecurity Foundations, module 1 (accounts) and module 2 (data).
2. Networking & Linux Foundations, modules 1 to 3.
3. Cybersecurity Foundations, modules 3 to 5.
4. Networking & Linux Foundations, modules 4 and 5.

The same rules apply in both courses: 80% on each video's questions, and 80% on each block quiz.

**Already know this?** Take the Stage 2 skip test. Passing it (80%) counts the stage as done; the courses stay available.

Mark this lesson complete to continue.`,
          takeaways: ['Stage 2 is two existing courses plus a stage exam.', 'Both courses must be complete before the exam, unless you pass the skip test.'],
        },
      ],
      bank: [
        {
          q: 'At which OSI layer do IP addresses and routing belong?',
          options: ['Layer 3, the network layer', 'Layer 1, the physical layer', 'Layer 2, the data link layer', 'Layer 7, the application layer'],
          answer: 'Layer 3, the network layer',
          explanation: 'Anything about IP addresses, subnet masks or how routers forward traffic is OSI layer 3.',
          topic: 'road-core',
          source: 'Professor Messer transcript, "Understanding the OSI Model" (N10-009), used in Networking & Linux Foundations',
        },
        {
          q: 'Which TCP port is commonly associated with SSH?',
          options: ['22', '23', '80', '443'],
          answer: '22',
          explanation: 'SSH (secure shell) uses TCP port 22, and SFTP runs over SSH on the same port.',
          topic: 'road-core',
          source: 'Professor Messer transcript, "Common Ports" (N10-009), used in Networking & Linux Foundations',
        },
        {
          q: 'How many usable host addresses are in a /24 IPv4 subnet?',
          options: ['254', '256', '255', '24'],
          answer: '254',
          explanation: 'A /24 leaves 8 host bits: 2⁸ = 256 addresses, minus the network and broadcast addresses, leaves 254.',
          topic: 'road-core',
          source: 'Networking & Linux Foundations, "Calculating IPv4 subnets and hosts"',
        },
        {
          q: 'Which Linux command prints the full path of the directory you are in?',
          options: ['pwd', 'ls', 'cd', 'whoami'],
          answer: 'pwd',
          explanation: 'pwd prints the name of the current working directory.',
          topic: 'road-core',
          source: 'pwd(1) manual page, man7.org',
        },
        {
          q: 'What does the command chmod 644 notes.txt set?',
          options: [
            'Owner can read and write; group and others can only read',
            'Everyone can read, write and execute',
            'Only the owner can read; nobody can write',
            'Owner can execute; group and others can write',
          ],
          answer: 'Owner can read and write; group and others can only read',
          explanation: 'Each digit adds read (4), write (2) and execute (1). 6 = read + write for the owner; 4 = read for the group and for others.',
          topic: 'road-core',
          source: 'chmod(1) manual page, man7.org (numeric modes)',
        },
        {
          q: 'What does sudo do?',
          options: [
            'Runs a command as another user, by default the superuser (root)',
            'Shows the current directory',
            'Deletes a user account',
            'Searches files for a pattern',
          ],
          answer: 'Runs a command as another user, by default the superuser (root)',
          explanation: 'sudo executes a command as another user. Without -u, that user is root, so use it carefully.',
          topic: 'road-core',
          source: 'sudo(8) manual page, man7.org',
        },
        {
          q: 'Which command searches a file for lines that match a pattern?',
          options: ['grep', 'chmod', 'pwd', 'mkdir'],
          answer: 'grep',
          explanation: 'grep searches each file for lines that match the given patterns and prints them.',
          topic: 'road-core',
          source: 'grep(1) manual page, man7.org',
        },
        {
          type: TF,
          q: 'ls -a also lists hidden entries whose names start with a dot.',
          answer: 'True',
          explanation: 'By default ls ignores entries starting with "."; -a (--all) shows them.',
          topic: 'road-core',
          source: 'ls(1) manual page, man7.org',
        },
        {
          q: 'A password plus a code from an authenticator app on your phone combines which two kinds of factor?',
          options: [
            'Something you know and something you have',
            'Something you are and somewhere you are',
            'Two things you know',
            'Something you have and something you are',
          ],
          answer: 'Something you know and something you have',
          explanation: 'The password is something you know; the phone that generates the code is something you have.',
          topic: 'road-core',
          source: 'Cybersecurity Foundations, "Two-factor authentication and credential stuffing" (CS50 Cybersecurity notes, lecture 0)',
        },
        {
          q: 'Why do sites store salted hashes of passwords instead of the passwords themselves?',
          options: [
            'A stolen database does not reveal the passwords, and the salt stops identical passwords from having identical hashes',
            'Hashes are shorter, so the database is smaller',
            'Hashes can be decrypted later if a user forgets their password',
            'Salting makes logins faster',
          ],
          answer: 'A stolen database does not reveal the passwords, and the salt stops identical passwords from having identical hashes',
          explanation: 'Hashing is one-way, and a unique salt per user means attackers cannot spot shared passwords or use precomputed tables.',
          topic: 'road-core',
          source: 'Cybersecurity Foundations, "Hashing and salting passwords" (CS50 Cybersecurity notes, lecture 1)',
        },
        {
          q: 'What is the main defense against SQL injection?',
          options: [
            'Prepared statements (parameterized queries)',
            'Longer passwords',
            'Turning off HTTPS',
            'Hiding the login page',
          ],
          answer: 'Prepared statements (parameterized queries)',
          explanation: 'Prepared statements keep user input as data, so it cannot change the structure of the SQL query.',
          topic: 'road-core',
          source: 'Cybersecurity Foundations, "Prepared statements and command injection" (CS50 Cybersecurity notes, lecture 3)',
        },
        {
          q: 'Which principle says accounts should have only the access they need to do their job?',
          options: ['Least privilege', 'Fault tolerance', 'Non-repudiation', 'Defense in depth'],
          answer: 'Least privilege',
          explanation: 'Least privilege limits each account to the rights it needs, which limits the damage if it is misused.',
          topic: 'road-core',
          source: 'Networking & Linux Foundations, "Users and privileges"; Professor Messer transcript, "Access Controls"',
        },
        {
          q: 'What does HTTPS add to HTTP?',
          options: [
            'Encryption and server authentication using TLS certificates',
            'Faster page loads by skipping DNS',
            'A guarantee that the website is not malicious',
            'Automatic backups of the page',
          ],
          answer: 'Encryption and server authentication using TLS certificates',
          explanation: 'HTTPS encrypts traffic and uses a certificate to show you are talking to the real server. It does not prove the site itself is trustworthy.',
          topic: 'road-core',
          source: 'Cybersecurity Foundations, "HTTPS, certificates and HSTS" (CS50 Cybersecurity notes, lecture 2)',
        },
        {
          type: MULTI,
          q: 'Which of these help protect an account from phishing and password reuse? Select all that apply.',
          options: ['A password manager with unique passwords', 'Passkeys', 'Multi-factor authentication', 'Using the same strong password everywhere'],
          answer: ['A password manager with unique passwords', 'Passkeys', 'Multi-factor authentication'],
          explanation: 'Unique passwords stop credential stuffing, MFA adds a second factor, and passkeys cannot be typed into a fake site. Reusing one password spreads a single breach to every account.',
          topic: 'road-core',
          source: 'Cybersecurity Foundations, module 1 (CS50 Cybersecurity notes, lecture 0)',
        },
      ],
      readings: [
        {
          title: 'The Linux Command Line (book, free PDF)',
          authors: 'William Shotts',
          publisher: 'LinuxCommand.org',
          url: 'https://linuxcommand.org/tlcl.php',
          kind: 'BOOK',
          access: 'FREE',
          note: 'A complete beginner-to-intermediate guide to the shell. The PDF is free; a printed edition is sold separately.',
        },
        {
          title: 'NIST SP 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management',
          authors: 'Paul A. Grassi et al.',
          publisher: 'NIST',
          year: 2017,
          url: 'https://csrc.nist.gov/pubs/sp/800/63/b/upd2/final',
          kind: 'STANDARD',
          access: 'FREE',
          note: 'The US guidance on passwords, authenticators and MFA that Cybersecurity Foundations refers to.',
        },
        {
          title: 'More than a Password (multi-factor authentication)',
          authors: 'Cybersecurity and Infrastructure Security Agency (CISA)',
          publisher: 'CISA',
          url: 'https://www.cisa.gov/MFA',
          kind: 'ARTICLE',
          access: 'FREE',
          note: 'Why MFA matters and which kinds resist phishing best.',
        },
      ],
    },

    // ── Stage 3 ─────────────────────────────────────────────────────
    {
      key: 'practice',
      title: 'Stage 3: Practice',
      description: 'Rules of engagement, a safe virtual lab on your own computer, and guided exercises.',
      difficulty: 'BEGINNER',
      passPercent: 80,
      quizCount: 10,
      time: 'About 6 to 8 hours, including lab setup',
      outcomes: [
        'Explain why written permission and rules of engagement come before any security testing',
        'Install VirtualBox and an Ubuntu virtual machine, and keep the lab isolated from other people’s systems',
        'Choose a VirtualBox network mode for a lab and use snapshots to recover from mistakes',
        'Complete guided exercises: capture your own traffic with Wireshark, play OverTheWire Bandit, secure your own accounts and read email headers',
      ],
      prerequisites: [
        'Stage 2 passed, or its skip test',
        'A computer with at least 8 GB of RAM and about 30 GB of free disk space, where you are allowed to install software',
      ],
      practice: `### Guided exercises (do them in order)

${SAFETY}

1. **Write your lab rules (15 min).** Before you start, write a one-page "rules of engagement" for your lab: which machines are in scope (only your own VMs), what is out of scope (everything else, including your school or work network), and when you will practice.
2. **Build the lab (2 hours).** Install VirtualBox, create an Ubuntu VM, and take a snapshot named "clean install". Follow the three lab videos in this stage.
3. **Explore your VM (30 min).** In the VM, run \`ip addr\` to find its address and \`ping\` your host or a second VM. Compare the address with what you learned about private ranges.
4. **Capture your own traffic (45 min).** Install Wireshark in the VM. Start a capture, visit a website, and stop. Use the display filter \`dns\` to find the DNS query and answer, then \`tcp.port == 443\` to see the HTTPS connection. Only capture traffic on your own machine.
5. **OverTheWire Bandit (1 to 2 hours).** Play levels 0 to 5 of Bandit, a free game made for beginners to practice the Linux command line. Keep notes of each command you used.
6. **Secure your own accounts (30 min).** Turn on MFA everywhere it is offered, check your address at Have I Been Pwned, and remove apps you no longer use.
7. **Read an email header (20 min).** In your own mailbox, open "show original" on a message and find the From, Return-Path and Received lines, and the SPF/DKIM/DMARC results.
8. **Roll back (10 min).** Restore your "clean install" snapshot and confirm the VM is back to its original state.`,
      nextSteps: `Pass the Stage 3 exam (80%) to unlock **Stage 4: Choose a Specialty**. Keep your lab: every specialty builds on it.`,
      lessons: [
        {
          key: 'permission',
          title: 'Rules first: permission and rules of engagement',
          summary: 'Why testing needs permission, what rules of engagement define, and how bug bounties work.',
          video: messer('-LevHAzXgFs', 381),
          content: `## What this lesson covers

Penetration testing simulates an attack on **your own** systems, or on systems whose owner has **authorized** the test. Before any test, everyone agrees on the **rules of engagement**, which define:

- the **scope**: exactly which systems (for example, which IP address ranges) may be tested, and which are **out of scope** and must not be touched;
- the **type of test** (on-site physical, internal or external) and the **hours** when testing is allowed;
- **emergency contacts**, and how to handle any sensitive data that is found.

The video also explains that exploits can crash systems, which is one reason the rules matter, and how **bug bounties** reward researchers who report vulnerabilities to the developer so a fix can be released before details are made public.

${SAFETY}`,
          takeaways: [
            'Never test without written permission.',
            'Rules of engagement set scope, timing, contacts and data handling.',
            'Bug bounties reward responsible reporting to the developer.',
          ],
          checkpoints: [
            {
              at: 142,
              q: 'Which of these is defined in the rules of engagement before a penetration test?',
              options: [
                'Which systems are in scope and out of scope, and when testing may happen',
                'The tester’s favorite tools',
                'The company’s marketing plan',
                'Nothing; testers decide as they go',
              ],
              answer: 'Which systems are in scope and out of scope, and when testing may happen',
              explanation: 'The rules of engagement are a formal list covering scope, the type of test, allowed hours, emergency contacts and how to handle sensitive data.',
              topic: 'road-practice',
              source: tx('Penetration Testing'),
            },
            {
              at: 372,
              q: 'In a bug bounty, what does a researcher who finds a vulnerability do?',
              options: [
                'Reports it to the software developer, who fixes it before details are made public',
                'Publishes it online immediately',
                'Uses it to access other companies’ systems',
                'Keeps it secret forever',
              ],
              answer: 'Reports it to the software developer, who fixes it before details are made public',
              explanation: 'Bug bounties reward reporting the vulnerability to the developer; the fix and the details are made public afterwards.',
              topic: 'road-practice',
              source: tx('Penetration Testing'),
            },
          ],
        },
        {
          key: 'virtualbox',
          title: 'Build your lab: install VirtualBox',
          summary: 'Install a free hypervisor so you can run practice machines safely inside your own computer.',
          video: soc(965, 1257),
          content: `## What this lesson covers

**Oracle VirtualBox** is a free hypervisor: it runs other operating systems as **virtual machines (VMs)** inside your computer. A VM is the safest place to practice, because what happens inside it stays separate from your main system, and you can reset it.

### Steps
1. Download VirtualBox for your operating system from virtualbox.org (free).
2. Install it with the default options.
3. Check that virtualization (Intel VT-x or AMD-V) is enabled in your computer's firmware settings if VirtualBox reports an error.

> **Instructor review:** this lesson is a clip of TCM's SOC 101 course ("Installing Oracle VM VirtualBox" chapter). The steps above are general; confirm the question matches the video.`,
          takeaways: ['VirtualBox is a free hypervisor for running virtual machines.', 'A VM keeps practice separate from your main system.'],
          checkpoints: [
            {
              at: 280,
              q: 'Why practice security skills in a virtual machine?',
              options: [
                'It keeps practice separate from your main system and can be reset if something breaks',
                'It makes your internet connection faster',
                'It gives you permission to test any website',
                'It hides your activity from the law',
              ],
              answer: 'It keeps practice separate from your main system and can be reset if something breaks',
              explanation: 'A VM is an isolated computer inside your computer. It does not give you permission to test anyone else’s systems.',
              topic: 'road-practice',
              review: true,
              source: socSrc('Installing Oracle VM VirtualBox', 'the Oracle VirtualBox User Guide'),
            },
          ],
        },
        {
          key: 'ubuntu',
          title: 'Build your lab: install Ubuntu',
          summary: 'Create an Ubuntu Linux virtual machine and take a clean snapshot.',
          video: soc(2602, 3358),
          content: `## What this lesson covers

1. Download the Ubuntu Desktop ISO from ubuntu.com (free).
2. In VirtualBox, create a new VM, choose the ISO, and give it at least 4 GB of RAM and 25 GB of disk.
3. Install Ubuntu and install updates.
4. **Take a snapshot** called "clean install". A snapshot saves the VM's state so you can go back to it after an experiment.

> **Instructor review:** this lesson is a clip of TCM's SOC 101 course ("Installing Ubuntu" chapter). The steps above are general; confirm the question matches the video.`,
          takeaways: ['Install Ubuntu from the official ISO.', 'Take a snapshot so you can roll back after experiments.'],
          checkpoints: [
            {
              at: 740,
              q: 'What does a VirtualBox snapshot let you do?',
              options: [
                'Save the VM’s state and return to it later',
                'Copy the VM to the internet',
                'Increase the VM’s RAM permanently',
                'Scan other computers on your network',
              ],
              answer: 'Save the VM’s state and return to it later',
              explanation: 'Snapshots save a VM’s state, so you can revert to it after experimenting or testing.',
              topic: 'road-practice',
              review: true,
              source: socSrc('Installing Ubuntu', 'the Oracle VirtualBox User Guide (snapshots)'),
            },
          ],
        },
        {
          key: 'lab-network',
          title: 'Build your lab: configure the lab network',
          summary: 'Choose a VirtualBox network mode that keeps your lab contained.',
          video: soc(3704, 4026),
          content: `## What this lesson covers

VirtualBox offers several network modes for each VM:

- **NAT** (default): the VM can reach the internet through your computer, which is enough to browse and download updates.
- **NAT Network**: like NAT, but VMs on the same NAT network can also talk to each other.
- **Internal network**: VMs can talk to each other, but **not to your computer or the outside world**. Best for isolated exercises.
- **Host-only**: VMs and your own computer can talk to each other without using your physical network.
- **Bridged**: the VM appears on your real network like another device. Avoid this for practice unless you own the whole network.

> **Instructor review:** this lesson is a clip of TCM's SOC 101 course ("Configuring the Lab Network" chapter). The modes above come from the Oracle VirtualBox User Guide; confirm the question matches the video.`,
          takeaways: ['Internal networking isolates VMs from your computer and the internet.', 'Avoid bridged mode for practice on networks you do not own.'],
          checkpoints: [
            {
              at: 310,
              q: 'Which VirtualBox network mode lets VMs talk to each other but not to your computer or the internet?',
              options: ['Internal network', 'Bridged', 'NAT', 'Not attached'],
              answer: 'Internal network',
              explanation: 'An internal network is visible only to the selected VMs, not to the host or the outside world.',
              topic: 'road-practice',
              review: true,
              source: socSrc('Configuring the Lab Network', 'the Oracle VirtualBox User Guide, "Virtual Networking"'),
            },
          ],
        },
        {
          key: 'exercises',
          title: 'Guided exercises: traffic, Bandit, accounts and email',
          summary: 'Step-by-step practice in your lab and on platforms built for learning.',
          minutes: 240,
          content: `## Guided exercises

Work through the exercises listed on this stage's page (also below). Tick each one off in your notes.

${SAFETY}

### 1. Capture your own traffic with Wireshark
Wireshark is a free network packet analyzer: it shows captured packets in detail. In your Ubuntu VM:
1. \`sudo apt install wireshark\`, then start it and capture on the VM's network interface.
2. Visit a website, then stop the capture.
3. Filter with \`dns\` and find the query and the answer (the IP address).
4. Filter with \`tcp.port == 443\` and find the start of the HTTPS connection.

### 2. OverTheWire Bandit (free, no account)
Bandit is a wargame for absolute beginners. Level 0: connect with SSH to bandit.labs.overthewire.org on **port 2220** as **bandit0** (password bandit0). Each level's page explains how to reach the next. Read the site's rules first, and play levels 0 to 5.

### 3. Secure your own accounts
Turn on MFA, use a password manager, and check your email address at Have I Been Pwned.

### 4. Read an email header
Open "show original" on a message in your own mailbox and find the Received lines and the SPF, DKIM and DMARC results.

### 5. Roll back
Restore your "clean install" snapshot.

Mark this lesson complete when you have done the exercises.`,
          takeaways: ['Practice only on your own VMs and on platforms built for learning.', 'Wireshark display filters such as dns and tcp.port help you find traffic.'],
        },
      ],
      bank: [
        {
          q: 'You want to practice scanning. Which target is acceptable?',
          options: [
            'A virtual machine you own, on an isolated lab network',
            'Your school’s web server, because it is public',
            'A neighbor’s Wi-Fi router',
            'Any website, as long as you do not change anything',
          ],
          answer: 'A virtual machine you own, on an isolated lab network',
          explanation: 'Only test systems you own or have written permission to test. Being public does not mean you are allowed to test it.',
          lesson: 'Rules first: permission and rules of engagement',
          source: tx('Penetration Testing'),
        },
        {
          q: 'During an authorized test, you notice a server that is not listed in the scope. What should you do?',
          options: [
            'Leave it alone and ask the contact in the rules of engagement',
            'Test it quickly, since you are already inside',
            'Shut it down to be safe',
            'Copy its data for the report',
          ],
          answer: 'Leave it alone and ask the contact in the rules of engagement',
          explanation: 'Out-of-scope systems must not be touched. The rules of engagement list emergency contacts for questions.',
          lesson: 'Rules first: permission and rules of engagement',
          source: tx('Penetration Testing'),
        },
        {
          type: TF,
          q: 'Rules of engagement can limit testing to certain hours, such as after 6 p.m.',
          answer: 'True',
          explanation: 'Many organizations specify when testing may happen, for example outside business hours.',
          lesson: 'Rules first: permission and rules of engagement',
          source: tx('Penetration Testing'),
        },
        {
          q: 'Why are exploit attempts written into the rules of engagement carefully?',
          options: [
            'Exploiting a vulnerability can make a system or service fail',
            'Exploits always fix the vulnerability',
            'Exploits only work at night',
            'Rules of engagement are not needed for exploits',
          ],
          answer: 'Exploiting a vulnerability can make a system or service fail',
          explanation: 'Some exploits, such as buffer overflows, can crash systems, so the rules protect critical production systems.',
          lesson: 'Rules first: permission and rules of engagement',
          source: tx('Penetration Testing'),
        },
        {
          q: 'Which VirtualBox network mode puts the VM directly on your real network like another device?',
          options: ['Bridged', 'Internal network', 'Host-only', 'NAT'],
          answer: 'Bridged',
          explanation: 'Bridged networking exchanges packets directly through one of your network cards. Avoid it for practice on networks you do not own.',
          lesson: 'Build your lab: configure the lab network',
          source: 'Oracle VirtualBox User Guide, "Virtual Networking"',
        },
        {
          q: 'Which VirtualBox network mode is the default and lets the VM browse the web and download updates?',
          options: ['NAT', 'Internal network', 'Bridged', 'Not attached'],
          answer: 'NAT',
          explanation: 'NAT is the default mode and is enough to browse, download files and view email inside the guest.',
          lesson: 'Build your lab: configure the lab network',
          source: 'Oracle VirtualBox User Guide, "Virtual Networking"',
        },
        {
          q: 'Which VirtualBox mode creates a network of your computer and VMs without using your physical network interface?',
          options: ['Host-only', 'Bridged', 'NAT', 'Not attached'],
          answer: 'Host-only',
          explanation: 'Host-only networking creates a virtual interface on the host, so the host and VMs can talk without the physical network.',
          lesson: 'Build your lab: configure the lab network',
          source: 'Oracle VirtualBox User Guide, "Virtual Networking"',
        },
        {
          q: 'You broke your lab VM while experimenting. What is the quickest safe way back?',
          options: [
            'Restore the snapshot you took after installing it',
            'Reinstall your main operating system',
            'Switch the VM to bridged networking',
            'Delete VirtualBox',
          ],
          answer: 'Restore the snapshot you took after installing it',
          explanation: 'Snapshots save a VM’s state so you can revert to it, which is why you take one right after installation.',
          lesson: 'Build your lab: install Ubuntu',
          source: 'Oracle VirtualBox User Guide (snapshots)',
        },
        {
          q: 'What is Wireshark?',
          options: [
            'A network packet analyzer that shows captured packet data in detail',
            'An antivirus program',
            'A password manager',
            'A virtual machine hypervisor',
          ],
          answer: 'A network packet analyzer that shows captured packet data in detail',
          explanation: 'Wireshark captures packets and presents them in as much detail as possible, like a voltmeter for a network cable.',
          lesson: 'Guided exercises: traffic, Bandit, accounts and email',
          source: 'Wireshark User’s Guide, chapter 1',
        },
        {
          q: 'In a Wireshark capture of your own traffic, which display filter shows name lookups?',
          options: ['dns', 'tcp.port == 22', 'http.cookie', 'arp'],
          answer: 'dns',
          explanation: 'The dns filter shows DNS queries and answers: the lookups that turn names into IP addresses.',
          lesson: 'Guided exercises: traffic, Bandit, accounts and email',
          source: 'Wireshark User’s Guide, display filters; CS50 Understanding Technology notes, Internet (DNS)',
        },
        {
          q: 'To start OverTheWire Bandit level 0, which port do you connect to with SSH?',
          options: ['2220', '22', '443', '80'],
          answer: '2220',
          explanation: 'The Bandit host bandit.labs.overthewire.org accepts SSH on port 2220, with username and password bandit0.',
          lesson: 'Guided exercises: traffic, Bandit, accounts and email',
          source: 'OverTheWire Bandit, Level 0 page',
        },
        {
          type: TF,
          q: 'A virtual machine gives you permission to scan any website from inside it.',
          answer: 'False',
          explanation: 'Where you run a tool does not change the law. You still need the target owner’s permission.',
          lesson: 'Build your lab: install VirtualBox',
          source: tx('Penetration Testing'),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-115: Technical Guide to Information Security Testing and Assessment',
          authors: 'Karen Scarfone, Murugiah Souppaya, Amanda Cody, Angela Orebaugh',
          publisher: 'NIST',
          year: 2008,
          url: 'https://csrc.nist.gov/pubs/sp/800/115/final',
          kind: 'STANDARD',
          access: 'FREE',
          note: 'How security testing is planned, authorized and carried out. Recommended in the rules-of-engagement video.',
        },
        {
          title: 'Oracle VirtualBox User Guide',
          authors: 'Oracle',
          publisher: 'Oracle',
          url: 'https://www.virtualbox.org/manual/',
          kind: 'DOCUMENTATION',
          access: 'FREE',
          note: 'Read "Virtual Networking" for the network modes and "Snapshots" for rolling back.',
        },
        {
          title: 'Wireshark User’s Guide',
          authors: 'The Wireshark project',
          publisher: 'Wireshark Foundation',
          url: 'https://www.wireshark.org/docs/wsug_html_chunked/',
          kind: 'DOCUMENTATION',
          access: 'FREE',
          note: 'Capturing packets and building display filters.',
        },
        {
          title: 'OverTheWire: Bandit',
          authors: 'OverTheWire',
          publisher: 'OverTheWire',
          url: 'https://overthewire.org/wargames/bandit/',
          kind: 'DOCUMENTATION',
          access: 'FREE',
          note: 'A free command-line wargame for absolute beginners. No account needed; read the site rules first.',
        },
      ],
    },

    // ── Stage 4 ─────────────────────────────────────────────────────
    {
      key: 'specialty',
      title: 'Stage 4: Choose a Specialty',
      description: 'Four specialties, what each one does, and the course and resources to continue with.',
      difficulty: 'INTERMEDIATE',
      passPercent: 80,
      quizCount: 10,
      time: 'About 2 to 3 hours here, then a specialty course (15 to 30 hours)',
      outcomes: [
        'Describe what security operations and incident response work involves',
        'Recognize common cloud and application weaknesses such as misconfiguration, missing patches and poor input validation',
        'Explain how authorized penetration testing works: red and blue teams, known and unknown environments, passive and active reconnaissance',
        'Choose a specialty and a next course and practice platform that fit your goals',
      ],
      prerequisites: ['Stage 3 passed', 'Your practice lab from Stage 3'],
      practice: `### Exercises (about 1 hour)

1. **Compare the specialties.** For each of the four specialties below, write two tasks you would do in a typical week and one skill you still need.
2. **Explore one free resource per specialty.** Try one free item from each specialty's list. Note which one you enjoyed most.
3. **Plan your next 8 weeks.** Pick one specialty, its course on this site, and one practice platform. Write a weekly plan of 3 to 5 hours.
4. **NICE Framework.** Find two work roles in the NIST NICE Framework that match your chosen specialty and list the tasks they include.`,
      nextSteps: `Pass the Stage 4 exam (80%) to complete the roadmap and earn its certificate. Then start the course for the specialty you chose, below, and keep practicing in your lab and on the platforms listed. Platforms marked **Free account** or **Paid** need a sign-up or payment.`,
      specialties: [
        {
          key: 'soc',
          title: 'Security operations and incident response',
          summary: 'Monitor alerts, investigate suspicious activity, and respond to incidents in a security operations center (SOC).',
          roles: ['SOC analyst', 'Incident responder', 'Threat hunter'],
          courses: ['defensive-ops'],
          resources: [
            { title: 'NIST SP 800-61 Rev. 3: Incident Response Recommendations', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', publisher: 'NIST', access: 'FREE' },
            { title: 'CyberDefenders: blue team labs', url: 'https://cyberdefenders.org/', publisher: 'CyberDefenders', access: 'ACCOUNT', note: 'Free labs need an account; some content is paid' },
            { title: 'Blue Team Labs Online', url: 'https://blueteamlabs.online/', publisher: 'Security Blue Team', access: 'ACCOUNT', note: 'Free tier with an account; some content is paid' },
          ],
        },
        {
          key: 'network-cloud',
          title: 'Network and cloud security',
          summary: 'Design and protect networks and cloud environments: segmentation, firewalls, identity, configuration and resilience.',
          roles: ['Network security engineer', 'Cloud security engineer', 'Security architect'],
          courses: ['networking-linux', 'security-governance'],
          resources: [
            { title: 'AWS Skill Builder', url: 'https://skillbuilder.aws/', publisher: 'Amazon Web Services', access: 'ACCOUNT', note: 'Many free courses with an account; labs and exam prep are paid' },
            {
              title: 'Microsoft Security, Compliance, and Identity Fundamentals (SC-900)',
              url: 'https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/',
              publisher: 'Microsoft Learn',
              access: 'FREE',
              note: 'Learning paths are free; the certification exam is paid',
            },
          ],
        },
        {
          key: 'appsec',
          title: 'Application security',
          summary: 'Find and prevent weaknesses in software: input validation, authentication, secure code review and testing.',
          roles: ['Application security engineer', 'Secure software developer', 'Product security analyst'],
          courses: ['cyber-foundations'],
          resources: [
            { title: 'OWASP Top 10', url: 'https://owasp.org/Top10/', publisher: 'OWASP Foundation', access: 'FREE' },
            { title: 'Web Security Academy', url: 'https://portswigger.net/web-security', publisher: 'PortSwigger', access: 'ACCOUNT', note: 'Free, with a free account for the labs' },
            {
              title: 'OWASP Juice Shop',
              url: 'https://owasp.org/www-project-juice-shop/',
              publisher: 'OWASP Foundation',
              access: 'FREE',
              note: 'A deliberately insecure app you run in your own lab for practice',
            },
          ],
        },
        {
          key: 'pentest',
          title: 'Authorized penetration testing',
          summary: 'Test systems with the owner’s written permission, within agreed rules of engagement, and report how to fix what you find.',
          roles: ['Penetration tester', 'Red team operator', 'Vulnerability analyst'],
          courses: ['defensive-ops'],
          resources: [
            { title: 'NIST SP 800-115: Technical Guide to Information Security Testing and Assessment', url: 'https://csrc.nist.gov/pubs/sp/800/115/final', publisher: 'NIST', access: 'FREE' },
            { title: 'TryHackMe', url: 'https://tryhackme.com/', publisher: 'TryHackMe', access: 'ACCOUNT', note: 'Free rooms with an account; most learning paths need a subscription' },
            { title: 'Hack The Box Academy', url: 'https://academy.hackthebox.com/', publisher: 'Hack The Box', access: 'ACCOUNT', note: 'Some free modules with an account; most are paid' },
            {
              title: 'Practical Ethical Hacking',
              url: 'https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course',
              publisher: 'TCM Security',
              access: 'PAID',
            },
          ],
        },
      ],
      lessons: [
        {
          key: 'soc-ir',
          title: 'Specialty: security operations and incident response',
          summary: 'How a SOC turns events into incidents and manages them.',
          video: soc(7209, 7655),
          content: `## What this lesson covers

In a security operations center, analysts watch **events** (anything observable, such as a login or a blocked connection) and decide which ones are **incidents** (events that harm, or threaten, security). NIST SP 800-61 Rev. 2 described incident handling as a lifecycle: preparation; detection and analysis; containment, eradication and recovery; and post-incident activity (lessons learned). Rev. 3 (2025) places incident response within the NIST Cybersecurity Framework 2.0 functions, but the same ideas apply.

**Course to continue with:** Defensive Security Operations.

> **Instructor review:** this lesson is a clip of TCM's SOC 101 course ("Incident and Event Management" chapter). The lifecycle summary is from NIST SP 800-61 Rev. 2 and was not checked against the video; confirm the question matches it.`,
          takeaways: ['Not every event is an incident.', 'Incident handling runs from preparation through detection and response to lessons learned.'],
          checkpoints: [
            {
              at: 430,
              q: 'What is the difference between a security event and a security incident?',
              options: [
                'An event is anything observable; an incident is an event that harms or threatens security',
                'They mean exactly the same thing',
                'Events only happen at night',
                'An incident is any login to a system',
              ],
              answer: 'An event is anything observable; an incident is an event that harms or threatens security',
              explanation: 'Analysts triage many events to find the few that are real incidents needing a response.',
              topic: 'road-specialty',
              review: true,
              source: socSrc('Incident and Event Management', 'NIST SP 800-61 Rev. 2 (not checked against the video)'),
            },
          ],
        },
        {
          key: 'cloud',
          title: 'Specialty: network and cloud security',
          summary: 'Why cloud applications are exposed, and the misconfigurations and missing patches attackers look for.',
          video: messer('V2DCYO-sWRQ', 245),
          content: `## What this lesson covers

- Many organizations do not use **multi-factor authentication** on their cloud consoles, and much cloud code is **unpatched**.
- Anything in a public cloud can be reached by anyone, so it can be targeted by **denial of service** and by attempts to abuse **weak or misconfigured authentication**.
- **Directory traversal** (moving around a web server's folders) is a misconfiguration that should not be allowed.
- Unpatched systems can allow **remote code execution**; examples include the Log4j and Spring Cloud Function vulnerabilities.
- Poor input validation can allow **cross-site scripting** and **SQL injection** against cloud-hosted data.

**Courses to continue with:** Networking & Linux Foundations (if not finished) and Security Architecture, Governance & Risk.`,
          takeaways: ['Use MFA on cloud consoles and patch everything.', 'Misconfiguration is a leading cloud risk.'],
          checkpoints: [
            {
              at: 155,
              q: 'A web server lets visitors move into folders they should not see. What is this weakness called?',
              options: ['Directory traversal', 'Denial of service', 'Hashing', 'Fault tolerance'],
              answer: 'Directory traversal',
              explanation: 'Directory traversal means moving around a web server’s folder structure; it is a misconfiguration that should be blocked.',
              topic: 'road-specialty',
              source: tx('Cloud-specific Vulnerabilities'),
            },
            {
              at: 238,
              q: 'Attackers send SQL commands through an input field of a cloud app to read its database. What is this attack?',
              options: ['SQL injection', 'Directory traversal', 'Denial of service', 'Bluetooth pairing'],
              answer: 'SQL injection',
              explanation: 'SQL injection is a code injection attack that targets the data behind the application.',
              topic: 'road-specialty',
              source: tx('Cloud-specific Vulnerabilities'),
            },
          ],
        },
        {
          key: 'appsec',
          title: 'Specialty: application security',
          summary: 'Input validation, fuzzing, secure cookies, static analysis, code signing, sandboxing and monitoring.',
          video: messer('fFvXy3WkLpA', 506),
          content: `## What this lesson covers

- **Input validation:** every input must match what the application expects (for example, a zip code's length and format).
- **Fuzzing:** automated tools send random input to find unexpected behavior.
- **Secure cookies:** an attribute that sends the cookie only over HTTPS. Never store sensitive data in cookies.
- **Static application security testing (SAST):** analyzes source code for flaws such as buffer overflows; it can miss some issues and report false positives.
- **Code signing:** shows the code has not changed since the developer signed it and that it really came from them.
- **Sandboxing:** limits an application to the data it needs.
- **Monitoring:** logs reveal attack attempts such as SQL injection.

**Course to continue with:** Cybersecurity Foundations, module 4 (Securing Software), then the OWASP resources below.`,
          takeaways: ['Validate every input.', 'Fuzzing and SAST find flaws before attackers do.', 'Code signing proves origin and integrity.'],
          checkpoints: [
            {
              at: 135,
              q: 'What is fuzzing?',
              options: [
                'Automatically sending random input to an application to see if it behaves unexpectedly',
                'Encrypting an application’s database',
                'Signing code with a certificate',
                'Blurring screenshots in a report',
              ],
              answer: 'Automatically sending random input to an application to see if it behaves unexpectedly',
              explanation: 'Fuzzers put random data into inputs; unexpected behavior shows where input validation needs work.',
              topic: 'road-specialty',
              source: tx('Application Security'),
            },
            {
              at: 300,
              q: 'What does static application security testing (SAST) examine?',
              options: ['The application’s source code', 'Live network traffic only', 'The office building', 'Employee passwords'],
              answer: 'The application’s source code',
              explanation: 'A static analyzer reads the code to find flaws such as buffer overflows; a developer still checks its output for false positives.',
              topic: 'road-specialty',
              source: tx('Application Security'),
            },
            {
              at: 455,
              q: 'What does code signing let your operating system check before installing an application?',
              options: [
                'That the code has not changed since the developer signed it, and that it came from that developer',
                'That the application has no bugs',
                'That the application is free',
                'That the application uses little memory',
              ],
              answer: 'That the code has not changed since the developer signed it, and that it came from that developer',
              explanation: 'A digital signature, backed by a certificate authority, shows the code’s origin and that it is unchanged.',
              topic: 'road-specialty',
              source: tx('Application Security'),
            },
          ],
        },
        {
          key: 'pentest',
          title: 'Specialty: authorized penetration testing',
          summary: 'Red and blue teams, known and unknown environments, and passive and active reconnaissance.',
          video: messer('wEMzVfwBiWY', 328),
          content: `## What this lesson covers

Penetration testers work **only with the owner's written permission and within the rules of engagement** (Stage 3).

- **Physical penetration tests** check whether someone can get into the building.
- The **red team** attacks and looks for vulnerabilities; the **blue team** detects and blocks attacks. Working together, they improve defenses.
- **Known environment:** full information is provided. **Partially known:** some is provided. **Unknown environment** (a "blind test"): none is provided.
- **Passive reconnaissance** gathers information without touching the customer's network (websites, social media). **Active reconnaissance** queries their systems directly (ping or port scans, DNS queries) and leaves traces in their logs, which is why it needs authorization.

**Next:** Defensive Security Operations covers vulnerability scanning and remediation. Practice only on platforms built for it (see the resources below) and in your own lab.`,
          takeaways: ['Authorization comes first.', 'Red teams attack; blue teams defend.', 'Active reconnaissance touches the target and needs permission.'],
          checkpoints: [
            {
              at: 110,
              q: 'In a penetration test, what does the blue team do?',
              options: [
                'Identifies attacks in real time and blocks them',
                'Attacks systems and looks for vulnerabilities',
                'Writes the company’s marketing plan',
                'Approves the testers’ invoices',
              ],
              answer: 'Identifies attacks in real time and blocks them',
              explanation: 'The red team attacks; the blue team defends. Sharing findings between them improves security.',
              topic: 'road-specialty',
              source: tx('Penetration Tests'),
            },
            {
              at: 170,
              q: 'A tester is given no information about the environment. What is this called?',
              options: ['An unknown environment (blind test)', 'A known environment', 'A partially known environment', 'A blue team exercise'],
              answer: 'An unknown environment (blind test)',
              explanation: 'In an unknown environment the tester must gather all information themselves.',
              topic: 'road-specialty',
              source: tx('Penetration Tests'),
            },
            {
              at: 320,
              q: 'Which of these is active reconnaissance?',
              options: [
                'A port scan of the customer’s servers',
                'Reading the company’s public website',
                'Searching social media posts about the company',
                'Reading online forums',
              ],
              answer: 'A port scan of the customer’s servers',
              explanation: 'Active reconnaissance sends traffic to the target’s systems and can be seen in their logs. The others are passive.',
              topic: 'road-specialty',
              source: tx('Penetration Tests'),
            },
          ],
        },
        {
          key: 'choose',
          title: 'Choose your specialty and plan next steps',
          summary: 'Compare the four specialties, pick one, and plan your next course and practice.',
          minutes: 30,
          content: `## Choosing a specialty

| Specialty | You might enjoy it if... | Continue with |
| --- | --- | --- |
| **Security operations and incident response** | you like investigating, spotting patterns in logs and solving problems under time pressure | Defensive Security Operations |
| **Network and cloud security** | you like designing systems, networks and cloud platforms | Networking & Linux Foundations, then Security Architecture, Governance & Risk |
| **Application security** | you like code and want software to be secure from the start | Cybersecurity Foundations (Securing Software), then OWASP resources |
| **Authorized penetration testing** | you like thinking like an attacker, within strict rules and with permission | Defensive Security Operations (vulnerabilities), then the platforms listed |

The specialty cards on this stage's page list the courses and resources for each, labeled **Free**, **Free account** or **Paid**.

### Find your role
The **NIST NICE Framework** (SP 800-181) describes cybersecurity work roles and the tasks, knowledge and skills each needs. Use it to name the role you are aiming for.

### Keep practicing safely
Practice only in your own lab or on platforms built for it, and only test anything else with written permission.

Mark this lesson complete, then take the Stage 4 exam.`,
          takeaways: ['Pick one specialty and one practice platform.', 'Use the NICE Framework to find work roles.'],
        },
      ],
      bank: [
        {
          q: 'A SOC analyst reviews hundreds of alerts and finds one that shows real harm. What has the analyst identified?',
          options: ['A security incident', 'A security control', 'A bug bounty', 'A snapshot'],
          answer: 'A security incident',
          explanation: 'Events are anything observable; an incident is an event that harms or threatens security and needs a response.',
          lesson: 'Specialty: security operations and incident response',
          review: true,
          source: 'TCM SOC 101 chapter "Incident and Event Management" and NIST SP 800-61 Rev. 2. Not checked against the video or the document text; confirm before use.',
        },
        {
          q: 'What does the "lessons learned" step of incident response do?',
          options: [
            'Reviews what happened to improve preparation and defenses',
            'Deletes all logs about the incident',
            'Blames the person who clicked the link',
            'Starts the attack again to test it',
          ],
          answer: 'Reviews what happened to improve preparation and defenses',
          explanation: 'After recovery, the team reviews the incident and feeds improvements back into preparation.',
          lesson: 'Specialty: security operations and incident response',
          review: true,
          source: 'NIST SP 800-61 Rev. 2 incident handling lifecycle (post-incident activity). Not checked against the document text; confirm before use.',
        },
        {
          q: 'Which simple step would protect many organizations’ cloud consoles, according to the video?',
          options: ['Turning on multi-factor authentication', 'Using bridged networking', 'Disabling logging', 'Publishing the admin URL'],
          answer: 'Turning on multi-factor authentication',
          explanation: 'The video cites estimates that most organizations do not use MFA on their cloud consoles.',
          lesson: 'Specialty: network and cloud security',
          source: tx('Cloud-specific Vulnerabilities'),
        },
        {
          type: TF,
          q: 'An application in a public cloud can be reached by anyone in the world, which also makes it a target for denial-of-service attacks.',
          answer: 'True',
          explanation: 'Being reachable from anywhere is the point of a public cloud app, and it means anyone can try to disable it.',
          lesson: 'Specialty: network and cloud security',
          source: tx('Cloud-specific Vulnerabilities'),
        },
        {
          q: 'Why are unpatched systems in the cloud dangerous?',
          options: [
            'Known vulnerabilities can allow remote code execution, as with Log4j',
            'They use too much electricity',
            'They cannot be reached from the internet',
            'They automatically delete their data',
          ],
          answer: 'Known vulnerabilities can allow remote code execution, as with Log4j',
          explanation: 'Easy-to-exploit vulnerabilities such as Log4j can give an attacker control of the system.',
          lesson: 'Specialty: network and cloud security',
          source: tx('Cloud-specific Vulnerabilities'),
        },
        {
          q: 'A form field for a zip code accepts 500 characters of any kind. Which practice is missing?',
          options: ['Input validation', 'Code signing', 'Sandboxing', 'Bug bounties'],
          answer: 'Input validation',
          explanation: 'Input validation checks that each input matches the expected format, such as a zip code’s length and characters.',
          lesson: 'Specialty: application security',
          source: tx('Application Security'),
        },
        {
          q: 'What does the secure attribute on a cookie do?',
          options: [
            'Makes the browser send the cookie only over HTTPS',
            'Encrypts everything stored in the cookie',
            'Makes the cookie impossible to read in the browser',
            'Deletes the cookie after one use',
          ],
          answer: 'Makes the browser send the cookie only over HTTPS',
          explanation: 'Secure cookies are sent only over encrypted connections. Cookie contents can still be read, so never store sensitive data in them.',
          lesson: 'Specialty: application security',
          source: tx('Application Security'),
        },
        {
          q: 'A mobile browser can show your bookmarks but cannot open your camera roll by default. Which technique is this?',
          options: ['Sandboxing', 'Fuzzing', 'Directory traversal', 'Passive reconnaissance'],
          answer: 'Sandboxing',
          explanation: 'Sandboxing limits an application to the data it needs, which limits what an attacker can reach through it.',
          lesson: 'Specialty: application security',
          source: tx('Application Security'),
        },
        {
          type: TF,
          q: 'A static code analyzer finds every security problem and never reports false positives.',
          answer: 'False',
          explanation: 'Static analysis misses some issues, such as flawed cryptography implementations, and its output must be checked for false positives.',
          lesson: 'Specialty: application security',
          source: tx('Application Security'),
        },
        {
          q: 'Before a penetration tester sends a single packet to a client’s network, what must be in place?',
          options: [
            'Written permission and agreed rules of engagement',
            'A fast internet connection',
            'A red team T-shirt',
            'Nothing, if the tester is certified',
          ],
          answer: 'Written permission and agreed rules of engagement',
          explanation: 'Authorization and an agreed scope come first. Testing without them is an attack, not a test.',
          lesson: 'Specialty: authorized penetration testing',
          source: `${tx('Penetration Testing')}; ${tx('Penetration Tests')}`,
        },
        {
          q: 'Reading a company’s public website and social media to learn about its systems is which kind of reconnaissance?',
          options: ['Passive', 'Active', 'Physical', 'Corrective'],
          answer: 'Passive',
          explanation: 'Passive reconnaissance uses sources that do not connect directly to the customer’s network.',
          lesson: 'Specialty: authorized penetration testing',
          source: tx('Penetration Tests'),
        },
        {
          q: 'A test where the client gives the tester full details of the systems to be tested uses which kind of environment?',
          options: ['Known environment', 'Unknown environment', 'Partially known environment', 'Blind environment'],
          answer: 'Known environment',
          explanation: 'A known environment means full disclosure of the systems in the test.',
          lesson: 'Specialty: authorized penetration testing',
          source: tx('Penetration Tests'),
        },
        {
          q: 'Which NIST publication describes cybersecurity work roles and the tasks and skills each needs?',
          options: ['SP 800-181, the NICE Framework', 'SP 800-115', 'SP 800-63B', 'SP 800-12'],
          answer: 'SP 800-181, the NICE Framework',
          explanation: 'The NICE Workforce Framework for Cybersecurity (SP 800-181 Rev. 1) defines work roles, tasks, knowledge and skills.',
          lesson: 'Choose your specialty and plan next steps',
          source: 'NIST SP 800-181 Rev. 1 (publication page)',
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-181 Rev. 1: Workforce Framework for Cybersecurity (NICE Framework)',
          authors: 'Rodney Petersen, Danielle Santos, Karen Wetzel, Matthew Smith, Gregory Witte',
          publisher: 'NIST',
          year: 2020,
          url: 'https://csrc.nist.gov/pubs/sp/800/181/r1/final',
          kind: 'STANDARD',
          access: 'FREE',
          note: 'The common language for cybersecurity work roles. Pair it with the NICE Framework Resource Center.',
        },
        {
          title: 'NICE Framework Resource Center',
          authors: 'NIST',
          publisher: 'NIST',
          url: 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center',
          kind: 'DOCUMENTATION',
          access: 'FREE',
          note: 'Current work roles, competency areas and tools for exploring them.',
        },
        {
          title: 'NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management',
          authors: 'Alexander Nelson, Sanjay Rekhi, Murugiah Souppaya, Karen Scarfone',
          publisher: 'NIST',
          year: 2025,
          url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
          kind: 'STANDARD',
          access: 'FREE',
          note: 'How organizations prepare for, detect, respond to and recover from incidents.',
        },
        {
          title: 'OWASP Top 10',
          authors: 'OWASP Foundation',
          publisher: 'OWASP Foundation',
          url: 'https://owasp.org/Top10/',
          kind: 'REPORT',
          access: 'FREE',
          note: 'The most critical web application security risks, with prevention guidance.',
        },
        {
          title: 'No-Cost Cybersecurity Services and Tools',
          authors: 'Cybersecurity and Infrastructure Security Agency (CISA)',
          publisher: 'CISA',
          url: 'https://www.cisa.gov/resources-tools/resources/free-cybersecurity-services-and-tools',
          kind: 'ARTICLE',
          access: 'FREE',
          note: 'Free tools and services for defenders, many of them open source.',
        },
      ],
    },
  ],
};

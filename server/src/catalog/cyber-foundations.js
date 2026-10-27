// Course 1 (Beginner): Cybersecurity Foundations, built on Harvard's CS50 Introduction to Cybersecurity.
// Videos: official CS50 playlist PLhQjrBD2T383Cqo5I1oRrbC1EKRAKGKUE (CC BY-NC-SA 4.0). Lessons are clips cut at the
// lectures' own chapter markers. Questions are grounded in CS50's published lecture notes
// (https://cs50.harvard.edu/cybersecurity/notes/0/ to /4/); each checkpoint appears after the chapter it asks about.
import { MULTI, TF, FILL, youtube } from './helpers.js';

const CREDIT = "CS50's Introduction to Cybersecurity, Harvard University (David J. Malan). CC BY-NC-SA 4.0.";
const L0 = 'kUovJpWqEMk';
const L1 = 'X3DVaMnl5n8';
const L2 = '9phdZjF8qOk';
const L3 = '5rsKrTh3fAo';
const L4 = '6IeqJtudKnk';
const notes = (n) => `CS50 Cybersecurity lecture notes, Lecture ${n}`;
const clip = (id, start, end) => youtube(id, { start, end, credit: CREDIT });

export default {
  key: 'cyber-foundations',
  version: 1,
  topics: {
    'cyber-accounts': 'Securing accounts',
    'cyber-data': 'Securing data',
    'cyber-systems': 'Securing systems',
    'cyber-software': 'Securing software',
    'cyber-privacy': 'Preserving privacy',
  },
  roadmap: {
    slug: 'cybersecurity-foundations',
    title: 'Cybersecurity Foundations',
    summary: 'Harvard CS50 cybersecurity: accounts, data, systems, software and privacy.',
    description:
      "Start here. This course follows Harvard's CS50 Introduction to Cybersecurity lecture by lecture: how accounts are attacked and defended, how hashing and encryption protect data, how networks and systems are secured, how software is exploited and hardened, and how to protect your privacy online. Each lecture is split into short lessons at its own chapter markers, with checkpoint questions during the videos and a block quiz after each module.",
    category: 'Cybersecurity',
    difficulty: 'BEGINNER',
    prerequisites: ['No prior security knowledge needed', 'Comfortable using a web browser and email'],
    learningOutcomes: [
      'Explain the trade-off between security and usability, and defend accounts with strong passwords, MFA, password managers and passkeys',
      'Describe how hashing, salting, secret-key and public-key cryptography, and digital signatures protect data',
      'Explain how HTTPS, VPNs, SSH, ports and firewalls secure networked systems, and how malware spreads',
      'Recognize injection, cross-site scripting and CSRF attacks and the defenses against them',
      'Identify how browsers, cookies, DNS and permissions expose personal data, and the tools that reduce that exposure',
    ],
    sources: [
      {
        title: "CS50's Introduction to Cybersecurity (YouTube playlist)",
        author: 'CS50, Harvard University',
        url: 'https://www.youtube.com/playlist?list=PLhQjrBD2T383Cqo5I1oRrbC1EKRAKGKUE',
        license: 'CC BY-NC-SA 4.0',
      },
      { title: 'Course site, notes and slides', author: 'CS50, Harvard University', url: 'https://cs50.harvard.edu/cybersecurity/', license: 'CC BY-NC-SA 4.0' },
    ],
    order: 10,
    isFeatured: true,
  },
  modules: [
    // ── Module 1 ────────────────────────────────────────────────────
    {
      key: 'accounts',
      title: 'Securing Accounts',
      description: 'Passwords, brute force, multi-factor authentication, phishing, single sign-on, password managers and passkeys.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'intro',
          title: 'Welcome to the course',
          summary: 'What CS50 Cybersecurity covers and how this course is organized.',
          video: youtube('kmJlnUfMd7I', { duration: 142, credit: CREDIT }),
          content: `## About this course

This course follows **CS50's Introduction to Cybersecurity** from Harvard University, taught by David J. Malan. The five lectures become five modules:

1. Securing accounts
2. Securing data
3. Securing systems
4. Securing software
5. Preserving privacy

### How the course player works

- Lessons unlock **one at a time**. Watch at least 90% of a video and answer its checkpoint questions to complete it.
- Each module ends with a **block quiz** drawn from a question bank. Pass it (70% or more) to unlock the next module.
- Your place is saved automatically, so you can stop and resume at any time.
- Further reading for each module is listed at the end of the module.`,
          takeaways: ['The course has five modules, one per CS50 lecture.', 'Each module ends with a block quiz you must pass to continue.'],
          checkpoints: [
            {
              at: 120,
              q: 'In this course, what unlocks the next module?',
              options: [
                'Passing the block quiz at the end of the current module',
                'Watching any one video in the current module',
                'Waiting a week',
                'Bookmarking every lesson',
              ],
              answer: 'Passing the block quiz at the end of the current module',
              explanation: 'Every module ends with a block quiz. Passing it with 70% or more unlocks the next module.',
              topic: 'cyber-accounts',
              source: 'Course rules',
            },
          ],
        },
        {
          key: 'passwords',
          title: 'Passwords and brute-force attacks',
          summary: 'Why longer passwords drawn from more characters raise the cost of guessing.',
          video: clip(L0, 17, 2108),
          content: `## What this lesson covers

- **Authentication building blocks:** usernames and passwords attest that you should have access to an account.
- **Dictionary and brute-force attacks:** adversaries try long lists of likely passwords, or every possible combination.
- **The math of guessing:** a 4-digit PIN has 10 × 10 × 10 × 10 = 10,000 possibilities. Four letters (upper and lower case) give 52⁴, over 7 million. Adding digits and punctuation raises it to over 78 million for just four characters.
- **NIST guidance:** at least 8 characters, allow long passwords and all printable characters, check new passwords against breached lists, no password hints, no forced periodic changes, and limit failed attempts.

### As you watch
Notice how quickly a short program can enumerate every short password, and how each extra character multiplies the work for the adversary.`,
          takeaways: [
            'Every extra character multiplies the number of possible passwords.',
            'There is always a trade-off between security and usability.',
            'NIST advises against forced periodic password changes and recommends checking passwords against breached lists.',
          ],
          checkpoints: [
            {
              at: 1300,
              q: 'How many possible codes does a 4-digit numeric passcode have?',
              options: ['10,000', '40', '1,000', '9,999,999'],
              answer: '10,000',
              explanation: 'Each of the 4 positions can be any of 10 digits: 10 × 10 × 10 × 10 = 10,000. In the worst case an attacker tries them all.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
            {
              at: 2050,
              q: 'NIST recommends that verifiers require users to change their passwords periodically, for example every 90 days.',
              type: TF,
              answer: 'False',
              explanation: 'NIST recommends that verifiers should NOT require periodic password changes. They should instead check new passwords against breached and common lists and limit failed attempts.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
          ],
        },
        {
          key: 'mfa',
          title: 'Two-factor authentication and credential stuffing',
          summary: 'Knowledge, possession and inherence factors, one-time passwords, keyloggers and reused passwords.',
          video: clip(L0, 2108, 2851),
          content: `## What this lesson covers

- **Multi-factor authentication (MFA)** combines factors:
  - *Knowledge*: something only you know (a password)
  - *Possession*: something only you have (a phone or key fob)
  - *Inherence*: something you are (a fingerprint or face)
- **One-time passwords (OTPs)** come from apps, devices or text messages. Text-message codes can be stolen through **SIM swapping**, so an authenticator app is generally safer.
- **Keylogging:** malware that records keystrokes can capture usernames, passwords and OTPs.
- **Credential stuffing:** attackers take username/password pairs leaked from one site and try them on others. Unique passwords per site defeat it.`,
          takeaways: [
            'MFA combines at least two different kinds of factor.',
            'SMS codes are weaker than authenticator apps because of SIM swapping.',
            'Reusing a password lets one breach unlock many accounts.',
          ],
          checkpoints: [
            {
              at: 600,
              q: 'A fingerprint used to unlock an account is which kind of authentication factor?',
              options: ['Inherence', 'Knowledge', 'Possession', 'Location'],
              answer: 'Inherence',
              explanation: 'Inherence factors are things you are, such as biometrics. Knowledge is something you know, and possession is something you have.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
            {
              at: 735,
              q: 'An attacker tries username/password pairs leaked from one website on many other websites. What is this attack called?',
              options: ['Credential stuffing', 'SIM swapping', 'Keylogging', 'Single sign-on'],
              answer: 'Credential stuffing',
              explanation: 'Credential stuffing reuses credentials obtained from a compromised site on other sites. It only works when people reuse passwords.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
          ],
        },
        {
          key: 'phishing',
          title: 'Social engineering, phishing and machine-in-the-middle attacks',
          summary: 'Attacks that target people and the network path rather than the password itself.',
          video: clip(L0, 2851, 3518),
          content: `## What this lesson covers

- **Social engineering** uses social pressure and trust rather than technology, for example someone posing as a trusted party to get your credentials or personal details.
- **Phishing** applies social engineering technologically: a fake site that looks like a real login page. Don't blindly trust links in emails; type the trusted address yourself.
- **Machine-in-the-middle attacks:** devices between you and a service, such as routers and switches, can be compromised by sophisticated attackers.`,
          takeaways: [
            'Social engineering attacks people, not code.',
            'Phishing pages imitate trusted login pages; navigate to sites directly instead of following email links.',
          ],
          checkpoints: [
            {
              at: 470,
              q: 'What is the safest response to an email link that asks you to sign in to your bank?',
              options: [
                "Type the bank's known address into the browser yourself",
                'Click the link but check the page looks right',
                'Reply to the email to ask whether it is real',
                'Forward the email to friends to warn them',
              ],
              answer: "Type the bank's known address into the browser yourself",
              explanation: 'Phishing pages can look identical to the real site. Going to a trusted address directly avoids the attacker-controlled link entirely.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
          ],
        },
        {
          key: 'sso-passkeys',
          title: 'Single sign-on, password managers and passkeys',
          summary: 'Reducing the number of passwords you must remember, and replacing passwords with cryptography.',
          video: clip(L0, 3518, 4387),
          content: `## What this lesson covers

- **Single sign-on (SSO)** lets you use an account such as Google or Facebook to sign in to other services, with less friction.
- **Password managers** generate and store complex, unique passwords, and many recognize phishing sites. The downside: all your eggs are in one basket, protected by one primary password.
- **Passkeys** replace passwords with a key pair: the service stores your **public key** and your device keeps the **private key**, so there is nothing to type or phish.`,
          takeaways: [
            'Password managers make unique passwords practical.',
            'With passkeys, the website holds only a public key; the private key never leaves your device.',
          ],
          checkpoints: [
            {
              at: 560,
              q: 'What is the main downside of a password manager described in this lesson?',
              options: [
                'All of your passwords depend on one primary password ("all your eggs in one basket")',
                'It forces you to reuse the same password everywhere',
                'It cannot generate complex passwords',
                'It makes phishing sites harder to recognize',
              ],
              answer: 'All of your passwords depend on one primary password ("all your eggs in one basket")',
              explanation: 'A password manager stores every password behind one primary password, so that password (and the device) must be well protected.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
            {
              at: 860,
              q: 'With a passkey, which key does the website store?',
              options: ['The public key', 'The private key', 'Both keys', 'Neither; it stores your password'],
              answer: 'The public key',
              explanation: 'The service holds the public key while your device holds the private key, so a breach of the website does not reveal anything that lets an attacker sign in as you.',
              topic: 'cyber-accounts',
              source: notes(0),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Why do longer passwords that use more kinds of characters resist brute-force attacks better?',
          options: [
            'They increase the number of possible combinations an attacker must try',
            'They are encrypted automatically by the browser',
            'They prevent phishing',
            'They cannot be typed by a keylogger',
          ],
          answer: 'They increase the number of possible combinations an attacker must try',
          explanation: 'Each added character multiplies the search space. Four letters give 52⁴ (over 7 million) combinations versus 10,000 for four digits.',
          lesson: 'Passwords and brute-force attacks',
          source: notes(0),
        },
        {
          q: 'Allowing upper- and lower-case letters, how many combinations does a 4-letter password have?',
          options: ['52 × 52 × 52 × 52 (over 7 million)', '26 × 4 = 104', '10 × 10 × 10 × 10 = 10,000', '4⁵² combinations'],
          answer: '52 × 52 × 52 × 52 (over 7 million)',
          explanation: '26 lower-case plus 26 upper-case letters gives 52 choices per position, so 52⁴ ≈ 7.3 million.',
          lesson: 'Passwords and brute-force attacks',
          source: notes(0),
        },
        {
          q: 'Which of these are NIST recommendations for passwords covered in this module? Select all that apply.',
          type: MULTI,
          options: [
            'Check new passwords against breached password lists',
            'Do not let unauthenticated users see password hints',
            'Limit the number of failed authentication attempts',
            'Force users to change passwords every 30 days',
          ],
          answer: [
            'Check new passwords against breached password lists',
            'Do not let unauthenticated users see password hints',
            'Limit the number of failed authentication attempts',
          ],
          explanation: 'NIST recommends checking against breached lists, no hints for unauthenticated claimants and limiting failed attempts. It recommends NOT requiring periodic changes.',
          lesson: 'Passwords and brute-force attacks',
          source: notes(0),
        },
        {
          q: 'There is a trade-off between security and usability: a more secure system can become less convenient to use.',
          type: TF,
          answer: 'True',
          explanation: 'Longer, more complex passwords take longer to type and are harder to remember. Choosing a defense means balancing security against usability.',
          lesson: 'Passwords and brute-force attacks',
          source: notes(0),
        },
        {
          q: 'Your phone receives a one-time code by text message. Which attack can let someone else receive that code?',
          options: ['SIM swapping', 'SQL injection', 'Packet sniffing on HTTPS', 'Rainbow tables'],
          answer: 'SIM swapping',
          explanation: 'In SIM swapping, an adversary obtains or clones your SIM and receives your text messages. App-based OTPs on a secure device are more secure.',
          lesson: 'Two-factor authentication and credential stuffing',
          source: notes(0),
        },
        {
          q: 'A hardware key fob that generates codes is an example of which factor?',
          options: ['Possession', 'Knowledge', 'Inherence', 'Behavior'],
          answer: 'Possession',
          explanation: 'Possession factors are items only the authorized user has, such as a phone or key fob.',
          lesson: 'Two-factor authentication and credential stuffing',
          source: notes(0),
        },
        {
          q: 'Malicious software that records everything you type, including passwords and one-time codes, is called a ___.',
          type: FILL,
          answer: 'keylogger',
          accepted: ['keylogging', 'key logger', 'keystroke logger'],
          explanation: 'Keylogging records keystrokes. It is one reason to sign in only on devices you control.',
          lesson: 'Two-factor authentication and credential stuffing',
          source: notes(0),
        },
        {
          q: 'Which habit makes credential stuffing ineffective against you?',
          options: ['Using a unique password for every site', 'Using a longer username', 'Clearing your browser history', 'Using private browsing'],
          answer: 'Using a unique password for every site',
          explanation: 'Credential stuffing replays passwords leaked from one site. If every password is unique, a leak from one site does not open the others.',
          lesson: 'Two-factor authentication and credential stuffing',
          source: notes(0),
        },
        {
          q: 'A caller claims to be from IT support and asks for your password to "fix your account". What kind of attack is this?',
          options: ['Social engineering', 'Brute force', 'Credential stuffing', 'Ransomware'],
          answer: 'Social engineering',
          explanation: 'Social engineering uses trust and social pressure rather than technology to obtain credentials.',
          lesson: 'Social engineering, phishing and machine-in-the-middle attacks',
          source: notes(0),
        },
        {
          q: 'Phishing is a form of social engineering that typically imitates a trusted website to collect credentials.',
          type: TF,
          answer: 'True',
          explanation: 'Phishing uses social engineering in a technological way, for example a page that looks like a Google login but belongs to an adversary.',
          lesson: 'Social engineering, phishing and machine-in-the-middle attacks',
          source: notes(0),
        },
        {
          q: 'In a machine-in-the-middle attack, where is the adversary?',
          options: [
            'On a device between you and the service, such as a compromised router',
            'Inside the password manager',
            'Only on the destination server',
            'In your browser history',
          ],
          answer: 'On a device between you and the service, such as a compromised router',
          explanation: 'Devices along the path, such as routers and switches, can be compromised so the attacker sits between the two parties.',
          lesson: 'Social engineering, phishing and machine-in-the-middle attacks',
          source: notes(0),
        },
        {
          q: 'What does single sign-on (SSO) let you do?',
          options: [
            'Use one account, such as Google, to sign in to other services',
            'Use the same password on every site',
            'Sign in without any account at all',
            'Store passwords in a text file',
          ],
          answer: 'Use one account, such as Google, to sign in to other services',
          explanation: 'SSO lets a trusted identity provider sign you in to other services, reducing the number of passwords you manage.',
          lesson: 'Single sign-on, password managers and passkeys',
          source: notes(0),
        },
        {
          q: 'Which benefits of password managers are described in this module? Select all that apply.',
          type: MULTI,
          options: [
            'They generate and remember complex passwords',
            'Many recognize phishing websites',
            'They remove the need to protect any password at all',
            'They make it practical to use a different password for every service',
          ],
          answer: [
            'They generate and remember complex passwords',
            'Many recognize phishing websites',
            'They make it practical to use a different password for every service',
          ],
          explanation: 'Password managers create and store strong unique passwords and often spot phishing sites, but you must still protect the one primary password.',
          lesson: 'Single sign-on, password managers and passkeys',
          source: notes(0),
        },
        {
          q: 'Passkeys rely on a pair of keys. Where is the private key kept?',
          options: ['On your device', 'On the website’s server', 'In an email to you', 'In the browser history'],
          answer: 'On your device',
          explanation: 'The website holds the public key; the private key stays on your device and is used to prove your identity without typing a password.',
          lesson: 'Single sign-on, password managers and passkeys',
          source: notes(0),
        },
      ],
      readings: [
        {
          title: 'NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management',
          authors: 'National Institute of Standards and Technology',
          publisher: 'NIST',
          year: 2025,
          url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final',
          kind: 'STANDARD',
          note: 'The current version of the password and authenticator guidance summarized in this module.',
        },
        {
          title: 'The Quest to Replace Passwords: A Framework for Comparative Evaluation of Web Authentication Schemes',
          authors: 'Joseph Bonneau, Cormac Herley, Paul C. van Oorschot, Frank Stajano',
          publisher: 'IEEE Symposium on Security and Privacy',
          year: 2012,
          url: 'https://www.cl.cam.ac.uk/~fms27/papers/2012-BonneauHerOorSta-password--oakland.pdf',
          kind: 'PAPER',
          note: 'Compares dozens of password replacements on usability, deployability and security.',
        },
        {
          title: 'Implementing Phishing-Resistant MFA (fact sheet)',
          authors: 'Cybersecurity and Infrastructure Security Agency',
          publisher: 'CISA',
          year: 2022,
          url: 'https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf',
          kind: 'REPORT',
          note: 'Why some MFA methods resist phishing and SIM swapping better than others.',
        },
      ],
    },

    // ── Module 2 ────────────────────────────────────────────────────
    {
      key: 'data',
      title: 'Securing Data',
      description: 'Hashing and salting, secret-key and public-key cryptography, digital signatures, encryption in transit and at rest.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'hashing',
          title: 'Hashing and salting passwords',
          summary: 'How services avoid storing passwords in plain text, and the attacks hashing must resist.',
          video: clip(L1, 17, 2392),
          content: `## What this lesson covers

- Storing passwords in a plain text file means anyone who obtains the file has every password.
- A **hash function** turns input into a hash value. At sign-in, the password you type is hashed again and compared with the stored hash.
- **One-way hash functions** take input of any length and produce output of a fixed length; you cannot recover the input from the hash.
- Attacks on hashes: **dictionary** and **brute-force** attacks hash guesses one after another; **rainbow tables** precompute hashes (at enormous storage cost).
- **Salting** adds a value to each password before hashing, so two users with the same password get different hashes. NIST recommends that stored passwords be hashed **and** salted.`,
          takeaways: [
            'Servers should store salted hashes, never plain-text passwords.',
            'A one-way hash produces fixed-length output and cannot be reversed.',
            'Salting makes identical passwords produce different hashes.',
          ],
          checkpoints: [
            {
              at: 1500,
              q: 'When you sign in, how does a server that stores password hashes check your password?',
              options: [
                'It hashes the password you typed and compares that hash with the stored hash',
                'It decrypts the stored hash and compares the plain text',
                'It emails the stored password to you',
                'It compares the length of the two passwords',
              ],
              answer: 'It hashes the password you typed and compares that hash with the stored hash',
              explanation: 'Hashes are one-way, so the server never needs the original password. It hashes the input again and compares the results.',
              topic: 'cyber-data',
              source: notes(1),
            },
            {
              at: 2340,
              q: 'Two users choose the same password. What makes their stored hashes different?',
              options: ['Salting', 'Encoding', 'Compression', 'Two-factor authentication'],
              answer: 'Salting',
              explanation: 'A salt is an extra value mixed into each password before hashing, so the same password produces different hash values for different users.',
              topic: 'cyber-data',
              source: notes(1),
            },
          ],
        },
        {
          key: 'secret-key',
          title: 'Secret-key cryptography',
          summary: 'Codes versus ciphers, keys, encryption and decryption with a shared secret.',
          video: clip(L1, 2392, 3801),
          content: `## What this lesson covers

- **Cryptography** is the study of transmitting data securely from one party to another.
- **Codes** convert words into other words (encoding and decoding). **Ciphers** convert plaintext into ciphertext (encryption) and back (decryption).
- **Keys** are very large values used by encryption algorithms.
- In **secret-key (symmetric) cryptography**, the sender and receiver share the same secret key, which is used both to encrypt and to decrypt.
- **Cryptanalysis** studies how ciphers can be analyzed and broken.`,
          takeaways: ['Encryption turns plaintext into ciphertext; decryption reverses it.', 'Secret-key cryptography needs both parties to share one secret key.'],
          checkpoints: [
            {
              at: 1300,
              q: 'In secret-key cryptography, which key does the receiver use to decrypt the message?',
              options: ['The same shared secret key the sender used', 'The sender’s public key', 'A hash of the message', 'No key is needed'],
              answer: 'The same shared secret key the sender used',
              explanation: 'Secret-key (symmetric) cryptography uses one shared secret for both encryption and decryption.',
              topic: 'cyber-data',
              source: notes(1),
            },
          ],
        },
        {
          key: 'public-key',
          title: 'Public-key cryptography and digital signatures',
          summary: 'Sharing secrets with strangers, Diffie-Hellman key exchange and signing documents.',
          video: clip(L1, 3801, 5277),
          content: `## What this lesson covers

- How can two parties who have never met establish a shared secret? **Public-key (asymmetric) cryptography**: anyone encrypts with the receiver's **public key**; only the receiver's **private key** decrypts. **RSA** is a standard for this.
- **Diffie-Hellman** is an algorithm for **key exchange**: using agreed values *g* and a prime *p*, both parties derive the same shared secret.
- **Digital signatures:** hash the document, then sign the hash with your **private key**. Anyone can verify with your **public key** by checking that the hash they compute matches.`,
          takeaways: [
            'Encrypt with the receiver’s public key; only their private key decrypts.',
            'Diffie-Hellman lets two parties agree on a shared secret over an open channel.',
            'Signatures are made with a private key and verified with the matching public key.',
          ],
          checkpoints: [
            {
              at: 760,
              q: 'Alice wants to send Bob a message only Bob can read. With public-key encryption, which key does Alice use?',
              options: ['Bob’s public key', 'Bob’s private key', 'Alice’s private key', 'A salt'],
              answer: 'Bob’s public key',
              explanation: 'Anyone can encrypt with Bob’s public key, but only Bob’s private (secret) key can decrypt the result.',
              topic: 'cyber-data',
              source: notes(1),
            },
            {
              at: 1460,
              q: 'To create a digital signature, the content is hashed and then processed with which key?',
              options: ['The signer’s private key', 'The signer’s public key', 'The recipient’s public key', 'A shared salt'],
              answer: 'The signer’s private key',
              explanation: 'Signing uses the private key; verification uses the matching public key to check that the hash matches.',
              topic: 'cyber-data',
              source: notes(1),
            },
          ],
        },
        {
          key: 'transit',
          title: 'Passkeys and encryption in transit',
          summary: 'How passkeys use key pairs, and how end-to-end encryption keeps intermediaries out.',
          video: clip(L1, 5277, 6010),
          content: `## What this lesson covers

- **Passkeys (WebAuthn):** your device generates a key pair per site and sends the public key to the site. To sign in, the device signs a **challenge** with the private key.
- **Encryption in transit** protects data while it moves across networks.
- Intermediaries such as email providers may be able to read data that is only encrypted between you and them.
- **End-to-end encryption** ensures no third party in between, including the service provider, can read the messages.`,
          takeaways: ['Passkeys sign a challenge with a private key instead of sending a password.', 'End-to-end encryption keeps even the service in the middle from reading messages.'],
          checkpoints: [
            {
              at: 700,
              q: 'What does end-to-end encryption guarantee that ordinary encryption in transit to a provider may not?',
              options: [
                'No third party in between, including the provider, can read the data',
                'Messages arrive faster',
                'The sender’s IP address is hidden',
                'Files are deleted after reading',
              ],
              answer: 'No third party in between, including the provider, can read the data',
              explanation: 'Only the two endpoints hold the keys, so intermediaries such as the service provider cannot read the content.',
              topic: 'cyber-data',
              source: notes(1),
            },
          ],
        },
        {
          key: 'rest',
          title: 'Deletion, encryption at rest, ransomware and quantum computing',
          summary: 'Why deleted files linger, full-disk encryption, and threats to data at rest.',
          video: clip(L1, 6010, 6922),
          content: `## What this lesson covers

- Operating systems often "delete" files by forgetting where they are; the data may remain until overwritten.
- **Secure deletion** overwrites remnants with zeros, ones or random bits.
- **Full-disk encryption (encryption at rest)** protects data on a stolen or sold device, but losing the password means losing the data.
- **Ransomware** uses the same idea against you: attackers encrypt your drive and demand payment.
- **Quantum computing** may give adversaries enough power to break current encryption faster.`,
          takeaways: [
            'Deleted files can often be recovered unless securely wiped.',
            'Full-disk encryption protects lost or stolen devices.',
            'Ransomware abuses encryption to hold data hostage.',
          ],
          checkpoints: [
            {
              at: 360,
              q: 'Why can "deleted" files often be recovered?',
              options: [
                'The operating system usually just forgets where the file is, leaving the data until it is overwritten',
                'Files are always copied to the cloud first',
                'Deletion only renames the file',
                'Hard drives cannot be overwritten',
              ],
              answer: 'The operating system usually just forgets where the file is, leaving the data until it is overwritten',
              explanation: 'Normal deletion removes the reference, not the data. Secure deletion overwrites the remnants.',
              topic: 'cyber-data',
              source: notes(1),
            },
            {
              at: 880,
              q: 'Ransomware abuses which protective technology against its victims?',
              options: ['Encryption', 'Salting', 'Single sign-on', 'Antivirus'],
              answer: 'Encryption',
              explanation: 'Ransomware encrypts the victim’s data and demands payment for the key, the same technology full-disk encryption uses to protect you.',
              topic: 'cyber-data',
              source: notes(1),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'A one-way hash function takes input of any length and produces output of a fixed length.',
          type: TF,
          answer: 'True',
          explanation: 'One-way hash functions accept arbitrary-length input and return a fixed-length hash, and the original input cannot be recovered from it.',
          lesson: 'Hashing and salting passwords',
          source: notes(1),
        },
        {
          q: 'What do attackers precompute in a rainbow table?',
          options: ['Hash values for many possible passwords', 'Lists of email addresses', 'Private keys for websites', 'Salts for every user'],
          answer: 'Hash values for many possible passwords',
          explanation: 'A rainbow table is a precomputed table of hashes, traded off against huge storage requirements. Salting defeats it.',
          lesson: 'Hashing and salting passwords',
          source: notes(1),
        },
        {
          q: 'NIST recommends that stored memorized secrets (passwords) be both hashed and ___.',
          type: FILL,
          answer: 'salted',
          accepted: ['salt'],
          explanation: 'Salting adds a per-user value before hashing so identical passwords do not produce identical hashes.',
          lesson: 'Hashing and salting passwords',
          source: notes(1),
        },
        {
          q: 'Which attacks can still target hashed passwords? Select all that apply.',
          type: MULTI,
          options: ['Dictionary attacks', 'Brute-force attacks', 'Rainbow-table lookups (when hashes are unsalted)', 'Reading the plain-text passwords directly from the database'],
          answer: ['Dictionary attacks', 'Brute-force attacks', 'Rainbow-table lookups (when hashes are unsalted)'],
          explanation: 'Attackers can hash guesses (dictionary or brute force) or look up precomputed hashes. Properly hashed storage has no plain text to read.',
          lesson: 'Hashing and salting passwords',
          source: notes(1),
        },
        {
          q: 'What is the difference between a code and a cipher, as described in this module?',
          options: [
            'Codes substitute words for other words; ciphers transform plaintext into ciphertext using an algorithm and key',
            'Codes are always more secure than ciphers',
            'Ciphers are only used for passwords',
            'There is no difference',
          ],
          answer: 'Codes substitute words for other words; ciphers transform plaintext into ciphertext using an algorithm and key',
          explanation: 'Encoding converts words into codetext. Enciphering (encryption) converts plaintext into ciphertext using an algorithm and a key.',
          lesson: 'Secret-key cryptography',
          source: notes(1),
        },
        {
          q: 'The process of turning ciphertext back into plaintext is called ___.',
          type: FILL,
          answer: 'decryption',
          accepted: ['decrypting', 'deciphering'],
          explanation: 'Encryption turns plaintext into ciphertext; decryption reverses it.',
          lesson: 'Secret-key cryptography',
          source: notes(1),
        },
        {
          q: 'What problem does public-key cryptography solve that secret-key cryptography alone does not?',
          options: [
            'Communicating securely with someone you have never shared a secret with',
            'Making hashes reversible',
            'Compressing large files',
            'Removing the need for any keys',
          ],
          answer: 'Communicating securely with someone you have never shared a secret with',
          explanation: 'Secret-key cryptography needs a shared secret first. Public-key cryptography lets strangers communicate securely using published public keys.',
          lesson: 'Public-key cryptography and digital signatures',
          source: notes(1),
        },
        {
          q: 'What is the goal of the Diffie-Hellman algorithm?',
          options: ['Key exchange: agreeing on a shared secret', 'Hashing passwords', 'Signing software updates', 'Deleting files securely'],
          answer: 'Key exchange: agreeing on a shared secret',
          explanation: 'Diffie-Hellman lets two parties derive the same shared secret from agreed values (g and a prime p) and their own private keys.',
          lesson: 'Public-key cryptography and digital signatures',
          source: notes(1),
        },
        {
          q: 'A recipient verifies your digital signature using your public key.',
          type: TF,
          answer: 'True',
          explanation: 'Signatures are created with the private key and verified with the corresponding public key by comparing hash values.',
          lesson: 'Public-key cryptography and digital signatures',
          source: notes(1),
        },
        {
          q: 'RSA is an example of which kind of cryptography?',
          options: ['Public-key (asymmetric)', 'Secret-key (symmetric) only', 'A hash function', 'An encoding scheme'],
          answer: 'Public-key (asymmetric)',
          explanation: 'RSA is a public-key encryption standard: encrypt with a public key, decrypt with the private key.',
          lesson: 'Public-key cryptography and digital signatures',
          source: notes(1),
        },
        {
          q: 'When signing in with a passkey, what does your device send to prove your identity?',
          options: ['A signature over a challenge, made with the private key', 'Your password', 'Your private key', 'A one-time SMS code'],
          answer: 'A signature over a challenge, made with the private key',
          explanation: 'The private key never leaves the device. It signs a challenge value, and the site verifies the signature with the stored public key.',
          lesson: 'Passkeys and encryption in transit',
          source: notes(1),
        },
        {
          q: 'What does secure deletion do?',
          options: [
            'Overwrites the remnants of deleted files with zeros, ones or random data',
            'Moves files to the recycle bin',
            'Renames the files',
            'Compresses the files',
          ],
          answer: 'Overwrites the remnants of deleted files with zeros, ones or random data',
          explanation: 'Overwriting removes the leftover data that ordinary deletion leaves behind.',
          lesson: 'Deletion, encryption at rest, ransomware and quantum computing',
          source: notes(1),
        },
        {
          q: 'Which statements about full-disk encryption are true? Select all that apply.',
          type: MULTI,
          options: [
            'It protects your data if the device is stolen',
            'Forgetting the password can lock you out of your own data',
            'It stops phishing emails',
            'It is also called encryption at rest',
          ],
          answer: ['It protects your data if the device is stolen', 'Forgetting the password can lock you out of your own data', 'It is also called encryption at rest'],
          explanation: 'Full-disk (at-rest) encryption protects lost or stolen devices, but without the password even the owner cannot read the data. It does nothing against phishing.',
          lesson: 'Deletion, encryption at rest, ransomware and quantum computing',
          source: notes(1),
        },
        {
          q: 'Why is quantum computing discussed as a future threat to data security?',
          options: [
            'It may give adversaries enough computing power to break encryption and guess passwords much faster',
            'It deletes encrypted files',
            'It makes hashes reversible by design',
            'It replaces passkeys',
          ],
          answer: 'It may give adversaries enough computing power to break encryption and guess passwords much faster',
          explanation: 'Quantum computers could drastically cut the time needed to break some of today’s encryption.',
          lesson: 'Deletion, encryption at rest, ransomware and quantum computing',
          source: notes(1),
        },
      ],
      readings: [
        {
          title: 'New Directions in Cryptography',
          authors: 'Whitfield Diffie, Martin E. Hellman',
          publisher: 'IEEE Transactions on Information Theory',
          year: 1976,
          url: 'https://ee.stanford.edu/~hellman/publications/24.pdf',
          kind: 'PAPER',
          note: 'The paper that introduced public-key key exchange (doi:10.1109/TIT.1976.1055638).',
        },
        {
          title: 'FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard',
          authors: 'National Institute of Standards and Technology',
          publisher: 'NIST',
          year: 2024,
          url: 'https://csrc.nist.gov/pubs/fips/203/final',
          kind: 'STANDARD',
          note: 'NIST’s first post-quantum standard, a response to the quantum threat discussed in the lecture.',
        },
        {
          title: 'NIST SP 800-88 Rev. 2: Guidelines for Media Sanitization',
          authors: 'National Institute of Standards and Technology',
          publisher: 'NIST',
          year: 2025,
          url: 'https://csrc.nist.gov/pubs/sp/800/88/r2/final',
          kind: 'STANDARD',
          note: 'How organizations securely delete data, expanding on the lesson about deletion.',
        },
      ],
    },

    // ── Module 3 ────────────────────────────────────────────────────
    {
      key: 'systems',
      title: 'Securing Systems',
      description: 'Wi-Fi, HTTP and HTTPS, VPNs, SSH, ports, firewalls, proxies, malware and antivirus.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'http',
          title: 'Wi-Fi, HTTP, packet sniffing and cookies',
          summary: 'What can go wrong when traffic is unencrypted.',
          video: clip(L2, 17, 1112),
          content: `## What this lesson covers

- Secured Wi-Fi networks use encryption such as **WPA** (Wi-Fi Protected Access).
- **HTTP** is unencrypted. A machine in the middle can inject code or ads into pages you download.
- **Packet sniffing** lets an adversary read unencrypted packets, for example a credit card number.
- **Cookies** are small files websites store on your computer to remember you. Stolen cookies enable **session hijacking**.`,
          takeaways: ['HTTP traffic can be read and modified in transit.', 'Stolen session cookies can let an attacker impersonate you.'],
          checkpoints: [
            {
              at: 1050,
              q: 'Why is plain HTTP risky on an untrusted network?',
              options: [
                'Traffic is unencrypted, so it can be read (sniffed) or modified in transit',
                'HTTP blocks cookies',
                'HTTP only works over Wi-Fi',
                'HTTP always requires a VPN',
              ],
              answer: 'Traffic is unencrypted, so it can be read (sniffed) or modified in transit',
              explanation: 'Because HTTP is unencrypted, packet sniffing can read it and a machine in the middle can inject content.',
              topic: 'cyber-systems',
              source: notes(2),
            },
          ],
        },
        {
          key: 'https',
          title: 'HTTPS, certificates and HSTS',
          summary: 'How TLS, certificate authorities and HSTS protect web traffic.',
          video: clip(L2, 1112, 2276),
          content: `## What this lesson covers

- **HTTPS** encrypts traffic between your browser and the site using **TLS**, built on public-key cryptography.
- Sites present an **X.509 certificate**: their public key signed by a trusted **certificate authority (CA)**. Your browser verifies the signature.
- **SSL stripping:** an attacker uses HTTP to redirect you before the secure connection starts.
- **HSTS (HTTP Strict Transport Security)** tells browsers to always use a secure connection for the site.`,
          takeaways: [
            'Certificate authorities vouch for a site’s public key.',
            'HSTS defends against SSL stripping by forcing HTTPS.',
          ],
          checkpoints: [
            {
              at: 1120,
              q: 'Which mechanism tells the browser to always use a secure connection to a site, defending against SSL stripping?',
              options: ['HSTS', 'Cookies', 'Packet sniffing', 'DNS'],
              answer: 'HSTS',
              explanation: 'HTTP Strict Transport Security instructs the browser to direct all traffic for the site over HTTPS.',
              topic: 'cyber-systems',
              source: notes(2),
            },
          ],
        },
        {
          key: 'vpn-ssh-ports',
          title: 'VPNs, SSH and ports',
          summary: 'Encrypted tunnels, remote command lines, and how services listen on ports.',
          video: clip(L2, 2276, 3093),
          content: `## What this lesson covers

- A **VPN** creates an encrypted channel between two points; services see the VPN's IP address rather than yours.
- **SSH** is a secure protocol for running commands on a remote server.
- **Ports** direct traffic to services: **80** for HTTP, **443** for HTTPS, **22** for SSH.
- Adversaries **port scan** to find listening services. **Penetration testing** and **ethical hacking** check for such weaknesses legally.`,
          takeaways: ['HTTP uses port 80, HTTPS 443 and SSH 22.', 'With a VPN, websites see the VPN’s IP address, not yours.'],
          checkpoints: [
            {
              at: 780,
              q: 'Which port does HTTPS use by default?',
              type: FILL,
              answer: '443',
              explanation: 'By convention HTTP uses port 80, HTTPS 443 and SSH 22.',
              topic: 'cyber-systems',
              source: notes(2),
            },
          ],
        },
        {
          key: 'firewalls',
          title: 'IP addresses, firewalls, deep packet inspection and proxies',
          summary: 'How networks filter and inspect traffic.',
          video: clip(L2, 3093, 3829),
          content: `## What this lesson covers

- An **IP address** is a number assigned to each computer on a network.
- A **firewall** blocks unauthorized access, often using IP addresses to keep outsiders out.
- **Deep packet inspection** examines the data inside packets, for example to detect data leaving a company.
- A **proxy** sits in the middle of all traffic in and out of a network; it can log or change URLs and block harmful sites.`,
          takeaways: ['Firewalls filter traffic, often by IP address.', 'Deep packet inspection looks inside packets, typically on a proxy.'],
          checkpoints: [
            {
              at: 700,
              q: 'A school routes all web traffic through one device that logs which URLs students visit. What is that device?',
              options: ['A proxy', 'A passkey', 'A hash function', 'A botnet'],
              answer: 'A proxy',
              explanation: 'A proxy is a device in the middle through which traffic enters and leaves the network, where URLs can be logged, changed or blocked.',
              topic: 'cyber-systems',
              source: notes(2),
            },
          ],
        },
        {
          key: 'malware',
          title: 'Malware, antivirus and zero-day attacks',
          summary: 'Viruses, worms, botnets, denial-of-service attacks and keeping software updated.',
          video: clip(L2, 3829, 4628),
          content: `## What this lesson covers

- **Malware** is malicious software that damages a computer or compromises its security.
- A **virus** attaches itself to your computer; a **worm** moves from computer to computer through security holes.
- A **botnet** controls many infected computers, which can launch **distributed denial-of-service (DDoS)** attacks.
- **Antivirus** software detects and removes malware; **automatic updates** fix known holes.
- **Zero-day attacks** exploit vulnerabilities before the vendor has a fix.`,
          takeaways: ['Worms spread on their own through security holes.', 'Botnets power DDoS attacks.', 'Updates fix known holes, but zero-days have no fix yet.'],
          checkpoints: [
            {
              at: 760,
              q: 'What makes an attack a "zero-day" attack?',
              options: [
                'It exploits a vulnerability before the software maker has created a fix',
                'It happens on the first day of the month',
                'It only lasts one day',
                'It targets computers with no antivirus installed',
              ],
              answer: 'It exploits a vulnerability before the software maker has created a fix',
              explanation: 'Zero-day attacks use unknown or unpatched vulnerabilities, so updates and antivirus may not yet protect against them.',
              topic: 'cyber-systems',
              source: notes(2),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'WPA is a form of encryption used to secure what?',
          options: ['Wi-Fi networks', 'Email attachments', 'Password hashes', 'DNS queries'],
          answer: 'Wi-Fi networks',
          explanation: 'Wi-Fi Protected Access (WPA) encrypts traffic on wireless networks.',
          lesson: 'Wi-Fi, HTTP, packet sniffing and cookies',
          source: notes(2),
        },
        {
          q: 'An attacker on the same network reads unencrypted traffic as it passes by. What is this called?',
          options: ['Packet sniffing', 'Salting', 'Port forwarding', 'Fingerprinting'],
          answer: 'Packet sniffing',
          explanation: 'Packet sniffing inspects data in transit. It is a major risk for unencrypted protocols such as HTTP.',
          lesson: 'Wi-Fi, HTTP, packet sniffing and cookies',
          source: notes(2),
        },
        {
          q: 'Stealing someone’s session cookie can let an attacker impersonate them on a website (session hijacking).',
          type: TF,
          answer: 'True',
          explanation: 'Cookies identify your session. Whoever presents the cookie can be treated as you.',
          lesson: 'Wi-Fi, HTTP, packet sniffing and cookies',
          source: notes(2),
        },
        {
          q: 'What does a certificate authority (CA) do in HTTPS?',
          options: [
            'Signs certificates that bind a website to its public key, so browsers can trust it',
            'Stores every user’s password',
            'Encrypts the user’s hard drive',
            'Blocks malicious ports',
          ],
          answer: 'Signs certificates that bind a website to its public key, so browsers can trust it',
          explanation: 'The CA is a trusted third party whose signature on an X.509 certificate lets browsers verify a site’s public key.',
          lesson: 'HTTPS, certificates and HSTS',
          source: notes(2),
        },
        {
          q: 'HTTPS encrypts traffic using which protocol?',
          options: ['TLS', 'SSH', 'WPA', 'DNS'],
          answer: 'TLS',
          explanation: 'HTTPS is HTTP over TLS, which uses public-key cryptography to set up encryption.',
          lesson: 'HTTPS, certificates and HSTS',
          source: notes(2),
        },
        {
          q: 'In an SSL stripping attack, what does the adversary exploit?',
          options: [
            'An initial HTTP connection, to redirect the user before HTTPS is established',
            'A weak password hash',
            'A full disk',
            'A zero-day in antivirus software',
          ],
          answer: 'An initial HTTP connection, to redirect the user before HTTPS is established',
          explanation: 'SSL stripping uses unencrypted HTTP to redirect traffic. HSTS mitigates it by forcing secure connections.',
          lesson: 'HTTPS, certificates and HSTS',
          source: notes(2),
        },
        {
          q: 'Match the default port: SSH uses port ___.',
          type: FILL,
          answer: '22',
          explanation: 'SSH listens on port 22 by default; HTTP uses 80 and HTTPS 443.',
          lesson: 'VPNs, SSH and ports',
          source: notes(2),
        },
        {
          q: 'Which statements about VPNs are true? Select all that apply.',
          type: MULTI,
          options: [
            'They create an encrypted channel between two points',
            'Websites see the VPN server’s IP address instead of yours',
            'They protect you even if your computer is infected with malware',
            'People use them to appear to be in another country',
          ],
          answer: [
            'They create an encrypted channel between two points',
            'Websites see the VPN server’s IP address instead of yours',
            'People use them to appear to be in another country',
          ],
          explanation: 'VPNs encrypt traffic to the VPN server and change your apparent IP address, but they do not protect an infected machine.',
          lesson: 'VPNs, SSH and ports',
          source: `${notes(2)}; ${notes(4)}`,
        },
        {
          q: 'What is port scanning?',
          options: [
            'Trying many ports on a host to see which accept traffic',
            'Encrypting traffic on every port',
            'Assigning IP addresses to computers',
            'Scanning a file for viruses',
          ],
          answer: 'Trying many ports on a host to see which accept traffic',
          explanation: 'Adversaries (and penetration testers, with permission) scan ports to discover listening services.',
          lesson: 'VPNs, SSH and ports',
          source: notes(2),
        },
        {
          q: 'Ethical hacking is the legal business of testing systems for vulnerabilities.',
          type: TF,
          answer: 'True',
          explanation: 'Penetration testers and ethical hackers test systems with permission to find weaknesses before adversaries do.',
          lesson: 'VPNs, SSH and ports',
          source: notes(2),
        },
        {
          q: 'What does deep packet inspection examine?',
          options: ['The data inside packets', 'Only the packet’s destination port', 'The physical network cables', 'Users’ password hashes'],
          answer: 'The data inside packets',
          explanation: 'Deep packet inspection looks at packet contents, for example to detect sensitive data leaving an organization.',
          lesson: 'IP addresses, firewalls, deep packet inspection and proxies',
          source: notes(2),
        },
        {
          q: 'Which kind of malware spreads from one computer to another through security holes on its own?',
          options: ['Worm', 'Keylogger', 'Proxy', 'Cookie'],
          answer: 'Worm',
          explanation: 'Worms move between computers via vulnerabilities without needing the user to run them.',
          lesson: 'Malware, antivirus and zero-day attacks',
          source: notes(2),
        },
        {
          q: 'Thousands of infected computers send requests to slow down or shut down one server. What is this attack?',
          options: ['Distributed denial-of-service (DDoS)', 'Credential stuffing', 'SSL stripping', 'SQL injection'],
          answer: 'Distributed denial-of-service (DDoS)',
          explanation: 'A botnet of infected machines can flood a server from many IP addresses, which is a distributed denial-of-service attack.',
          lesson: 'Malware, antivirus and zero-day attacks',
          source: notes(2),
        },
        {
          q: 'Why should automatic updates be enabled?',
          options: [
            'They fix security holes found in earlier versions of the software',
            'They make passwords longer',
            'They hide your IP address',
            'They prevent all zero-day attacks',
          ],
          answer: 'They fix security holes found in earlier versions of the software',
          explanation: 'Updates patch known vulnerabilities. Zero-days are, by definition, not yet fixed.',
          lesson: 'Malware, antivirus and zero-day attacks',
          source: notes(2),
        },
      ],
      readings: [
        {
          title: 'Security Problems in the TCP/IP Protocol Suite',
          authors: 'Steven M. Bellovin',
          publisher: 'ACM SIGCOMM Computer Communication Review',
          year: 1989,
          url: 'https://www.cs.columbia.edu/~smb/papers/ipext.pdf',
          kind: 'PAPER',
          note: 'A classic survey of design weaknesses in the internet’s core protocols.',
        },
        {
          title: 'The Internet Worm Program: An Analysis (Purdue CSD-TR-823)',
          authors: 'Eugene H. Spafford',
          publisher: 'Purdue University',
          year: 1988,
          url: 'https://www.cerias.purdue.edu/techreports-ssl/public/823.pdf',
          kind: 'REPORT',
          note: 'A detailed analysis of the 1988 Morris worm, the first worm to gain wide attention (later published as doi:10.1145/66093.66095).',
        },
        {
          title: 'RFC 6797: HTTP Strict Transport Security (HSTS)',
          authors: 'J. Hodges, C. Jackson, A. Barth',
          publisher: 'IETF',
          year: 2012,
          url: 'https://www.rfc-editor.org/rfc/rfc6797',
          kind: 'STANDARD',
          note: 'The standard behind the HSTS defense against SSL stripping.',
        },
        {
          title: 'RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3',
          authors: 'E. Rescorla',
          publisher: 'IETF',
          year: 2018,
          url: 'https://www.rfc-editor.org/rfc/rfc8446',
          kind: 'STANDARD',
          note: 'The protocol that secures HTTPS today.',
        },
      ],
    },

    // ── Module 4 ────────────────────────────────────────────────────
    {
      key: 'software',
      title: 'Securing Software',
      description: 'Phishing links, cross-site scripting, SQL and command injection, validation, CSRF, code execution and the software supply chain.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'xss',
          title: 'Deceptive links and cross-site scripting',
          summary: 'How HTML links can lie, and how unescaped input lets attackers run scripts.',
          video: clip(L3, 17, 1614),
          content: `## What this lesson covers

- An HTML link's visible text can differ from where it goes: \`<a href="https://yale.edu">https://harvard.edu</a>\` shows Harvard but opens Yale. Hover to check.
- **Cross-site scripting (XSS):** a site is tricked into running an attacker's code supplied as input, for example \`<script>alert('attack')</script>\`.
- A **reflected attack** tricks your own browser into sending a request (such as a crafted link) whose response runs the attacker's script.`,
          takeaways: ['A link’s text and its destination can differ.', 'Sites that echo user input without escaping it are vulnerable to XSS.'],
          checkpoints: [
            {
              at: 600,
              q: 'What does this link do when clicked?',
              code: '<a href="https://yale.edu">https://harvard.edu</a>',
              options: ['Opens yale.edu', 'Opens harvard.edu', 'Opens both sites', 'Nothing; it is invalid'],
              answer: 'Opens yale.edu',
              explanation: 'The href attribute sets the destination; the text between the tags is only what you see. Phishers exploit this difference.',
              topic: 'cyber-software',
              source: notes(3),
            },
            {
              at: 1560,
              q: 'In a reflected cross-site scripting attack, how does the malicious script usually reach the victim?',
              options: [
                'Inside a crafted link that the victim is tricked into clicking',
                'Stored permanently in the website’s database',
                'Through a firewall rule',
                'Via a password manager',
              ],
              answer: 'Inside a crafted link that the victim is tricked into clicking',
              explanation: 'In a reflected attack the script is part of the request (such as a search URL), and the site reflects it back into the page.',
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
        {
          key: 'sqli',
          title: 'Stored attacks, escaping and SQL injection',
          summary: 'Malicious input that is saved, character escapes, Content-Security-Policy and injecting SQL.',
          video: clip(L3, 1614, 3289),
          content: `## What this lesson covers

- A **stored attack** tricks a site into saving malicious code that later runs for other users.
- **Character escapes** neutralize input: \`<\` becomes \`&lt;\`, \`>\` becomes \`&gt;\`, \`&\` becomes \`&amp;\`.
- A **Content-Security-Policy** header such as \`script-src https://example.com/\` stops inline \`<script>\` tags from running.
- **SQL injection:** user input is pasted into a query. Typing \`' OR '1'='1\` as a password turns the condition into one that is always true.

**Never trust user input.**`,
          takeaways: ['Escape user input before displaying it.', 'Inserting raw input into SQL lets attackers change the query.'],
          checkpoints: [
            {
              at: 1640,
              q: 'An attacker types this into the password field of a login form built by pasting input into SQL. Why can it let them in?',
              code: "SELECT * FROM users\nWHERE username = 'malan' AND password = ''\nOR '1'='1'",
              options: [
                "'1'='1' is always true, so the WHERE condition is true for every row",
                'It guesses the correct password',
                'It encrypts the password',
                'It deletes the password column',
              ],
              answer: "'1'='1' is always true, so the WHERE condition is true for every row",
              explanation: "The injected OR '1'='1' makes the whole condition true, so the query returns users without a valid password.",
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
        {
          key: 'prepared',
          title: 'Prepared statements and command injection',
          summary: 'Fixing SQL injection with placeholders, and the danger of passing input to a shell.',
          video: clip(L3, 3289, 4071),
          content: `## What this lesson covers

- **Prepared statements** use placeholders (\`WHERE username = ?\`) so the database library escapes input correctly; a \`'\` becomes \`''\` and can no longer end the string.
- **Command injection:** if user input reaches a command line, an attacker can run commands on the server. Functions like \`system\` and \`eval\` are common culprits.
- Read the documentation to learn how to escape input safely.`,
          takeaways: ['Prepared statements prevent SQL injection.', 'Never pass unsanitized input to system or eval.'],
          checkpoints: [
            {
              at: 760,
              q: 'Which coding practice prevents SQL injection by keeping user input out of the SQL syntax?',
              options: ['Prepared statements with placeholders', 'Client-side validation', 'Longer table names', 'Using HTTP instead of HTTPS'],
              answer: 'Prepared statements with placeholders',
              explanation: 'With placeholders such as ?, the library escapes input so it is treated as data, not as part of the query.',
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
        {
          key: 'csrf',
          title: 'Client-side validation, server-side validation and CSRF',
          summary: 'Why browser checks are not security, and how forged requests abuse your logged-in session.',
          video: clip(L3, 4071, 5319),
          content: `## What this lesson covers

- HTML lives on the user's computer. With developer tools anyone can remove attributes like \`disabled\` or \`required\`, so **never rely on client-side validation alone**.
- **Server-side validation** checks input where the user cannot tamper with it.
- **Cross-site request forgery (CSRF):** another site tricks your browser into submitting a request (GET or POST) to a site where you're logged in, such as a hidden auto-submitting "Buy Now" form.
- Defense: a secret **CSRF token** per user that the server checks on each submission.`,
          takeaways: ['Client-side checks can be bypassed; validate on the server.', 'CSRF tokens let servers reject forged requests.'],
          checkpoints: [
            {
              at: 260,
              q: 'A form field has the "required" attribute in its HTML. Can a user still submit it empty?',
              type: TF,
              answer: 'True',
              explanation: 'Yes. The HTML is on the user’s machine and can be edited with developer tools, which is why validation must also happen on the server.',
              topic: 'cyber-software',
              source: notes(3),
            },
            {
              at: 1220,
              q: 'What is a common defense against cross-site request forgery?',
              options: ['A secret CSRF token checked by the server', 'A longer password', 'Client-side validation', 'Disabling HTTPS'],
              answer: 'A secret CSRF token checked by the server',
              explanation: 'The server issues a secret token and rejects submissions that do not include it, which a forging site cannot know.',
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
        {
          key: 'ace',
          title: 'Arbitrary code execution and reverse engineering',
          summary: 'Buffer overflows, cracking and reverse engineering.',
          video: clip(L3, 5319, 6123),
          content: `## What this lesson covers

- **OWASP** (the Open Worldwide Application Security Project) publishes widely used guidance on web application security.
- **Arbitrary code execution (ACE):** running code that is not part of the intended program.
- A **buffer overflow** sends more input than the program expects so it spills into other memory; a **stack overflow** can be used to insert and run malicious code.
- Such techniques are also used for **cracking** (bypassing registration or payment) and **reverse engineering**.`,
          takeaways: ['Buffer overflows can let attackers run their own code.', 'Overly long input is a classic way to trigger memory corruption.'],
          checkpoints: [
            {
              at: 760,
              q: 'What happens in a buffer overflow?',
              options: [
                'Input longer than expected spills into other areas of memory',
                'A database runs out of rows',
                'A web page loads too many images',
                'A password manager stores too many passwords',
              ],
              answer: 'Input longer than expected spills into other areas of memory',
              explanation: 'When software does not check input length, data overflows its buffer into adjacent memory, which can lead to arbitrary code execution.',
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
        {
          key: 'supply-chain',
          title: 'Open source, app stores, package managers and vulnerability catalogs',
          summary: 'Trusting the software you install, and tracking known vulnerabilities.',
          video: clip(L3, 6123, 7046),
          content: `## What this lesson covers

- **Open-source** code can be audited by anyone; **closed-source** code is hidden. Both can contain vulnerabilities.
- **App stores** and **package managers** check and **digitally sign** software so your device installs only authorized code.
- **Bug bounties** pay people to report vulnerabilities instead of exploiting them.
- Tracking vulnerabilities: **CVE** identifiers, **CVSS** severity scores, **EPSS** exploitation predictions and CISA's **KEV** (Known Exploited Vulnerabilities) catalog.`,
          takeaways: ['Signed software from trusted stores raises the bar for attackers.', 'CVE identifies, CVSS scores, EPSS predicts, and KEV lists exploited vulnerabilities.'],
          checkpoints: [
            {
              at: 880,
              q: 'Which system scores how severe a vulnerability is?',
              options: ['CVSS', 'CVE', 'KEV', 'CSRF'],
              answer: 'CVSS',
              explanation: 'CVE gives a vulnerability an identifier, CVSS scores its severity, EPSS estimates the chance of exploitation and KEV lists ones known to be exploited.',
              topic: 'cyber-software',
              source: notes(3),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Before clicking a link in an email, how can you see where it really goes?',
          options: [
            'Hover over it and check the actual destination',
            'Read the link text carefully',
            'Check the sender’s profile picture',
            'Click it in a private window',
          ],
          answer: 'Hover over it and check the actual destination',
          explanation: 'The visible text can be anything; hovering reveals the href destination.',
          lesson: 'Deceptive links and cross-site scripting',
          source: notes(3),
        },
        {
          q: 'Cross-site scripting (XSS) happens when a website is tricked into running malicious code supplied as user input.',
          type: TF,
          answer: 'True',
          explanation: 'If a site copies input into its page without escaping it, a script typed by an attacker runs in other users’ browsers.',
          lesson: 'Deceptive links and cross-site scripting',
          source: notes(3),
        },
        {
          q: 'A forum saves a post containing a script, which then runs for everyone who views the post. What kind of attack is this?',
          options: ['A stored attack', 'A reflected attack', 'A brute-force attack', 'Credential stuffing'],
          answer: 'A stored attack',
          explanation: 'Stored attacks persist malicious code in the site, so it runs for every later visitor.',
          lesson: 'Stored attacks, escaping and SQL injection',
          source: notes(3),
        },
        {
          q: 'When escaping HTML, the less-than sign < is replaced with which entity?',
          options: ['&lt;', '&gt;', '&amp;', '&quot;'],
          answer: '&lt;',
          explanation: '&lt; displays a literal < without starting an HTML tag; &gt; is >, &amp; is &, and &quot; is a double quote.',
          lesson: 'Stored attacks, escaping and SQL injection',
          source: notes(3),
        },
        {
          q: 'What does this Content-Security-Policy header accomplish?',
          code: 'Content-Security-Policy: script-src https://example.com/',
          options: [
            'Only scripts loaded from https://example.com/ run; inline <script> tags are blocked',
            'All scripts are allowed from anywhere',
            'Only CSS files are allowed',
            'Cookies are disabled',
          ],
          answer: 'Only scripts loaded from https://example.com/ run; inline <script> tags are blocked',
          explanation: 'script-src restricts where JavaScript may come from, so injected inline scripts are not executed.',
          lesson: 'Stored attacks, escaping and SQL injection',
          source: notes(3),
        },
        {
          q: "An application builds this query from user input. Which username input would also delete every user?",
          code: "SELECT * FROM users WHERE username = '{username}'",
          options: ["malan'; DELETE FROM users; --", 'malan', 'DELETE', "malan''"],
          answer: "malan'; DELETE FROM users; --",
          explanation: "The quote closes the string, the semicolon ends the statement, DELETE FROM users runs next, and -- comments out the rest.",
          lesson: 'Stored attacks, escaping and SQL injection',
          source: notes(3),
        },
        {
          q: 'How does a prepared statement treat a single quote typed by the user?',
          options: ["It escapes it (for example as '') so it cannot end the string", 'It removes the whole input', 'It runs it as SQL', 'It converts it to a password hash'],
          answer: "It escapes it (for example as '') so it cannot end the string",
          explanation: "The library escapes the quote, so input like malan'; DELETE FROM users; -- stays harmless text.",
          lesson: 'Prepared statements and command injection',
          source: notes(3),
        },
        {
          q: 'Which functions are common places for command injection if user input is passed to them unsanitized? Select all that apply.',
          type: MULTI,
          options: ['system', 'eval', 'print', 'len'],
          answer: ['system', 'eval'],
          explanation: 'system runs commands on the operating system and eval runs code. Passing unsanitized input to either lets attackers run their own commands.',
          lesson: 'Prepared statements and command injection',
          source: notes(3),
        },
        {
          q: 'Why is client-side validation alone never enough?',
          options: [
            'Users can change the HTML and JavaScript on their own machine, for example with developer tools',
            'Browsers do not support validation',
            'It makes pages load slowly',
            'It only works on mobile devices',
          ],
          answer: 'Users can change the HTML and JavaScript on their own machine, for example with developer tools',
          explanation: 'Attributes like disabled and required can be removed locally. Validation must also be done on the server.',
          lesson: 'Client-side validation, server-side validation and CSRF',
          source: notes(3),
        },
        {
          q: 'A malicious page contains a hidden form that automatically submits a purchase to a store where you are logged in. What is this attack?',
          options: ['Cross-site request forgery (CSRF)', 'SQL injection', 'Buffer overflow', 'Packet sniffing'],
          answer: 'Cross-site request forgery (CSRF)',
          explanation: 'CSRF tricks your browser into sending a request to another site using your logged-in session.',
          lesson: 'Client-side validation, server-side validation and CSRF',
          source: notes(3),
        },
        {
          q: 'Executing code that is not part of the intended program is called arbitrary code ___.',
          type: FILL,
          answer: 'execution',
          explanation: 'Arbitrary code execution (ACE) lets an attacker run their own code, often through memory bugs like buffer overflows.',
          lesson: 'Arbitrary code execution and reverse engineering',
          source: notes(3),
        },
        {
          q: 'How do app stores help protect users?',
          options: [
            'They review submitted code and digitally sign software so devices can verify it is authorized',
            'They encrypt every website',
            'They replace antivirus software',
            'They make all apps open source',
          ],
          answer: 'They review submitted code and digitally sign software so devices can verify it is authorized',
          explanation: 'Signing lets the operating system check that software comes from an authorized source and was not modified.',
          lesson: 'Open source, app stores, package managers and vulnerability catalogs',
          source: notes(3),
        },
        {
          q: 'Open-source software cannot contain vulnerabilities because anyone can read its code.',
          type: TF,
          answer: 'False',
          explanation: 'Open source allows audits, but open-source software is still vulnerable to attacks. Visibility is a trade-off, not a guarantee.',
          lesson: 'Open source, app stores, package managers and vulnerability catalogs',
          source: notes(3),
        },
        {
          q: 'Which catalog lists vulnerabilities that are known to have been exploited?',
          options: ['KEV', 'CVSS', 'EPSS', 'OWASP'],
          answer: 'KEV',
          explanation: 'CISA’s Known Exploited Vulnerabilities (KEV) catalog lists vulnerabilities with evidence of exploitation.',
          lesson: 'Open source, app stores, package managers and vulnerability catalogs',
          source: notes(3),
        },
        {
          q: 'What is the purpose of a bug bounty?',
          options: [
            'To pay people to discover and report vulnerabilities rather than exploit them',
            'To fine developers for bugs',
            'To remove bugs automatically',
            'To slow down attackers with fake bugs',
          ],
          answer: 'To pay people to discover and report vulnerabilities rather than exploit them',
          explanation: 'Bug bounties reward responsible disclosure, encouraging would-be attackers to report instead of attack.',
          lesson: 'Open source, app stores, package managers and vulnerability catalogs',
          source: notes(3),
        },
      ],
      readings: [
        {
          title: 'OWASP Top 10:2025',
          authors: 'OWASP Foundation',
          publisher: 'OWASP',
          year: 2025,
          url: 'https://owasp.org/Top10/2025/',
          kind: 'REPORT',
          note: 'The most widely used list of critical web application security risks, including injection.',
        },
        {
          title: 'Reflections on Trusting Trust',
          authors: 'Ken Thompson',
          publisher: 'Communications of the ACM',
          year: 1984,
          url: 'https://doi.org/10.1145/358198.358210',
          kind: 'PAPER',
          note: 'Thompson’s Turing Award lecture on why you can only fully trust code you created yourself.',
        },
        {
          title: 'Known Exploited Vulnerabilities Catalog',
          authors: 'Cybersecurity and Infrastructure Security Agency',
          publisher: 'CISA',
          year: null,
          url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          kind: 'DOCUMENTATION',
          note: 'The KEV catalog mentioned at the end of the lecture.',
        },
        {
          title: 'Exploit Prediction Scoring System (EPSS)',
          authors: 'FIRST',
          publisher: 'Forum of Incident Response and Security Teams',
          year: null,
          url: 'https://www.first.org/epss/',
          kind: 'DOCUMENTATION',
          note: 'How EPSS estimates the probability that a vulnerability will be exploited.',
        },
      ],
    },

    // ── Module 5 ────────────────────────────────────────────────────
    {
      key: 'privacy',
      title: 'Preserving Privacy',
      description: 'Browsing history and server logs, headers, fingerprinting, cookies and tracking, DNS, VPNs, Tor and permissions.',
      difficulty: 'BEGINNER',
      lessons: [
        {
          key: 'logs-headers',
          title: 'Browsing history, server logs and HTTP headers',
          summary: 'What servers learn about you, and how the Referer header leaks information.',
          video: clip(L4, 17, 1007),
          content: `## What this lesson covers

- Clearing your browser history does not clear **server logs**, which record your IP address, time, request and more.
- **HTTP headers** are key-value pairs sent with each request. The **Referer** header can reveal the page you came from, even your search terms.
- Sites can limit this with \`<meta name="referrer" content="origin">\` (send only the origin) or \`content="none"\`.`,
          takeaways: ['Servers keep logs even when you clear your own history.', 'The Referer header can leak the page or search that led you to a site.'],
          checkpoints: [
            {
              at: 900,
              q: 'You clear your browser history. Does the website’s server still have a record of your visit?',
              type: TF,
              answer: 'True',
              explanation: 'Server logs typically record your IP address, time and request regardless of what you delete on your own device.',
              topic: 'cyber-privacy',
              source: notes(4),
            },
          ],
        },
        {
          key: 'fingerprinting',
          title: 'Fingerprinting and session cookies',
          summary: 'Identifying you without cookies, and how session cookies keep you logged in.',
          video: clip(L4, 1007, 1860),
          content: `## What this lesson covers

- **Fingerprinting** identifies you from available clues: the **User-Agent** header (browser, OS, device), IP address, screen resolution, installed fonts and extensions. Together they can single you out.
- **Session cookies** (for example \`Set-Cookie: session=1234abcd\`) are unique values a server places on your computer to recognize you; they usually expire after a set time.`,
          takeaways: ['Many small details combined can uniquely identify a browser.', 'Session cookies are like a virtual hand stamp that identifies you to a server.'],
          checkpoints: [
            {
              at: 560,
              q: 'Which request header describes your browser, operating system and device to the server?',
              options: ['User-Agent', 'Referer', 'Set-Cookie', 'Host'],
              answer: 'User-Agent',
              explanation: 'The User-Agent header identifies your browser, OS version and device, one of many clues used for fingerprinting.',
              topic: 'cyber-privacy',
              source: notes(4),
            },
          ],
        },
        {
          key: 'tracking',
          title: 'Tracking cookies, tracking parameters and third-party cookies',
          summary: 'How advertisers follow you from site to site.',
          video: clip(L4, 1860, 2950),
          content: `## What this lesson covers

- **Tracking cookies** last a long time (for example, a two-year analytics cookie) and follow your behavior.
- **Tracking parameters** in URLs (such as a unique \`click_id\`) identify you; browsers increasingly strip them.
- **Third-party cookies:** an ad image from \`example.com\` on many sites sets one cookie, so example.com learns every site you visit that includes its ad.`,
          takeaways: ['Third-party cookies let one company see your visits across many sites.', 'Tracking parameters identify you in the URL itself.'],
          checkpoints: [
            {
              at: 1000,
              q: 'The same ad server is embedded on harvard.edu and yale.edu. What lets it know you visited both?',
              options: ['A third-party cookie it set the first time', 'Your password manager', 'DNS over HTTPS', 'Full-disk encryption'],
              answer: 'A third-party cookie it set the first time',
              explanation: 'Your browser sends the ad server’s cookie back on every site that embeds it, along with a Referer, revealing your browsing across sites.',
              topic: 'cyber-privacy',
              source: notes(4),
            },
          ],
        },
        {
          key: 'dns',
          title: 'Private browsing, supercookies and DNS',
          summary: 'What private browsing does and does not hide, and encrypting DNS lookups.',
          video: clip(L4, 2950, 4019),
          content: `## What this lesson covers

- **Private browsing** starts without your past cookies, but new cookies are still created and servers can still track you during the session.
- **Supercookies** can be injected by your internet provider into HTTP headers; you may be able to opt out.
- **DNS** turns names like harvard.edu into IP addresses. Traditional DNS is unencrypted, so your provider sees which sites you look up.
- **DNS over HTTPS (DoH)** and **DNS over TLS (DoT)** encrypt those lookups.`,
          takeaways: ['Private browsing does not make you anonymous to websites.', 'DoH and DoT encrypt DNS lookups.'],
          checkpoints: [
            {
              at: 1000,
              q: 'Which technologies encrypt your DNS lookups? Select all that apply.',
              type: MULTI,
              options: ['DNS over HTTPS (DoH)', 'DNS over TLS (DoT)', 'Private browsing', 'Third-party cookies'],
              answer: ['DNS over HTTPS (DoH)', 'DNS over TLS (DoT)'],
              explanation: 'DoH and DoT encrypt DNS queries. Private browsing does not encrypt DNS, and cookies are unrelated.',
              topic: 'cyber-privacy',
              source: notes(4),
            },
          ],
        },
        {
          key: 'tor',
          title: 'VPNs, Tor, permissions and location',
          summary: 'Tools that hide where your traffic comes from, and the data apps can request.',
          video: clip(L4, 4019, 4692),
          content: `## What this lesson covers

- A **VPN** sends your traffic through a trusted server so sites see its IP address, but it does **not** protect a computer infected with malware.
- **Tor** routes traffic through several encrypted nodes, making it hard to identify you. Still, being the only Tor user on a local network can single you out. No technology gives absolute protection.
- Operating systems ask for **permissions**; **location-based services** reveal where you are to apps you allow.`,
          takeaways: ['VPNs change your apparent IP but do not stop malware.', 'Tor relays traffic through several nodes; no tool is perfect.'],
          checkpoints: [
            {
              at: 640,
              q: 'Using Tor guarantees that nobody can ever identify you.',
              type: TF,
              answer: 'False',
              explanation: 'Tor makes identification much harder, but if you are the only Tor user on a network you may still be identified by other means. No technology provides absolute protection.',
              topic: 'cyber-privacy',
              source: notes(4),
            },
          ],
        },
      ],
      bank: [
        {
          q: 'Which details commonly appear in a web server’s access log? Select all that apply.',
          type: MULTI,
          options: ['Your IP address', 'The time of the request', 'The page requested', 'Your password manager’s contents'],
          answer: ['Your IP address', 'The time of the request', 'The page requested'],
          explanation: 'A combined log format records the remote address, time, request line, status, referrer and user agent.',
          lesson: 'Browsing history, server logs and HTTP headers',
          source: notes(4),
        },
        {
          q: 'You click a search result. Which header can tell the destination site what you searched for?',
          options: ['Referer', 'User-Agent', 'Content-Security-Policy', 'Host'],
          answer: 'Referer',
          explanation: 'By default the browser sends the referring URL, such as https://www.google.com/search?q=cats, in the Referer header.',
          lesson: 'Browsing history, server logs and HTTP headers',
          source: notes(4),
        },
        {
          q: 'What does this tag tell the browser to share when users follow links from the page?',
          code: '<meta name="referrer" content="origin">',
          options: ['Only the origin (for example https://www.google.com/), not the full URL', 'The full URL including search terms', 'Nothing at all', 'The user’s IP address'],
          answer: 'Only the origin (for example https://www.google.com/), not the full URL',
          explanation: 'content="origin" limits the Referer to the site’s origin; content="none" sends no referrer information.',
          lesson: 'Browsing history, server logs and HTTP headers',
          source: notes(4),
        },
        {
          q: 'Fingerprinting can identify a browser even when cookies are blocked.',
          type: TF,
          answer: 'True',
          explanation: 'Fingerprinting combines clues such as the User-Agent, IP address, screen resolution, fonts and extensions, none of which need cookies.',
          lesson: 'Fingerprinting and session cookies',
          source: notes(4),
        },
        {
          q: 'Which of these can contribute to a browser fingerprint? Select all that apply.',
          type: MULTI,
          options: ['Screen resolution', 'Installed fonts', 'Installed extensions', 'The color of your keyboard'],
          answer: ['Screen resolution', 'Installed fonts', 'Installed extensions'],
          explanation: 'Servers can discover screen resolution, fonts and extensions, along with the User-Agent and IP address.',
          lesson: 'Fingerprinting and session cookies',
          source: notes(4),
        },
        {
          q: 'What is the purpose of a session cookie like Set-Cookie: session=1234abcd?',
          options: [
            'To let the server recognize you across requests during your session',
            'To encrypt your hard drive',
            'To block third-party ads',
            'To hide your IP address',
          ],
          answer: 'To let the server recognize you across requests during your session',
          explanation: 'The unique session value works like a hand stamp that identifies you to the server until it expires.',
          lesson: 'Fingerprinting and session cookies',
          source: notes(4),
        },
        {
          q: 'How are tracking parameters different from tracking cookies?',
          options: [
            'They are visible in the link URL itself rather than stored in the browser',
            'They are always encrypted',
            'They only work in private browsing',
            'They are set by the operating system',
          ],
          answer: 'They are visible in the link URL itself rather than stored in the browser',
          explanation: 'A value such as click_id=… in the URL identifies you; cookies are stored behind the scenes. Browsers increasingly strip such parameters.',
          lesson: 'Tracking cookies, tracking parameters and third-party cookies',
          source: notes(4),
        },
        {
          q: 'A Google Analytics cookie with max-age=63072000 lasts about how long?',
          options: ['Two years', 'One hour', 'One day', 'Until the tab is closed'],
          answer: 'Two years',
          explanation: '63,072,000 seconds is 2 × 365 × 24 × 3600, about two years.',
          lesson: 'Tracking cookies, tracking parameters and third-party cookies',
          source: notes(4),
        },
        {
          q: 'Which statements about private browsing are true? Select all that apply.',
          type: MULTI,
          options: [
            'Past cookies are not sent in the private window',
            'New cookies can still be set during the private session',
            'Servers can still track you within the session',
            'It hides your IP address from websites',
          ],
          answer: ['Past cookies are not sent in the private window', 'New cookies can still be set during the private session', 'Servers can still track you within the session'],
          explanation: 'Private browsing starts without old cookies but the web works as usual: new cookies, server logs and your IP address are all still visible.',
          lesson: 'Private browsing, supercookies and DNS',
          source: notes(4),
        },
        {
          q: 'Who can inject supercookies into your HTTP traffic?',
          options: ['Your internet service provider', 'Your password manager', 'The certificate authority', 'Your antivirus program'],
          answer: 'Your internet service provider',
          explanation: 'Whoever provides your internet service can inject cookies into HTTP headers; you may be able to opt out.',
          lesson: 'Private browsing, supercookies and DNS',
          source: notes(4),
        },
        {
          q: 'By convention, traditional DNS traffic is unencrypted.',
          type: TF,
          answer: 'True',
          explanation: 'Plain DNS announces which names you look up to your ISP and anyone on the path; DoH and DoT encrypt it.',
          lesson: 'Private browsing, supercookies and DNS',
          source: notes(4),
        },
        {
          q: 'What does DNS do?',
          options: ['Resolves names like harvard.edu to IP addresses', 'Encrypts websites', 'Stores cookies', 'Scans for malware'],
          answer: 'Resolves names like harvard.edu to IP addresses',
          explanation: 'The Domain Name System translates human-readable names into the IP addresses computers use.',
          lesson: 'Private browsing, supercookies and DNS',
          source: notes(4),
        },
        {
          q: 'How does Tor make it harder to identify you?',
          options: [
            'It relays your traffic through several encrypted nodes',
            'It deletes your browser history',
            'It changes your password daily',
            'It blocks all cookies permanently',
          ],
          answer: 'It relays your traffic through several encrypted nodes',
          explanation: 'Tor sends traffic through multiple encrypted relays, so no single point sees both who you are and what you access.',
          lesson: 'VPNs, Tor, permissions and location',
          source: notes(4),
        },
        {
          q: 'A VPN protects you even if your computer is infected with malware.',
          type: TF,
          answer: 'False',
          explanation: 'A VPN encrypts traffic between you and the VPN server, but malware on your own computer can still see everything.',
          lesson: 'VPNs, Tor, permissions and location',
          source: notes(4),
        },
      ],
      readings: [
        {
          title: 'The Right to Privacy',
          authors: 'Samuel D. Warren, Louis D. Brandeis',
          publisher: 'Harvard Law Review, vol. 4, no. 5',
          year: 1890,
          url: 'https://doi.org/10.2307/1321160',
          kind: 'PAPER',
          note: 'The Harvard Law Review article that first argued for a legal "right to be let alone", written in response to new technology (instant photography and newspapers).',
        },
        {
          title: 'How Unique Is Your Web Browser?',
          authors: 'Peter Eckersley',
          publisher: 'Privacy Enhancing Technologies Symposium (EFF)',
          year: 2010,
          url: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
          kind: 'PAPER',
          note: 'The study that measured how uniquely browsers can be fingerprinted.',
        },
        {
          title: 'Tor: The Second-Generation Onion Router',
          authors: 'Roger Dingledine, Nick Mathewson, Paul Syverson',
          publisher: 'USENIX Security Symposium',
          year: 2004,
          url: 'https://www.usenix.org/conference/13th-usenix-security-symposium/tor-second-generation-onion-router',
          kind: 'PAPER',
          note: 'The original design of Tor.',
        },
        {
          title: 'RFC 8484: DNS Queries over HTTPS (DoH)',
          authors: 'P. Hoffman, P. McManus',
          publisher: 'IETF',
          year: 2018,
          url: 'https://www.rfc-editor.org/rfc/rfc8484',
          kind: 'STANDARD',
          note: 'The standard for encrypting DNS lookups inside HTTPS.',
        },
      ],
    },
  ],
};

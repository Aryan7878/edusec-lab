/**
 * initChallenges.js
 *
 * Seeds the CTF challenges collection with sample challenges.
 * Run: npm run init-challenges
 *
 * IMPORTANT: Run `npm run init-labs` first so Lab documents exist in DB.
 *
 * Flags are stored as bcrypt hashes. The plaintext flags are only here
 * in this seed script. In production, delete this file after seeding
 * or store flags in a secrets manager.
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs');

const Challenge = require('../models/Challenge');

// ─── Plaintext flags ──────────────────────────────────────────────────────────
// Format: EDUSEC{descriptive_tag}
// These are hashed before storage. Keep this list secure.
const challenges = [
  // ── Web Security ──────────────────────────────────────────────────────────
  {
    title:       'SQL Injection: First Blood',
    description:
      'The DVWA SQL Injection module (Security Level: Low) is vulnerable to classic SQL injection. ' +
      'Your goal is to inject a payload that retrieves the database version string. ' +
      'Start the DVWA lab, navigate to SQL Injection, and find the hidden flag in the response.',
    category:    'Web Security',
    difficulty:  'easy',
    points:      100,
    flag:        'EDUSEC{sqli_db_version_extracted}',
    hint:        "Try the payload: ' UNION SELECT @@version, NULL -- in the user ID field.",
  },
  {
    title:       'Reflected XSS: Alert Box',
    description:
      'In DVWA (Security Level: Low), find the Reflected XSS vulnerability and execute a JavaScript ' +
      'alert() in the victim\'s browser. The flag is revealed when your payload executes successfully. ' +
      'Capture the value shown in the alert.',
    category:    'Web Security',
    difficulty:  'easy',
    points:      75,
    flag:        'EDUSEC{xss_reflected_alert_fired}',
    hint:        'Try injecting <script>alert(document.cookie)</script> in the search field.',
  },
  {
    title:       'Juice Shop: Admin Account Takeover',
    description:
      'The OWASP Juice Shop login page is vulnerable to SQL injection. Bypass authentication ' +
      'to log in as the admin user (admin@juice-sh.op) without knowing the password. ' +
      'The flag is hidden in the admin\'s profile page after successful login.',
    category:    'Web Security',
    difficulty:  'medium',
    points:      150,
    flag:        'EDUSEC{juice_shop_admin_pwned}',
    hint:        "Use the email field. What happens when you enter: ' OR 1=1 -- (with a space after --)",
  },
  {
    title:       'Juice Shop: Hidden Score Board',
    description:
      'The Juice Shop application hides its challenge Score Board from the main navigation. ' +
      'It is accessible via a direct URL that you must discover by analyzing the JavaScript bundle. ' +
      'Find the Score Board page and submit the flag shown there.',
    category:    'Web Security',
    difficulty:  'easy',
    points:      50,
    flag:        'EDUSEC{scoreboard_found_via_js_analysis}',
    hint:        'Open DevTools → Sources → main.js and search for "score-board" route definitions.',
  },
  {
    title:       'DVWA File Inclusion',
    description:
      'The DVWA File Inclusion module is vulnerable to Local File Inclusion (LFI). ' +
      'Exploit it to read the /etc/passwd file from the web server and find the flag ' +
      'hidden as a comment in that file.',
    category:    'Web Security',
    difficulty:  'medium',
    points:      150,
    flag:        'EDUSEC{lfi_passwd_file_leaked}',
    hint:        'Try manipulating the ?page= parameter with path traversal: ../../../../../../etc/passwd',
  },

  // ── Network Security ──────────────────────────────────────────────────────
  {
    title:       'Port Scanner: Service Discovery',
    description:
      'Use nmap inside your Kali VM to scan the DVWA lab container and identify all open ports ' +
      'and running services. The flag is the name of the web server software and its version, ' +
      'formatted as EDUSEC{server_version} in lowercase.',
    category:    'Network Security',
    difficulty:  'easy',
    points:      75,
    flag:        'EDUSEC{apache_2_4_discovered}',
    hint:        'Run: nmap -sV -p- <dvwa_container_ip>  Look for the http service banner.',
  },
  {
    title:       'Kali VM: Tool Arsenal',
    description:
      'Your Kali VM comes pre-provisioned with essential security tools. Start the VM, open the ' +
      'terminal, and run: gobuster --version. The flag is the version string of gobuster ' +
      'formatted as EDUSEC{gobuster_vX_X_X}.',
    category:    'Network Security',
    difficulty:  'easy',
    points:      50,
    flag:        'EDUSEC{gobuster_v3_6_0}',
    hint:        'Start the Kali VM from the Kali VM page, then open the terminal and type: gobuster --version',
  },

  // ── Cryptography ──────────────────────────────────────────────────────────
  {
    title:       'Hash Cracking: MD5 Basics',
    description:
      'The following MD5 hash was found in a database dump: 5f4dcc3b5aa765d61d8327deb882cf99\n' +
      'Use John the Ripper or your knowledge of common hash databases to crack it. ' +
      'The flag is EDUSEC{cracked_password} where cracked_password is the plaintext.',
    category:    'Cryptography',
    difficulty:  'easy',
    points:      100,
    flag:        'EDUSEC{password}',
    hint:        'This is one of the most common passwords in the world. Try john --format=raw-md5 hash.txt',
  },
  {
    title:       'Base64 Encoding: Not Encryption',
    description:
      'Many developers confuse encoding with encryption. The following string is "secured" with Base64: ' +
      'RURVVEVDX3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259\n' +
      'Decode it to find the flag. No tools required — your browser console works fine.',
    category:    'Cryptography',
    difficulty:  'easy',
    points:      50,
    flag:        'EDUSEC{base64_is_not_encryption}',
    hint:        "Run in browser console: atob('RURVVEVDX3tiYXNlNjRfaXNfbm90X2VuY3J5cHRpb259')",
  },
  {
    title:       'Caesar Cipher: ROT13',
    description:
      'This flag was "encrypted" with ROT13. Decrypt it:\n' +
      'RQHFRD{ebg13_vf_abg_frpher}\n' +
      'ROT13 shifts each letter by 13 positions.',
    category:    'Cryptography',
    difficulty:  'easy',
    points:      50,
    flag:        'EDUSEC{rot13_is_not_secure}',
    hint:        'ROT13 is its own inverse. Apply the same shift to decrypt. Many online tools exist.',
  },

  // ── Forensics ─────────────────────────────────────────────────────────────
  {
    title:       'HTTP Traffic Analysis: Find the Credentials',
    description:
      'Analyze the HTTP traffic in the provided packet capture to find credentials submitted via an ' +
      'unencrypted HTTP POST request. The flag is the password that was transmitted in plaintext.',
    category:    'Forensics',
    difficulty:  'medium',
    points:      150,
    flag:        'EDUSEC{plaintext_passwords_are_dangerous}',
    hint:        'Use Wireshark filter: http.request.method == "POST" and look at the form data.',
  },
  {
    title:       'Log Analysis: Find the Attacker IP',
    description:
      'You are given an Apache access log. Someone attempted a SQL injection attack on the web server. ' +
      'Find their IP address and submit it as EDUSEC{X_X_X_X} replacing dots with underscores.',
    category:    'Forensics',
    difficulty:  'medium',
    points:      150,
    flag:        'EDUSEC{192_168_1_100}',
    hint:        "grep -i 'select\\|union\\|insert\\|drop' access.log to find SQL injection attempts.",
  },

  // ── OSINT ─────────────────────────────────────────────────────────────────
  {
    title:       'GitHub Secrets: Leaked API Key',
    description:
      'Developers often accidentally commit secrets to public GitHub repositories. ' +
      'Search GitHub for a repository that has accidentally exposed an API key with the pattern ' +
      '"EDUSEC_TEST_KEY_". The flag is the full key value you find.',
    category:    'OSINT',
    difficulty:  'hard',
    points:      200,
    flag:        'EDUSEC{github_dork_secrets_exposed}',
    hint:        'Use GitHub search: "EDUSEC_TEST_KEY_" language:python  Look in the commits history too.',
  },
  {
    title:       'Shodan: Open Ports',
    description:
      'OSINT tools like Shodan index internet-connected devices. Search Shodan for servers running ' +
      'Apache HTTP Server 2.4.29 that are exposing an /admin path. How many results are there? ' +
      'The flag is EDUSEC{the_count} where the_count is the number of results (rounded to nearest 100).',
    category:    'OSINT',
    difficulty:  'hard',
    points:      200,
    flag:        'EDUSEC{shodan_reveals_everything}',
    hint:        'Shodan query: apache 2.4.29 http.html:"/admin"  Check the result counter in the top-right.',
  },
];

// ─── Seeder ────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('🔐 Hashing flags with bcrypt (this takes a moment)...\n');

    // Hash all flags in parallel for speed
    const hashed = await Promise.all(
      challenges.map(async (ch) => ({
        ...ch,
        flag: await bcrypt.hash(ch.flag.trim(), 10),
      }))
    );

    // Clear existing challenges and re-seed
    await Challenge.deleteMany({});
    await Challenge.insertMany(hashed);

    console.log('✅ CTF Challenges seeded successfully!\n');
    console.log('━'.repeat(60));

    const byCategory = {};
    challenges.forEach(ch => {
      if (!byCategory[ch.category]) byCategory[ch.category] = [];
      byCategory[ch.category].push(ch);
    });

    Object.entries(byCategory).forEach(([cat, chs]) => {
      console.log(`\n📂 ${cat}`);
      chs.forEach(ch => {
        const star = ch.difficulty === 'easy' ? '🟢' : ch.difficulty === 'medium' ? '🟡' : '🔴';
        console.log(`   ${star} [${ch.points}pts] ${ch.title}`);
      });
    });

    console.log('\n━'.repeat(60));
    console.log(`\nTotal: ${challenges.length} challenges across ${Object.keys(byCategory).length} categories`);
    console.log('\n⚠️  Keep the plaintext flags in this file PRIVATE.');
    console.log('   In production, delete or gitignore this seed file after running.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding challenges:', err.message);
    process.exit(1);
  }
}

seed();

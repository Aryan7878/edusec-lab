export const LAB_GUIDES = {
  "DVWA - Web Application Security": {
    steps: [
      "Click the 'Start Lab' button under Quick Actions to spin up the containerized DVWA environment.",
      "Once started, note the port mapped on localhost and click the Access URL to open DVWA in your browser.",
      "Log in using the default credentials: Username: 'admin' | Password: 'password'.",
      "Navigate to the 'DVWA Security' tab in the left-hand sidebar, set the security level to 'Low', and click Submit.",
      "To practice SQL Injection: Go to the 'SQL Injection' tab, input 1' OR '1'='1 in the User ID field and click Submit. This will dump all user accounts in the database.",
      "To practice XSS (Reflected): Navigate to 'XSS (Reflected)', enter <script>alert('hack')</script> in the text field, and press Submit to trigger the alert script."
    ],
    terminalSteps: [
      "Log in to DVWA in your browser using default credentials: Username: 'admin' | Password: 'password'.",
      "Navigate to the 'DVWA Security' tab in the left-hand sidebar, set the security level to 'Low', and click Submit.",
      "SQL Injection Practice: Go to the 'SQL Injection' tab, input 1' OR '1'='1 in the User ID field and click Submit to dump all user accounts in the database.",
      "XSS (Reflected) Practice: Navigate to 'XSS (Reflected)', enter <script>alert('hack')</script> in the text field, and press Submit to trigger the alert script."
    ],
    hints: [
      "For SQL injection, single quotes (') are used to break the string parsing in the database statement.",
      "Use your browser's Developer Tools (F12) to inspect cookie flags and request headers."
    ]
  },
  "OWASP Juice Shop": {
    steps: [
      "Click 'Start Lab' to spin up the OWASP Juice Shop container.",
      "Click the Access URL to load the e-commerce storefront in your browser.",
      "Locate the hidden Score Board to track your hacking challenges: inspect the page source or search for the word 'Score Board' in the client JavaScript bundle, or navigate directly to /#/score-board in your URL address bar.",
      "Perform SQL Injection to log in as administrator: Navigate to the Login page, use admin@juice-sh.op'-- as the email, and enter any random password to bypass authentication.",
      "Trigger a DOM-based XSS: Enter <iframe src=\"javascript:alert(`XSS`)\"> in the main search bar at the top of the storefront."
    ],
    terminalSteps: [
      "Locate the hidden Score Board to track your hacking challenges: inspect the page source or search for the word 'Score Board' in the client JavaScript bundle, or navigate directly to /#/score-board in your URL address bar.",
      "Perform SQL Injection to log in as administrator: Navigate to the Login page, use admin@juice-sh.op'-- as the email, and enter any random password to bypass authentication.",
      "Trigger a DOM-based XSS: Enter <iframe src=\"javascript:alert(`XSS`)\"> in the main search bar at the top of the storefront."
    ],
    hints: [
      "The '--' sequence in SQL comments out the rest of the query, ignoring the password comparison.",
      "Check the '/ftp' directory on the server to find hidden sensitive files like coupons or backups."
    ]
  },
  "Metasploitable 2": {
    steps: [
      "Click 'Start Lab' to start the target Metasploitable 2 virtual container.",
      "Go to the 'Kali Linux VM' tab inside EduSec Labs and click 'Start VM' to spin up your terminal environment.",
      "Find the target container IP address by running a host scan on your Kali VM shell: nmap -sn 172.17.0.0/16.",
      "Scan the target IP for open ports and services: nmap -sS -sV <target_ip>.",
      "Find the vulnerable VSFTPD 2.3.4 backdoor on Port 21. Exploit it manually by connecting via telnet and typing user admin:) with any password, or launch Metasploit on your Kali VM: msfconsole, search vsftpd_234_backdoor, set RHOSTS <target_ip>, and type exploit."
    ],
    terminalSteps: [
      "Find the target container IP address by running a host scan on your Kali VM shell: nmap -sn 172.17.0.0/16.",
      "Scan the target IP for open ports and services: nmap -sS -sV <target_ip>.",
      "Find the vulnerable VSFTPD 2.3.4 backdoor on Port 21. Exploit it manually by connecting via telnet and typing user admin:) with any password, or launch Metasploit on your Kali VM: msfconsole, search vsftpd_234_backdoor, set RHOSTS <target_ip>, and type exploit."
    ],
    hints: [
      "The vsftpd backdoor triggers when a username ends with a smiley face :) and opens an unauthenticated shell listener on port 6200.",
      "Port 139/445 (Samba) is also vulnerable to root execution via the usermap_script exploit."
    ]
  },
  "Basic Network Scanning": {
    steps: [
      "Go to the 'Kali Linux VM' tab and start your personal Kali machine.",
      "Determine your network range by running ip a or ifconfig inside the terminal.",
      "Perform a ping sweep to discover active machines in your laboratory subnet: nmap -sn 172.17.0.0/16.",
      "Perform a deep port and service scan on active targets: nmap -sV -A <target_ip>.",
      "Run a vulnerability script scan to identify system exploits: nmap --script vuln <target_ip>."
    ],
    terminalSteps: [
      "Determine your network range by running ip a or ifconfig inside the terminal.",
      "Perform a ping sweep to discover active machines in your laboratory subnet: nmap -sn 172.17.0.0/16.",
      "Perform a deep port and service scan on active targets: nmap -sV -A <target_ip>.",
      "Run a vulnerability script scan to identify system exploits: nmap --script vuln <target_ip>."
    ],
    hints: [
      "-sV runs service version detection, while -A enables OS detection, version detection, script scanning, and traceroute.",
      "Always scan with sudo privileges to enable raw socket scanning techniques (-sS)."
    ]
  },
  "Password Cracking": {
    steps: [
      "Start your 'Kali Linux VM' terminal environment.",
      "Prepare a file containing your target hashes (e.g. echo -n '5d41402abc4b2a76b9719d911017c592' > hash.txt).",
      "Run John the Ripper using the preloaded rockyou wordlist to crack the hash: john --wordlist=/usr/share/wordlists/rockyou.txt --format=raw-md5 hash.txt.",
      "Crack remote credentials using Hydra (e.g., SSH login brute-forcer): hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://localhost:<ssh_port>."
    ],
    terminalSteps: [
      "Prepare a file containing your target hashes (e.g. echo -n '5d41402abc4b2a76b9719d911017c592' > hash.txt).",
      "Run John the Ripper using the preloaded rockyou wordlist to crack the hash: john --wordlist=/usr/share/wordlists/rockyou.txt --format=raw-md5 hash.txt.",
      "Crack remote credentials using Hydra (e.g., SSH login brute-forcer): hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://localhost:<ssh_port>."
    ],
    hints: [
      "John requires formatting constraints (e.g., raw-md5, raw-sha1) for un-salted raw hashes.",
      "The rockyou.txt wordlist is pre-located at /usr/share/wordlists/rockyou.txt inside your Kali container."
    ]
  }
};

export const DEFAULT_GUIDE = {
  steps: [
    "Start the lab container using the Start Lab button.",
    "Open the Kali Linux VM terminal to interact with the environment.",
    "Perform reconnaissance and identify vulnerability vectors.",
    "Exploit vulnerabilities to retrieve the completion flags."
  ],
  terminalSteps: [
    "Perform reconnaissance and identify vulnerability vectors.",
    "Exploit vulnerabilities to retrieve the completion flags."
  ],
  hints: [
    "Use help options (e.g., --help, -h) on CLI tools to study syntax parameters."
  ]
};

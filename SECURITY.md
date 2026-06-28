# Security Policy

## Supported Versions

We actively update and support security fixes for the following versions:

| Version | Supported |
| --- | --- |
| 1.0.x |  Yes |
| < 1.0.0 |  No |

---

## Reporting a Vulnerability

If you discover a security vulnerability in EduSec Labs, **please do not open a public issue.** Instead, follow our private disclosure process to prevent exploitation:

1.  Send an email to **security@edusec.com** describing the issue.
2.  Provide a detailed summary including:
    *   Affected endpoints or configurations.
    *   Proof of concept steps or exploitation script.
    *   Impact assessment (privilege escalation, remote execution, information disclosure).
3.  We will confirm receipt within **48 hours** and coordinate a patch within **14 days**.

---

## Secure Coding Principles for Contributors

*   **Sanitize User Input:** Any parameter passed into a terminal run context (`LabManager.executeCommand`) must be checked for control characters.
*   **Token Verification:** All private routes must call the `auth` middleware. Verify JWT tokens strictly on the backend; never trust client-side route guards alone.
*   **Clean Database Queries:** Always utilize parameterized queries or Mongoose models to prevent NoSQL injection vectors.

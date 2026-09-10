---
name: vibe-sec
description: Apply secure web-application coding practices when implementing web features or reviewing an application for security flaws.
---

# VibeSec

Use this skill for implementation and review work that may affect web-application security. It is adapted from [VibeSec-Skill](https://github.com/BehiSecc/VibeSec-Skill). Treat repository-specific security decisions and documented workflows as authoritative.

## Core approach

Work from a bug hunter's perspective. Use defense in depth, least privilege, server-side validation, context-appropriate output encoding, and fail-closed behavior. Do not weaken an existing security control without surfacing the trade-off.

## Access control and sessions

- Authenticate and authorize on every protected server-side action; routing and client state are not sufficient.
- Verify ownership and tenant or organization membership for the exact resource, including its parent resource. Avoid revealing whether an unauthorized resource exists.
- Derive roles and privileges server-side. Explicitly allowlist writable fields to prevent mass assignment.
- Revalidate authorization after role or membership changes; revoke sessions and API credentials when accounts are removed, disabled, or deleted.
- Prefer unguessable public identifiers. Do not accept client-supplied identifiers, roles, or prices as trusted facts.
- Use secure, HttpOnly, SameSite cookies for session tokens; define the expected JWT algorithm and validate expiration when JWTs are used.

## Input, output, and browser protections

- Validate and normalize all input on the server, including query parameters, headers used for display, uploads, third-party data, and persisted client-side values.
- Rely on framework escaping for ordinary UI rendering. Before rendering HTML, Markdown, SVG, or rich text, use a suitable allowlist sanitizer and encode values for their actual HTML, URL, JavaScript, or CSS context.
- Avoid unsafe script execution. Apply a restrictive Content Security Policy and relevant headers such as `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and clickjacking protection where compatible with the application.
- Keep secrets, private service URLs, stack traces, and sensitive personal data out of client bundles, source maps, logs visible to users, and error responses. Never expose server-only environment values to client code.
- Protect every state-changing request against CSRF using the application’s established mechanism. Enforce safe HTTP methods, validate Origin or Referer where appropriate, and do not put CSRF tokens in URLs.

## Server-side attack surfaces

- Use ORM APIs or parameterized queries. For unavoidable dynamic SQL identifiers, sort fields, and limits, validate against explicit allowlists.
- For redirects, accept validated relative paths or a strict destination allowlist. Reject protocol-relative, encoded, malformed, and non-HTTP(S) destinations.
- For user-influenced outbound requests, allowlist destinations where possible; validate schemes and resolved addresses, block private and metadata networks, constrain redirects, response sizes, and timeouts, and consider DNS rebinding.
- For uploads, enforce server-side size and extension allowlists, verify type and content (not only MIME type), use generated names, avoid executable storage, and serve with safe content headers. Treat SVG and archive formats as high-risk.
- Disable XML DTDs, external entities, external DTD loading, and XInclude unless a specifically justified use needs them.
- Do not use user input directly in filesystem paths. Resolve paths and ensure the resolved target stays inside an approved base directory; prefer indirect identifier-to-path mappings.

## Review checklist

- Check authentication, per-resource authorization, privilege boundaries, and account lifecycle handling.
- Trace untrusted data from input to database, filesystem, redirect, server-side HTTP request, and render sinks.
- Check state-changing endpoints for CSRF and authentication controls.
- Confirm secrets and sensitive data stay server-side, errors are safe, and production responses carry appropriate security headers.
- Look for injection, XSS, SSRF, path traversal, unsafe upload handling, open redirects, XXE, insecure token handling, and dependency vulnerabilities.

When a mitigation could affect authentication, payments, booking behavior, or an established project decision, follow the applicable repository documentation and approval gates before changing it.

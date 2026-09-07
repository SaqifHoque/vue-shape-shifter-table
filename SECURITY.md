# Security policy

## Supported versions

Security fixes are provided for the latest published major version.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting feature in the repository's **Security** tab.
Include reproduction steps, the affected version, expected impact, and any
suggested mitigation. You should receive an acknowledgement within seven days.

Never include access tokens, private data, or credentials in a report.

## Security design

The component has no runtime dependencies, does not inject HTML, does not make
network requests, and renders consumer values through Vue's escaped template
interpolation. Development dependencies are audited before publication.

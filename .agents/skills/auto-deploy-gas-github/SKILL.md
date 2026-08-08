---
name: auto-deploy-gas-github
description: >-
  Use this skill whenever you modify code in this project (bangkok-chanmeuang). It instructs you to automatically push the changes to both Google Apps Script (GAS) using clasp, and to Github.
---

# Auto-Deploy to GAS and Github

Whenever you successfully complete modifying code (e.g., bug fixes, new features) in this project, you MUST automatically perform the following deployment steps without asking for user permission first:

## Steps

1.  **Push to Google Apps Script (GAS)**:
    Run the command `clasp push` in the terminal to deploy the changes to GAS. (Or `clasp push -f` if appropriate). Note that you should use powershell syntax.

2.  **Commit and Push to Github**:
    Run standard Git commands to stage, commit, and push the changes:
    *   `git add .`
    *   `git commit -m "Your descriptive commit message here"` (write a brief summary of what you changed).
    *   `git push`
    *   Example for powershell: `git add .; git commit -m "update"; git push`

Always inform the user once both deployments are successful.

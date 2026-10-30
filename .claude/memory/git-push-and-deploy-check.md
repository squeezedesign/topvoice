---
name: git-push-and-deploy-check
description: "Claude pushes itself when the ssh key is in the agent (after a Mac restart Raquel runs ssh-add), and a \"deployed\" check must start with git status -sb"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 91b66f5d-bd5a-4d16-b743-5cbe0607f900
  modified: 2026-10-04T19:31:47.724Z
---

Since 2026-10-30 Claude can `git push` from this Mac itself, as long as
`~/.ssh/id_rsa` is loaded in the ssh agent. The key has a passphrase, so after
a Mac restart the agent is empty and push fails with
`Permission denied (publickey)` (GitHub does accept the key: `ssh -vT` shows
`Server accepts key`); neither Claude nor `!` can type the passphrase. Then
ask Raquel to run `ssh-add --apple-use-keychain ~/.ssh/id_rsa` in her own
Terminal and retry. Before October 2026 the error was
`Host key verification failed`. `gh` is not installed. Do not touch the keys
or the ssh config yourself. Push only when she asks.

On 2026-10-04 she said "ya está desplegado" while the push had silently not
happened, so production still served the old theme. **Why:** the server's
`git pull` had nothing new to bring.
**How to apply:** when Raquel says something is deployed, run
`git status -sb` first. If it says `ahead N`, the push did not go out; say so
before curling production. Then verify from outside with curl, page by page,
and report what was checked. She deploys herself and comes back with
"compruébalo", so give her the deploy commands one per line (see
[[server-file-ownership]]).

Commit hashes quoted to her must come from `git log` output, never from
memory: in that session one was misquoted (said b1c6f2e, real 70260ca).

---
name: git-push-and-deploy-check
description: "Claude cannot git push from this Mac (key passphrase, empty agent); Raquel pushes with `! git push`, and a \"deployed\" check must start with git status -sb"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 91b66f5d-bd5a-4d16-b743-5cbe0607f900
  modified: 2026-10-04T19:31:47.724Z
---

`git push` from a Claude session on this Mac fails. Until October 2026 it was
`Host key verification failed`; since github.com is in known_hosts (seen
2026-10-30) it is `Permission denied (publickey)`. GitHub does accept
`~/.ssh/id_rsa` (`ssh -vT` shows `Server accepts key`), but the key has a
passphrase, the agent is empty and neither Claude nor `!` can type it. Fix:
Raquel runs `ssh-add --apple-use-keychain ~/.ssh/id_rsa` in her own terminal,
after which `! git push origin main` works. `gh` is not installed. Do not
touch the keys or the ssh config yourself.

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

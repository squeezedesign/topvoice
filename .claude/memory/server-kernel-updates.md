---
name: server-kernel-updates
description: Prod kernel updates install but nobody reboots; CVE-2026-98432 mitigation (nftables ipopts table, MPTCP off) in place since 2026-10-30 until Ubuntu ships the fix
metadata:
  type: project
---

On 2026-10-30 `ubuntu-blackpony` (Ubuntu 22.04) was still running kernel
5.15.0-133 from early 2025 although 5.15.0-202 was installed: updates land
but nobody reboots (`/var/run/reboot-required` was there). Raquel did
`apt full-upgrade` + `reboot`; it came back on 5.15.0-202 with nginx and
php8.5-fpm active.

**Why:** CVE-2026-98432 (IPv4 TCP use-after-free, remote, fixed upstream in
5.15.223). Ubuntu had no fixed 22.04 kernel yet, so a temporary mitigation
went on:
- nftables table `ip ipopts` drops TCP packets with IPv4 options. Saved in
  `/etc/ipopts.nft`, loaded at boot by `/etc/cron.d/ipopts`
  (`@reboot root /usr/sbin/nft -f /etc/ipopts.nft`), separate from ufw.
- MPTCP off: `/etc/sysctl.d/99-no-mptcp.conf` (`net.mptcp.enabled = 0`).

**How to apply:** when security work comes up, check
`cat /proc/version_signature` and `ls /var/run/reboot-required` first. Once
https://ubuntu.com/security/CVE-2026-98432 lists a fixed 22.04 kernel
(5.15.0-203 or later), give Raquel `apt update`, `apt full-upgrade`,
`reboot` and verify with curl; the mitigation can stay or be removed
(`nft delete table ip ipopts`, delete the two files). Commands one per line,
see [[server-file-ownership]].

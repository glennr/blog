---
title: "A QEMU Windows guest's clock falls behind after host suspend"
date: 2026-03-05T22:47:56+10:00
draft: true
format: til
tags:
  - qemu
  - kvm
  - windows
---

My Windows guest under QEMU/KVM came back from every host suspend with its
clock behind, far enough that certificate checks inside the guest failed.

Changing two QEMU options fixed it:

```diff
-  -cpu host,hv_relaxed,hv_vapic,hv_spinlocks=8191,hv_vpindex,hv_time \
+  -cpu host,hv_relaxed,hv_vapic,hv_spinlocks=8191,hv_vpindex,hv_time,hv_synic,hv_stimer,hv_frequencies,hv_reenlightenment,hv_vendor_id=1234567890ab \
-  -rtc base=localtime,clock=host,driftfix=slew \
+  -rtc base=utc,clock=rt \
```

I changed both lines in one commit (my bad), so I can't say which one did it.
So I wouldn't switch to `clock=rt` on the strength of this note alone. The
[QEMU docs](https://www.qemu.org/docs/master/system/invocation.html) say
`clock=host`, the default, already follows host time, and `clock=rt` isolates
the guest from it.

The `-cpu` line adds Hyper-V guest features, among them synthetic timers
(`hv_stimer`, which needs `hv_synic`). The
[QEMU Hyper-V docs](https://www.qemu.org/docs/master/system/i386/hyperv.html)
say that without them some Windows versions lean on HPET, or on the RTC when
there is no HPET.

The `-rtc` docs also say `base=localtime` "is required for correct date in
MS-DOS or Windows." So a Windows guest on `base=utc` needs
`RealTimeIsUniversal` set in its registry, from an admin prompt:

```text
reg add HKLM\SYSTEM\CurrentControlSet\Control\TimeZoneInformation /v RealTimeIsUniversal /t REG_DWORD /d 1 /f
```

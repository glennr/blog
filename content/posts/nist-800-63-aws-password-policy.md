---
title: "NIST and AWS Password Policies"
description: "NIST and AWS Password Policies"
date: 2022-11-16T21:11:32+10:00
categories:
  - Security
tags:
  - AWS
  - Pulumi
  - NIST
  - DevSecOps
---

[NIST 800-63, section 5](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5) describes the following guidelines for passwords (aka "memorized secrets"):

- at least 64 characters, all ASCII (including spaces and Unicode characters)
- no reusing passwords
- No password expiration period.
- No password hints.
- disallow passwords from data breaches, dictionary or context-specific words, or repetitive or sequential characters

(and several more things like expiry, rate limiting and MFA which I won't discuss here)

{{< alert >}}
**Warning!** This list excludes several important recommendations like expiry, rate limiting and MFA.
{{< /alert >}}

NIST now de-emphasizes forcing the use of certain characters (for example uppercase letters, numbers, or special chars like `! @ # $ %`) and forcing periodic password rotation. This runs contrary to many password schemes you've probably encountered in the wild.

AWS is no exception. [Account Password Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_account-policy.html) lags these recommendations. There are many (optional) parameters, like `requireSymbols`, that you can ignore when implementing password schemes for your infrastructure in-line with the latest NIST recommendations.

Here's what that might look like if you're [using Pulumi](https://www.pulumi.com/registry/packages/aws/api-docs/iam/accountpasswordpolicy/) to manage your infrastructure definitions:

```typescript
new aws.iam.AccountPasswordPolicy("nist22-ish", {
  allowUsersToChangePassword: true,
  minimumPasswordLength: 64,
  requireLowercaseCharacters: false,
  requireNumbers: false,
  requireSymbols: false,
  requireUppercaseCharacters: false,
  passwordReusePrevention: 24,
});
```

The 64 character minimum might seem onerous, but is less of a problem if you use a password manager, or can recite prose from memory /s.

This is just a starting point however. As mentioned above, in the same section NIST additionally recommends using second (2FA) or multi-factor (MFA) devices. [Start here](https://www.obytes.com/blog/enforce-mfa-aws) with some AWS policy definitions you could use to enforce MFA.

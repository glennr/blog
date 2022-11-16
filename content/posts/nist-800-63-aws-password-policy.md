---
title: "NIST and AWS Password Policies"
date: 2022-11-16T21:11:32+10:00
draft: true
categories:
  - Security
tags:
  - AWS
  - Pulumi
  - NIST
---

[NIST 800-63, section 5](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5) describes the following guidelines for passwords (aka "memorized secrets"):

- at least 64 characters
- all ASCII characters (including spaces), and Unicode characters
- prevent reusing passwords
- No password expiration period.
- No password hints.
- disallow passwords from data breaches, dictionary or context-specific words, or repetitive or sequential characters

(and several more things like expiry, rate limiting and MFA which I won't discuss here)

NIST now de-emphasizes forcing the use of certain characters (for example uppercase letters, numbers, or special chars like `! @ # $ %`) and forcing periodic password rotation.

AWS provides an [Account Password Policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_account-policy.html) which allows you to implement some of these recommendations. The API lags a little in some areas, but here's what it might look like if you're [using Pulumi](https://www.pulumi.com/registry/packages/aws/api-docs/iam/accountpasswordpolicy/) to manage your infrastructure definitions:

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

The 64 character minimum might seem onerous, but isn't a problem if you use a password manager.

This is just a starting point however. In the same section NIST recommends using second (2FA) or multi-factor (MFA) devices. [Here](https://www.obytes.com/blog/enforce-mfa-aws) are some AWS policy definitions you could use to enforce MFA.

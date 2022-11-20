---
title: "Let Your Finance Team Track AWS Spend"
description: "Let Your Finance Team Track AWS Spend"
date: 2022-11-16T22:02:59+10:00
draft: true
categories:
  - DevOps
tags:
  - Pulumi
  - AWS
  - IaC
---

Need to delegate access to your AWS billing dashboard to folks in your finance team? Here's how you can define the necessary policies using Pulumi for your Infrastructure As Code (IaC).

Using IaC gives you a number of benefits. You have an excellent audit trail, since all policy versions are in a git repository. Your infrastructure code can be expressed using the same languages and toolchains your DevOps team already uses daily. You can integrate with your preferred CI/CD pipeline, ensuring your cloud infrastructure stays in sync with the code. With a tool like Pulumi you also get a [web-based dashboard](https://app.pulumi.com/) showing all the updates that were applied.

First, create an [IAM Group](https://www.pulumi.com/registry/packages/aws/api-docs/iam/group/):

```typescript
const group = new aws.iam.Group("finance", { path });
```

Next, define the policy:

```typescript
function billingFullPolicy() {
  const policyDefn: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: [
          "aws-portal:*Billing",
          "aws-portal:*PaymentMethods",
          "aws-portal:ViewUsage",
          "billing:ListBillingViews",
          "ce:*",
          "cur:*",
          "pricing:*",
          "purchase-orders:*",
          "support:AddAttachmentsToSet",
          "support:CreateCase",
          "sustainability:GetCarbonFootprintSummary",
          "tax:*",
        ],
        Resource: "*",
        Effect: "Allow",
        Sid: "FullBillingAndReporting",
      },
    ],
  };

  return new aws.iam.Policy("GrantFullAccessToBilling", {
    description: `Allow manage billing`,
    policy: policyDefn,
  });
}
```

Note this is quite a permissive policy, and you might want to reserve it only for financial 'administrators'.

A Read-only billing policy might be better suited for reporting users, which might exclude creating Cost and Usage reports (`cur:*`) or accessing account settings:

```typescript
function billingReadOnlyPolicy() {
  const policyDefn: aws.iam.PolicyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: [
          'aws-portal:ViewBilling',
          'aws-portal:ViewUsage',
          'billing:ListBillingViews',
          'ce:GetCostAndUsage'
          'cur:DescribeReportDefinitions',
          'pricing:*',
          'purchase-orders:View*',
          'support:AddAttachmentsToSet',
          'support:CreateCase',
          'sustainability:GetCarbonFootprintSummary',
          'tax:Get*',
        ],
        Resource: '*',
        Effect: 'Allow',
        Sid: 'FullBillingAndReporting',
      },
      {
        Effect: 'Deny',
        Action: 'aws-portal:*Account',
        Resource: '*',
        Sid: ''
      }
    ],
  }

  return new aws.iam.Policy('GrantReadAccessToBilling', {
    description: 'Allow read-only access to billing',
    policy: policyDefn,
  })
}
```

Attach the desired policy to the Finance group you created.

```typescript
new aws.iam.GroupPolicyAttachment("attach-full-billing", {
  group: group.name,
  policyArn: billingFullPolicy().arn,
});
```

Now all the IAM users you add to this group will be able to access the these billing permissions.

AWS provides [plenty of billing examples](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/billing-example-policies.html), and it's a simple matter of copying the JSON policy into your Pulumi definitions, using the typescript template above. As an added bonus, if you're using Typescript, your editor should autoformat the JSON definition for you.

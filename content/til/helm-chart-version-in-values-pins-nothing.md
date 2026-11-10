---
title: "A Helm chart version inside values pins nothing in Pulumi"
date: 2026-10-14T22:22:11+10:00
draft: false
format: til
tags:
  - pulumi
  - helm
---

In Pulumi's [`k8s.helm.v3.Chart`](https://www.pulumi.com/registry/packages/kubernetes/api-docs/helm/v3/chart/), a chart `version` inside `values` pins nothing:

```ts
new k8s.helm.v3.Chart('cluster-autoscaler', {
  chart: 'cluster-autoscaler',
  fetchOpts: { repo: 'https://kubernetes.github.io/autoscaler' },
  values: {
    autoDiscovery: { clusterName: 'prod' },
    version: '9.21.0', // just another chart value
  },
})
```

Pulumi hands it to the chart as one more value, and no template reads it. With no `version` on the chart, Pulumi fetches the latest release. A newer chart then lands on the next `pulumi up` with no change to your code. The TypeScript types accept it, since `values` takes any key. The chart ships no values schema, so Helm accepts it as well.

Move it up a level, next to `chart`:

```ts
new k8s.helm.v3.Chart('cluster-autoscaler', {
  chart: 'cluster-autoscaler',
  version: '9.21.0',
  fetchOpts: { repo: 'https://kubernetes.github.io/autoscaler' },
  values: {
    autoDiscovery: { clusterName: 'prod' },
  },
})
```

The chart you got is in the `helm.sh/chart` label: `kubectl get deploy -A -L helm.sh/chart` shows `cluster-autoscaler-9.21.0` once the pin holds.

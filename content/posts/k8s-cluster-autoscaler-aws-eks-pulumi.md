---
title: "K8s Cluster Autoscaler Aws Eks Pulumi"
date: 2022-11-11T12:03:01+10:00
draft: true
categories:
  - DevOps
tags:
  - K8s
  - AWS
  - EKS
  - Pulumi
---

AWS recommends installing this example from the repo

https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

https://docs.aws.amazon.com/eks/latest/userguide/autoscaling.html#cluster-autoscaler

This repo provides some helpful insight

https://github.com/ludesdeveloper/pulumi-managed-nodes-autoscale-eks/blob/master/autoscaler-chart/values.yaml

lets see if we can do it without these commands

https://github.com/ludesdeveloper/pulumi-managed-nodes-autoscale-eks/blob/master/init-autoscale-cluster.sh

`cluster-autoscaler.kubernetes.io/safe-to-evict": "false"`

Lets see if we can configure this helm chart

https://github.com/kubernetes/autoscaler/blob/master/charts/cluster-autoscaler/values.yaml

to arrive back at this example configuration

https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

but using Pulumi's `k8s.helm.v3.Chart` API.

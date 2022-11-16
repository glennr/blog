---
title: "Monitor Elixir App in K8s With Promex"
date: 2022-11-16T22:41:25+10:00
draft: true
categories:
  - DevOps
tags:
  - K8s
  - Pulumi
  - Elixir
  - Typescript
---

Per [PromEx's Security Considerations](https://hexdocs.pm/prom_ex/readme.html#security-concerns) you don't want to allow external network requests to `/metrics`.

k8s.networking.v1.Ingress

```typescript
new k8s.networking.v1.Ingress('nginx-ingress',
    {
      metadata: {
        annotations: {
          'kubernetes.io/ingress.class': ingressClass,
          'cert-manager.io/cluster-issuer': clusterIssuer,
+          'nginx.ingress.kubernetes.io/server-snippet': `
+            location ~* "/metrics" {
+                deny all;
+                return 403;
+            }
+          `,
        },
      },
      spec: ...
```

```typescript
new k8s.core.v1.Secret("app-secrets", {
  stringData: {
    GRAFANA_HOST: "http://grafana.cluster-svcs.svc.cluster.local",
    GRAFANA_ADMIN_USERNAME: "grafana-admin",
    GRAFANA_ADMIN_PASSWORD: config.requireSecret("GRAFANA_ADMIN_PASSWORD"),
  },
});
```

```typescript
  return new k8s.apps.v1.Deployment(
    'my-app',
    {
      spec: {
        replicas,
        template: {
          metadata: {
            labels,
            annotations: {
              // Auto scrape the route that PromEx exposes
              'prometheus.io/scrape': 'true',
              'prometheus.io/port': '8080',
            },
            namespace,
          },
          spec: {
            restartPolicy: 'Always',
            containers: [
              {
                envFrom: [
                  {
                    secretRef: {
                      name: secrets.metadata.name,
                    },
                  },
                ],
                name: `my-app`,
                image: ...
                ports: [{ name: 'http', containerPort }],
              },
            ],
          },
        },
      },
    },
  )
```

---
title: "Zigbee2mqtt bind needs from_endpoint"
date: 2026-07-07T09:40:01+10:00
draft: true
format: til
tags:
  - zigbee2mqtt
  - zigbee
  - mqtt
---

A remote with several button groups exposes each group as its own endpoint in
[zigbee2mqtt](https://www.zigbee2mqtt.io/guide/usage/binding.html), and its
actions end in the number (`on_2` is endpoint 2). To bind any group but the
first, the endpoint goes in `from_endpoint`.

The `name/endpoint` form looks like it should work. In 2.12.1 it fails with
the friendly name and with the address:

```text
Source device '0xSOURCE/2' does not exist
```

Leave `from_endpoint` out and you get the first endpoint, reported back as
`"from_endpoint":"default"`. So name the remote by address and the group by
number:

```json
{"from":"0xSOURCE","from_endpoint":2,"to":"0xTARGET","clusters":["genOnOff","genLevelCtrl"]}
```

The remote is a sleepy battery device, so tap a button about once a second
until the response arrives:

```bash
mosquitto_sub -t "zigbee2mqtt/bridge/response/device/bind" -C 1 -W 35 &
sleep 0.5
mosquitto_pub -t "zigbee2mqtt/bridge/request/device/bind" \
  -m '{"from":"0xSOURCE","from_endpoint":2,"to":"0xTARGET","clusters":["genOnOff","genLevelCtrl"]}'
wait
```

What the response tells you:

- `"status":"ok"` with `"failed":[]`: bound.
- `Delivery failed`: the remote fell asleep. Keep tapping and send again.
- A cluster under `failed` on a re-bind: probably already bound.

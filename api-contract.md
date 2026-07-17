# API 契约草案

该契约用于把当前前端 MVP 升级为真实服务端版本。所有接口默认使用 HTTPS，认证方式建议为短期访问令牌 + 刷新令牌。

## 用户与身份

### POST /api/auth/register

创建账号。服务端保存真实账号信息，匿名展示身份单独生成。

请求：

```json
{
  "phoneOrEmail": "user@example.com",
  "password": "********",
  "deviceId": "device-fingerprint"
}
```

响应：

```json
{
  "userId": "u_123",
  "anonymousId": "匿名用户 2048",
  "accessToken": "token",
  "refreshToken": "token"
}
```

### PATCH /api/privacy/settings

更新匿名默认、同频推荐、本地或云端审核日志保留策略。

## 动态发布

### POST /api/posts

发布生活分享。服务端必须先审核，再决定是否进入广场或人工队列。

请求：

```json
{
  "visibility": "anonymous",
  "text": "今天想分享的一件事...",
  "circleIds": ["c_work_stress"],
  "allowPeerMatch": true
}
```

响应：

```json
{
  "postId": "p_123",
  "review": "approved",
  "risk": 8,
  "topic": "职场压力",
  "aiRepliesQueued": true,
  "peerMatchQueued": true
}
```

## AI 反馈

### POST /api/ai/replies

为指定动态生成智能体回复。高风险动态不得生成公开 AI 评论。

请求：

```json
{
  "postId": "p_123",
  "agents": ["warm_voice", "mirror", "action_light"]
}
```

响应：

```json
{
  "replies": [
    {
      "agent": "warm_voice",
      "role": "情绪陪伴",
      "text": "我读到的是一种很真实的消耗感..."
    }
  ]
}
```

## 同频推荐

### POST /api/matching/peers

把已通过审核的动态推荐给相近用户。推荐依据必须排除真实身份字段。

请求：

```json
{
  "postId": "p_123",
  "topic": "关系支持",
  "limit": 30
}
```

## 内容审核

### POST /api/moderation/check

实时审核文本、链接、图片 OCR 和视频抽帧结果。

响应：

```json
{
  "review": "pending",
  "risk": 44,
  "labels": ["情绪危机"],
  "reason": "存在强烈负面情绪或危机关键词",
  "requiresHumanReview": true
}
```

### PATCH /api/moderation/tasks/{taskId}

人工审核处理。

请求：

```json
{
  "status": "approved",
  "operatorId": "admin_01",
  "note": "确认可展示"
}
```

## 举报

### POST /api/reports

用户举报动态或评论，必须进入审核队列并写入风控日志。

## 安全事件

### POST /api/security/events

WAF、CDN、限流、设备指纹和异常登录事件统一入库。

```json
{
  "type": "ddos_blocked",
  "level": "blocked",
  "ipHash": "hash",
  "requestCount": 1200,
  "windowSeconds": 60
}
```

## 数据隔离要求

- 真实账号表不得直接暴露给动态流查询。
- 匿名身份、圈层画像、AI 情绪标签应使用内部 ID 关联。
- 审核日志保留操作者、时间、原因和前后状态。
- AI 生成内容需要标记来源，避免被误认为真人评论。

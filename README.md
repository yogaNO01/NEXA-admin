# NEXA 独立运营后台

此项目与公开门户 `front/` 分离，使用同一 FastAPI 管理接口。

```bash
cd /Users/zhangmingchun/Documents/web/admin
cp .env.example .env
npm install
npm run dev
```

在 `.env` 设置后端地址：

```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
```

后端必须设置 `NEXA_ADMIN_TOKEN_SECRET`。首次部署时可额外设置 `NEXA_ADMIN_USERNAME`、`NEXA_ADMIN_PASSWORD` 以创建第一个管理员；之后可在“账号管理”中创建账号及修改或重置密码。生产部署时，将本项目的 `dist/` 放到独立的管理域名或受限路径，且始终通过 HTTPS 提供服务。

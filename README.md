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
VITE_API_BASE_URL=auto
```

`auto` 会根据浏览器当前访问后台的地址连接同一台机器的 8000 端口。例如，在局域网其他设备打开 `http://192.168.5.56:5176` 时，后台会请求 `http://192.168.5.56:8000`。

启动后台后，从同一局域网的设备访问 `http://<运行后台电脑的局域网-IP>:5176`。后端需以 `--host 0.0.0.0 --port 8000` 启动；若启用了系统防火墙，请允许局域网访问 TCP 5176 和 8000。生产环境请使用 HTTPS 和反向代理，而不是暴露 Vite 开发服务器。

后端必须设置 `NEXA_ADMIN_TOKEN_SECRET`。首次部署时可额外设置 `NEXA_ADMIN_USERNAME`、`NEXA_ADMIN_PASSWORD` 以创建第一个管理员；之后可在“账号管理”中创建账号及修改或重置密码。生产部署时，将本项目的 `dist/` 放到独立的管理域名或受限路径，且始终通过 HTTPS 提供服务。

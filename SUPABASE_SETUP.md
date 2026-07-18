# Supabase 方案已停用

更新日期：2026-07-18

本项目不再依赖 Supabase、Cloudflare D1 或 R2。当前正式内容方案是“本地产品内容工作台”：

- 在本机后台编辑双语产品资料；
- 产品源记录写入 `content/products/<slug>/product.json`；
- 前台目录写入 `public/content/catalog.json`；
- 图片和视频复制到 `public/media/products/<slug>/`；
- 通过 GitHub 推送触发 Cloudflare Pages 静态部署。

旧 SQL 文件仅保留为历史设计记录，不应在生产环境执行。当前操作请阅读 `docs/11-local-content-workbench.md`。

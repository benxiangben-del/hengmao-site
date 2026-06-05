# Supabase 上线配置

这套后台现在已经支持真正的 Supabase 账号登录、云端内容保存、图片上传和视频上传。上线前只需要把下面几步做完。

## 1. 创建 Supabase 项目

在 [Supabase](https://supabase.com/) 新建一个项目，然后进入:

- `Project Settings -> API`
- 复制 `Project URL`
- 复制 `anon public key`

## 2. 配置环境变量

把项目根目录下的 `.env.example` 复制为 `.env`，填入你自己的值：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_BUCKET=site-images
VITE_SUPABASE_CONTENT_TABLE=site_content
```

## 3. 初始化数据库和存储桶

打开 Supabase 的 SQL Editor，执行这个文件：

- [`supabase/setup.sql`](C:/Users/XR/Documents/New project/supabase/setup.sql)

它会完成这些事情：

- 创建 `site_content` 表
- 初始化默认站点数据行 `id = default`
- 开启 RLS
- 允许公开读取官网内容
- 允许已登录管理员写入内容
- 创建公开存储桶 `site-images`
- 允许已登录管理员上传、更新、删除图片和视频文件

## 4. 创建后台管理员账号

进入：

- `Authentication -> Users`

创建一个邮箱密码账号。这个账号就是后台登录用的正式管理员账号。

后台登录页启用 Supabase 后，用户名字段会自动变成邮箱登录。

## 5. 本地验证

运行：

```bash
npm run dev
```

然后打开：

- 前台: [http://localhost:5173/](http://localhost:5173/)
- 后台: [http://localhost:5173/admin.html](http://localhost:5173/admin.html)

如果端口被占用，Vite 会自动切到别的端口。

## 6. 部署建议

推荐直接部署到：

- Vercel
- Netlify

部署时把同样的 4 个 `VITE_SUPABASE_*` 环境变量填进平台的环境变量设置里。

## 当前已经具备的云端能力

- 后台管理员账号登录
- 网站内容自动同步到 Supabase
- 产品图片上传到云端存储桶
- 产品安装视频文件上传到云端存储桶
- 前台自动读取云端最新内容

## 说明

如果 `.env` 没填，系统会自动退回本地演示模式：

- 登录账号: `admin`
- 密码: `admin123`

这能保证你在没接云端之前也能继续编辑页面。接入 Supabase 后，后台就会变成可上线的正式账号系统。

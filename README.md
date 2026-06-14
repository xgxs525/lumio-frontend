# Lumio 序光前端

这是 Lumio 序光 AI 办公平台的前端项目，采用 Next.js App Router 构建。后端服务独立放在 `I:\lumio`，默认通过 `NEXT_PUBLIC_API_BASE_URL` 访问 FastAPI 接口。

## 技术栈

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- lucide-react 图标
- 原子化组件和业务组件组合

## 目录结构

```text
src/
  app/                 # 页面路由
  components/          # 通用组件和业务组件
  lib/                 # API client、工具函数、常量和认证逻辑
public/                # 静态资源
```

## 快速启动

1. 安装依赖：

```powershell
cd I:\lumio-frontend
npm install
```

2. 准备环境变量：

```powershell
Copy-Item .env.local.example .env.local
```

3. 启动开发服务：

```powershell
npm run dev
```

默认访问地址：`http://localhost:3000`

## 环境变量

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 页面结构

官网页面：

- `/` 首页
- `/product` 产品
- `/product/[slug]` 产品详情
- `/solutions` 解决方案
- `/solutions/[slug]` 解决方案详情
- `/templates` 模板中心
- `/help` 帮助中心
- `/help/[slug]` 帮助文档详情
- `/blog` 博客
- `/blog/[slug]` 博客详情
- `/pricing` 价格
- `/enterprise` 企业版
- `/login` 登录
- `/register` 注册

工作台页面：

- `/workspace` 工作台首页
- `/workspace/settings` 工作空间设置
- `/ai` AI 助手
- `/drive` 云盘
- `/drive/folders/[folderId]` 文件夹详情
- `/drive/files/[fileId]` 文件预览
- `/drive/files/[fileId]/ai` 文件 AI 问答
- `/docs` 在线文档
- `/knowledge` 知识库
- `/knowledge/[knowledgeBaseId]` 知识库详情
- `/knowledge/[knowledgeBaseId]/sources` 知识库来源管理
- `/knowledge/[knowledgeBaseId]/members` 知识库成员
- `/knowledge/[knowledgeBaseId]/settings` 知识库设置
- `/tasks` 任务中心
- `/team` 团队
- `/team/members/[memberId]` 成员详情
- `/team/departments` 部门管理
- `/team/roles` 角色权限
- `/usage` 用量统计
- `/billing` 账单和套餐
- `/billing/checkout/[orderNo]` 支付确认
- `/admin` 后台管理
- `/settings` 账号设置

## 常用命令

```powershell
npm run dev      # 本地开发
npm run build    # 生产构建
npm run lint     # 代码检查
```

## 浏览器兼容

前端使用现代 CSS 和 React 渲染，目标兼容当前主流浏览器：

- Google Chrome
- Microsoft Edge
- Firefox
- QQ 浏览器
- 夸克浏览器
- 其他 Chromium 内核浏览器

开发新页面时要注意：

- 不要让弹窗遮挡当前页面主体。
- 长列表、表格和弹窗必须有可见的表头、操作区和滚动区域。
- 移动端和窄屏场景下避免横向溢出。
- 重要按钮不能出现在视口外。

## 部署说明

构建前请确认 `NEXT_PUBLIC_API_BASE_URL` 指向生产后端地址。生产环境推荐配合 CDN、HTTPS、服务端日志和前端错误监控使用。

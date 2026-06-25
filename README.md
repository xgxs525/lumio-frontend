# 序光前端

序光 AI 办公平台前端应用，基于 Next.js 16 App Router + TypeScript + Tailwind CSS 构建。

## 技术栈

- **框架**: Next.js 16 (Turbopack)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **编辑器**: TipTap (块编辑器)
- **图标**: Lucide React
- **语法高亮**: lowlight

## 快速启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000

需确保后端 API 运行在 http://localhost:8000

## 目录结构

```
src/
├── app/                  # Next.js App Router 页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   ├── globals.css       # 全局样式
│   ├── login/            # 登录
│   ├── register/         # 注册
│   ├── forgot-password/  # 忘记密码
│   ├── reset-password/   # 重置密码
│   ├── workspace/        # 工作空间
│   ├── tasks/            # 任务中心
│   ├── models/           # 模型广场
│   ├── creation/         # 创作空间
│   │   ├── image/        # 图像生成
│   │   └── video/        # 视频创作
│   ├── drive/            # 云盘
│   │   ├── files/[fileId]/      # 文件编辑
│   │   ├── folders/[folderId]/  # 文件夹详情
│   │   └── trash/               # 回收站
│   ├── knowledge/        # 知识库
│   ├── ai/               # AI 对话
│   ├── settings/         # 个人设置
│   ├── billing/          # 计费
│   ├── team/             # 团队
│   └── admin/            # 后台管理
├── components/
│   ├── knowledge/        # 知识库组件 (富文本编辑器等)
│   ├── layout/           # 布局组件 (Header, Footer, Chrome)
│   ├── ui/               # 通用 UI (Button, Input, Modal, Toast)
│   ├── video/            # 视频创作组件
│   └── workspace/        # 工作空间组件 (Shell, AuthGate)
└── lib/
    ├── api.ts            # API 客户端
    ├── auth.ts           # 认证工具
    └── utils.ts          # 通用工具
```

## 环境变量

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 构建

```bash
npm run build    # 生产构建
npm start        # 启动生产服务
npm run lint     # 代码检查
```

## 2026-06 更新

- 新增忘记密码/重置密码页面，支持邮箱验证码和邮件链接直达
- 云盘新增文件夹导航、文件编辑器、回收站
- 新建文件弹出命名对话框
- 侧边栏精简为 6 项核心导航，分组标题已隐藏
- 新增创作空间入口，整合图像生成与视频创作
- 登录/注册页输入框尺寸优化
- 新增依赖：`pdfjs-dist`、`mammoth`、`pptx-preview`、`xlsx`

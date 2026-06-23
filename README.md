# 序光前端

序光 AI 办公平台前端应用，基于 Next.js 15 App Router + TypeScript + Tailwind CSS 构建。

## 技术栈

- **框架**: Next.js 15 (App Router)
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
│   ├── login/            # 登录
│   ├── register/         # 注册
│   ├── workspace/        # 工作空间
│   ├── drive/            # 云盘
│   ├── knowledge/        # 知识库
│   │   └── [id]/add-source/  # 添加资料工作台
│   ├── ai/               # AI 对话
│   ├── settings/         # 个人设置
│   ├── admin/            # 后台管理
│   ├── billing/          # 计费
│   ├── team/             # 团队
│   ├── tasks/            # 任务
│   └── ...
├── components/
│   ├── knowledge/        # 知识库组件 (富文本编辑器等)
│   ├── layout/           # 布局组件
│   ├── ui/               # 通用 UI (Button, Input, Modal, Toast)
│   └── workspace/        # 工作空间组件
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

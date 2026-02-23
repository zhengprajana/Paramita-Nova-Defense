# 波罗蜜新星防御 (Paramita Nova Defense)

这是一个基于 React + Vite + Tailwind CSS 开发的经典导弹防御类塔防游戏。

## 部署到 Vercel 指南

### 1. 准备工作
- 确保你有一个 [GitHub](https://github.com/) 账号。
- 确保你有一个 [Vercel](https://vercel.com/) 账号。

### 2. 上传到 GitHub
1. 在 GitHub 上创建一个新的代码仓库。
2. 在本地项目目录中运行以下命令（如果你是在本地开发）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <你的仓库URL>
   git push -u origin main
   ```

### 3. 在 Vercel 上部署
1. 登录 Vercel 控制台。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入你刚刚创建的 GitHub 仓库。
4. **配置环境变量**：
   - 在部署设置的 "Environment Variables" 部分，添加 `GEMINI_API_KEY`。
   - 值的来源可以是你从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取的 API Key。
5. 点击 **"Deploy"**。

## 本地开发

安装依赖：
```bash
npm install
```

启动开发服务器：
```bash
npm run dev
```

构建项目：
```bash
npm run build
```

## 技术栈
- **React 19**
- **Vite**
- **Tailwind CSS 4**
- **Motion (Framer Motion)**
- **Lucide React (图标)**
- **Google Gemini API** (预留接口)

# 导航

点击下面链接直达腾讯云

[![Deploy to CloudBase](https://qcloudimg.tencent-cloud.cn/raw/fdfede7f163bddfef9b826bbc94a1f32/cloudbase-deploy-button.svg)](https://tcb.cloud.tencent.com/dev#/static/hosting?repo-url=https://github.com/wzhu2026/ssddh)

# 方式一：腾讯 EdgeOne Pages（推荐）

登录腾讯云控制台 → 进入 EdgeOne Pages

创建项目：

点击「新建项目」

选择「从本地上传」或连接 Git 仓库

文件结构（保持原有结构）：

text
/functions
  ├── admin.js
  ├── logout.js
  /api
    ├── config.js
    ├── [id].js
    ├── logo.js
    ├── logo-link.js
  /index.js
  
环境变量配置：

添加 KV 绑定：NAV_KV（需要先在 EdgeOne 创建 KV 存储）

部署步骤：

将所有修改后的文件上传

点击「部署」

等待部署完成（约1-2分钟）

访问：

部署成功后，会获得一个预览域名（如 xxx.edgeone.app）

访问 /admin 进行登录（默认账号：admin，密码：admin123）

# 方式二：通过 Git 部署

将代码推送到 GitHub/GitLab

在 EdgeOne Pages 中选择「从 Git 仓库导入」

配置构建设置：

构建命令：留空（无需构建）

输出目录：/

点击部署

初始化 KV 存储（重要）
在 EdgeOne Pages 控制台中，需要先创建 KV 存储：

进入 EdgeOne Pages → 你的项目 → KV 存储

创建 KV 命名空间：NAV_KV

可选：预先添加一些示例数据（通过后台管理界面添加）

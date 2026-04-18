# 导航

点击下面链接直达腾讯云

[![Deploy to CloudBase](https://qcloudimg.tencent-cloud.cn/raw/fdfede7f163bddfef9b826bbc94a1f32/cloudbase-deploy-button.svg)](https://tcb.cloud.tencent.com/dev#/static/hosting?repo-url=https://github.com/wzhu2026/ssddh)

# 方式一：腾讯 EdgeOne Pages（推荐）

登录腾讯云控制台 → 进入 EdgeOne Pages

创建项目：

点击「新建项目」

选择「从本地上传」或连接 Git 仓库

文件结构（保持原有结构）：

根目录/functions

  admin.js
  
  logout.js
  
  index.js
  
  /api
  
根目录/functions/api

    config.js

    logo.js
    
    logo-link.js
    
根目录/functions/api/config

    [id].js
      
环境变量配置：

添加 KV 绑定：NAV_KV（需要先在 EdgeOne 创建 KV 存储）

创建 KV 命名空间：NAV_KV（必须是这个名称，因为代码里写死了这个，你也可以自行在代码里修改）

部署步骤：

将所有修改后的文件上传

点击「部署」

等待部署完成（约1-2分钟）

访问：

部署成功后，会获得一个预览域名（如 xxx.edgeone.app）

访问 /admin 进行登录（默认账号：admin，密码：admin123）

然后添加自定义域名  

避坑  无论什么域名，一定要拥有绝对控制权，否则无法验证，

例如：xxxx.us.kg  你需要拥有us.kg的控制权才行

可选：预先添加一些示例数据（通过后台管理界面添加）

# 方式二：通过 Git 部署

将代码推送到 GitHub/GitLab

在 EdgeOne Pages 中选择「从 Git 仓库导入」

配置构建设置：

构建命令：留空（无需构建）

输出目录：/

点击部署

初始化 KV 存储（重要）

创建 KV 命名空间：NAV_KV

在 EdgeOne Pages 控制台中，需要先创建 KV 存储：

进入 EdgeOne Pages → 你的项目 → KV 存储  绑定

可选：预先添加一些示例数据（通过后台管理界面添加）

修改密码

登录后台：访问 /admin，输入账号密码（默认：admin / admin123）

修改密码：

点击右上角的「修改密码」按钮

输入原密码和新密码

确认修改后会自动退出登录，需要用新密码重新登录

其他管理方式（通过 KV 直接修改）

如果忘记密码，也可以通过 EdgeOne Pages 控制台直接修改 KV 中的密码：

进入项目 → KV 存储

找到 NAV_KV 命名空间

编辑键值对：

Key: admin_password

Value: 你想要的新密码

或者修改用户名：

Key: admin_username

Value: 新的用户名

安全建议

首次登录后立即修改默认密码

使用强密码（至少8位，包含字母+数字）

定期更换密码

这样你就可以在后台界面直接修改密码，无需通过 KV 控制台操作了。



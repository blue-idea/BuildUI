# v22 技术设计

首页复用创建接口的 `templateId`，App 传入 `react-native`。Go 按模板选择嵌入式脚手架，沿用工程目录、Git、会话和数据库初始化。既有工程按原有方式运行。App 工作区通过脚手架标记识别路线，避免新增数据库字段。

App 使用 Expo SDK 54、React Native、NativeWind v4 与 React Native Reusables 组件源码。蓝图和规划注入技术栈，生成和修复复用工具协议。类型检查通过后运行 Metro 导出，临时产物放在工作区外，诊断复用有限重试。工作台使用 Metro 本地 Web 服务，以同一工程支持浏览器预览和原生打包。

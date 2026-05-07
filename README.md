# Starsheet

Starsheet 是一个基于 Luckysheet 的二次开发表格项目，目标是保留 Luckysheet 的核心能力，同时持续修复问题、优化交互体验，并按业务需求扩展表格功能。

当前仓库包含：

- 面向浏览器的表格运行时与构建产物输出
- 本地开发与演示页面
- 多类内置插件能力，如图表、打印、导出 Excel
- 针对菜单、工具栏、浮层和交互体验的持续优化

## 项目定位

Starsheet 适合以下场景：

- 需要在前端集成类 Excel 表格能力的业务系统
- 基于 Luckysheet 做私有化定制和二次开发
- 需要在现有表格能力基础上继续扩展 UI、交互和业务逻辑的团队

## 主要能力

- 工作表创建、切换与多 sheet 管理
- 单元格编辑、格式化、合并、边框、对齐、自动换行
- 公式计算与函数能力
- 条件格式、数据验证、筛选、排序
- 图表、批注、透视表、Sparkline
- 打印、导入导出 Excel
- 丰富的 hook 扩展点，便于接入业务逻辑
- 基于本仓库的 UI 现代化主题与交互优化

## 技术栈

- 核心：Luckysheet 二次开发
- 构建：Gulp + esbuild + Rollup
- 运行依赖：jQuery、dayjs、numeral、xlsx、exceljs、flatpickr 等
- 文档：VuePress

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动本地开发环境

```bash
npm run dev
```

开发服务会构建 `dist` 目录并启动 BrowserSync。本地预览地址通常为：

```text
http://localhost:3002
```

### 3. 生产构建

```bash
npm run build
```

构建完成后，浏览器产物位于 `dist/`。

## 可用脚本

```bash
npm run dev         # 本地开发与热更新
npm run build       # 生产构建
npm run docs:dev    # 本地启动文档站点
npm run docs:build  # 构建文档站点
npm run commit      # 使用 commitizen 提交
npm run release     # 使用 standard-version 发布版本
```

## 产物说明

`package.json` 中声明了以下构建产物：

- `dist/luckysheet.cjs.js`
- `dist/luckysheet.esm.js`
- `dist/luckysheet.umd.js`

样式和静态资源会一起输出到 `dist` 目录。

## 本地演示页面

本仓库自带一个完整演示页，入口模板位于 [src/index.html](src/index.html)。

演示页包含：

- 默认本地数据初始化
- 图表、导出、打印等插件演示
- 多种 demoData 示例数据
- Hook 示例与可扩展配置

## 如何初始化表格

项目默认通过 `luckysheet.create(options)` 初始化实例。仓库中的实际示例可参考 [src/index.html](src/index.html#L1928)。

一个最小接入示例：

```html
<link rel="stylesheet" href="./css/luckysheet.css" />
<script src="./plugins/js/plugin.js"></script>
<script src="./luckysheet.umd.js"></script>

<div id="luckysheet" style="width: 100%; height: 100%;"></div>

<script>
	luckysheet.create({
		container: 'luckysheet',
		lang: 'zh'
	});
</script>
```

## 典型配置项

结合当前仓库示例，常见配置包括：

- `container`：挂载容器 id
- `lang`：语言
- `plugins`：插件注册列表
- `fontList`：自定义字体
- `hook`：业务钩子与生命周期扩展
- `forceCalculation`：是否强制重算

如需联机协同模式，示例页中也包含以下接口配置方式：

- `loadUrl`
- `loadSheetUrl`
- `updateUrl`
- `updateImageUrl`
- `gridKey`

## 插件能力

当前仓库已接入的插件包括：

- `chart`
- `exportXlsx`
- `print`

插件注册入口在表格初始化配置与 [src/controllers/expendPlugins.js](src/controllers/expendPlugins.js)。

## Hook 扩展

Starsheet 保留并扩展了 Luckysheet 的 hook 能力，适合接入业务逻辑、埋点和权限控制。当前示例中可见的 hook 包括但不限于：

- `cellDragStop`
- `cellRenderBefore`
- `cellRenderAfter`
- `cellUpdated`
- `sheetActivate`
- `rangeSelect`
- `commentInsertAfter`
- `cellEditBefore`
- `workbookCreateAfter`
- `rangePasteBefore`

建议优先从 [src/index.html](src/index.html) 的示例配置和 [src/global/api.js](src/global/api.js) 的公开 API 入手。

## 目录结构

```text
.
├─ src/
│  ├─ index.html                # 本地演示入口
│  ├─ index.js                  # 入口模块
│  ├─ core.js                   # 初始化主链
│  ├─ css/                      # 样式与主题覆盖
│  ├─ controllers/              # 交互控制器与菜单、键盘、筛选等逻辑
│  ├─ global/                   # 全局 API、渲染、公式、刷新等核心逻辑
│  ├─ function/                 # 函数定义与函数实现
│  ├─ store/                    # 全局 Store 状态
│  ├─ demoData/                 # 演示用数据和功能样例
│  ├─ expendPlugins/            # 插件扩展实现
│  └─ locale/                   # 国际化资源
├─ dist/                        # 构建产物
├─ docs/                        # 文档站点（如存在）
├─ gulpfile.js                  # 构建脚本
└─ package.json                 # 项目依赖与脚本
```

## 核心代码说明

如果你准备继续做二次开发，优先关注这些模块：

- [src/core.js](src/core.js)：初始化主入口，串联主要控制器
- [src/store/index.js](src/store/index.js)：全局状态中心
- [src/global/api.js](src/global/api.js)：公开 API 与高频业务接入点
- [src/global/draw.js](src/global/draw.js)：Canvas 绘制主入口
- [src/global/refresh.js](src/global/refresh.js)：数据刷新与重绘调度
- [src/global/formula.js](src/global/formula.js)：公式核心逻辑
- [src/controllers/handler.js](src/controllers/handler.js)：事件处理主链
- [src/controllers/keyboard.js](src/controllers/keyboard.js)：键盘交互
- [src/controllers/filter.js](src/controllers/filter.js)：筛选与部分菜单显隐交互
- [src/controllers/xlsxCtrl.js](src/controllers/xlsxCtrl.js)：导入导出相关逻辑

## 样式与 UI 定制

当前项目已经引入独立的现代主题覆盖层，推荐样式定制优先放在：

- [src/css/starsheet-modern.css](src/css/starsheet-modern.css)

这样可以尽量避免直接修改底层核心样式，降低升级和回归风险。

## 开发建议

- 优先通过 hook 和公开 API 扩展业务逻辑
- 样式修改优先走主题覆盖层，而不是直接侵入核心样式
- 涉及右键菜单、浮层和多级菜单时，建议同步验证 hover、移入移出和显隐边界
- 涉及渲染性能的问题，优先排查 `draw.js`、`refresh.js` 和 Store 更新链路

## 常见开发流程

### 修改前端交互或样式

1. 在 `src/` 内修改对应模块或样式文件
2. 使用 `npm run dev` 启动本地预览
3. 在演示页中复现并验证改动
4. 使用 `npm run build` 做一次完整构建检查

### 新增业务功能

1. 找到最接近的控制器或 API 落点
2. 评估是否可通过 hook 或插件扩展完成
3. 补充 demoData 或最小复现示例，便于回归验证

## 版本与提交

仓库已配置：

- Commitizen：规范化提交信息
- Commitlint：提交校验
- standard-version：版本发布

推荐使用：

```bash
npm run commit
```

## 致谢

本项目基于 Luckysheet 进行二次开发，并在其基础上持续做问题修复、能力增强与界面体验优化。

## License

本仓库包含 [LICENSE](LICENSE) 文件，使用前请结合仓库协议与上游依赖协议一并确认。

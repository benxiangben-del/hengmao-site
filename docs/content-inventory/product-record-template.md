# 双语产品资料录入模板

模板版本：1.0

适用内容模型：`docs/06-content-model.md` v1.0

> 每个正式型号复制一份，以型号命名，例如 `HM-P1200.md`。只填写有来源、可核实的信息；不知道的内容保留“待填写”，不得推测。中文和英文分别审核。

## 0. 资料责任

- 资料整理人：待填写
- 产品技术确认人：待填写
- 中文内容审核人：待填写
- 英文内容审核人：待填写
- 图片/视频权属确认人：待填写
- 首次建档日期：待填写
- 最后更新日期：待填写

## 1. 产品身份（语言无关）

| 字段 | 填写内容 | 规则 |
| --- | --- | --- |
| 正式型号 `model` | 待填写 | 唯一；以铭牌或正式资料为准 |
| URL `slug` | 待生成 | 小写英文、数字和连字符，如 `hm-p1200` |
| 分类 key | 待填写 | 从标准分类中选择 |
| 产品状态 | `draft` | `draft/review/published/archived` |
| 生命周期 | `active` | `active/discontinued/upcoming` |
| 默认排序 | 0 | 数字越小越靠前 |

标准分类：

- `portable-washer`
- `trolley-washer`
- `spray-gun`
- `high-pressure-hose`
- `steel-wire-hose`
- `accessory`

## 2. 中文产品内容 `zh-CN`

- 正式中文名称：待填写
- 中文摘要（40–120 字符）：待填写
- 中文完整介绍：待填写
- 翻译状态：`draft`

### 2.1 中文产品特点

每项 key 应与英文对应。

| key | 标题 | 说明 |
| --- | --- | --- |
| 待填写 | 待填写 | 待填写 |

### 2.2 中文适用场景

| key | 场景名称 | 说明 |
| --- | --- | --- |
| 待填写 | 待填写 | 待填写 |

### 2.3 中文 SEO

- SEO 标题（建议 15–32 字）：待填写
- SEO 描述（建议 60–120 字）：待填写

## 3. English product content `en`

- Official English name: To be provided
- English summary (40–160 characters): To be provided
- Full English description: To be provided
- Translation status: `draft`

### 3.1 English features

Use the same keys and order as the Chinese record.

| key | Title | Description |
| --- | --- | --- |
| To be provided | To be provided | To be provided |

### 3.2 English applications

| key | Application | Description |
| --- | --- | --- |
| To be provided | To be provided | To be provided |

### 3.3 English SEO

- SEO title (recommended 30–60 characters): To be provided
- SEO description (recommended 120–160 characters): To be provided

## 4. 技术参数（共享真实值）

> 参数数值只填一次，中文和英文只翻译标签。参数来源必须能追溯。

| 参数 key | 分组 | 中文标签 | English label | 数值 | 文本值 | 单位 | 关键参数 | 来源 | 审核状态 |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| 待填写 | performance | 待填写 | To be provided |  | 待填写 |  | 是/否 | 说明书/铭牌/技术确认 | unverified |

参数分组：`performance/electrical/dimensions/connection/package/other`。

## 5. 包装清单（共享数量）

| item key | 数量 | 单位 | 中文名称 | English name | 中文备注 | English notes |
| --- | ---: | --- | --- | --- | --- | --- |
| 待填写 | 1 | pc | 待填写 | To be provided | 待填写 | To be provided |

> 数量和单位只填写一次，中英文共用，避免两个语言版本不一致。

## 6. 安装要求

- 是否需要安装：待填写（需要/无需/待确认）
- 适用型号：待填写
- 指南版本：`1.0`
- 中文状态：`draft`
- 英文状态：`draft`
- 技术审核状态：`unverified`
- 所需工具：待填写
- 安装前条件：待填写

### 6.1 中文安装步骤

| key | 顺序 | 标题 | 操作说明 | 对应图片/视频 |
| --- | ---: | --- | --- | --- |
| 待填写 | 1 | 待填写 | 待填写 | 待填写 |

### 6.2 English installation steps

| key | Order | Title | Instructions | Image/video |
| --- | ---: | --- | --- | --- |
| Same as Chinese | 1 | To be provided | To be provided | Same asset or localized asset |

## 7. 使用方法

- 指南版本：`1.0`
- 中文状态：`draft`
- 英文状态：`draft`
- 技术审核状态：`unverified`

### 7.1 中文使用步骤

| key | 顺序 | 标题 | 操作说明 | 对应图片/视频 |
| --- | ---: | --- | --- | --- |
| 待填写 | 1 | 待填写 | 待填写 | 待填写 |

### 7.2 English usage steps

| key | Order | Title | Instructions | Image/video |
| --- | ---: | --- | --- | --- |
| Same as Chinese | 1 | To be provided | To be provided | Same asset or localized asset |

## 8. 安全注意事项

> 必须由了解该型号的技术人员确认。不要让翻译人员或 AI 单独创造安全警告。

| key | 等级 | 中文标题 | 中文说明 | English title | English description | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
| 待填写 | danger/warning/caution/note | 待填写 | 待填写 | To be provided | To be provided | 说明书/技术确认 |

- 技术审核人：待填写
- 审核日期：待填写
- 审核状态：`unverified`

## 9. 维护与故障排查

### 9.1 日常维护

| key | 周期 | 中文说明 | English description |
| --- | --- | --- | --- |
| 待填写 | 每次使用后/定期/按需 | 待填写 | To be provided |

### 9.2 常见问题

| key | 中文问题 | 中文回答 | English question | English answer |
| --- | --- | --- | --- | --- |
| 待填写 | 待填写 | 待填写 | To be provided | To be provided |

## 10. 图片和视频

> 素材必须确认型号、用途和权属。原始文件名用于追溯，上传后由系统生成 Storage 路径。

| asset key | 原始文件名 | 类型 | 用途 role | 语言 | 中文 alt | English alt | 权属状态 | 是否公开 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | image/video | cover/gallery/detail/application/package/video-demo/video-installation/video-usage/video-maintenance/poster | 无语言/zh-CN/en | 待填写 | To be provided | pending | 否 |

权属状态：`pending/approved/restricted/rejected`。

## 11. 说明书和下载资料

| asset key | 文件名 | 类型 | 语言 | 版本 | 生效日期 | 适用型号 | 权属/有效性确认 | 当前版本 | 是否公开 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | manual/spec-sheet/installation-drawing/certificate/warranty/other | zh-CN/en/multilingual | 待填写 | 待填写 | 待填写 | 待确认 | 是/否 | 否 |

## 12. 相关产品与配件

| 目标型号 | 关系 | 中文兼容说明 | English compatibility note | 排序 |
| --- | --- | --- | --- | ---: |
| 待填写 | accessory/compatible/replacement/related | 待填写 | To be provided | 0 |

## 13. 首页推荐

- 是否进入首页大图轮播：否
- 轮播顺序：待填写
- 是否使用产品主图：是
- 指定轮播素材 asset key：待填写
- 展示开始时间：待填写
- 展示结束时间：待填写

说明：首页大图轮播最多启用 4 款，且只能选择已发布产品和已授权素材。

## 14. 来源与审核记录

| 内容范围 | 来源文件/确认人 | 审核状态 | 审核人 | 审核日期 |
| --- | --- | --- | --- | --- |
| 产品身份 | 待填写 | 待确认 | 待填写 | 待填写 |
| 技术参数 | 待填写 | 待确认 | 待填写 | 待填写 |
| 安装与使用 | 待填写 | 待确认 | 待填写 | 待填写 |
| 安全事项 | 待填写 | 待确认 | 待填写 | 待填写 |
| 中文内容 | 待填写 | 待确认 | 待填写 | 待填写 |
| 英文内容 | 待填写 | 待确认 | 待填写 | 待填写 |
| 图片和视频权属 | 待填写 | 待确认 | 待填写 | 待填写 |

## 15. 发布检查

### 产品与中文

- [ ] 型号、slug 和分类唯一且正确
- [ ] 中文名称、摘要、介绍和 SEO 已审核
- [ ] 中文特点、场景和包装清单已确认
- [ ] 主图型号和权属已确认

### English

- [ ] English name, summary, description and SEO are reviewed
- [ ] Feature/application keys match the Chinese record
- [ ] English media alt text is complete
- [ ] No unreviewed machine translation is marked as published

### 技术与支持

- [ ] 关键参数有来源且通过审核
- [ ] 安装指南已发布或明确无需安装
- [ ] 使用指南已发布
- [ ] 安全事项经过技术人员审核
- [ ] 视频、说明书的型号、语言和版本正确

### 发布

- [ ] 产品状态可改为 `published`
- [ ] 中文翻译状态可改为 `published`
- [ ] 英文翻译状态可改为 `published`
- [ ] 如进入首页轮播，推荐位和顺序已确认

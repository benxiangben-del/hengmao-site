# 上海恒猫机电官网双语产品内容模型

版本：1.0

日期：2026-07-18

状态：已完成字段合同，待后台与数据库迁移实施

## 1. 目标与边界

本模型是产品中心、产品详情、首页产品轮播、安装与支持中心、后台录入和后续批量导入共同遵守的数据合同。

首期固定支持：

- 中文：`zh-CN`
- 英文：`en`
- 产品、配件及其分类
- 技术参数、特点、应用和包装内容
- 安装、使用、安全、维护和故障排查指南
- 主图、详情图、视频、说明书和参数表
- 首页推荐、产品关系、草稿、审核、发布和归档
- 中英文 SEO 与媒体替代文本

本阶段只定义数据，不修改已确认的页面视觉，也不执行生产数据库迁移。

## 2. 已锁定的内容决策

1. **语言无关数据只保存一份。** 型号、slug、分类、参数真实值、尺寸、文件和产品关系不因语言重复。
2. **中英文内容独立审核。** 名称、描述、步骤、警告、SEO 和替代文本按语言保存并拥有独立状态。
3. **不做静默语言替代。** 英文未发布时，英文站不把中文内容伪装成英文；后台预览可明确标记“使用中文参考”。
4. **产品与首页轮播分离。** 产品只录入一次，通过推荐位决定是否进入首页轮播以及轮播顺序。
5. **型号和 URL 稳定。** 正式发布后不得随意修改 `model` 和 `slug`；确需变更时建立重定向和审计记录。
6. **缺失内容不虚构。** 未提供的参数、认证、安装步骤和安全提示不由系统猜测；前台隐藏或显示“资料准备中”。
7. **技术与安全内容必须有来源。** 参数、安装、使用和安全内容记录来源、审核状态、审核人和审核时间。
8. **媒体授权先于公开。** 权属未确认、含第三方品牌或适用型号不明的素材不能发布。
9. **删除业务记录不直接删除文件。** 媒体先解除关联并进入待清理状态，确认未被引用后再删除 Storage 对象。

## 3. 前台页面与数据来源

| 前台区域 | 数据来源 | 发布条件 |
| --- | --- | --- |
| 首页机器轮播 | `content_placements` + 产品 + 指定媒体 | 推荐位、产品、当前语言和媒体均已发布 |
| 产品中心卡片 | 产品 + 当前语言翻译 + 主图 + 关键参数 | 产品和当前语言已发布 |
| 产品详情首屏 | 产品 + 当前语言翻译 + 主图/相册 | 同上 |
| 技术参数 | `product_specifications` | 参数已验证且允许公开 |
| 安装与使用 | `guides` + 当前语言指南 | 指南版本和当前语言已发布 |
| 安全事项 | 安全指南 | 技术审核通过后发布 |
| 视频与下载 | 媒体、文档关联 | 权属通过、适用型号明确、文件有效 |
| 相关配件 | `product_relations` | 两端产品均可公开 |

## 4. 产品基础实体 `products`

只保存语言无关、长期稳定的信息。

| 字段 | 类型建议 | 必填 | 规则 |
| --- | --- | --- | --- |
| `id` | uuid | 是 | 主键 |
| `model` | text unique | 是 | 正式型号；去除首尾空格；发布后受保护 |
| `slug` | text unique | 是 | 小写 ASCII kebab-case，如 `hm-p1200` |
| `category_id` | uuid | 是 | 指向有效产品分类 |
| `status` | text | 是 | `draft/review/published/archived` |
| `lifecycle_status` | text | 是 | `active/discontinued/upcoming` |
| `sort_order` | int | 是 | 产品中心默认排序 |
| `created_by/updated_by` | uuid | 否 | 后台用户 |
| `published_at` | timestamptz | 否 | 首次公开时间 |
| `created_at/updated_at` | timestamptz | 是 | 审计时间 |

产品分类使用稳定 `key`，首期包括：

- `portable-washer`：便携式清洗设备
- `trolley-washer`：推车式清洗设备
- `spray-gun`：水枪
- `high-pressure-hose`：高压管
- `steel-wire-hose`：钢丝管
- `accessory`：其他配件

分类名称和说明同样提供 `zh-CN` 与 `en`，分类 key 不直接展示给访客。

## 5. 产品翻译 `product_translations`

唯一约束：`product_id + locale`。

| 字段 | 类型建议 | 发布必填 | 用途 |
| --- | --- | --- | --- |
| `product_id` | uuid | 是 | 产品外键 |
| `locale` | text | 是 | `zh-CN` 或 `en` |
| `name` | text | 是 | 正式产品名称 |
| `short_description` | text | 是 | 卡片和详情首屏摘要，建议 40–120 字符 |
| `description` | text | 是 | 产品完整介绍，不包含未经证实的宣传数据 |
| `features` | jsonb | 否 | 有序特点列表 |
| `applications` | jsonb | 否 | 有序适用场景列表 |
| `seo_title` | text | 是 | 建议中文 15–32 字、英文 30–60 字符 |
| `seo_description` | text | 是 | 建议中文 60–120 字、英文 120–160 字符 |
| `translation_status` | text | 是 | `draft/review/published` |
| `reviewed_by/reviewed_at` | uuid/time | 发布必填 | 语言审核记录 |

列表字段统一使用稳定 key，便于比较中英文是否对应：

```json
[
  {
    "key": "compact-body",
    "title": "紧凑机身",
    "description": "适用于需要移动设备的清洁场景。"
  }
]
```

英文记录必须使用相同的 `key`，但标题和说明改为经过审核的英文。

## 6. 技术参数与包装清单

### 6.1 技术参数 `product_specifications`

参数真实值只保存一次，标签提供中英文。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `product_id` | uuid | 产品外键 |
| `spec_key` | text | 同类产品统一键，如 `rated-pressure` |
| `group_key` | text | `performance/electrical/dimensions/connection/package/other` |
| `label_zh/label_en` | text | 前台参数名称 |
| `value_text` | text | 复杂值或范围；与数值字段至少填一项 |
| `value_number` | numeric nullable | 可筛选、可比较的数值 |
| `unit_code` | text nullable | 标准单位，如 `bar/W/V/mm/kg` |
| `sort_order` | int | 组内排序 |
| `is_key_spec` | boolean | 是否显示在产品卡片或详情首屏 |
| `verification_status` | text | `unverified/review/approved/rejected` |
| `source_reference` | text | 说明书、铭牌、检测报告或技术确认编号 |
| `reviewed_by/reviewed_at` | uuid/time | 参数审核记录 |

规则：

- 不把 `220V` 同时写入数值和单位；应使用 `value_number=220`、`unit_code=V`。
- 范围或组合值无法拆分时使用 `value_text`，例如 `8–12 m`。
- 参数未通过审核时只能在后台预览，不能公开。
- 相同分类尽量复用同一 `spec_key` 和单位。

### 6.2 包装清单 `product_package_items`

包装数量和单位只保存一次，中文与英文名称成对维护：

| 字段 | 说明 |
| --- | --- |
| `item_key` | 稳定项目键，如 `main-unit`、`inlet-hose` |
| `quantity` | 语言无关数量 |
| `unit_code` | `pc/set/m` 等标准单位 |
| `name_zh/name_en` | 中英文名称 |
| `notes_zh/notes_en` | 可选说明 |
| `sort_order` | 显示顺序 |

中英文包装清单不得分别填写两套数量，避免翻译更新后发生数量不一致。

## 7. 安装、使用与安全指南

指南分为语言无关的版本记录和语言相关正文。

### 7.1 指南 `guides`

| 字段 | 说明 |
| --- | --- |
| `slug` | 稳定指南 URL |
| `guide_type` | `installation/usage/safety/maintenance/troubleshooting/faq` |
| `status` | `draft/review/published/archived` |
| `version` | 版本号，如 `1.0` |
| `effective_at` | 生效时间 |
| `technical_review_status` | `unverified/review/approved/changes_requested` |
| `reviewed_by/reviewed_at` | 技术审核记录 |

### 7.2 指南翻译 `guide_translations`

- `locale`
- `title`
- `summary`
- `steps`
- `warnings`
- `body`
- `seo_title/seo_description`
- `translation_status`
- `reviewed_by/reviewed_at`

步骤结构：

```json
[
  {
    "key": "connect-water-inlet",
    "order": 1,
    "title": "连接进水管",
    "body": "按照已审核说明连接对应接口。",
    "media_asset_key": "hm-p1200-install-01"
  }
]
```

警告结构：

```json
[
  {
    "key": "disconnect-power",
    "severity": "warning",
    "title": "维护前断开电源",
    "body": "具体操作以对应型号说明书和技术审核内容为准。"
  }
]
```

`severity` 只允许 `danger/warning/caution/note`。中英文步骤和警告使用相同 key，便于发现漏译或错位。

### 7.3 产品与指南关联 `product_guides`

- `relationship`：`dedicated/compatible/general`
- `sort_order`
- `is_primary`

同一通用维护指南可以关联多个型号；型号专属安全指南不得错误复用于其他产品。

## 8. 媒体资产

### 8.1 媒体文件 `media_assets`

| 字段 | 说明 |
| --- | --- |
| `asset_key` | 业务稳定标识，如 `hm-p1200-cover-01` |
| `kind` | `image/video/document` |
| `storage_bucket/storage_path` | Supabase Storage 位置 |
| `original_filename` | 原始文件名，用于追溯 |
| `mime_type/file_size` | 文件属性 |
| `width/height/duration_seconds` | 尺寸或时长 |
| `checksum` | 重复文件识别 |
| `rights_status` | `pending/approved/restricted/rejected` |
| `rights_source` | 自有拍摄、供应商授权或协议编号 |
| `cleanup_status` | `active/orphaned/pending_delete` |

### 8.2 产品媒体关联 `product_media`

- `role`：`cover/gallery/detail/application/package/video-demo/video-installation/video-usage/video-maintenance/poster`
- `locale`：无语言素材为 `null`；带文字、配音或字幕的素材必须指定语言
- `alt_zh/alt_en`：图片替代文本
- `caption_zh/caption_en`：可选说明
- `sort_order`
- `is_active`

同一媒体可关联多个产品，但每个产品只能有一个有效 `cover`。含第三方品牌、权属待确认或型号不明的素材不得设为有效公开媒体。

## 9. 下载资料 `product_documents`

文档文件仍由 `media_assets` 管理，关联记录保存：

- `document_type`：`manual/spec-sheet/installation-drawing/certificate/warranty/other`
- `locale`：`zh-CN/en/multilingual`
- `title`
- `version`
- `effective_at`
- `is_current`
- `publication_status`
- `applicable_models`

更新说明书不覆盖旧文件。旧版本保留追溯记录，前台只展示当前有效版本。

## 10. 产品关系 `product_relations`

| 字段 | 说明 |
| --- | --- |
| `source_product_id` | 当前产品 |
| `target_product_id` | 被关联产品或配件 |
| `relation_type` | `accessory/compatible/replacement/related` |
| `note_zh/note_en` | 兼容范围或限制 |
| `sort_order` | 显示顺序 |

关系不默认双向。例如“某水枪兼容某主机”是否反向展示由后台单独决定。

## 11. 首页产品推荐位 `content_placements`

产品是否进入首页轮播不再使用重复的轮播产品对象，而使用推荐位：

| 字段 | 说明 |
| --- | --- |
| `placement_key` | 首期为 `home-hero` 或 `home-featured` |
| `product_id` | 被推荐的正式产品 |
| `media_asset_id` | 可选；为空时使用产品主图 |
| `sort_order` | 轮播顺序 |
| `is_active` | 是否启用 |
| `starts_at/ends_at` | 可选展示时间 |

业务规则：

- `home-hero` 最多启用 4 个产品。
- 只有已发布产品和已授权媒体可以进入公开轮播。
- 推荐位不修改产品本身，也不建立第二份产品资料。

## 12. 发布状态和语言行为

### 12.1 状态流

```text
draft → review → published → archived
          ↘ changes requested ↗
```

### 12.2 中文与英文发布

- 产品基础记录可以处于 `published`，但某个语言只有 `translation_status=published` 时才在对应语言站显示。
- 中文已发布、英文未发布时：中文产品页可访问；英文产品列表不展示该产品，直接访问英文 URL 显示“英文资料准备中”。
- 正式全站上线验收要求主推产品中英文都通过审核。
- SEO、图片 alt、指南正文和文档语言必须与当前页面语言一致。

## 13. 发布前校验门槛

### 13.1 产品基础门槛

- [ ] 唯一正式型号、slug 和有效分类
- [ ] 生命周期状态明确
- [ ] 至少一条可发布语言翻译
- [ ] 主图已确认权属和适用型号
- [ ] 关键参数有来源并审核通过

### 13.2 每种语言门槛

- [ ] 名称、摘要、完整介绍已填写
- [ ] 特点和应用场景与真实资料一致
- [ ] SEO 标题和描述已审核
- [ ] 当前语言图片替代文本完整
- [ ] 翻译审核状态为 `published`

### 13.3 支持资料门槛

- [ ] 安装指南已发布，或明确记录该产品无需安装
- [ ] 使用指南已发布
- [ ] 安全内容通过技术审核
- [ ] 视频适用型号、语言/字幕和版权明确
- [ ] 说明书版本、语言和生效日期明确

## 14. 本地资料包与后台存储

本地固定文件夹是资料交接规范，不是网站运行的强制目录。推荐：

```text
products/HM-P1200/
├── product-record.json
├── product-record.md
├── images/
│   ├── cover.png
│   ├── gallery-01.png
│   └── detail-01.jpg
├── videos/
│   ├── installation-zh.mp4
│   └── usage-en.mp4
├── manuals/
│   ├── HM-P1200-manual-zh.pdf
│   └── HM-P1200-manual-en.pdf
└── source/
    └── parameter-source.pdf
```

后台上传后，Storage 使用系统生成的安全路径；不能依赖用户原始文件名作为公开 URL。

## 15. 数据库映射

| 内容 | 目标表 |
| --- | --- |
| 产品身份与状态 | `products` |
| 中英文产品正文与 SEO | `product_translations` |
| 分类 | `product_categories` |
| 技术参数 | `product_specifications` |
| 包装清单 | `product_package_items` |
| 文件元数据与权属 | `media_assets` |
| 产品图片和视频 | `product_media` |
| 指南版本 | `guides` |
| 中英文指南 | `guide_translations` |
| 产品与指南关系 | `product_guides` |
| 说明书和参数表 | `product_documents` |
| 配件和兼容关系 | `product_relations` |
| 首页轮播和推荐产品 | `content_placements` |

`docs/supabase-content-model-v2.sql` 是结构评审草案，不得直接在生产数据库执行。现有 `products/product_images/site_settings` 在迁移验证完成前继续保留。

## 16. 迁移原则

1. 先备份现有数据库、Auth 用户和 Storage 清单。
2. 在独立测试环境验证 v2 表结构和权限。
3. 复制而非覆盖现有数据，生成迁移缺口报告。
4. 将当前演示产品和首页四款图片标为 `unverified`，不能自动升级为正式产品。
5. 后台先接入 v2 并完成一款真实产品录入。
6. 前台优先在预览环境读取 v2；读取失败时使用明确的演示回退，不混合真假数据。
7. 数量、文件、URL 和中英文页面验收后再切换正式读取。
8. 旧表至少保留一个回滚周期。

## 17. 验收标准

- 任意产品都能使用同一模板完整描述中英文内容。
- 每个产品只有一份型号、参数真实值和媒体文件记录。
- 中文与英文可以独立审核，不发生语言伪装或错位。
- 首页轮播只引用正式产品，不复制产品资料。
- 安装、使用、安全和维护指南具有版本和审核记录。
- 未确认权属、型号或技术来源的内容无法公开。
- 内容字段可以明确映射到数据库、后台表单和前台组件。
- 新增普通产品不要求修改前端代码。

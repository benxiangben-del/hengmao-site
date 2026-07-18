# 上海恒猫机电官网内容模型

版本：0.1  
日期：2026-07-17  
状态：待数据库迁移设计验证

## 1. 目标

内容模型需要同时支持：

- 中英文产品信息
- 独立、稳定的产品 URL
- 产品安装、使用、安全和维护指南
- 图片、视频和说明书版本管理
- 产品与配件、指南、资料之间的关联
- 工厂、证书、专利和案例展示
- 后台编辑、发布状态和更新时间
- SEO 字段与语言对应关系

当前 `products` 表和 JSON 字段可以继续作为迁移来源，但不足以长期承载上述内容。迁移应保留现有数据，不能先删表再重新录入。

## 2. 建模原则

1. 型号、数值参数和媒体关联属于语言无关数据。
2. 名称、说明、步骤、警告和 SEO 文案属于语言相关数据。
3. 草稿、审核、发布和归档状态必须区分。
4. 安全与技术内容记录审核人和更新时间。
5. 产品 URL 使用稳定 slug，不依赖数据库 UUID。
6. 媒体文件与业务记录分离，删除记录不等于直接删除文件。
7. 后台只允许明确的管理员写入。

## 3. 核心实体

```text
ProductCategory
  └── Product
       ├── ProductTranslation
       ├── ProductSpecification
       ├── ProductMedia
       ├── ProductDocument
       ├── ProductGuide ── Guide ── GuideTranslation
       └── ProductRelation

CompanyEvidence
  └── EvidenceTranslation

SitePage
  └── SitePageTranslation
```

## 4. 产品分类 `product_categories`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `key` | text unique | 稳定内部标识，如 `portable` |
| `slug` | text unique | URL 标识 |
| `name_zh` | text | 中文名称 |
| `name_en` | text | 英文名称 |
| `description_zh` | text | 中文分类说明 |
| `description_en` | text | 英文分类说明 |
| `sort_order` | int | 排序 |
| `is_active` | boolean | 是否公开 |

分类数量较少，首期允许双语字段同表维护，不必为了形式过度拆分。

## 5. 产品基础表 `products`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `model` | text unique | 正式型号 |
| `slug` | text unique | 稳定产品 URL |
| `category_id` | uuid | 分类外键 |
| `status` | text | `draft/review/published/archived` |
| `cover_media_id` | uuid nullable | 主图 |
| `sort_order` | int | 排序 |
| `featured` | boolean | 是否重点产品 |
| `published_at` | timestamptz | 发布时间 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |

`model` 和 `slug` 不因翻译变化而改变。产品下线使用 `archived` 或取消发布，不直接删除历史内容。

## 6. 产品翻译 `product_translations`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `product_id` | uuid | 产品外键 |
| `locale` | text | `zh-CN` 或 `en` |
| `name` | text | 正式名称 |
| `short_description` | text | 卡片和首屏摘要 |
| `description` | text | 完整介绍 |
| `applications` | jsonb | 适用场景列表 |
| `features` | jsonb | 产品特点列表 |
| `package_contents` | jsonb | 包装清单 |
| `seo_title` | text | SEO 标题 |
| `seo_description` | text | SEO 描述 |
| `translation_status` | text | `draft/reviewed/published` |
| `reviewed_by` | uuid nullable | 审核人 |
| `reviewed_at` | timestamptz | 审核时间 |

唯一约束：`product_id + locale`。

## 7. 产品参数 `product_specifications`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `product_id` | uuid | 产品外键 |
| `spec_key` | text | 规范参数键 |
| `label_zh` | text | 中文标签 |
| `label_en` | text | 英文标签 |
| `value` | text | 参数值 |
| `unit` | text nullable | 单位 |
| `group_key` | text | 性能、尺寸、电气、包装等 |
| `sort_order` | int | 排序 |
| `is_key_spec` | boolean | 是否用于卡片/首屏 |

首期保留文本值以兼容复杂参数，但同类产品应使用统一 `spec_key` 和单位。后续若需要参数筛选，再为可比较参数增加规范化数值字段。

## 8. 媒体 `media_assets`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `kind` | text | `image/video/document` |
| `storage_bucket` | text | 存储桶 |
| `storage_path` | text | 对象路径，不只保存公开 URL |
| `mime_type` | text | MIME 类型 |
| `file_size` | bigint | 文件大小 |
| `width/height` | int nullable | 图片或视频尺寸 |
| `duration_seconds` | int nullable | 视频时长 |
| `checksum` | text nullable | 文件校验 |
| `created_at` | timestamptz | 上传时间 |
| `created_by` | uuid | 上传者 |

产品媒体关联表 `product_media` 增加：用途、排序、语言、替代文本、说明、海报图与适用型号。

删除流程建议采用“先解除关联 → 进入待清理状态 → 定期删除未被引用的对象”，避免误删仍在使用的文件。

## 9. 安装与支持指南

### `guides`

- `id`
- `slug`
- `guide_type`：`installation/usage/safety/maintenance/faq`
- `status`
- `version`
- `reviewed_by`
- `reviewed_at`
- `published_at`
- `updated_at`

### `guide_translations`

- `guide_id`
- `locale`
- `title`
- `summary`
- `steps`：有序步骤数据
- `warnings`：结构化安全提示
- `body`：补充正文
- `seo_title`
- `seo_description`
- `translation_status`

### `product_guides`

- `product_id`
- `guide_id`
- `relationship`：专属、兼容、通用
- `sort_order`

指南与产品建立多对多关系：同一通用维护指南可关联多个型号，型号专属安装步骤也能独立存在。

## 10. 下载资料 `product_documents`

- 产品或指南关联
- 文件媒体 ID
- 文档类型：说明书、参数表、证书、安装图等
- 语言
- 版本
- 生效日期
- 是否当前版本
- 文件标题
- 适用型号

更新资料时不直接覆盖旧文件；旧链接需要保留或设置清晰的更新提示。

## 11. 产品关系 `product_relations`

- `source_product_id`
- `target_product_id`
- `relation_type`：配件、替代、兼容、相关
- `note_zh`
- `note_en`
- `sort_order`

用于把主机与水枪、高压管、钢丝管等配件建立明确关系，减少用户选错配件。

## 12. 企业证据 `company_evidence`

统一承载：工厂、生产设备、证书、专利、案例和出口地区。

基础字段：

- `evidence_type`
- `status`
- `reference_number`
- `issuer`
- `valid_from/valid_until`
- `verification_url`
- `media_id`
- `sort_order`
- `published_at`

翻译字段：标题、摘要、正文、地点、适用产品和替代文本。

客户案例增加公开授权状态；未获授权时不保存可识别客户的信息到公开字段。

## 13. 站点配置与页面

当前 `site_settings` 可以保留用于小型全局配置：

- 品牌名称与口号
- 联系方式
- 社交/视频渠道
- 默认 SEO
- 功能开关

首页和公司介绍等长内容不建议继续全部塞入单条 JSON。使用 `site_pages` 和 `site_page_translations` 管理页面状态、slug、SEO 与模块内容。

## 14. 发布与审核

建议状态流：

`draft → review → published → archived`

- 产品参数、安装步骤和安全提示必须经过指定人员审核。
- 英文内容单独记录审核状态。
- 发布内容记录最后编辑与审核时间。
- 普通访客只能读取 `published` 内容。

## 15. 权限模型

角色建议：

- `admin`：账号、内容、媒体和发布管理
- `editor`：创建和编辑内容，不能管理账号
- `reviewer`：审核技术与安全内容并发布

Supabase RLS 不再以“所有 authenticated 用户均可写入”为最终方案。策略应检查管理员资料表或受控角色声明，并分别限制读取、编辑、审核与删除。

前端只使用 anon key。Service role key 不进入浏览器、仓库或 Vercel 公共构建变量。

## 16. 迁移策略

1. 备份现有 Supabase 表与 Storage 清单。
2. 新建表和字段，不删除旧表。
3. 编写只读迁移报告，识别缺失翻译、slug 和异常参数。
4. 将现有产品、图片、视频和设置复制到新结构。
5. 后台先支持双写或切换到新表。
6. 前台在预览环境验证新数据。
7. 确认无丢失后再停止旧结构写入。
8. 旧表保留一个回滚周期后再决定归档。

## 17. 验收标准

- 现有产品、图片和视频迁移后数量一致且可追溯。
- 每个已发布产品拥有唯一型号、slug 和至少一种正式语言内容。
- 中英文技术参数共享同一真实值。
- 安装与安全内容有版本、审核状态和适用型号。
- 媒体删除不会误删仍被引用的文件。
- 公开用户只能读取已发布内容。
- 只有明确角色能够修改或发布内容。


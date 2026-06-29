# Marketing Creative OS - Tài liệu kiến trúc & triển khai

## 1. Mục tiêu hệ thống

Xây dựng một hệ thống làm việc cho team Marketing dựa trên mô hình Trello, nhưng mở rộng thành một nền tảng quản lý toàn bộ vòng đời sản xuất creative:

```text
Ý tưởng → Brief → Quay/chụp → Kho media → Edit/design → Review → Launch ads → Đọc số liệu → Chấm điểm → Học lại → Tạo creative mới
```

Hệ thống không chỉ quản lý task, mà còn đo lường hiệu quả media, creative, editor, designer và ads performance.

---

## 2. Stack kỹ thuật

```text
GitHub      = Lưu source code, quản lý version, pull request
Vercel      = Deploy web app, API routes, server functions
Supabase    = Database, Auth, Realtime, Permission, Workflow data
Cloudflare R2 = Lưu trữ video, hình ảnh, audio, file raw/source
Antigravity = AI coding agent để code theo spec/milestone
```

### Vai trò từng thành phần

| Thành phần | Vai trò |
|---|---|
| Supabase | Database, authentication, user role, permission, realtime, workflow data |
| Cloudflare R2 | Object storage cho video, ảnh, audio, raw footage, thumbnail |
| GitHub | Lưu source code, quản lý version, branch, pull request |
| Vercel | Deploy app từ GitHub, chạy frontend và API routes |
| Antigravity | Agent AI hỗ trợ sinh code, refactor, test, triển khai module |

---

## 3. Kiến trúc tổng thể

```text
User / Browser
   |
   v
Vercel App: Next.js / React
   |
   |--- Supabase Auth: đăng nhập, phân quyền
   |
   |--- Supabase Postgres: task, board, card, score, metadata media
   |
   |--- Supabase Realtime: cập nhật card/comment/notification real-time
   |
   |--- Vercel API Routes / Server Functions
           |
           |--- tạo presigned upload URL cho Cloudflare R2
           |--- xử lý upload metadata
           |--- tính điểm creative/editor/designer/media
           |--- đồng bộ số liệu ads
           |
           v
Cloudflare R2: video, ảnh, audio, file raw
```

---

## 4. Nguyên tắc lưu trữ dữ liệu

Không lưu video, ảnh, audio trực tiếp trong Supabase database.

### Supabase chỉ lưu metadata

```text
asset_id
file_name
file_type
r2_bucket
r2_object_key
file_size
duration
thumbnail_url
uploaded_by
project_id
campaign_id
creative_id
quality_score
performance_score
created_at
```

### Cloudflare R2 lưu file thật

```text
/media/raw/2026/06/product-a/source-001.mp4
/media/edited/2026/06/product-a/video-ad-v1.mp4
/media/audio/voiceover/voice-001.mp3
/media/thumbs/video-ad-v1.jpg
```

---

## 5. Luồng upload video, ảnh, audio

```text
1. User chọn file trong app
2. App gọi API: POST /api/r2/presign-upload
3. Vercel kiểm tra user qua Supabase Auth
4. Vercel tạo object_key
5. Vercel tạo presigned PUT URL cho R2
6. Browser upload file trực tiếp lên R2
7. Upload xong, browser gọi API: POST /api/assets/complete
8. Vercel lưu metadata vào Supabase
9. Asset xuất hiện trong Kho Media
```

### Lưu ý bảo mật

- Browser không được giữ `R2_ACCESS_KEY_ID` hoặc `R2_SECRET_ACCESS_KEY`.
- API key R2 chỉ nằm trong server environment variables của Vercel.
- File private nên truy cập qua signed URL ngắn hạn.

---

## 6. Luồng xem video/file

### Cách 1: File public qua CDN

Dùng cho asset không nhạy cảm.

```text
Browser → Public R2 URL / Custom Domain
```

### Cách 2: File private qua signed URL

Dùng cho raw footage, file khách hàng, file nội bộ.

```text
1. User click xem video
2. App gọi /api/r2/presign-download
3. Server check quyền trong Supabase
4. Server trả signed URL ngắn hạn
5. Browser stream video từ R2
```

---

## 7. Cấu trúc database Supabase

## 7.1. Bảng lõi kiểu Trello

```sql
workspaces
boards
lists
cards
card_members
card_labels
card_checklists
card_comments
card_attachments
activity_logs
```

## 7.2. Bảng riêng cho marketing/media

```sql
campaigns
products
creative_briefs
media_assets
shoot_requests
video_ads
image_ads
audio_assets
ad_metrics
creative_scores
source_reviews
editor_scores
designer_scores
media_scores
competitor_ads
creative_learnings
approval_requests
notifications
```

## 7.3. Quan hệ quan trọng

```text
campaigns 1-n creative_briefs
creative_briefs 1-n cards
media_assets n-n video_ads
video_ads 1-n ad_metrics
video_ads 1-1 creative_scores
users 1-n editor_scores
users 1-n designer_scores
media_assets 1-n source_reviews
```

---

## 8. Role & phân quyền

| Role | Quyền |
|---|---|
| Owner/Admin | Toàn quyền |
| Marketing Lead | Duyệt campaign, xem dashboard |
| Ads Buyer | Tạo brief, nhập ads metrics, xem performance |
| Media Lead | Quản lý kho media, lịch quay |
| Shooter/Media | Upload source, xem task quay |
| Editor | Nhận task edit, chấm source |
| Designer | Nhận task design, chấm source |
| Reviewer | Duyệt creative |
| Viewer | Chỉ xem |

### Quy tắc bảo mật

- Bật Row Level Security cho tất cả bảng business.
- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra browser.
- Chỉ dùng `SUPABASE_ANON_KEY` ở client khi đã bật RLS.
- Service role chỉ dùng trong Vercel API Route hoặc server-side job.

---

## 9. Cấu trúc project đề xuất

```text
mkt-workos/
  app/
    dashboard/
    boards/
    media-library/
    creative-briefs/
    video-ads/
    campaigns/
    rankings/
    settings/
    api/
      r2/
        presign-upload/route.ts
        presign-download/route.ts
      assets/
        complete/route.ts
      scores/
        creative/route.ts
        editor/route.ts
        designer/route.ts
      ads/
        import-meta/route.ts
        import-tiktok/route.ts
  components/
    boards/
    cards/
    media/
    video-player/
    scoring/
    dashboards/
  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
    r2/
      client.ts
      presign.ts
    scoring/
      creative-score.ts
      people-score.ts
      media-source-score.ts
    auth/
      permissions.ts
  supabase/
    migrations/
    seed.sql
  docs/
    PRD.md
    DATABASE_SCHEMA.md
    API_SPEC.md
    AGENTS.md
```

---

## 10. Biến môi trường trên Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=

DATABASE_URL=

META_ADS_ACCESS_TOKEN=
TIKTOK_ADS_ACCESS_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=

APP_URL=
```

### Lưu ý

- Biến có tiền tố `NEXT_PUBLIC_` có thể dùng ở client.
- Các biến như `SUPABASE_SERVICE_ROLE_KEY`, `R2_SECRET_ACCESS_KEY`, ads token chỉ dùng ở server.
- Không commit `.env` lên GitHub.

---

## 11. API routes quan trọng

```text
POST /api/r2/presign-upload
POST /api/r2/presign-download
POST /api/assets/complete
GET  /api/assets
POST /api/cards
PATCH /api/cards/:id
POST /api/creative-briefs
POST /api/video-ads
POST /api/ad-metrics/import
POST /api/scores/recalculate
GET  /api/rankings/editors
GET  /api/rankings/designers
GET  /api/dashboard/creative-performance
```

---

## 12. Module chức năng chính

## 12.1. Task Management Core

Tính năng giống Trello:

- Workspace
- Board
- List
- Card
- Drag & drop
- Checklist
- Comment
- Attachment
- Label
- Deadline
- Member
- Activity log
- Custom field
- Automation
- Notification

## 12.2. Media Library

Kho media dùng để lưu và quản lý:

- Raw video
- Edited video
- Image
- Audio
- Thumbnail
- Voiceover
- Music
- Design source
- Final creative

Tính năng:

- Upload trực tiếp lên R2
- Lưu metadata vào Supabase
- Preview video/image/audio
- Tag/filter/search
- Chấm điểm source
- Gắn source với video ads
- Gắn source với campaign/product
- Theo dõi source đã dùng ở ads nào
- Đánh dấu winning source

## 12.3. Creative Brief

Brief gồm:

- Product/SKU
- Campaign
- Audience
- Pain point
- Hook
- Angle
- Offer
- CTA
- Platform
- Deadline
- Yêu cầu media
- Yêu cầu editor
- Yêu cầu designer
- Checklist launch

## 12.4. Video Ads Library

Quản lý:

- Video final
- Version V1/V2/V3
- Thumbnail
- Hook
- Angle
- Offer
- CTA
- Platform
- Editor
- Designer
- Source media
- Approval status
- Launch status
- Ads metrics
- Creative score

## 12.5. Ads Performance Intelligence

Tính năng:

- Import số liệu ads thủ công bằng CSV
- Sau đó tích hợp Meta/TikTok/Google Ads API
- Tính CTR, CPC, CPM, CVR, CPA, ROAS
- Tính thumbstop rate, hold rate, watch time
- Chấm điểm creative
- Phát hiện winner
- Phát hiện creative fatigue
- Gợi ý remake

## 12.6. People Ranking

Chấm điểm:

- Editor
- Designer
- Media/Shooter
- Reviewer
- Ads buyer

Mục tiêu:

- Coaching
- Phân bổ task
- Tìm người mạnh theo từng loại creative
- Xác định bottleneck
- Tạo hệ thống bonus công bằng hơn

---

## 13. Công thức chấm điểm Creative

```text
Creative Score =
20% CTR
+ 15% Thumbstop Rate
+ 15% Hold Rate
+ 15% CPA Efficiency
+ 15% CVR
+ 20% ROAS
```

### Phân loại điểm

| Score | Nhãn |
|---:|---|
| 90-100 | Winner |
| 75-89 | Strong Creative |
| 60-74 | Có tiềm năng remake |
| 40-59 | Chỉ dùng để học insight |
| <40 | Loại / không scale |

### Code mẫu

```ts
type CreativeMetricInput = {
  ctr: number
  cvr: number
  cpa: number
  roas: number
  thumbstopRate: number
  holdRate: number
  spend: number
}

export function calculateCreativeScore(input: CreativeMetricInput) {
  const ctrScore = normalizeHigherBetter(input.ctr, 0.5, 3.5)
  const cvrScore = normalizeHigherBetter(input.cvr, 0.5, 5)
  const roasScore = normalizeHigherBetter(input.roas, 0.8, 4)
  const thumbstopScore = normalizeHigherBetter(input.thumbstopRate, 10, 40)
  const holdScore = normalizeHigherBetter(input.holdRate, 5, 35)
  const cpaScore = normalizeLowerBetter(input.cpa, 300000, 50000)

  return Math.round(
    ctrScore * 0.2 +
    thumbstopScore * 0.15 +
    holdScore * 0.15 +
    cpaScore * 0.15 +
    cvrScore * 0.15 +
    roasScore * 0.2
  )
}
```

---

## 14. Công thức chấm điểm Editor

| Nhóm điểm | Tỷ trọng |
|---|---:|
| Performance creative đã chạy | 40% |
| Chất lượng dựng | 25% |
| Đúng deadline | 15% |
| Ít vòng sửa | 10% |
| Chủ động đề xuất | 10% |

### Chỉ số theo dõi

- Số creative hoàn thành
- Số creative thành winner
- CTR trung bình
- Hold rate trung bình
- ROAS trung bình
- Số vòng sửa trung bình
- Tỷ lệ đúng deadline
- Điểm review nội bộ

---

## 15. Công thức chấm điểm Designer

| Nhóm điểm | Tỷ trọng |
|---|---:|
| CTR / thumbnail performance | 35% |
| Brand fit | 20% |
| Visual clarity | 20% |
| Đúng deadline | 15% |
| Ít vòng sửa | 10% |

### Chỉ số theo dõi

- CTR trung bình theo thumbnail/banner
- Số creative được approve
- Số creative thành winner
- Tỷ lệ đúng guideline
- Số vòng sửa trung bình
- Tỷ lệ đúng deadline

---

## 16. Công thức chấm điểm Media Source

| Nhóm điểm | Tỷ trọng |
|---|---:|
| Kỹ thuật quay/chụp | 25% |
| Dễ edit/design | 25% |
| Hiệu quả khi dùng trong ads | 30% |
| Khả năng tái sử dụng | 20% |

### Tiêu chí editor/designer chấm source

- Độ nét
- Ánh sáng
- Bố cục
- Âm thanh
- Biểu cảm
- Product visibility
- Hook potential
- Editing flexibility
- Brand fit
- Reuse potential

---

## 17. Database schema mẫu

## 17.1. `media_assets`

```sql
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  campaign_id uuid,
  product_id uuid,
  uploaded_by uuid not null,

  file_name text not null,
  file_type text not null,
  mime_type text,
  file_size bigint,
  duration_seconds numeric,

  r2_bucket text not null,
  r2_object_key text not null,
  r2_public_url text,
  thumbnail_object_key text,

  asset_type text check (asset_type in ('raw_video', 'edited_video', 'image', 'audio', 'thumbnail', 'document')),
  status text default 'active',

  technical_score numeric default 0,
  editability_score numeric default 0,
  performance_score numeric default 0,
  reuse_score numeric default 0,
  total_quality_score numeric default 0,

  tags text[] default '{}',
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 17.2. `video_ads`

```sql
create table video_ads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  campaign_id uuid,
  product_id uuid,
  brief_id uuid,
  editor_id uuid,
  designer_id uuid,

  title text not null,
  version text default 'v1',
  hook text,
  angle text,
  offer text,
  cta text,
  platform text,
  funnel_stage text,

  final_asset_id uuid,
  thumbnail_asset_id uuid,

  approval_status text default 'draft',
  launch_status text default 'not_launched',

  creative_score numeric default 0,
  internal_review_score numeric default 0,
  performance_score numeric default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 17.3. `ad_metrics`

```sql
create table ad_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  video_ad_id uuid,
  campaign_id uuid,

  platform text not null,
  external_campaign_id text,
  external_adset_id text,
  external_ad_id text,

  date date not null,
  spend numeric default 0,
  impressions numeric default 0,
  clicks numeric default 0,
  ctr numeric default 0,
  cpc numeric default 0,
  cpm numeric default 0,
  conversions numeric default 0,
  cvr numeric default 0,
  cpa numeric default 0,
  revenue numeric default 0,
  roas numeric default 0,
  thumbstop_rate numeric default 0,
  hold_rate numeric default 0,
  watch_time numeric default 0,

  created_at timestamptz default now()
);
```

---

## 18. Tính năng sáng tạo nên thêm

## 18.1. Creative DNA Library

Mỗi ads được gắn DNA:

- Hook type
- Angle
- Offer
- CTA
- Visual style
- Audience
- Funnel stage
- Product/SKU
- Platform

Mục tiêu: tìm công thức creative thắng theo từng sản phẩm.

## 18.2. Winning Formula Finder

Hệ thống tự tìm pattern:

- Hook nào tạo CTR tốt
- Angle nào tạo ROAS tốt
- Thumbnail nào giữ CTR cao
- Video độ dài nào có CPA tốt
- Source nào tạo ra nhiều winner

## 18.3. Creative Fatigue Alert

Cảnh báo khi:

- CTR giảm liên tục
- CPM tăng
- CPA tăng
- Frequency cao
- ROAS giảm
- Comment tiêu cực tăng

## 18.4. Remake Engine

Từ một ads thắng, hệ thống tự tạo task remake:

- Đổi hook
- Đổi CTA
- Đổi thumbnail
- Đổi opening scene
- Đổi text overlay
- Đổi voiceover
- Cắt bản 15s
- Chuyển thành image ads

## 18.5. Brief Generator

Ads team nhập:

- Sản phẩm
- Mục tiêu
- Audience
- Pain point
- Offer
- Platform
- Deadline

Hệ thống tạo brief cho media, editor, designer, copywriter.

## 18.6. Shot List Builder

Tự tạo danh sách cảnh cần quay:

- Cận sản phẩm
- Người dùng sản phẩm
- Before-after
- Problem scene
- Reaction scene
- Unboxing
- Testimonial
- Lifestyle
- Comparison
- CTA shot

## 18.7. Creative Review Room

Tính năng:

- Xem video
- Comment theo timestamp
- So sánh version
- Chọn lý do reject
- Chấm điểm nhanh
- Approve bằng 1 click
- Tự tạo task sửa nếu bị reject

## 18.8. Ads Learning Board

Sau mỗi test ads, ghi lại:

- Cái gì thắng
- Cái gì thua
- Vì sao thắng/thua
- Hành động tiếp theo
- Ai cần biết

## 18.9. Competitor Swipe File

Lưu ads đối thủ:

- Link ads
- Screenshot/video
- Brand
- Product
- Hook
- Offer
- CTA
- Format
- Nhận xét
- Có nên clone angle không

## 18.10. Product Creative Health

Dashboard theo sản phẩm:

- Số creative đã làm
- Số creative đang live
- Số winner
- Best hook
- Best angle
- Best editor/designer
- Best source media
- ROAS trung bình theo format
- Nhu cầu quay/chụp thêm

---

## 19. Automation nên có

- Khi task chuyển sang Review → tag leader duyệt.
- Khi bị reject → tự tạo checklist sửa.
- Khi quá deadline → nhắc người phụ trách và leader.
- Khi creative được approve → chuyển sang Ready to Launch.
- Khi ads metrics được import → tự tính Creative Score.
- Khi creative đạt Winner → lưu vào Winning Library.
- Khi CTR giảm hoặc CPA tăng → tạo task remake.
- Khi source media được chấm thấp → báo media team cần quay lại.
- Khi campaign sắp launch mà thiếu creative → cảnh báo team.

---

## 20. Dashboard cần có

- MKT Overview Dashboard
- Creative Performance Dashboard
- Media Quality Dashboard
- Editor Ranking Dashboard
- Designer Ranking Dashboard
- Winning Ads Dashboard
- Creative Fatigue Dashboard
- Product Creative Health Dashboard
- Campaign Launch Dashboard
- Weekly Learning Dashboard
- Bottleneck Dashboard

---

## 21. Roadmap triển khai

## Phase 1: Nền móng

1. Tạo Next.js project.
2. Kết nối Supabase.
3. Tạo Auth.
4. Tạo bảng `profiles`, `workspaces`, `workspace_members`.
5. Tạo RLS.
6. Tạo layout dashboard.
7. Deploy lên Vercel từ GitHub.

## Phase 2: Trello Core

1. Board.
2. List.
3. Card.
4. Drag & drop.
5. Checklist.
6. Comment.
7. Label.
8. Member.
9. Activity log.
10. Deadline.

## Phase 3: Media Library + R2

1. Tạo bucket R2.
2. Tạo API presign upload.
3. Upload video/ảnh/audio trực tiếp lên R2.
4. Lưu metadata vào Supabase.
5. Gallery view.
6. Video preview.
7. Tag/filter/search.
8. Chấm điểm source.

## Phase 4: Creative Workflow

1. Creative brief.
2. Shoot request.
3. Link source media vào task.
4. Video ads versioning.
5. Approval flow.
6. Review comment.
7. Ready to launch status.

## Phase 5: Scoring

1. Creative score.
2. Media source score.
3. Editor score.
4. Designer score.
5. Ranking dashboard.
6. Product creative health dashboard.

## Phase 6: Ads Intelligence

1. Import số liệu ads thủ công bằng CSV.
2. Tích hợp Meta/TikTok/Google API.
3. Fatigue alert.
4. Winning ads library.
5. Remake engine.
6. Weekly learning report.

---

## 22. File `AGENTS.md` đề xuất cho Antigravity

```md
# AGENTS.md

## Project
Build a Marketing Creative OS similar to Trello, extended for media production, video ads, creative scoring, editor/designer rankings, and ads performance intelligence.

## Stack
- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Cloudflare R2 for video/image/audio storage
- Vercel deployment
- GitHub repository

## Architecture Rules
1. Supabase stores metadata and business data only.
2. Cloudflare R2 stores actual files: video, image, audio, raw footage.
3. Browser must never access R2 secret keys.
4. Upload/download to R2 must use presigned URLs generated by server API routes.
5. Supabase service role key must never be exposed to client.
6. All business tables must use RLS.
7. Every feature must include permission checks.
8. Build modular code: lib/supabase, lib/r2, lib/scoring, components.

## Core Modules
1. Workspace, board, list, card, checklist, comment, label.
2. Media Library with asset upload, preview, tags, score.
3. Creative Briefs.
4. Video Ads Library.
5. Ads Metrics Import.
6. Creative Score.
7. Editor Ranking.
8. Designer Ranking.
9. Media Source Score.
10. Dashboard.

## Coding Requirements
- Use TypeScript.
- Use Zod for request validation.
- Use server-side API routes for sensitive logic.
- Add error handling.
- Add loading states.
- Add empty states.
- Add audit logs for important actions.
- Add tests for scoring functions.
```

---

## 23. Prompt đầu tiên nên giao cho Antigravity

```md
Build the foundation of a Marketing Creative OS.

Stack:
- Next.js App Router
- TypeScript
- Supabase Auth + Postgres + RLS
- Cloudflare R2 for file storage
- Vercel deployment

First milestone:
1. Create project structure.
2. Add Supabase client/server/admin clients.
3. Add Cloudflare R2 S3 client.
4. Create database migrations for:
   - profiles
   - workspaces
   - workspace_members
   - boards
   - lists
   - cards
   - media_assets
5. Add RLS policies for workspace-based access.
6. Build dashboard layout.
7. Build media library page.
8. Implement /api/r2/presign-upload.
9. Implement /api/assets/complete.
10. Add a simple file upload UI that uploads directly to R2 and saves metadata to Supabase.
11. Add clear error handling and permission checks.
```

---

## 24. Checklist bảo mật bắt buộc

- [ ] Bật RLS cho mọi bảng business.
- [ ] Không commit `.env` lên GitHub.
- [ ] Thêm `.env.local` vào `.gitignore`.
- [ ] R2 key chỉ nằm ở Vercel Environment Variables.
- [ ] Supabase service role chỉ dùng ở server.
- [ ] Upload file qua presigned URL.
- [ ] Validate file type trước khi upload.
- [ ] Validate file size trước khi upload.
- [ ] Check workspace permission trước khi tạo presigned URL.
- [ ] Tạo audit log cho upload, delete, approve, score update.
- [ ] Không cho user xóa file R2 trực tiếp.
- [ ] Dùng signed URL ngắn hạn cho file private.

---

## 25. Kết luận kiến trúc

Kiến trúc cuối cùng nên là:

```text
GitHub = code
Vercel = app + API
Supabase = database + auth + permission + realtime
Cloudflare R2 = media storage
Antigravity = agent code theo spec
```

Điểm cần làm đúng ngay từ đầu là tách file thật khỏi metadata:

- File nặng nằm ở Cloudflare R2.
- Supabase chỉ lưu đường dẫn, quyền, trạng thái, điểm số, quan hệ với campaign/task/creative.
- Vercel giữ vai trò trung gian bảo mật để tạo signed URL, xử lý API và deploy app.

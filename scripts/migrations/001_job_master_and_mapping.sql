-- ============================================================
-- Migration: 정비항목 마스터 테이블 + 매핑 캐시 + estimate_items 확장
-- ============================================================

-- 1. maintenance_job_master: 정비항목 마스터 (160개 표준 항목)
CREATE TABLE IF NOT EXISTS public.maintenance_job_master (
  job_id TEXT PRIMARY KEY,
  job_name_raw TEXT NOT NULL,
  job_name_norm TEXT NOT NULL,
  system_type TEXT,
  area TEXT,
  component_group TEXT,
  position_side TEXT,
  axle_or_row TEXT,
  quantity_type TEXT,
  work_type TEXT,
  labor_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. job_mapping_cache: OCR 텍스트 → 마스터 항목 매핑 캐시 (학습용)
CREATE TABLE IF NOT EXISTS public.job_mapping_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ocr_text_normalized TEXT NOT NULL,
  master_job_id TEXT NOT NULL REFERENCES public.maintenance_job_master(job_id),
  confidence FLOAT DEFAULT 1.0,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ocr_text_normalized, master_job_id)
);

-- 3. estimate_items 확장: 매핑된 마스터 항목 ID 저장
ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS master_job_id TEXT REFERENCES public.maintenance_job_master(job_id);

ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS mapping_confidence FLOAT;

ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS mapping_method TEXT;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_job_mapping_cache_ocr_text
  ON public.job_mapping_cache(ocr_text_normalized);

CREATE INDEX IF NOT EXISTS idx_estimate_items_master_job_id
  ON public.estimate_items(master_job_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_job_master_system_type
  ON public.maintenance_job_master(system_type);

CREATE INDEX IF NOT EXISTS idx_maintenance_job_master_labor_category
  ON public.maintenance_job_master(labor_category);

-- 5. RLS (Read-only for anon, full for authenticated)
ALTER TABLE public.maintenance_job_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_job_master_read_all"
  ON public.maintenance_job_master FOR SELECT
  USING (true);

ALTER TABLE public.job_mapping_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_mapping_cache_read_all"
  ON public.job_mapping_cache FOR SELECT
  USING (true);

CREATE POLICY "job_mapping_cache_insert_authenticated"
  ON public.job_mapping_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "job_mapping_cache_update_authenticated"
  ON public.job_mapping_cache FOR UPDATE
  USING (true);

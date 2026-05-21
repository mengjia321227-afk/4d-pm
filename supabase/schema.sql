-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dimension TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ongoing', 'completed', 'delayed')),
  progress INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2')),
  stakeholders JSONB DEFAULT '[]',
  developers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建版本表
CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'developing', 'testing', 'released', 'deprecated')),
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建需求表
CREATE TABLE IF NOT EXISTS demands (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2')),
  category TEXT NOT NULL,
  creator TEXT NOT NULL DEFAULT '未知',
  create_date TEXT NOT NULL,
  remark TEXT DEFAULT '',
  images JSONB DEFAULT '[]',
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  version_id TEXT REFERENCES versions(id) ON DELETE SET NULL,
  schedule_start TEXT,
  schedule_end TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建进度日志表
CREATE TABLE IF NOT EXISTS progress_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 Row Level Security（可选，如果需要用户认证）
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名访问的策略（公开读写）
CREATE POLICY "Allow all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON demands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON progress_logs FOR ALL USING (true) WITH CHECK (true);

-- 创建实时订阅（可选）
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE versions;
ALTER PUBLICATION supabase_realtime ADD TABLE demands;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_logs;

import re

with open("src/app/admin/page.tsx", "r") as f:
    content = f.read()

# Add useRouter and LogOut icon to imports
content = content.replace(
    'import React, { useState, useEffect, useMemo } from "react";',
    'import React, { useState, useEffect, useMemo } from "react";\nimport { useRouter } from "next/navigation";'
)

content = content.replace(
    'Filter,\n} from "lucide-react";',
    'Filter,\n  LogOut,\n  Loader2,\n} from "lucide-react";'
)

# Add auth check inside AdminPage component
old_start = 'export default function AdminPage() {\n  const [locations, setLocations] = useState<CctvLocation[]>([]);'
new_start = '''export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<CctvLocation[]>([]);'''

content = content.replace(old_start, new_start)

# Add session check hook
auth_check_code = '''  // Verify session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchLocations();
        } else {
          router.replace("/admin/login");
        }
      } catch (err) {
        router.replace("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (e) {
      router.replace("/admin/login");
    }
  };
'''

content = content.replace(
    '  useEffect(() => {\n    fetchLocations();\n  }, []);',
    auth_check_code
)

# Add Logout button and User badge to header
header_btn_old = '''          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah CCTV Baru</span>
          </button>
        </div>
      </header>'''

header_btn_new = '''          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah CCTV Baru</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
              title="Keluar dari sesi admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>'''

content = content.replace(header_btn_old, header_btn_new)

# Add loading check before return
render_guard = '''  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Memverifikasi akses Administrator...</p>
      </div>
    );
  }

  return ('''

content = content.replace('  return (', render_guard)

with open("src/app/admin/page.tsx", "w") as f:
    f.write(content)

print("src/app/admin/page.tsx updated with auth guard and logout!")

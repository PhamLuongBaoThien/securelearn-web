import React from 'react';

export function PublicUserProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      {/* Container chính dạng 2 cột */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Cột phụ Sidebar (Bên phải trên Desktop, trên cùng ở Mobile) - lg:col-span-4 */}
        <aside className="lg:col-span-4 lg:order-2">
          <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            {/* Avatar lớn */}
            <div className="h-36 w-36 rounded-full bg-foreground/10" />

            {/* Badge Vai trò */}
            <div className="mt-5 h-6 w-20 rounded-full bg-foreground/10" />

            {/* Liên kết mạng xã hội */}
            <div className="mt-6 flex justify-center gap-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-10 rounded-full bg-foreground/10" />
              ))}
            </div>

            {/* Chỉ số giảng dạy */}
            <div className="mt-8 w-full space-y-4 rounded-2xl bg-muted/40 border border-border/30 p-5 text-left">
              <div className="h-4 w-28 rounded bg-foreground/10" />
              
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-foreground/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-16 rounded bg-foreground/10" />
                    <div className="h-3 w-24 rounded bg-foreground/10" />
                  </div>
                </div>
              ))}
            </div>

            {/* Ngày tham gia */}
            <div className="mt-6 h-4 w-36 rounded bg-foreground/10" />
          </div>
        </aside>

        {/* Cột chính - lg:col-span-8 */}
        <main className="lg:col-span-8 lg:order-1 space-y-8">
          {/* Header thông tin cá nhân */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="mx-auto lg:mx-0 h-10 w-64 rounded bg-foreground/10" />
            <div className="mx-auto lg:mx-0 h-6 w-96 rounded bg-foreground/10" />
          </div>

          {/*/ Tiểu sử */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 space-y-4">
            <div className="h-6 w-32 rounded bg-foreground/10" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-foreground/10" />
              <div className="h-4 w-full rounded bg-foreground/10" />
              <div className="h-4 w-3/4 rounded bg-foreground/10" />
            </div>
          </div>

          {/* Danh sách khóa học */}
          <div className="space-y-6">
            <div className="h-8 w-48 rounded bg-foreground/10" />
            
            {/* Grid khóa học */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm space-y-4 p-4">
                  {/*/ Thumbnail */}
                  <div className="aspect-video w-full rounded-xl bg-foreground/10" />
                  {/*/ Title & Stats */}
                  <div className="space-y-2">
                    <div className="h-5 w-full rounded bg-foreground/10" />
                    <div className="h-4 w-2/3 rounded bg-foreground/10" />
                  </div>
                  {/*/ Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-4 w-16 rounded bg-foreground/10" />
                    <div className="h-6 w-12 rounded bg-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

import { Empty } from "./shared";

const TYPE_CONFIG = {
  announcement: { bg: "bg-primary-50",  text: "text-primary-600",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  assignment:   { bg: "bg-slate-50",     text: "text-slate-700",     icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" },
  reminder:     { bg: "bg-slate-50",   text: "text-slate-600",   icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
};

function PostCard({ item }) {
  const cfg = TYPE_CONFIG[item.postType] || { bg: "bg-slate-50", text: "text-slate-500", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" };
  const publishedAt = item.createdAt ? new Date(item.createdAt) : null;
  const publishedLabel = publishedAt && !Number.isNaN(publishedAt.getTime())
    ? publishedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <article className="dn-card p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <svg className={`w-4 h-4 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{item.body}</p>
          {item.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {item.attachments.map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  {a.name || "Attachment"}
                </a>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>{item.authorName || "Faculty"}</span>
            {publishedLabel && <>&middot; <span>{publishedLabel}</span></>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StreamView({ items }) {
  if (!items || items.length === 0) {
    return <Empty title="No activity" body="Posts and announcements from faculty will appear here." icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />;
  }
  return (
    <section className="space-y-3" aria-label="Activity stream">
      {items.map((item) => <PostCard key={item.id} item={item} />)}
    </section>
  );
}

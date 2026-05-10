import { memo } from "react";
import { Megaphone, FileText, Bell, ExternalLink } from "lucide-react";
import { Empty } from "./shared";
import { cn } from "../lib/utils";

const TYPE_CONFIG = {
  announcement: { icon: Megaphone, tone: "text-danilo-primary bg-danilo-primary-subtle border border-danilo-primary/10" },
  assignment:   { icon: FileText,  tone: "text-danilo-text-secondary bg-danilo-surface-hover border border-danilo-border" },
  reminder:     { icon: Bell,      tone: "text-danilo-text-muted bg-danilo-bg border border-danilo-border" },
};

const PostCard = memo(function PostCard({ item }) {
  const cfg = TYPE_CONFIG[item.postType] || TYPE_CONFIG.reminder;
  const Icon = cfg.icon;
  const publishedAt = item.createdAt ? new Date(item.createdAt) : null;
  const publishedLabel = publishedAt && !Number.isNaN(publishedAt.getTime())
    ? publishedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <article className="dn-card p-4 dn-card-hover">
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.tone)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-danilo-text leading-snug">{item.title}</p>
          {item.body && (
            <p className="text-sm text-danilo-text-secondary mt-1.5 leading-relaxed whitespace-pre-wrap">{item.body}</p>
          )}
          {item.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-danilo-border bg-danilo-bg px-2.5 py-1.5 text-xs font-medium text-danilo-text-secondary hover:bg-danilo-surface-hover transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-danilo-text-muted flex-shrink-0" />
                  {a.name || "Attachment"}
                </a>
              ))}
            </div>
          )}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-danilo-text-muted">
            <span className="font-medium">{item.authorName || "Faculty"}</span>
            {publishedLabel && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={item.createdAt}>{publishedLabel}</time>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

export default memo(function StreamView({ items }) {
  if (!items || items.length === 0) {
    return (
      <Empty
        title="No activity"
        body="Posts and announcements from faculty will appear here."
        icon={<Bell className="w-6 h-6 text-danilo-text-muted" />}
      />
    );
  }
  return (
    <section className="space-y-3" aria-label="Activity stream">
      {items.map((item) => <PostCard key={item.id} item={item} />)}
    </section>
  );
});

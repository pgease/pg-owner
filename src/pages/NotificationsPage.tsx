import { useNavigate } from "react-router-dom";
import { Bell, SlidersHorizontal } from "lucide-react";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, unreadCount, markAllRead, markRead } = useOwnerNotifications();

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-page-title">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated with tenant payments, dues, and requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/notifications/preferences")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Preferences
          </button>
          {unreadCount > 0 ? (
            <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#008080] px-2 py-1.5">
              Mark all as read
            </button>
          ) : null}
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/notifications/preferences")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#008080]" />
          Preferences
        </button>
        {unreadCount > 0 ? (
          <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#008080] min-h-9 px-2">
            Mark all as read
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="register-card py-16 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#E8F4F4] text-[#008080] flex items-center justify-center mx-auto mb-3">
            <Bell className="h-6 w-6" />
          </div>
          <p className="text-[16px] font-semibold text-[#18212B]">You are all caught up</p>
          <p className="mt-1 text-[14px] text-[#636363]">No alerts right now. We will list rent dues and open complaints here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(item.id);
                  navigate(item.to);
                }}
                className={cn(
                  "w-full text-left rounded-[16px] border px-4 py-3 min-h-11",
                  item.read ? "bg-white border-[#E2E6EA]" : "bg-[#E8F4F4] border-[#CCE6E6]",
                )}
              >
                <p className="text-[15px] font-semibold text-[#18212B]">{item.title}</p>
                <p className="text-[13px] text-[#636363] mt-0.5">{item.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

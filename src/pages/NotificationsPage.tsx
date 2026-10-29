import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, unreadCount, markAllRead, markRead } = useOwnerNotifications();

  return (
    <div className="max-w-xl mx-auto">
      <div className="hidden md:flex items-center justify-between mb-4">
        <h1 className="text-page-title">Notifications</h1>
        {unreadCount > 0 ? (
          <button type="button" onClick={markAllRead} className="text-sm font-medium text-[#008080]">
            Mark all as read
          </button>
        ) : null}
      </div>

      <div className="md:hidden flex justify-end mb-3">
        {unreadCount > 0 ? (
          <button type="button" onClick={markAllRead} className="text-sm font-medium text-[#008080] min-h-11 px-2">
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

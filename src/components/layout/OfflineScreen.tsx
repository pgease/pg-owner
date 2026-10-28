import { useEffect, useState } from "react";

export function OfflineScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white px-8 text-center">
      <p className="text-[20px] font-semibold text-[#18212B]">No internet connection</p>
      <p className="mt-2 text-[14px] text-[#636363]">Check your network and try again.</p>
      <button
        type="button"
        onClick={() => setOnline(navigator.onLine)}
        className="mt-6 h-[60px] w-full max-w-[358px] rounded-[46px] bg-[#008080] text-white text-[16px] font-medium"
      >
        Retry
      </button>
    </div>
  );
}

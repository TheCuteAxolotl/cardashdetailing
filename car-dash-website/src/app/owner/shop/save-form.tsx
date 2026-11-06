"use client";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type SaveResult = { ok: boolean; created: boolean; message: string };
export default function SaveForm({
  save,
  children,
  className,
}: {
  save: (data: FormData) => Promise<SaveResult>;
  children: ReactNode;
  className: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className={className}
      aria-busy={pending}
      onSubmit={async (event) => {
        event.preventDefault();
        if (lock.current) return;
        const data = new FormData(event.currentTarget);
        lock.current = true;
        setPending(true);
        setMessage("Saving…");
        try {
          const result = await save(data);
          setMessage(result.message);
          if (result.created) router.push("/owner/shop");
        } catch {
          setMessage(
            "Could not reach the shop. Your entries are still here. Try again.",
          );
        } finally {
          lock.current = false;
          setPending(false);
        }
      }}
    >
      {children}
      <p role="status">{message}</p>
    </form>
  );
}

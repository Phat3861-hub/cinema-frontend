"use client";

import { Search, UserSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/i18n";

/** No paginated user list on the backend yet (backend context "Bước tiếp theo" §5) → look a user up by id. */
export function AdminUsersScreen() {
  const t = useT();
  const router = useRouter();
  const [id, setId] = useState("");
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = id.trim();
    if (!/^\d+$/.test(value) || Number(value) <= 0) return setError(t.admin.users.idInvalid);
    router.push(ROUTES.admin.userDetail(value));
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Alert tone="info">{t.admin.users.listSoon}</Alert>
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-black">
            <UserSearch aria-hidden className="size-6" />
          </span>
          <div>
            <h2 className="text-h8">{t.admin.users.lookupTitle}</h2>
            <p className="text-sm font-medium text-fg-muted">{t.admin.users.lookupHint}</p>
          </div>
        </div>
        <form noValidate onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <TextField
              label={t.admin.users.userId}
              inputMode="numeric"
              placeholder="1"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError(undefined);
              }}
              error={error}
            />
          </div>
          <Button type="submit" className="sm:mt-7">
            <Search aria-hidden className="size-4" />
            {t.common.search}
          </Button>
        </form>
      </Card>
    </div>
  );
}

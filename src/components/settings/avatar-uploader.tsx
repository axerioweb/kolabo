"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { removeAvatar, uploadAvatar } from "@/app/actions/account";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/** Profile photo (creator) / logo (company) upload with instant preview. */
export function AvatarUploader({
  current,
  name,
  company,
}: {
  current: string | null;
  name: string;
  company?: boolean;
}) {
  const t = useTranslations("settings.avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("errorType"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("errorSize"));
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await uploadAvatar(fd);
      if (!res.ok) {
        setPreview(current);
        setError(t("errorUpload"));
      } else if (res.url) {
        setPreview(res.url);
      }
      URL.revokeObjectURL(local);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: previews can't go through next/image
          <img
            src={preview}
            alt={name}
            className={`h-20 w-20 object-cover ${company ? "rounded-2xl" : "rounded-full"} ${pending ? "opacity-60" : ""}`}
          />
        ) : (
          <Avatar name={name} size={80} company={company} />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {pending ? t("uploading") : preview ? t("change") : company ? t("uploadLogo") : t("upload")}
          </Button>
          {preview && !pending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await removeAvatar();
                  setPreview(null);
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              {t("remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">{t("hint")}</p>
        {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={company ? t("uploadLogo") : t("upload")}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Undo2, Wand2 } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import { imageGenControllerRewriteDescription } from "@/lib/api/generated/endpoints/image-gen/image-gen";
import { uploadPhoto, dataUrlToBlob } from "@/lib/api/upload";

export interface DescriptionPhoto {
  id: string;
  url: string;
  key?: string;
}

export function FixDescriptionButton({
  photo,
  name,
  text,
  onResult,
  onPhotoStored,
  disabled,
}: {
  photo?: DescriptionPhoto;
  name?: string;
  text: string;
  onResult: (text: string) => void;
  onPhotoStored?: (photoId: string, key: string) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const [revision, setRevision] = useState<{
    before: string;
    after: string;
  } | null>(null);

  const canUndo = revision !== null && text === revision.after;

  const run = async () => {
    if (!photo) {
      toast.error(t("ai.description.needPhoto"));
      return;
    }

    setBusy(true);
    try {
      let key = photo.key;
      if (!key) {
        key = await uploadPhoto(dataUrlToBlob(photo.url));
        onPhotoStored?.(photo.id, key);
      }

      const before = text;
      const result = (await imageGenControllerRewriteDescription({
        photoKey: key,
        text,
        name: name?.trim() || undefined,
      })) as unknown as { text: string };

      onResult(result.text);
      setRevision({ before, after: result.text });
      toast.success(t("ai.description.done"));
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "ai.description.failed"));
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (!revision) return;
    onResult(revision.before);
    setRevision(null);
  };

  return (
    <div className="flex items-center gap-1.5">
      {canUndo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={undo}
        >
          <Undo2 className="size-3.5" />
          {t("ai.description.undo")}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={run}
        disabled={busy || disabled}
        title={t("ai.description.hint")}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
        {t("ai.description.action")}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/shared/rating-stars";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import { useSaveReview, type ReviewTarget } from "@/lib/api/reviews";
import type { OwnReview } from "@/lib/api/types";

const TEXT_MAX = 2000;

/**
 * Написать или поправить свой отзыв.
 *
 * Диалог управляемый: открывает его карточка отзывов — там же решается, звать
 * ли сначала вход. Своя кнопка внутри означала бы две точки входа в одно и то
 * же состояние.
 */
export function ReviewFormDialog({
  open,
  onOpenChange,
  target,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReviewTarget;
  /** Прежний отзыв — тогда форма правит его, а не создаёт второй. */
  existing?: OwnReview | null;
}) {
  const { t } = useT();

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRating(existing?.rating ?? 0);
      setText(existing?.text ?? "");
    }
  }

  const save = useSaveReview(target, existing?.id);

  const submit = async () => {
    if (rating < 1) {
      toast.error(t("reviews.form.ratingRequired"));
      return;
    }
    try {
      await save.mutateAsync({ rating, text });
      toast.success(t("reviews.form.sent"));
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "reviews.form.failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(existing ? "reviews.form.editTitle" : "reviews.form.title")}
          </DialogTitle>
          <DialogDescription>{t("reviews.form.moderated")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-1 py-1">
          <RatingInput
            value={rating}
            onChange={setRating}
            disabled={save.isPending}
            labels={[1, 2, 3, 4, 5].map((n) => t(`reviews.scale.${n}`))}
          />
          <span className="h-5 text-sm text-muted-foreground">
            {rating > 0 ? t(`reviews.scale.${rating}`) : ""}
          </span>
        </div>

        <div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX))}
            placeholder={t("reviews.form.placeholder")}
            rows={5}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground tabular">
            {text.length} / {TEXT_MAX}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {t("reviews.form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

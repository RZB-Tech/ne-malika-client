"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoDropzone, type UploadedPhoto } from "./photo-dropzone";
import { useT } from "@/components/providers/i18n-provider";

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular">
        {index}
      </span>
      <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>
    </div>
  );
}

export function AddProductForm() {
  const { t } = useT();
  const router = useRouter();
  const [specs, setSpecs] = useState<{ name: string; value: string }[]>([
    { name: "", value: "" },
  ]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [price, setPrice] = useState("");

  // Keep only digits, group thousands with spaces: "419900" → "419 900".
  const onPriceChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setPrice(digits ? Number(digits).toLocaleString("ru-RU") : "");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("seller.add.publish"), {
      description: t("moderation.moderation"),
    });
    router.push("/seller/products");
  };

  const field = "space-y-1.5";

  return (
    <form onSubmit={(e) => submit(e)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.add.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("seller.add.subtitle")}</p>
        </div>
      </div>

      {/* Section 1 */}
      <Card className="p-6">
        <SectionTitle index={1}>{t("seller.add.section1")}</SectionTitle>
        <div className="grid gap-5">
          <div className={field}>
            <Label htmlFor="name">{t("seller.add.name")}</Label>
            <Input id="name" required placeholder={t("seller.add.namePlaceholder")} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className={field}>
              <Label htmlFor="brand">{t("seller.add.brand")}</Label>
              <Input id="brand" placeholder="NVIDIA" />
            </div>
            <div className={field}>
              <Label htmlFor="model">{t("seller.add.model")}</Label>
              <Input id="model" placeholder="RTX 4070" />
            </div>
          </div>

          <div className={field}>
            <Label htmlFor="desc">{t("seller.add.description")}</Label>
            <Textarea id="desc" rows={4} placeholder={t("seller.add.descriptionPlaceholder")} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className={field}>
              <Label htmlFor="price">{t("seller.add.price")}, {t("common.currency")}</Label>
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="419 900"
                className="tabular"
              />
            </div>
            <div className={field}>
              <Label>{t("seller.add.condition")}</Label>
              <Select>
                <SelectTrigger className="h-8 w-full px-2.5 py-1 text-base font-normal md:text-sm dark:hover:bg-input/30">
                  <SelectValue placeholder={t("seller.add.conditionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("seller.add.conditionNew")}</SelectItem>
                  <SelectItem value="used">{t("seller.add.conditionUsed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: specs */}
      <Card className="p-6">
        <SectionTitle index={2}>{t("seller.add.section2")}</SectionTitle>
        <div className="space-y-3">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input
                placeholder={t("seller.add.specName")}
                value={s.name}
                onChange={(e) =>
                  setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <Input
                placeholder={t("seller.add.specValue")}
                value={s.value}
                onChange={(e) =>
                  setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setSpecs((arr) => (arr.length > 1 ? arr.filter((_, j) => j !== i) : arr))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => setSpecs((arr) => [...arr, { name: "", value: "" }])}
        >
          <Plus className="size-4" />
          {t("seller.add.addSpec")}
        </Button>
      </Card>

      {/* Section 3: photos */}
      <Card className="p-6">
        <SectionTitle index={3}>{t("seller.add.section3")}</SectionTitle>
        <PhotoDropzone photos={photos} onChange={setPhotos} />
      </Card>

      <div className="flex flex-wrap justify-end gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <Button type="submit" className="gap-2">
          <Send className="size-4" />
          {t("seller.add.publish")}
        </Button>
      </div>
    </form>
  );
}

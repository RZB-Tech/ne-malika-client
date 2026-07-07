"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Save, Send, Trash2 } from "lucide-react";
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
import { categories, getCategory, type Availability } from "@/lib/data";

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
  const { t, locale } = useT();
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [specs, setSpecs] = useState<{ name: string; value: string }[]>([
    { name: "", value: "" },
  ]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const subcats = category ? getCategory(category)?.subcategories ?? [] : [];

  const submit = (e: React.FormEvent, draft = false) => {
    e.preventDefault();
    toast.success(
      draft ? t("seller.add.saveDraft") : t("seller.add.publish"),
      { description: t("moderation.moderation") },
    );
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
              <Label>{t("seller.add.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("seller.add.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name[locale]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={field}>
              <Label>{t("seller.add.subcategory")}</Label>
              <Select disabled={!subcats.length}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("seller.add.selectSubcategory")} />
                </SelectTrigger>
                <SelectContent>
                  {subcats.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name[locale]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className={field}>
              <Label htmlFor="brand">{t("seller.add.brand")}</Label>
              <Input id="brand" placeholder="NVIDIA" />
            </div>
            <div className={field}>
              <Label htmlFor="model">{t("seller.add.model")}</Label>
              <Input id="model" placeholder="RTX 4070" />
            </div>
            <div className={field}>
              <Label htmlFor="sku">{t("seller.add.sku")}</Label>
              <Input id="sku" placeholder="NV-4070-12G" />
            </div>
          </div>

          <div className={field}>
            <Label htmlFor="desc">{t("seller.add.description")}</Label>
            <Textarea id="desc" rows={4} placeholder={t("seller.add.descriptionPlaceholder")} />
          </div>

          <div className="grid gap-5 sm:grid-cols-4">
            <div className={field}>
              <Label htmlFor="price">{t("seller.add.price")}, {t("common.currency")}</Label>
              <Input id="price" type="number" inputMode="numeric" placeholder="419900" className="tabular" />
            </div>
            <div className={field}>
              <Label htmlFor="qty">{t("seller.add.quantity")}</Label>
              <Input id="qty" type="number" inputMode="numeric" placeholder="5" className="tabular" />
            </div>
            <div className={field}>
              <Label htmlFor="warranty">{t("seller.add.warranty")}</Label>
              <Input id="warranty" type="number" inputMode="numeric" placeholder="24" className="tabular" />
            </div>
            <div className={field}>
              <Label>{t("seller.add.status")}</Label>
              <Select defaultValue="in_stock">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["in_stock", "out_of_stock", "on_order"] as Availability[]).map((a) => (
                    <SelectItem key={a} value={a}>{t(`availability.${a}`)}</SelectItem>
                  ))}
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

      <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-xl border border-border bg-background/90 p-3 backdrop-blur">
        <Button type="button" variant="outline" className="gap-2" onClick={(e) => submit(e, true)}>
          <Save className="size-4" />
          {t("seller.add.saveDraft")}
        </Button>
        <Button type="submit" className="gap-2">
          <Send className="size-4" />
          {t("seller.add.publish")}
        </Button>
      </div>
    </form>
  );
}

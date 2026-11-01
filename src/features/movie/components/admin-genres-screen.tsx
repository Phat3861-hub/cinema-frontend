"use client";

import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, IconButton } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Table, TableSkeleton, Td, Th } from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/components/ui/toast";
import { adminChecks } from "@/features/admin/form-utils";
import { genreApi } from "@/features/movie/api";
import { genreLabel } from "@/features/movie/labels";
import type { Genre } from "@/features/movie/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/** Compact genre table + add / rename dialog; delete is blocked by the backend while movies use it. */
export function AdminGenresScreen() {
  const t = useT();
  const toast = useToast();
  const genres = useApi("genres", genreApi.list);
  const [editing, setEditing] = useState<Genre | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Genre | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await genreApi.remove(toDelete.id);
      toast.success(t.admin.common.deleted);
      setToDelete(null);
      genres.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{t.admin.genres.subtitle}</p>
        <Button size="md" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" />
          {t.admin.genres.add}
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        {genres.error && !genres.data ? (
          <ErrorState error={genres.error} onRetry={genres.reload} />
        ) : genres.data?.length === 0 ? (
          <EmptyState icon={Tags} title={t.admin.genres.empty} />
        ) : (
          <Table className="min-w-[480px]">
            <thead>
              <tr>
                <Th>{t.admin.genres.name}</Th>
                <Th>{t.admin.genres.displayName}</Th>
                <Th>Slug</Th>
                <Th className="text-right">{t.admin.common.actions}</Th>
              </tr>
            </thead>
            {!genres.data ? (
              <TableSkeleton columns={4} />
            ) : (
              <tbody>
                {genres.data.map((genre) => (
                  <tr key={genre.id}>
                    <Td className="font-bold text-fg">{genre.name}</Td>
                    <Td>{genreLabel(genre, t)}</Td>
                    <Td>
                      <code className="text-xs">{genre.slug}</code>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={t.common.editItem(genre.name)} onClick={() => setEditing(genre)}>
                          <Pencil aria-hidden className="size-4" />
                        </IconButton>
                        <IconButton label={t.common.deleteItem(genre.name)} tone="danger" onClick={() => setToDelete(genre)}>
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </Table>
        )}
      </Card>

      {editing !== null && (
        <GenreDialog
          genre={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            genres.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={t.admin.genres.deleteTitle}
        description={toDelete ? t.admin.genres.deleteText(toDelete.name) : undefined}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

function GenreDialog({ genre, onClose, onSaved }: { genre?: Genre; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const toast = useToast();
  const check = adminChecks(t);
  const [name, setName] = useState(genre?.name ?? "");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = check.required(name) ?? check.maxLength(name, 100);
    setError(found);
    if (found) return;
    setSaving(true);
    setFormError(null);
    try {
      if (genre) await genreApi.update(genre.id, name.trim());
      else await genreApi.create(name.trim());
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (err) {
      setFormError(err);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={genre ? t.admin.genres.edit : t.admin.genres.add}
      description={genre ? t.admin.genres.slugKept : undefined}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="genre-form" size="md" loading={saving}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="genre-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {formError !== null && <Alert tone="error">{getErrorMessage(formError, t)}</Alert>}
        <TextField
          label={t.admin.genres.name}
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          hint={t.admin.genres.nameHint}
        />
      </form>
    </Dialog>
  );
}

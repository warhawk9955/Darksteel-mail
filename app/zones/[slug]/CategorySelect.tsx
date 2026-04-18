"use client";

import { useMemo } from "react";
import type { CategoryWithGroup } from "@/lib/db/categories";

interface Props {
  categories: CategoryWithGroup[];
  takenGroupIds: ReadonlySet<string>;
  value: string; // category id
  onChange: (categoryId: string) => void;
  id?: string;
}

export default function CategorySelect({
  categories,
  takenGroupIds,
  value,
  onChange,
  id,
}: Props) {
  // Group categories by group slug for <optgroup>.
  const byGroup = useMemo(() => {
    const map = new Map<string, { name: string; groupId: string; items: CategoryWithGroup[] }>();
    for (const c of categories) {
      const key = c.group.slug;
      const bucket = map.get(key);
      if (bucket) {
        bucket.items.push(c);
      } else {
        map.set(key, { name: c.group.name, groupId: c.group.id, items: [c] });
      }
    }
    return Array.from(map.values());
  }, [categories]);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-bg border border-border text-text font-body text-sm px-3 py-2.5 focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] focus:outline-none transition"
    >
      <option value="" disabled>
        Pick a category
      </option>
      {byGroup.map((group) => {
        const taken = takenGroupIds.has(group.groupId);
        return (
          <optgroup
            key={group.groupId}
            label={taken ? `${group.name} — TAKEN` : group.name}
          >
            {group.items.map((c) => (
              <option key={c.id} value={c.id} disabled={taken}>
                {c.name}
                {taken ? " (locked for this drop)" : ""}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

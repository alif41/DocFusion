import { OrganizePageItem } from '../types';

/**
 * Re-indexes currentPageNumber (1-based) across all pages
 */
export function reindexPages(pages: OrganizePageItem[]): OrganizePageItem[] {
  return pages.map((page, index) => ({
    ...page,
    currentPageNumber: index + 1,
  }));
}

/**
 * Moves a single page from one index to another
 */
export function moveSinglePage(
  pages: OrganizePageItem[],
  fromIndex: number,
  toIndex: number
): OrganizePageItem[] {
  if (
    fromIndex < 0 ||
    fromIndex >= pages.length ||
    toIndex < 0 ||
    toIndex >= pages.length ||
    fromIndex === toIndex
  ) {
    return pages;
  }

  const result = [...pages];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  return reindexPages(result);
}

/**
 * Moves multiple selected pages to targetIndex, preserving their relative order
 */
export function moveMultiPages(
  pages: OrganizePageItem[],
  selectedIds: Set<string>,
  targetIndex: number,
  position: 'before' | 'after' = 'before'
): OrganizePageItem[] {
  if (selectedIds.size === 0) return pages;

  // Filter out the selected items in their current sequence
  const selectedItems = pages.filter((p) => selectedIds.has(p.id));
  const unselectedItems = pages.filter((p) => !selectedIds.has(p.id));

  if (selectedItems.length === pages.length || unselectedItems.length === 0) {
    return pages;
  }

  // Find target item
  const targetItem = pages[targetIndex];
  if (!targetItem) return pages;

  // If target item is itself in selected items, find reference index in unselected
  let insertIndexInUnselected = unselectedItems.findIndex((p) => p.id === targetItem.id);
  if (insertIndexInUnselected === -1) {
    // If target was one of selected, calculate target position in unselected
    const clampedTarget = Math.min(targetIndex, unselectedItems.length);
    insertIndexInUnselected = clampedTarget;
  } else if (position === 'after') {
    insertIndexInUnselected += 1;
  }

  const result = [...unselectedItems];
  result.splice(insertIndexInUnselected, 0, ...selectedItems);

  return reindexPages(result);
}

/**
 * Quick movement controls for selected pages (or single page):
 * 'first' | 'left' | 'right' | 'last'
 */
export function moveStep(
  pages: OrganizePageItem[],
  selectedIds: Set<string>,
  direction: 'first' | 'left' | 'right' | 'last'
): OrganizePageItem[] {
  if (selectedIds.size === 0 || pages.length <= 1) return pages;

  const result = [...pages];

  if (direction === 'first') {
    const selected = result.filter((p) => selectedIds.has(p.id));
    const rest = result.filter((p) => !selectedIds.has(p.id));
    return reindexPages([...selected, ...rest]);
  }

  if (direction === 'last') {
    const selected = result.filter((p) => selectedIds.has(p.id));
    const rest = result.filter((p) => !selectedIds.has(p.id));
    return reindexPages([...rest, ...selected]);
  }

  if (direction === 'left') {
    // Move each selected block left by 1 if not already at position 0
    for (let i = 1; i < result.length; i++) {
      if (selectedIds.has(result[i].id) && !selectedIds.has(result[i - 1].id)) {
        const temp = result[i];
        result[i] = result[i - 1];
        result[i - 1] = temp;
      }
    }
    return reindexPages(result);
  }

  if (direction === 'right') {
    // Move each selected block right by 1 if not already at the end
    for (let i = result.length - 2; i >= 0; i--) {
      if (selectedIds.has(result[i].id) && !selectedIds.has(result[i + 1].id)) {
        const temp = result[i];
        result[i] = result[i + 1];
        result[i + 1] = temp;
      }
    }
    return reindexPages(result);
  }

  return pages;
}

/**
 * Counts how many pages have changed position compared to original order (1, 2, 3...)
 */
export function calculateReorderedCount(pages: OrganizePageItem[]): number {
  let count = 0;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].originalPageNumber !== i + 1) {
      count++;
    }
  }
  return count;
}

/**
 * Returns array of original page numbers in their current reordered sequence
 * e.g. [2, 3, 1, 4, 5]
 */
export function getPageOrderArray(pages: OrganizePageItem[]): number[] {
  return pages.map((p) => p.originalPageNumber);
}

/**
 * Checks if current order matches the default initial 1..N order
 */
export function isOrderDefault(pages: OrganizePageItem[]): boolean {
  return pages.every((p, idx) => p.originalPageNumber === idx + 1);
}

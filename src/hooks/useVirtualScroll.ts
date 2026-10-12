import { VirtualScrollConfig, VirtualScrollResult } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  totalItems,
  onLoadMore,
  hasNextPage = false,
  loadingMore = false,
  threshold = 200,
  itemSizes,
}: VirtualScrollConfig): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Prefix sums of row heights: offsets[i] is the top of row i
  const offsets = useMemo(() => {
    if (!itemSizes) return null;
    const result = [0];
    for (const size of itemSizes) result.push(result[result.length - 1] + size);
    return result;
  }, [itemSizes]);

  // Index of the row containing pixel y (binary search over offsets)
  const indexAt = (y: number) => {
    if (!offsets) return Math.floor(y / itemHeight);
    let lo = 0;
    let hi = Math.max(0, totalItems - 1);
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= y) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  // Calculate visible range
  const visibleStartIndex = indexAt(scrollTop);
  const visibleEndIndex = offsets
    ? Math.min(indexAt(scrollTop + containerHeight) + 1, totalItems)
    : Math.min(
        visibleStartIndex + Math.ceil(containerHeight / itemHeight),
        totalItems
      );

  // Add overscan
  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(totalItems, visibleEndIndex + overscan);

  // Calculate offset for virtual scrolling
  const offsetY = offsets ? offsets[startIndex] : startIndex * itemHeight;
  const totalHeight = offsets
    ? offsets[Math.min(totalItems, offsets.length - 1)]
    : totalItems * itemHeight;

  // Handle scroll with throttling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);

      // Infinite scroll logic
      if (onLoadMore && hasNextPage && !loadingMore && !isLoadingRef.current) {
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;

        if (scrollHeight - newScrollTop - clientHeight < threshold) {
          isLoadingRef.current = true;
          onLoadMore();
        }
      }
    },
    [onLoadMore, hasNextPage, loadingMore, threshold]
  );

  // Reset loading ref when loadingMore changes
  useEffect(() => {
    if (!loadingMore) {
      isLoadingRef.current = false;
    }
  }, [loadingMore]);

  // Reset scroll position when totalItems changes significantly (like on filter change)
  const prevTotalItemsRef = useRef(totalItems);
  useEffect(() => {
    if (
      totalItems !== prevTotalItemsRef.current &&
      totalItems < prevTotalItemsRef.current
    ) {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
        setScrollTop(0);
      }
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems]);

  return {
    containerRef,
    scrollTop,
    startIndex,
    endIndex,
    visibleStartIndex,
    visibleEndIndex,
    offsetY,
    totalHeight,
    handleScroll,
  };
};

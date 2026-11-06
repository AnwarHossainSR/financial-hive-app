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
  scrollParent = "container",
}: VirtualScrollConfig): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(containerHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const isWindow = scrollParent === "window";
  const viewHeight = isWindow ? windowHeight : containerHeight;

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
    ? Math.min(indexAt(scrollTop + viewHeight) + 1, totalItems)
    : Math.min(
        visibleStartIndex + Math.ceil(viewHeight / itemHeight),
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

  // Window mode: follow the page's scroll position relative to the list
  useEffect(() => {
    if (!isWindow) return;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setScrollTop(Math.max(0, -rect.top));
      setWindowHeight(window.innerHeight);

      if (onLoadMore && hasNextPage && !loadingMore && !isLoadingRef.current) {
        if (rect.bottom - window.innerHeight < threshold) {
          isLoadingRef.current = true;
          onLoadMore();
        }
      }
    };
    // Measure once rows have rendered (also re-checks after a page loads)
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isWindow, onLoadMore, hasNextPage, loadingMore, threshold, totalItems]);

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
      !isWindow &&
      totalItems !== prevTotalItemsRef.current &&
      totalItems < prevTotalItemsRef.current
    ) {
      // The resulting scroll event updates scrollTop through handleScroll
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
    prevTotalItemsRef.current = totalItems;
  }, [totalItems, isWindow]);

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

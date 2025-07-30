import { useCallback, useEffect, useRef, useState } from "react";

interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  totalItems: number;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  loadingMore?: boolean;
  threshold?: number; // Distance from bottom to trigger load more
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  offsetY: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  totalItems,
  onLoadMore,
  hasNextPage = false,
  loadingMore = false,
  threshold = 200,
}: VirtualScrollConfig): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Calculate visible range
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight),
    totalItems
  );

  // Add overscan
  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(totalItems, visibleEndIndex + overscan);

  // Calculate offset for virtual scrolling
  const offsetY = startIndex * itemHeight;

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
    handleScroll,
  };
};

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  totalItems: number;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  loadingMore?: boolean;
  threshold?: number; // Distance from bottom to trigger load more
  /** Per-row heights for lists with mixed rows; overrides itemHeight */
  itemSizes?: number[];
}

export interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  offsetY: number;
  /** Height of all rows combined */
  totalHeight: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

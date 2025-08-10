import { useMemo } from "react";

const colorPalette = [
  "#f9f9f9", "#e0f2f1", "#e1f5fe", "#f3e5f5", "#fff9c4",
  "#ffe0b2", "#c8e6c9", "#dcedc8", "#f8bbd0", "#d1c4e9"
];

export function useColorMap(classIntervals) {
  return useMemo(() => {
    return classIntervals.reduce((map, interval, index) => {
      map[interval] = colorPalette[index % colorPalette.length];
      return map;
    }, {});
  }, [classIntervals]);
}

export default useColorMap;

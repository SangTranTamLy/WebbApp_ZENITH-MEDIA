export const blankText = () => ({ vi: "", en: "" });
export const bytes = (value: number) =>
  value >= 1e9
    ? `${(value / 1e9).toFixed(2)} GB`
    : value >= 1e6
      ? `${(value / 1e6).toFixed(1)} MB`
      : `${Math.ceil(value / 1024)} KB`;

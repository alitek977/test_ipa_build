export interface FlowLabelStyle {
  text: string;
  color: string;
  tone: "blue" | "green" | "red" | "yellow";
}

export function getFlowLabelAndStyle(
  isExport: boolean,
  t: (key: string) => string,
  theme: { success: string; error: string }
): FlowLabelStyle {
  if (isExport) {
    return {
      text: t("export"),
      color: "#12b76a",
      tone: "green",
    };
  } else {
    return {
      text: t("withdrawal"),
      color: "#f04438",
      tone: "red",
    };
  }
}

import { JSX } from "react";
import { HiMiniEquals } from "react-icons/hi2";
import {
  MdOutlineKeyboardDoubleArrowUp,
  MdOutlineKeyboardDoubleArrowDown,
} from "react-icons/md";

export const getStatusColorCode = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "review":
      return "warning";
    case "completed":
      return "success";
    case "prepare":
      return "info";
    case "ready":
      return "info";
    case "failed":
      return "danger";
    default:
      return "primary";
  }
};

export const getPriorityColorCode = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "muted";
    default:
      return "primary";
  }
};

export const getDateInFormat = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const day = date.getUTCDate();
  return `${day} ${month} ${year}`;
};

export function formatNumber(num: number | string): string {
  if (num === null || num === undefined || num === '') return '0.00';
  
  const n = Number(num);
  if (isNaN(n)) return String(num);
  
  const absValue = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return n < 0 ? `(${absValue})` : absValue;
}



export const getPriorityIcon = (
  priority: string,
  color: string
): JSX.Element | null => {
  const priorityLower = priority.toLowerCase();
  
  if (priorityLower === "high" ) {
    return <MdOutlineKeyboardDoubleArrowUp color={color} size={20} />;
  } else if (priorityLower === "medium") {
    return <HiMiniEquals color={color} size={20} />;
  } else if (priorityLower === "low" ) {
    return <MdOutlineKeyboardDoubleArrowDown color={color} size={20} />;
  }

  return null;
};

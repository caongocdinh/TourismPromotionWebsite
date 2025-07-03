import React from "react";

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-12 w-12",
  lg: "h-20 w-20",
};

const colorMap = {
    white: "border-white",
  blue: "border-blue-600",
  red: "border-red-600",
  green: "border-green-600",
  orange: "border-orange-500",
  purple: "border-purple-600",
  teal: "border-teal-600",
  gray: "border-gray-500",
};

const Loading = ({
  size = "md",
  color = "blue",
  text = "",
  className = "",
  textClass = "mt-2 text-gray-600 text-sm",
}) => (
  <div className={`flex flex-col justify-center items-center ${className}`}>
    <div
      className={`animate-spin rounded-full border-b-2 ${colorMap[color] || colorMap.blue} ${sizeMap[size] || sizeMap.md}`}
      style={{ borderRightColor: "transparent" }}
    ></div>
    {text && <div className={textClass}>{text}</div>}
  </div>
);

export default Loading;
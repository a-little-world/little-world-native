import React from "react";
import { useEffect } from "react";

console.log("React object:", React);
console.log("useEffect from React:", React.useEffect);
console.log("useEffect direct import:", useEffect);

export default function RootLayout() {
  console.log("RootLayout component rendering");
  console.log("useEffect inside component:", useEffect);
  
  return <></>;
}

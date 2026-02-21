import { useEffect } from "react";
import AppNavbar from "../components/AppNavbar";
import DotGrid from "../components/DotGrid";
import "../styles/Layout.css";

export default function MainLayout({ children }) {

  // // ✅ Hook must be INSIDE component
  // useEffect(() => {
  //   document.body.classList.add("app-bg");

  //   return () => {
  //     document.body.classList.remove("app-bg");
  //   };
  // }, []);

  return (
    <div className="layout-wrapper">

      {/* DotGrid Background */}
      <div className="dotgrid-layer">
        <DotGrid
  dotSize={4}
  gap={20}
  baseColor="#1a1230"     // dark purple dots
  activeColor="#5227FF"
  proximity={120}
  shockRadius={250}
  shockStrength={5}
  resistance={750}
  returnDuration={1.5}
/>

      </div>

      {/* Navbar */}
      <AppNavbar />

      {/* Content */}
      <div className="layout-content">
        {children}
      </div>

    </div>
  );
}

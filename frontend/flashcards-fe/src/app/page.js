'use client'

import { NavigationProvider } from "./context/useNavigationContext";
import BaseLayout from "./screens/layout/BaseLayout";

export default function Home() {

  return (
    <NavigationProvider>
      <BaseLayout />
    </NavigationProvider>
  );
}

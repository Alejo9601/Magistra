import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeAppDataStorage } from "@/services/app-data-bootstrap-service";

initializeAppDataStorage();
const { default: App } = await import("./App.tsx");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { createApp } from "vue";
import App from "./App.vue";

import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

window.L = L; // 👈 CRITICAL

createApp(App).mount("#app");

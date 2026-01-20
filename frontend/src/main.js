import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

window.L = L;

createApp(App).mount("#app");

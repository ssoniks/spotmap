import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4002", // Spot Service port
});

export default api;

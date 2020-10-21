import Axios from "axios";

export const keepAlive = async () => {
  const { SELF_URL } = process.env;
  if (SELF_URL) {
    console.log("Keep alive ping");
    Axios.get(SELF_URL);
  }
};

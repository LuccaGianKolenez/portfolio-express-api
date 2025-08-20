import app from "./app";
import { env } from "./env";

const port = env.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
});

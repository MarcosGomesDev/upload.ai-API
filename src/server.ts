import fastifyCors from "@fastify/cors";
import "dotenv/config";
import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { createTranscription } from "./routes/create-transcription";
import { generateAICompletion } from "./routes/generate-ai-completion";
import { getAllPrompts } from "./routes/get-all-prompts";
import { uploadVideo } from "./routes/upload-video";

const app = fastify();

app.register(fastifyCors, {
  origin: "*",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(getAllPrompts);
app.register(uploadVideo);
app.register(createTranscription);
app.register(generateAICompletion);

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("HTTP Server Running! 🚀");
  });

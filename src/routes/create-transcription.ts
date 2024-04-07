import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createReadStream } from "node:fs";
import { z } from "zod";
import { openai } from "../lib/openai";
import { prisma } from "../lib/prisma";

export async function createTranscription(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/videos/:videoId/transcription",
    {
      schema: {
        params: z.object({
          videoId: z.string().uuid(),
        }),
        body: z.object({
          prompt: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { videoId } = request.params;

      const { prompt } = request.body;

      const video = await prisma.video.findUniqueOrThrow({
        where: {
          id: videoId,
        },
      });

      const videoPath = video.path;

      const audioReadStream = createReadStream(videoPath);

      console.log("transcribing audio");

      const response = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
        language: "pt",
        response_format: "json",
        temperature: 0,
        prompt,
      });

      const transcription = response.text;

      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          transcription,
        },
      });

      console.log("transcription created");

      return {
        transcription,
      };
    }
  );
}

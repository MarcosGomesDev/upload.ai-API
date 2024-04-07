import { OpenAIStream, streamToResponse } from "ai";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { openai } from "../lib/openai";
import { prisma } from "../lib/prisma";

export async function generateAICompletion(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/ai/complete",
    {
      schema: {
        body: z.object({
          videoId: z.string().uuid(),
          prompt: z.string(),
          temperature: z.number().min(0).max(1).default(0.5),
        }),
      },
    },
    async (request, reply) => {
      const { videoId, prompt, temperature } = request.body;

      const video = await prisma.video.findUniqueOrThrow({
        where: {
          id: videoId,
        },
      });

      if (!video.transcription) {
        return reply.status(400).send({
          message: "Video transcription was not generated yet.",
        });
      }

      const promptMessage = prompt.replace(
        "{transcription}",
        video.transcription
      );

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [
          {
            role: "user",
            content: promptMessage,
          },
        ],
        stream: true,
      });

      const stream = OpenAIStream(response);

      streamToResponse(stream, reply.raw, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });
    }
  );
}

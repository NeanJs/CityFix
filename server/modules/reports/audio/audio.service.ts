import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function transcribeAudio(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const bytes = new Uint8Array(buffer.length);
  buffer.copy(bytes);

  const file = new File([bytes], filename, {
    type: mimeType,
  });

  const result = await elevenlabs.speechToText.convert({
    file,
    modelId: "scribe_v2",
  });

  return result.text;
}

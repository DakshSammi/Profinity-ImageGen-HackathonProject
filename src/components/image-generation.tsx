"use client";

import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Modal from "./modal";
import axios, { AxiosRequestConfig } from "axios";

const ImageGenerator: React.FC = () => {
  const API_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN;
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { toast } = useToast();

  const checkProfanity = async (text: string): Promise<boolean> => {
    const customProfanityWords = [
      "sex",
      "nude",
      "pornography",
      "abuse",
      "ass",
      "bitch",
      "bastard",
      "cock",
      "cunt",
      "dick",
      "fuck",
      "shit",
      "whore",
      "slut",
      "pussy",
      "vagina",
      "penis",
      "orgasm",
      "masturbate",
      "erotic",
      "kinky",
      "fetish",
      "bdsm",
      "anus",
      "booty",
      "butthole",
      "clitoris",
      "condom",
      "ejaculate",
      "erection",
      "fornicate",
      "genitals",
      "intercourse",
      "orgy",
      "prostitute",
      "scrotum",
      "sperm",
      "testicle",
      "vulva",
    ];

    // Check if input text contains any of the custom profanity words
    const containsProfanity = customProfanityWords.some((profanityWord) =>
      text.toLowerCase().includes(profanityWord),
    );

    // If no profanity words are found in the input, return false immediately
    if (!containsProfanity) {
      return false;
    }

    // If profanity words are found, proceed with the API call for a more thorough check
    const url = `https://community-purgomalum.p.rapidapi.com/json?text=${encodeURIComponent(
      text,
    )}&add=${encodeURIComponent(customProfanityWords.join(","))}`;
    const options: AxiosRequestConfig = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "d3d1f801d9msh638df2d61641116p1293b8jsnd4bc3d2b1050",
        "X-RapidAPI-Host": "community-purgomalum.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.get(url, options);
      const result: { result: string } = response.data;
      if (result && result.result.includes("***")) {
        toast({
          title: "Profanity Detected",
          description:
            "Profanity detected in your input. Please remove any offensive language before proceeding.",
          variant: "destructive",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking profanity:", error);
      toast({
        title: "Profanity Detected",
        description:
          "Profanity detected in your input. Please remove any offensive language before proceeding.",
        variant: "destructive",
      });
      return true;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputText) {
      toast({
        title: "Uh oh! You forgot something.",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    const hasProfanity = await checkProfanity(inputText);
    if (hasProfanity) return; // Stop the submission if profanity is detected

    setLoading(true);
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          body: JSON.stringify({ inputs: inputText }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const blob = await response.blob();
      setOutput(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInputText(event.target.value);
  };

  useEffect(() => {
    if (output) {
      setIsModalOpen(true);
      toast({
        title: "Success! Image generated",
        description:
          "View your generated image by clicking the button `View Generated Image`.",
      });
    }
  }, [output]);

  return (
    <section className="flex w-screen items-center justify-center md:w-full">
      <form
        onSubmit={handleSubmit}
        className="grid w-screen gap-2.5 px-10 md:w-1/2 md:px-0">
        <Textarea
          name="input"
          value={inputText}
          onChange={handleTextareaChange}
          placeholder="Type your image prompt here..."
          className="h-48 resize-none"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Generating your artwork..." : "Generate"}
        </Button>
        {output && (
          <Modal isOpen={isModalOpen} imageSrc={output} title={inputText} />
        )}
      </form>
    </section>
  );
};

export default ImageGenerator;

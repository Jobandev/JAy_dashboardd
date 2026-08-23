import { FileText, Film, Link2, Play, Quote } from "lucide-react";

export const CONTENT_TYPES = ["Video", "Photo", "Document", "Testimonial", "Link"];

export const typeIcon = {
  Video: Play,
  Photo: Film,
  Document: FileText,
  Testimonial: Quote,
  Link: Link2,
};

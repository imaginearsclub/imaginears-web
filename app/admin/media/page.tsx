import { type Metadata } from "next";
import { MediaLibraryPage } from "@/components/admin/media/MediaLibraryPage";

export const metadata: Metadata = {
  title: "Media Library | Admin",
  description: "Manage organizational media assets",
};

export default function AdminMediaPage() {
  return <MediaLibraryPage />;
}
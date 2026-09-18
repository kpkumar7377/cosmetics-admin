"use client";

import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import api from "../lib/api";

// Uploads through the backend's /api/uploads endpoint (Multer -> Cloudinary),
// so no Cloudinary credentials are ever exposed to the browser.
export default function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange([...images, data.url]);
    } catch (err) {
      alert(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => onChange(images.filter((i) => i !== url));

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images?.map((url) => (
          <div key={url} className="relative">
            <img src={url} className="w-20 h-20 object-cover rounded-md border" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-2 -right-2 bg-white border rounded-full p-0.5"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-gray-50">
        <FiUpload size={16} />
        {uploading ? "Uploading..." : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
}

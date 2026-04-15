"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import { Venue } from "@/lib/mockData";
import Link from "next/link";

interface VenueFormProps {
  initialData?: Venue;
  onSubmit: (data: Omit<Venue, "id">) => Promise<{ success: boolean; error?: any }>;
  title: string;
}

export function VenueForm({ initialData, onSubmit, title }: VenueFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Venue, "id">>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    capacity: initialData?.capacity || 0,
    location: initialData?.location || "",
    image: initialData?.image || "",
    category: initialData?.category || "Hall",
    amenities: initialData?.amenities || [],
  });

  const [newAmenity, setNewAmenity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await onSubmit(formData);
    if (result.success) {
      router.push("/admin/venues");
    } else {
      alert("Error saving venue. Check console for details.");
    }
    setLoading(false);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.trim()],
      });
      setNewAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/venues"
            className="p-3 border-[0.5px] border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-serif text-4xl font-light tracking-tighter text-black">{title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16 font-sans">
        {/* Core Specifications */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b-[0.5px] border-zinc-200 pb-2">Venue Details</h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <FormField label="Venue Name">
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
                placeholder="e.g., The Grand Atrium"
              />
            </FormField>

            <FormField label="Location">
              <input
                required
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
                placeholder="e.g., Bangsar South, KL"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors resize-none"
              placeholder="Describe the space..."
            />
          </FormField>
        </div>

        {/* Global Settings */}
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b-[0.5px] border-zinc-200 pb-2">Capacity & Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Capacity (Pax)">
                <input
                  required
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
                />
              </FormField>
              <FormField label="Base Price (RM)">
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
                />
              </FormField>
            </div>
            <FormField label="Category">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="Hall">Hall</option>
                  <option value="Studio">Studio</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Office">Office</option>
                </select>
              </FormField>
          </div>

          <div className="space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b-[0.5px] border-zinc-200 pb-2">Visuals</h2>
            <FormField label="Cover Image URL">
              <input
                required
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
                placeholder="https://images.unsplash.com/..."
              />
            </FormField>
            {formData.image && (
              <div className="aspect-video bg-zinc-100 border-[0.5px] border-zinc-200 overflow-hidden">
                <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b-[0.5px] border-zinc-200 pb-2">Amenities</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.amenities.map((amenity, index) => (
              <span key={index} className="flex items-center gap-2 bg-white border-[0.5px] border-zinc-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black">
                {amenity}
                <button type="button" onClick={() => removeAmenity(index)} className="text-zinc-400 hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              className="flex-1 bg-zinc-50 border-[0.5px] border-zinc-200 p-4 text-xs font-medium focus:outline-none focus:border-black transition-colors"
              placeholder="Add amenity..."
            />
            <button type="button" onClick={addAmenity} className="bg-zinc-100 border-[0.5px] border-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200">Add</button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-12 border-t-[0.5px] border-zinc-200 flex justify-end gap-4">
          <Link
            href="/admin/venues"
            className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
          >
            Discard Changes
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-black px-12 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-xl shadow-zinc-200"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {initialData ? "Update Venue" : "Curate Venue"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

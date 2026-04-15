"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { EditRestaurantModal } from "@/modals/editRestaurantModal";

interface Restaurant {
    id: string;
    name: string;
    cuisine_type: string | null;
    latitude: number;
    longitude: number;
    image_url?: string | null;
    owner_id?: string;
    menu_id?: string | null;
}

export default function AdminDashboard() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRes, setSelectedRes] = useState<Restaurant | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("restaurants")
                // FIX: Add image_url to this string!
                .select("id, name, cuisine_type, latitude, longitude, menu_id, image_url");

            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error("Error fetching restaurants:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${name}"? This will remove all associated menu data.`
        );
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("restaurants")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setRestaurants((prev) => prev.filter((res) => res.id !== id));
        } catch (err) {
            console.error("Error deleting restaurant:", err);
            alert("Failed to delete the restaurant.");
        }
    };

    // Inside page.tsx
    const handleUpdate = async (updated: Restaurant, file?: File) => {
        try {
            let finalImageUrl = updated.image_url;

            // 1. If a new file was selected, upload it
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${updated.id}-${Date.now()}.${fileExt}`;
                const filePath = `photos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('restaurant-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. THIS IS THE MISSING LINK: Generate the public URL
                const { data } = supabase.storage
                    .from('restaurant-images')
                    .getPublicUrl(filePath);

                finalImageUrl = data.publicUrl; // This string is what we save to the table
                console.log("Successfully generated public URL:", finalImageUrl);
            }

            // 3. Update the database row
            const { error: dbError } = await supabase
                .from("restaurants")
                .update({
                    name: updated.name,
                    cuisine_type: updated.cuisine_type,
                    latitude: updated.latitude,
                    longitude: updated.longitude,
                    image_url: finalImageUrl // Pass the URL here
                })
                .eq("id", updated.id);

            if (dbError) throw dbError;

            // 4. Update local state so the UI refreshes
            setRestaurants((prev) =>
                prev.map((r) => (r.id === updated.id ? { ...updated, image_url: finalImageUrl } : r))
            );

            setIsEditOpen(false);
        } catch (err) {
            console.error("Database Update Failed:", err);
            alert("Could not update the database row. Check the browser console.");
        }
    };

    return (
        <>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">MAPAKaon Admin</h1>
                    <Button className="flex items-center gap-2">
                        <Plus size={16} /> Add New Restaurant
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Cuisine</th>
                                <th className="p-4 font-semibold">Coordinates</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            Loading...
                                        </div>
                                    </td>
                                </tr>
                            ) : restaurants.length > 0 ? (
                                restaurants.map((res) => (
                                    <tr key={res.id} className="border-t hover:bg-muted/30">
                                        <td className="p-4 font-medium">{res.name}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {res.cuisine_type || "None"}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-muted-foreground">
                                            {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setSelectedRes(res);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(res.id, res.name)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No restaurants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditRestaurantModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                restaurant={selectedRes}
                onSave={handleUpdate}
            />
        </>
    );
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaFooter,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Save, Loader2, Upload, X } from "lucide-react";

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

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    // The parent owns all Supabase logic. The modal just collects form data + file.
    onSave: (updated: Restaurant, file?: File) => Promise<void>;
}

export function EditRestaurantModal({ isOpen, onClose, restaurant, onSave }: EditModalProps) {
    const [formData, setFormData] = useState<Restaurant | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | undefined>();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Re-initialise form every time a (possibly different) restaurant is opened.
    useEffect(() => {
        if (restaurant) {
            setFormData({ ...restaurant });
            // Show the existing saved image as the initial preview.
            setPreviewUrl(restaurant.image_url ?? null);
            setSelectedFile(undefined);
            setSaveError(null);
        }
    }, [restaurant]);

    if (!formData) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        // Blob URL for instant local preview — actual upload happens in the parent.
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setSelectedFile(undefined);
        setPreviewUrl(null);
        setFormData((prev) => (prev ? { ...prev, image_url: null } : null));
    };

    const handleAction = async () => {
        if (!formData) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            // Pass the form data and the optional new file up to the parent.
            // The parent (page.tsx) does the Storage upload + DB update.
            await onSave(formData, selectedFile);
            // Parent closes the modal via setIsEditOpen(false) after success.
        } catch (err: any) {
            console.error("Save failed:", err);
            setSaveError(err?.message ?? "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Credenza open={isOpen} onOpenChange={onClose}>
            <CredenzaContent className="sm:max-w-lg">
                <CredenzaHeader>
                    <CredenzaTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                        Edit {restaurant?.name}
                    </CredenzaTitle>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Restaurant Photo</Label>
                        <div className="relative group aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={14} /> Change
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={removeImage}
                                        >
                                            <X size={14} /> Remove
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div
                                    className="text-center p-6 cursor-pointer hover:bg-muted/50 w-full h-full flex flex-col items-center justify-center"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-xs text-muted-foreground">Click to upload restaurant image</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Restaurant Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cuisine">Cuisine Type</Label>
                        <Input
                            id="cuisine"
                            value={formData.cuisine_type || ""}
                            onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lat">Latitude</Label>
                            <Input
                                id="lat"
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) =>
                                    setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lng">Longitude</Label>
                            <Input
                                id="lng"
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) =>
                                    setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                                }
                            />
                        </div>
                    </div>

                    {saveError && (
                        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                            {saveError}
                        </p>
                    )}
                </CredenzaBody>

                <CredenzaFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleAction} disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
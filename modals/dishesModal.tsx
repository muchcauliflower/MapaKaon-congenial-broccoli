"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Loader2, Utensils } from "lucide-react";

interface Dish {
  name: string;
  price: number;
  category: string;
}

interface DishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  dishes: Dish[];
  loading: boolean;
}

export function DishesModal({
  isOpen,
  onClose,
  restaurantName,
  dishes,
  loading,
}: DishesModalProps) {
  return (
    <Credenza open={isOpen} onOpenChange={onClose}>
      <CredenzaContent className="sm:max-w-md">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {restaurantName} Menu
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className="pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading dishes...</p>
            </div>
          ) : dishes.length > 0 ? (
            <div className="space-y-4">
              {/* Grouping by category (optional logic) */}
              {dishes.map((dish, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm sm:text-base">{dish.name}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {dish.category}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    ₱{dish.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">
              No dishes available for this menu yet.
            </p>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
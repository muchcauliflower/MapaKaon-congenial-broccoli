"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronDown, Loader2, MapPin, Search, X, Coffee, Utensils } from "lucide-react";
import RestaurantCard from "./restaurantCard";
import { supabase } from "@/lib/supabaseClient";
import { useLocationStore } from "@/store/locationStore";
import { useRouteStore } from "@/store/routeStore";
import { DishesModal } from "@/modals/dishesModal";

const ORS_URL = "https://api.openrouteservice.org";
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ILOILO_BOUNDS = {
  minLat: 10.66,
  maxLat: 10.78,
  minLng: 122.51,
  maxLng: 122.62,
};

const FALLBACK_COORDS = { lat: 10.7202, lng: 122.5621 };
const FALLBACK_LABEL = "Iloilo City Hall (placeholder)";

interface MenuListProps {
  onRouteSet?: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string | null;
  latitude: number | null;
  longitude: number | null;
  menu_id: string | null;
  image_url?: string | null;
}

export default function MenuList({ onRouteSet }: MenuListProps) {
  const userCoords = useLocationStore((s) => s.coords);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setRoutePoints = useRouteStore((s) => s.setRoutePoints);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [locationLabel, setLocationLabel] = useState("Locating...");
  const [locationLoading, setLocationLoading] = useState(false);
  const locationFetched = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [dishes, setDishes] = useState<any[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, cuisine_type, latitude, longitude, menu_id, image_url")
        .order("created_at", { ascending: false });

      if (error) setError("Failed to load restaurants.");
      else setRestaurants(data ?? []);
      setFetching(false);
    };
    fetchRestaurants();
  }, []);

  // 1.5. Fetch dishes for modal
  const handleViewMenu = async (menuId: string, restaurantName: string) => {
    setSelectedRestaurant(restaurantName);
    setIsModalOpen(true);
    setDishesLoading(true);

    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("name, price, category")
        .eq("menu_id", menuId);

      if (error) throw error;
      setDishes(data || []);
    } catch (err) {
      console.error("Error fetching dishes:", err);
    } finally {
      setDishesLoading(false);
    }
  };

  // 2. Geolocation helpers
  const applyFallback = () => {
    setLocationLabel(FALLBACK_LABEL);
    setCoords(FALLBACK_COORDS);
    setLocationLoading(false);
  };

  const applyCoords = async (latitude: number, longitude: number) => {
    const inBounds =
      latitude >= ILOILO_BOUNDS.minLat &&
      latitude <= ILOILO_BOUNDS.maxLat &&
      longitude >= ILOILO_BOUNDS.minLng &&
      longitude <= ILOILO_BOUNDS.maxLng;

    if (!inBounds) {
      applyFallback();
      return;
    }

    try {
      const res = await fetch(
        `${ORS_URL}/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${longitude}&point.lat=${latitude}&size=1`
      );
      const data = await res.json();
      const label = data.features?.[0]?.properties?.label;
      setLocationLabel(label ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } catch {
      setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } finally {
      setCoords({ lat: latitude, lng: longitude });
      setLocationLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      applyFallback();
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
      () => applyFallback(),
      { timeout: 8000, maximumAge: 60_000 }
    );
  };

  useEffect(() => {
    if (!locationFetched.current) {
      locationFetched.current = true;
      requestLocation();
    }
  }, []);

  // 3. Routing
  const handleGetRoute = () => {
    if (!selectedId || !userCoords) return;
    const restaurant = restaurants.find((r) => r.id === selectedId);
    if (!restaurant?.latitude || !restaurant?.longitude) return;

    setRoutePoints({
      originLat: userCoords.lat,
      originLon: userCoords.lng,
      destLat: restaurant.latitude,
      destLon: restaurant.longitude,
    });

    if (onRouteSet) onRouteSet();
  };

  const handleClear = () => {
    setSelectedId(null);
    setRoutePoints({ originLat: 0, originLon: 0, destLat: 0, destLon: 0 });
    setSearchQuery("");
  };

  const canRoute = !!selectedId && !!userCoords;

  // Filter and Sort Logic
  const filteredAndSorted = restaurants
    .filter((r) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(searchLower) ||
        (r.cuisine_type?.toLowerCase().includes(searchLower) ?? false)
      );
    })
    .sort((a, b) => {
      if (!userCoords || a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null)
        return 0;

      const distA = getDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
      const distB = getDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
      return distA - distB;
    });

  const cafeRestaurants = filteredAndSorted.filter((r) => {
    const cuisine = r.cuisine_type?.toLowerCase() || "";
    return cuisine.includes("cafe") || cuisine.includes("coffee");
  });

  const ilonggoClassics = filteredAndSorted.filter((r) => {
    const cuisine = r.cuisine_type?.toLowerCase() || "";
    const name = r.name.toLowerCase();
    return cuisine.includes("ilonggo") || name.includes("batchoy") || name.includes("kansi") || cuisine.includes("batchoy");
  });

  // Reusable Carousel Renderer
  const renderCarousel = (list: Restaurant[]) => (
    <div className="w-full overflow-hidden">
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-3">
          {list.map((r) => (
            <CarouselItem key={r.id} className="pl-3 basis-[85%] sm:basis-[70%] lg:basis-[45%]">
              <RestaurantCard
                name={r.name}
                imageUrl={r.image_url ?? undefined}
                cuisine={r.cuisine_type ?? undefined}
                selected={selectedId === r.id}
                onSelect={() => setSelectedId((prev) => (prev === r.id ? null : r.id))}
                menuId={r.menu_id}
                onViewMenu={(id) => handleViewMenu(id, r.name)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-full overflow-hidden">
      {/* Location row */}
      <div className="flex w-full items-center gap-2 overflow-hidden px-1">
        <div className="flex-shrink-0">
          {locationLoading ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : (
            <MapPin size={14} className="text-primary" />
          )}
        </div>
        <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
          {locationLabel}
        </p>
        {!locationLoading && <ChevronDown size={14} className="flex-shrink-0" />}
      </div>

      {/* Search Input */}
      <div className="relative px-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search restaurants or cuisines..."
          className="pl-10 pr-10 h-10 text-sm sm:h-12 sm:text-base bg-secondary/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content Sections Wrapper */}
      <div className="flex flex-col gap-8 pb-4 overflow-x-hidden">
        {fetching ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive px-1">{error}</p>
        ) : filteredAndSorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No restaurants found matching your search.
          </p>
        ) : (
          <>
            {/* SECTION 1: NEAR YOU */}
            <section className="flex flex-col">
              <h2 className="text-base font-bold px-1 mb-3 flex items-center gap-2 sm:text-lg">
                <MapPin size={18} className="text-primary" />
                Restaurants Near You
              </h2>
              {renderCarousel(filteredAndSorted)}
            </section>

            {/* SECTION 2: CAFES & COFFEE */}
            {cafeRestaurants.length > 0 && (
              <section className="flex flex-col">
                <h2 className="text-base font-bold px-1 mb-3 flex items-center gap-2 sm:text-lg">
                  <Coffee size={18} className="text-orange-500" />
                  Coffee & Chill
                </h2>
                {renderCarousel(cafeRestaurants)}
              </section>
            )}

            {/* SECTION 3: ILONGGO PRIDE */}
            {ilonggoClassics.length > 0 && (
              <section className="flex flex-col">
                <h2 className="text-base font-bold px-1 mb-3 flex items-center gap-2 sm:text-lg">
                  <Utensils size={18} className="text-red-500" />
                  Ilonggo Classics
                </h2>
                {renderCarousel(ilonggoClassics)}
              </section>
            )}
          </>
        )}
      </div>

      {/* Actions (Floating-style or Bottom) */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md pt-3 pb-4 border-t px-1 mt-auto z-10">
        <div className="flex flex-col gap-2">
          <Button
            className="h-10 text-sm font-bold sm:h-12 sm:text-base shadow-lg"
            onClick={handleGetRoute}
            disabled={!canRoute}
          >
            {locationLoading ? "Waiting for location..." : "Get Route to Selection"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-transparent"
            onClick={handleClear}
          >
            Clear Selection
          </Button>
        </div>
      </div>

      <DishesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantName={selectedRestaurant}
        dishes={dishes}
        loading={dishesLoading}
      />
    </div>
  );
}
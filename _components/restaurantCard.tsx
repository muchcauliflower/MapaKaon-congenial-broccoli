import React from "react";
import { Hamburger, Check } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  imageUrl?: string;
  promoLabel?: string;
  promoSubLabel?: string;
  rating?: number;
  reviewCount?: string;
  priceRange?: string;
  cuisine?: string;
  deliveryFee?: string;
  deliveryTime?: number;
  isFreeDelivery?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  menuId?: string | null;
  onViewMenu?: (menuId: string) => void;
}

function RestaurantCard({
  name,
  imageUrl,
  promoLabel,
  promoSubLabel,
  rating,
  reviewCount,
  priceRange,
  cuisine,
  selected = false,
  onSelect,
  deliveryFee,
  deliveryTime,
  isFreeDelivery = false,
  menuId,
  onViewMenu,
}: RestaurantCardProps) {
  return (
    <div
      style={{
        ...styles.card,
        outline: selected ? "2px solid #4A90D9" : "0.5px solid rgba(0,0,0,0.12)",
        outlineOffset: selected ? 2 : 0,
        boxShadow: selected ? "0 4px 12px rgba(74, 144, 217, 0.2)" : "none",
      }}
      onClick={onSelect}
    >
      <div style={styles.imageWrapper}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            style={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            <Hamburger size={40} color="#c1b4a6" />
          </div>
        )}

        {/* Selected Badge (Top Left) */}
        {selected && (
          <div style={styles.selectedBadge}>
            <Check size={12} strokeWidth={3} />
            <span>Selected</span>
          </div>
        )}

        {/* Promo Badge (Bottom Left) — only when not selected */}
        {promoLabel && !selected && (
          <div style={styles.promoBadge}>
            <div style={styles.promoText}>{promoLabel}</div>
            {promoSubLabel && <div style={styles.promoSubText}>{promoSubLabel}</div>}
          </div>
        )}

        {/* Menu Button (Top Right) */}
        {menuId && onViewMenu && (
          <button
            style={styles.menuButton}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onClick={(e) => {
              e.stopPropagation();
              onViewMenu(menuId);
            }}
          >
            Menu
          </button>
        )}
      </div>

      <div style={styles.body}>
        <div style={{ ...styles.name, color: selected ? "#4A90D9" : "#111" }}>
          {name}
        </div>
        {cuisine && <div style={styles.meta}>{cuisine}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    width: "100%",
    maxWidth: 360,
    transition: "all 0.2s ease-in-out",
    position: "relative",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 140,
    overflow: "hidden",
    backgroundColor: "#e8ddd0",
  },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: "4px 10px",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#00b14f",
    border: "1px solid #00b14f",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.1s ease",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#4A90D9",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  promoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 8,
  },
  promoText: { fontSize: 11, fontWeight: 700 },
  promoSubText: { fontSize: 10, opacity: 0.85 },
  body: { padding: "10px 12px 12px" },
  name: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  meta: { fontSize: 12, color: "#888" },
};

export default RestaurantCard;
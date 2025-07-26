"use client"

import dynamic from "next/dynamic"
import { useMapEvents } from "react-leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface InteractiveMapProps {
  lat: number
  lon: number
  onLocationSelect: (lat: number, lon: number) => void
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
)
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
    },
  })
  return null
}

export default function InteractiveMap({ lat, lon, onLocationSelect }: InteractiveMapProps) {
  return (
    <div
      className="w-full h-96 relative rounded-lg overflow-hidden border border-gray-200"
      style={{ minHeight: "400px" }}
    >
      <MapContainer
        center={[lat, lon]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        className="w-full h-full"
        key={`${lat}-${lon}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-center">
              <strong>Selected Location</strong>
              <br />
              Lat: {lat.toFixed(6)}
              <br />
              Lon: {lon.toFixed(6)}
            </div>
          </Popup>
        </Marker>

        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>

      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-md shadow-sm text-xs z-[1000] border border-gray-200">
        <div className="font-semibold text-teal-700">Click to select</div>
        <div className="text-gray-600 font-mono">
          {lat.toFixed(6)}, {lon.toFixed(6)}
        </div>
      </div>
    </div>
  )
}
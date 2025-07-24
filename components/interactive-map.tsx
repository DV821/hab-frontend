"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import FallbackMap from "./fallback-map"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const useMapEvents = dynamic(() => import("react-leaflet").then((mod) => mod.useMapEvents), { ssr: false })

interface InteractiveMapProps {
  lat: number
  lon: number
  onLocationSelect: (lat: number, lon: number) => void
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  return null
}

export default function InteractiveMap({ lat, lon, onLocationSelect }: InteractiveMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    // Check if we're in the browser and Leaflet can load
    if (typeof window !== "undefined") {
      import("leaflet")
        .then(() => {
          setMapLoaded(true)
        })
        .catch((error) => {
          console.error("Failed to load Leaflet:", error)
          setMapError(true)
        })
    }
  }, [])

  // Show fallback if map failed to load or we're on server
  if (typeof window === "undefined" || mapError || !mapLoaded) {
    return <FallbackMap lat={lat} lon={lon} onLocationSelect={onLocationSelect} />
  }

  try {
    return (
      <div className="w-full h-full min-h-[280px] max-h-[400px] relative rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[lat, lon]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          className="w-full h-full"
          key={`${lat}-${lon}`} // Force re-render when coordinates change
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
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Map rendering error:", error)
    return <FallbackMap lat={lat} lon={lon} onLocationSelect={onLocationSelect} />
  }
}

"use client"

import type React from "react"

import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FallbackMapProps {
  lat: number
  lon: number
  onLocationSelect: (lat: number, lon: number) => void
}

export default function FallbackMap({ lat, lon, onLocationSelect }: FallbackMapProps) {
  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLocationSelect(lat, lon)
  }

  return (
    <div className="w-full h-full min-h-[280px] max-h-[400px] rounded-lg border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 flex flex-col items-center justify-center p-4">
      <MapPin className="h-10 w-10 text-teal-600 mb-3" />
      <h3 className="text-sm font-semibold text-teal-700 mb-2">Map Loading...</h3>
      <p className="text-gray-600 text-center mb-4 max-w-xs text-xs">
        If the map doesn't load, you can manually enter coordinates:
      </p>

      <form onSubmit={handleCoordinateSubmit} className="w-full max-w-xs space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="fallback-lat" className="text-xs">
              Latitude
            </Label>
            <Input
              id="fallback-lat"
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => onLocationSelect(Number.parseFloat(e.target.value) || lat, lon)}
              className="font-mono text-xs h-7"
            />
          </div>
          <div>
            <Label htmlFor="fallback-lon" className="text-xs">
              Longitude
            </Label>
            <Input
              id="fallback-lon"
              type="number"
              step="0.000001"
              value={lon}
              onChange={(e) => onLocationSelect(lat, Number.parseFloat(e.target.value) || lon)}
              className="font-mono text-xs h-7"
            />
          </div>
        </div>
        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-7 text-xs">
          Update Location
        </Button>
      </form>

      <div className="mt-3 text-xs text-gray-500 text-center font-mono">
        {lat.toFixed(4)}, {lon.toFixed(4)}
      </div>
    </div>
  )
}
